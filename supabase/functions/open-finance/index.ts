import { createClient } from 'npm:@supabase/supabase-js@2.115.0';

const apiOrigin = 'https://api.pluggy.ai';
const products = ['ACCOUNTS', 'CREDIT_CARDS', 'TRANSACTIONS'];
const uuidPattern = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;

class RequestError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}
class PluggyError extends Error {
  constructor(readonly status: number) { super('Pluggy API request failed'); }
}
type Connector = { id: number; name: string; isSandbox: boolean; isOpenFinance: boolean; country: string };
type Item = { clientUserId: string; connector: Connector; status: string };
type Account = { id: string; name: string; type: 'BANK' | 'CREDIT'; currencyCode: string; balance?: number };
type Transaction = {
  id: string; accountId: string; description: string; date: string; amount: number;
  currencyCode?: string; amountInAccountCurrency?: number; type: 'CREDIT' | 'DEBIT';
};
type Page<T> = { results: T[]; next: string | null };
type BankCommand = { item: string; revision: string };

async function pluggy<T>(path: string, method = 'GET', apiKey?: string, body?: unknown): Promise<T> {
  const response = await fetch(apiOrigin + path, {
    method, redirect: 'error', signal: AbortSignal.timeout(9000),
    headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'X-API-KEY': apiKey } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new PluggyError(response.status);
  return response.status === 204 || method === 'DELETE' ? undefined as T : await response.json();
}

function uuid(value: unknown): string {
  if (typeof value !== 'string' || !uuidPattern.test(value)) throw new RequestError(400, 'Identificador inválido.');
  return value;
}

function permitted(connector: Connector, sandbox: boolean) {
  return connector.country === 'BR' && (sandbox ? connector.isSandbox === true : connector.isOpenFinance === true && connector.isSandbox === false);
}

async function readTransactions(account: Account, apiKey: string, since: string) {
  const transactions: Transaction[] = [];
  const initial = new URLSearchParams({ accountId: account.id, dateFrom: since });
  let query: string | null = '?' + initial.toString();
  const seen = new Set<string>();
  while (query) {
    if (!query.startsWith('?') || seen.has(query) || seen.size >= 25) throw new Error('Invalid transaction pagination');
    seen.add(query);
    const page: Page<Transaction> = await pluggy<Page<Transaction>>('/v2/transactions' + query, 'GET', apiKey);
    transactions.push(...page.results);
    query = page.next;
  }
  return transactions.map(tx => {
    if (tx.accountId !== account.id || !Number.isFinite(tx.amount)) throw new Error('Invalid transaction');
    const accountAmount = tx.amountInAccountCurrency;
    return {
      id: tx.id, account_id: account.id, description: tx.description.slice(0, 400),
      posted_on: tx.date.slice(0, 10), currency: accountAmount == null ? tx.currencyCode ?? account.currencyCode : account.currencyCode,
      amount: Math.abs(accountAmount ?? tx.amount), direction: tx.type,
    };
  });
}

Deno.serve(async request => {
  const mode = Deno.env.get('PLUGGY_MODE') ?? 'sandbox';
  const sandbox = mode === 'sandbox';
  const appOrigin = Deno.env.get('FLUXO_APP_ORIGIN');
  const origin = request.headers.get('Origin');
  const headers = {
    'Access-Control-Allow-Origin': appOrigin ?? '*',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json',
    'Vary': 'Origin',
  };
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

  if (appOrigin && origin && origin !== appOrigin) return json({ error: 'Origem não autorizada.' }, 403);
  if (request.method === 'OPTIONS') return new Response(null, { headers });
  if (request.method !== 'POST') return json({ error: 'Método inválido.' }, 405);

  const apiUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(apiUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const rpc = async <T>(name: string, args: Record<string, unknown>): Promise<T> => {
    const { data, error } = await admin.rpc(name, args);
    if (error?.code === '42501' || error?.code === '23505') throw new RequestError(403, 'Conexão indisponível para esta conta.');
    if (error?.code === '22023') throw new RequestError(429, error.message);
    if (error) throw new Error('Bank database operation failed: ' + error.code);
    return data as T;
  };

  try {
    const bearer = request.headers.get('Authorization')?.match(/^Bearer (\S+)$/i)?.[1];
    if (!bearer) throw new RequestError(401, 'Entre novamente no Fluxo.');
    const { data: { user }, error: authError } = await admin.auth.getUser(bearer);
    if (authError || !user?.email_confirmed_at) throw new RequestError(401, 'Entre com uma conta de e-mail confirmado.');
    const payload = await request.json().catch(() => null);
    if (!payload || typeof payload.action !== 'string') throw new RequestError(400, 'Ação inválida.');
    if (payload.action === 'status') {
      return json({ sandbox, configured: Boolean(Deno.env.get('PLUGGY_CLIENT_ID') && Deno.env.get('PLUGGY_CLIENT_SECRET')) });
    }
    const clientId = Deno.env.get('PLUGGY_CLIENT_ID');
    const clientSecret = Deno.env.get('PLUGGY_CLIENT_SECRET');
    if (!clientId || !clientSecret) throw new RequestError(503, 'A aplicação Pluggy ainda precisa ser configurada.');
    if (!sandbox && (mode !== 'production' || !appOrigin?.startsWith('https://'))) {
      throw new RequestError(503, 'Configure a origem HTTPS do Fluxo antes de ativar bancos reais.');
    }
    const actor = user.id;
    const allowedActions = ['connect', 'register', 'sync', 'disconnect', 'reconnect'];
    if (!allowedActions.includes(payload.action)) throw new RequestError(400, 'Ação inválida.');

    const { apiKey } = await pluggy<{ apiKey: string }>('/auth', 'POST', undefined, { clientId, clientSecret });
    if (payload.action === 'connect') {
      const response = await pluggy<{ results: Connector[] }>(
        sandbox ? '/connectors?sandbox=true' : '/connectors?isOpenFinance=true', 'GET', apiKey,
      );
      const connectorIds = response.results.filter(connector => permitted(connector, sandbox)).map(connector => connector.id);
      if (!connectorIds.length) throw new RequestError(503, 'Nenhum conector habilitado neste ambiente.');
      const intent = await rpc<string>('fluxo_bank_intent', { actor });
      const { accessToken } = await pluggy<{ accessToken: string }>('/connect_token', 'POST', apiKey, {
        options: { clientUserId: intent, avoidDuplicates: true },
      });
      return json({ connectToken: accessToken, connectorIds, sandbox });
    }

    if (payload.action === 'register') {
      const itemId = uuid(payload.itemId);
      const item = await pluggy<Item>('/items/' + itemId, 'GET', apiKey);
      if (!permitted(item.connector, sandbox)) throw new RequestError(403, 'Conector indisponível neste ambiente.');
      const target = await rpc<string>('fluxo_register_bank', {
        actor, item: itemId, intent: uuid(item.clientUserId), institution_name: item.connector.name.slice(0, 120),
      });
      return json({ connectionId: target });
    }

    const target = uuid(payload.connectionId);
    const command = (action: string) => rpc<BankCommand>('fluxo_bank_command', { actor, target, command: action });
    if (payload.action === 'disconnect') {
      const { item } = await command('disconnect');
      await pluggy('/items/' + item, 'DELETE', apiKey).catch(error => {
        if (!(error instanceof PluggyError && error.status === 404)) throw error;
      });
      await command('remove');
      return json({ ok: true });
    }

    if (payload.action === 'reconnect') {
      const { item } = await command('reconnect');
      const current = await pluggy<Item>('/items/' + item, 'GET', apiKey);
      if (!permitted(current.connector, sandbox)) throw new RequestError(403, 'Conector indisponível neste ambiente.');
      const { accessToken } = await pluggy<{ accessToken: string }>('/connect_token', 'POST', apiKey, { itemId: item });
      return json({ connectToken: accessToken, connectorIds: [current.connector.id], sandbox, updateItem: item });
    }

    const { item, revision } = await command('sync');
    const finish = (outcome: string, accounts: unknown[] = [], transactions: unknown[] = []) => rpc('fluxo_apply_bank', {
      target, expected_revision: revision, outcome, accounts, transactions,
    });
    try {
      const current = await pluggy<Item>('/items/' + item, 'GET', apiKey);
      if (!permitted(current.connector, sandbox)) throw new RequestError(403, 'Conector indisponível neste ambiente.');
      if (current.status !== 'UPDATED') {
        const outcome = ['UPDATING', 'CREATED'].includes(current.status) ? 'pending' : 'action_required';
        await finish(outcome);
        return json({ outcome });
      }
      const response = await pluggy<{ results: Account[] }>('/accounts?itemId=' + item, 'GET', apiKey);
      const since = new Date();
      since.setUTCDate(1);
      since.setUTCMonth(since.getUTCMonth() - 5);
      const accounts = response.results.filter(account => ['BANK', 'CREDIT'].includes(account.type));
      const transactionRows = [];
      for (const account of accounts) {
        transactionRows.push(...await readTransactions(account, apiKey, since.toISOString().slice(0, 10)));
      }
      const distinct = [...new Map(transactionRows.map(tx => [tx.id, tx])).values()];
      await finish('ready', accounts.map(account => ({
        id: account.id, name: account.name.slice(0, 120), kind: account.type, currency: account.currencyCode,
        balance: account.balance ?? null,
      })), distinct);
      return json({ outcome: 'ready' });
    } catch (error) {
      if (error instanceof PluggyError && error.status === 404) {
        await finish('action_required');
        return json({ outcome: 'action_required' });
      }
      await finish('error');
      throw error;
    }
  } catch (error) {
    if (error instanceof RequestError) return json({ error: error.message }, error.status);
    if (error instanceof PluggyError) console.error('Pluggy HTTP status', error.status);
    else console.error('Bank integration operation failed', error instanceof Error ? error.message : 'unknown');
    return json({ error: 'Não foi possível concluir a operação bancária. Tente novamente.' }, 502);
  }
});
