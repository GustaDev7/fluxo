import { createClient } from 'npm:@supabase/supabase-js@2.115.0';

const apiOrigin = 'https://api.pluggy.ai';
const meuPluggyConnector = 200;
type PluggyMode = 'sandbox' | 'meu-pluggy' | 'production';
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

function permitted(connector: Connector, mode: PluggyMode) {
  if (mode === 'meu-pluggy') return connector.id === meuPluggyConnector && connector.isSandbox === false;
  return connector.country === 'BR' && (mode === 'sandbox' ? connector.isSandbox === true : connector.isOpenFinance === true && connector.isSandbox === false);
}

type PluggyCredentials = { clientId: string; clientSecret: string };

function personalCredentials(actor: string): PluggyCredentials | undefined {
  const raw = Deno.env.get('FLUXO_PLUGGY_PERSONAL_CREDENTIALS');
  if (!raw) return;
  let entries: unknown;
  try { entries = JSON.parse(raw); }
  catch { return; }
  if (!entries || typeof entries !== 'object' || !Object.hasOwn(entries, actor)) return;
  const entry = (entries as Record<string, Partial<PluggyCredentials> | null>)[actor];
  if (typeof entry?.clientId !== 'string' || !entry.clientId.trim()
    || typeof entry.clientSecret !== 'string' || !entry.clientSecret.trim()) return;
  return { clientId: entry.clientId.trim(), clientSecret: entry.clientSecret.trim() };
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

const fluxoPreviewOrigin = 'https://fluxo-git-feat-fluxo-casal-open-finance-gustadev7s-projects.vercel.app';
const fluxoEdgeUrl = 'https://kwhbkkvoahxztzzscdnm.supabase.co/functions/v1/open-finance';
const belvoClientId = fluxoEdgeUrl + '/belvo-client.json';
const belvoResource = 'https://panorama-mcp.belvo.com/mcp';

type BelvoRecord = Record<string, unknown>;
type BelvoTool = { name: string; inputSchema?: { properties?: BelvoRecord; required?: string[] } };
const record = (value: unknown): BelvoRecord | undefined =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as BelvoRecord : undefined;
const field = (row: BelvoRecord, ...keys: string[]) => keys.map(key => row[key]).find(value => value != null);
const label = (value: unknown): string => typeof value === 'string' ? value.trim().slice(0, 200) : '';
const moneyValue = (value: unknown): number | null => {
  const number = typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value) ? Number(value) : value;
  return typeof number === 'number' && Number.isFinite(number) ? number : null;
};
const currencyCode = (value: unknown) => /^[A-Z]{3}$/.test(label(value)) ? label(value) : 'BRL';

function belvoPage(result: BelvoRecord, listName: string) {
  if (result.isError) {
    const outputs = Array.isArray(result.content) ? result.content : [];
    const codes = ['link_id', 'connection_id', 'account_id', 'date_from', 'date_to', 'start_date', 'end_date', 'permission', 'invalid', 'expired', 'required'];
    const matched = codes.filter(code => outputs.some(block => typeof block?.text === 'string' && block.text.toLowerCase().includes(code)));
    console.info('belvo_rejected', listName, matched);
  }
  if (result.isError) throw new RequestError(502, 'O Belvo recusou a consulta de ' + listName + '.');
  let payload: unknown = result.structuredContent;
  if (payload == null && Array.isArray(result.content)) {
    for (const block of result.content) {
      if (block?.type !== 'text' || typeof block.text !== 'string') continue;
      try { payload = JSON.parse(block.text); break; } catch { /* Ignore non-JSON blocks. */ }
    }
  }
  let value = payload;
  let next: unknown;
  for (let depth = 0; depth < 4; depth++) {
    if (Array.isArray(value)) return { rows: value.map(record).filter(row => row !== undefined), next };
    const obj = record(value);
    if (!obj) break;
    next = field(obj, 'next', 'next_page', 'nextPage', 'next_cursor', 'nextCursor') ??
      field(record(obj.pagination) ?? {}, 'next', 'next_page', 'nextPage', 'next_cursor', 'nextCursor') ?? next;
    value = field(obj, listName, 'results', 'items', 'data', 'records', 'output');
    if (value == null) console.info('belvo_shape', listName, Object.keys(obj).filter(key => /^[a-zA-Z_]{1,40}$/.test(key)).slice(0, 20));
  }
  throw new RequestError(502, 'O Belvo respondeu em um formato inesperado na consulta de ' + listName + '.');
}

function belvoArguments(tool: BelvoTool, link: string, month: string) {
  const args: BelvoRecord = {};
  const endOfMonth = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 0)).toISOString().slice(0, 10);
  for (const key of Object.keys(tool.inputSchema?.properties ?? {})) {
    const normalized = key.replaceAll('_', '').toLowerCase();
    if (link && ['link', 'linkid', 'connection', 'connectionid'].includes(normalized)) args[key] = link;
    if (['datefrom', 'fromdate', 'startdate', 'start', 'dategte', 'valuedategte', 'transactiondategte'].includes(normalized)) args[key] = month + '-01';
    if (['dateto', 'todate', 'enddate', 'end', 'datelte', 'valuedatelte', 'transactiondatelte'].includes(normalized)) args[key] = endOfMonth;
    if (key === 'page') args[key] = 1;
  }
  return args;
}

async function readBelvoBankData(
  tools: BelvoTool[], call: (tool: string, args: BelvoRecord) => Promise<BelvoRecord>, month: string,
) {
  let partial = false;
  async function read(name: string, list: string, link = '') {
    const tool = tools.find(item => item.name === name);
    if (!tool) throw new RequestError(502, 'O Belvo não habilitou a consulta de ' + list + '.');
    const args = belvoArguments(tool, link, month);
    const missing = (tool.inputSchema?.required ?? []).filter(key => !(key in args));
    if (missing.length) {
      console.info('belvo_missing', name, missing.filter(key => /^[a-zA-Z_]{1,40}$/.test(key)));
      throw new RequestError(502, 'O Belvo exige campos adicionais para consultar ' + list + '.');
    }
    const rows: BelvoRecord[] = [];
    const properties = tool.inputSchema?.properties ?? {};
    const cursorKey = ['cursor', 'page_cursor', 'pageCursor'].find(key => key in properties);
    for (let page = 1; page <= 3; page++) {
      const result = belvoPage(await call(name, args), list);
      rows.push(...result.rows);
      if (!result.next) return rows;
      if (page === 3) break;
      if (typeof result.next === 'string' && cursorKey) {
        if (args[cursorKey] === result.next) break;
        args[cursorKey] = result.next;
      } else if ('page' in properties) args.page = page + 1;
      else break;
    }
    partial = true;
    return rows;
  }
  const connections = (await read('list_connections', 'connections')).filter(connection => {
    const source = field(connection, 'product', 'product_type', 'productType', 'type', 'source');
    const kind = (label(source) || label(record(source)?.name) || label(record(source)?.id)).toLowerCase();
    return !kind || /open[ _-]?finance|banking|^ofda|^of[ _-]?br/.test(kind);
  });
  const accounts: { name: string; balance: number | null; currency: string }[] = [];
  const transactions: { description: string; date: string; amount: number; currency: string; direction: string }[] = [];
  const seen = new Set<string>();
  let skipped = 0;
  for (const connection of connections.slice(0, 10)) {
    const link = label(field(connection, 'connection_id', 'connectionId', 'link_id', 'linkId', 'link', 'id')) ||
      label(record(connection.link)?.id);
    if (!link) {
      console.info('belvo_link_shape', Object.keys(connection).filter(key => /^[a-zA-Z_]{1,40}$/.test(key)).slice(0, 20));
      skipped++;
      continue;
    }
    const [accountResult, transactionResult] = await Promise.allSettled([
      read('open_finance_list_accounts', 'accounts', link),
      read('open_finance_list_transactions', 'transactions', link),
    ]);
    if (accountResult.status === 'rejected') skipped++;
    else for (const account of accountResult.value) {
      const balance = field(account, 'balance', 'current_balance', 'currentBalance');
      accounts.push({
        name: label(field(account, 'name', 'display_name', 'displayName', 'type', 'category')) || 'Conta',
        balance: moneyValue(record(balance)?.current ?? record(balance)?.available ?? record(balance)?.amount ?? balance),
        currency: currencyCode(field(account, 'currency', 'currency_code', 'currencyCode') ?? record(balance)?.currency),
      });
    }
    if (transactionResult.status === 'rejected') skipped++;
    else for (const tx of transactionResult.value) {
      const date = label(field(tx, 'value_date', 'accounting_date', 'transaction_date', 'date', 'posted_on', 'datetime')).slice(0, 10);
      const amount = moneyValue(field(tx, 'amount', 'value'));
      if (amount === null || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !date.startsWith(month)) continue;
      const id = label(field(tx, 'id', 'transaction_id', 'transactionId'));
      if (id && seen.has(link + ':' + id)) continue;
      if (id) seen.add(link + ':' + id);
      const direction = label(field(tx, 'type', 'direction', 'credit_debit_type')).toLowerCase();
      transactions.push({
        date, amount: Math.abs(amount), currency: currencyCode(field(tx, 'currency', 'currency_code', 'currencyCode')),
        direction: /inflow|credit/.test(direction) ? 'in' : /outflow|debit/.test(direction) || amount < 0 ? 'out' : '',
        description: label(field(tx, 'description', 'description_raw', 'reference', 'name')) || 'Movimentação',
      });
    }
  }
  transactions.sort((a, b) => b.date.localeCompare(a.date));
  return { month, accounts, transactions: transactions.slice(0, 100), partial: partial || skipped > 0 || connections.length > 10 || transactions.length > 100, skipped };
}

async function verifyBelvo(code: string, verifier: string, month?: string) {
  const response = await fetch('https://auth.panorama.belvo.com/oauth2/token', {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(12000),
    body: new URLSearchParams({
      grant_type: 'authorization_code', client_id: belvoClientId, code, code_verifier: verifier,
      redirect_uri: fluxoPreviewOrigin + '/?belvo=1', resource: belvoResource,
    }),
  });
  if (!response.ok) throw new RequestError(502, 'O Belvo não concluiu a autorização. Tente conectar novamente.');
  const { access_token: token } = await response.json();
  if (typeof token !== 'string' || !token) throw new RequestError(502, 'O Belvo não retornou acesso ao conector.');
  const headers = new Headers({
    Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream',
  });
  const post = (body: unknown) => fetch(belvoResource, {
    method: 'POST', headers, body: JSON.stringify(body), redirect: 'error', signal: AbortSignal.timeout(12000),
  });
  async function result(reply: Response, id: number) {
    if (!reply.ok) throw new RequestError(502, 'O Belvo autorizou o acesso, mas o servidor MCP não respondeu à validação.');
    let data;
    if (reply.headers.get('content-type')?.includes('text/event-stream')) {
      const reader = reply.body?.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = '';
      try {
        while (reader) {
          const chunk = await reader.read();
          if (chunk.done) break;
          buffer += chunk.value.replace(/\r\n/g, '\n');
          if (buffer.length > 1048576) break;
          let boundary;
          while ((boundary = buffer.indexOf('\n\n')) !== -1) {
            const event = buffer.slice(0, boundary).split('\n').filter(line => line.startsWith('data:'))
              .map(line => line.slice(5).trimStart()).join('\n');
            buffer = buffer.slice(boundary + 2);
            if (event) {
              const message = JSON.parse(event);
              if (message.id === id) { data = message; break; }
            }
          }
          if (data) break;
        }
      } finally { void reader?.cancel().catch(() => undefined); }
    } else data = await reply.json();
    if (data?.id !== id || !data.result) throw new RequestError(502, 'O Belvo não retornou uma resposta MCP válida.');
    return data.result;
  }
  const initialize = await post({
    jsonrpc: '2.0', id: 1, method: 'initialize',
    params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'Fluxo Casal', version: '1.0.0' } },
  });
  const config = await result(initialize, 1);
  const session = initialize.headers.get('mcp-session-id');
  if (session) headers.set('MCP-Session-Id', session);
  if (typeof config.protocolVersion !== 'string') throw new RequestError(502, 'O Belvo não informou a versão do protocolo MCP.');
  headers.set('MCP-Protocol-Version', config.protocolVersion);
  const ready = await post({ jsonrpc: '2.0', method: 'notifications/initialized' });
  if (!ready.ok) throw new RequestError(502, 'Não foi possível iniciar a sessão com o Belvo.');
  const tools = await result(await post({ jsonrpc: '2.0', id: 2, method: 'tools/list' }), 2);
  const count = Array.isArray(tools.tools) ? tools.tools.length : 0;
  if (!count) throw new RequestError(502, 'Nenhuma ferramenta MCP disponível para este login.');
  if (!month) return { verified: true };
  let requestId = 2;
  return { verified: true, bankData: await readBelvoBankData(tools.tools, async (name, args) => {
    const id = ++requestId;
    return await result(await post({ jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } }), id);
  }, month) };
}

Deno.serve(async request => {
  if (request.method === 'GET' && new URL(request.url).pathname.endsWith('/open-finance/belvo-client.json')) {
    return Response.json({
      client_id: belvoClientId, client_name: 'Fluxo Casal',
      redirect_uris: [fluxoPreviewOrigin + '/?belvo=1'], grant_types: ['authorization_code'],
      response_types: ['code'], token_endpoint_auth_method: 'none',
    });
  }
  const mode = Deno.env.get('PLUGGY_MODE') ?? 'sandbox';
  const sandbox = mode === 'sandbox';
  const personal = mode === 'meu-pluggy';
  const configuredMode = sandbox || personal || mode === 'production';
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
    if (payload.action === 'belvo-check' || payload.action === 'belvo-read') {
      if (origin && origin !== fluxoPreviewOrigin) throw new RequestError(403, 'Abra a prévia do Fluxo para verificar o Belvo.');
      if (typeof payload.code !== 'string' || !payload.code || payload.code.length > 4096
        || typeof payload.verifier !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(payload.verifier)) {
        throw new RequestError(400, 'Retorno de autorização inválido.');
      }
      const month = payload.action === 'belvo-read' ? payload.month : undefined;
      if (payload.action === 'belvo-read' && (typeof month !== 'string' || !/^20\d{2}-(0[1-9]|1[0-2])$/.test(month))) {
        throw new RequestError(400, 'Selecione um mês válido.');
      }
      try { return json(await verifyBelvo(payload.code, payload.verifier, month)); }
      catch (error) {
        if (error instanceof RequestError) throw error;
        throw new RequestError(502, 'Não foi possível concluir a consulta ao Belvo. Tente novamente.');
      }
    }
    const actor = user.id;
    const credentials = personal ? personalCredentials(actor) : {
      clientId: Deno.env.get('PLUGGY_CLIENT_ID'),
      clientSecret: Deno.env.get('PLUGGY_CLIENT_SECRET'),
    };
    const allowMode = configuredMode && (sandbox || !!appOrigin?.startsWith('https://'));
    const configured = allowMode && Boolean(credentials?.clientId && credentials?.clientSecret);
    if (payload.action === 'status') return json({ sandbox, personal, configured });
    if (!configured || !credentials) {
      throw new RequestError(503, 'A conexão bancária ainda precisa ser configurada para este login.');
    }
    const allowedActions = ['connect', 'register', 'sync', 'disconnect', 'reconnect'];
    if (!allowedActions.includes(payload.action)) throw new RequestError(400, 'Ação inválida.');

    const { apiKey } = await pluggy<{ apiKey: string }>('/auth', 'POST', undefined, credentials);
    if (payload.action === 'connect') {
      const connectorPath = personal ? '/connectors/' + meuPluggyConnector : sandbox ? '/connectors?sandbox=true' : '/connectors?isOpenFinance=true';
      const available = personal
        ? [await pluggy<Connector>(connectorPath, 'GET', apiKey)]
        : (await pluggy<{ results: Connector[] }>(connectorPath, 'GET', apiKey)).results;
      const connectorIds = available.filter(connector => permitted(connector, mode)).map(connector => connector.id);
      if (!connectorIds.length) throw new RequestError(503, 'Nenhum conector habilitado neste ambiente.');
      const intent = await rpc<string>('fluxo_bank_intent', { actor });
      const { accessToken } = await pluggy<{ accessToken: string }>('/connect_token', 'POST', apiKey, {
        options: { clientUserId: intent, avoidDuplicates: true },
      });
      return json({ connectToken: accessToken, connectorIds, sandbox, personal });
    }

    if (payload.action === 'register') {
      const itemId = uuid(payload.itemId);
      const item = await pluggy<Item>('/items/' + itemId, 'GET', apiKey);
      if (!permitted(item.connector, mode)) throw new RequestError(403, 'Conector indisponível neste ambiente.');
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
      if (!permitted(current.connector, mode)) throw new RequestError(403, 'Conector indisponível neste ambiente.');
      const { accessToken } = await pluggy<{ accessToken: string }>('/connect_token', 'POST', apiKey, { itemId: item });
      return json({ connectToken: accessToken, connectorIds: [current.connector.id], sandbox, personal, updateItem: item });
    }

    const { item, revision } = await command('sync');
    const finish = (outcome: string, accounts: unknown[] = [], transactions: unknown[] = []) => rpc('fluxo_apply_bank', {
      target, expected_revision: revision, outcome, accounts, transactions,
    });
    try {
      const current = await pluggy<Item>('/items/' + item, 'GET', apiKey);
      if (!permitted(current.connector, mode)) throw new RequestError(403, 'Conector indisponível neste ambiente.');
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
