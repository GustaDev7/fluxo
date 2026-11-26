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

function belvoInstitution(value: unknown) {
  const name = label(field(record(value) ?? {}, 'display_name', 'displayName', 'name')) || label(value);
  if (/nubank|nu pagamentos/i.test(name)) return 'Nubank';
  if (/mercado[ _-]?pago/i.test(name)) return 'Mercado Pago';
  return name;
}

function belvoTimestamp(value: unknown): string | undefined {
  const date = label(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  if (/^\d{4}-\d{2}-\d{2}T/.test(date) && Number.isFinite(Date.parse(date))) return new Date(date).toISOString();
}

function belvoReserves(account: BelvoRecord, balance: BelvoRecord | undefined, institution: string, currency: string) {
  const rows = field(balance ?? {}, 'reserved_balances', 'reservedBalances') ??
    field(account, 'reserved_balances', 'reservedBalances');
  if (!Array.isArray(rows)) return undefined;
  const accountBalanceAt = belvoTimestamp(field(balance ?? {}, 'last_updated_at', 'lastUpdatedAt'));
  const collectedAt = belvoTimestamp(field(balance ?? {}, 'collected_at', 'collectedAt') ??
    field(account, 'collected_at', 'collectedAt'));
  const seen = new Set<string>();
  return rows.flatMap(value => {
    const reserve = record(value);
    if (!reserve) return [];
    const id = label(reserve.identification);
    if (id && seen.has(id)) return [];
    if (id) seen.add(id);
    const name = label(reserve.name) || (institution === 'Mercado Pago' ? 'Cofrinho' : 'Reserva');
    const balanceAt = belvoTimestamp(field(reserve, 'last_updated_at', 'lastUpdatedAt', 'reference_date', 'referenceDate')) ?? accountBalanceAt;
    const amounts = Array.isArray(reserve.amounts) ? reserve.amounts.flatMap(value => {
      const amount = record(value);
      if (!amount) return [];
      return [{
        name,
        currency: currencyCode(amount.currency ?? currency),
        balance: moneyValue(field(amount, 'amount', 'value')),
        balanceAt: belvoTimestamp(field(amount, 'last_updated_at', 'lastUpdatedAt', 'reference_date', 'referenceDate')) ?? balanceAt,
        collectedAt,
      }];
    }) : [];
    return amounts.length ? amounts : [{ name, currency, balance: null, balanceAt, collectedAt }];
  });
}

function belvoAccount(account: BelvoRecord, connection: BelvoRecord) {
  const providerName = label(field(account, 'name', 'display_name', 'displayName'));
  const institution = belvoInstitution(connection.institution) || belvoInstitution(account.institution);
  const kind = [account.category, account.type, account.account_type, account.subtype]
    .map(label).join(' ').replace(/[_-]/g, ' ').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const isCard = Boolean(record(account.credit_data)) || /credit card|cartao de credito/.test(kind) || /\bvisa\b|mastercard/i.test(providerName) ||
    (/^gold$/i.test(providerName) && /nubank|nu pagamentos/i.test(institution));
  const isDebt = /loan|financing|financiamento|emprestimo/.test(kind) ||
    /credito pessoal|crédito pessoal|financiamento/i.test(providerName);
  const group = isCard ? 'card' : isDebt ? 'debt' : /checking|savings|deposit|prepaid|payment account|conta corrente|poupanca|conta de pagamento/.test(kind) ? 'cash' : 'other';
  const type = {
    card: 'Cartão de crédito',
    debt: /financ/i.test(kind + ' ' + providerName) ? 'Financiamento' : 'Empréstimo',
    cash: /savings|poupanca/.test(kind) ? 'Poupança' : /checking|conta corrente/.test(kind) ? 'Conta corrente' : 'Conta bancária',
    other: /investment/.test(kind) ? 'Investimento' : 'Produto financeiro',
  }[group];
  const balance = field(account, 'balance', 'current_balance', 'currentBalance');
  const reported = record(balance);
  const currency = currencyCode(field(account, 'currency', 'currency_code', 'currencyCode') ?? reported?.currency);
  const available = group === 'cash' ? moneyValue(reported?.available) : null;
  const shown = available ?? moneyValue(reported?.current ?? reported?.amount ?? reported?.available ?? balance);
  const finalDigits = group === 'card' ? label(field(account, 'last_four', 'lastFour', 'last_four_digits', 'last4')) : '';
  const name = !providerName || providerName.toLowerCase() === institution.toLowerCase() ? type : providerName;
  return {
    name: /^gold$/i.test(name) ? 'Gold' : name, institution, group, type,
    lastFour: /^\d{4}$/.test(finalDigits) ? finalDigits : null, balance: shown,
    balanceLabel: available !== null ? 'Saldo disponível' : group === 'cash' ? 'Saldo informado' : 'Valor informado',
    currency,
    reserves: isCard || isDebt ? undefined : belvoReserves(account, reported, institution, currency),
  };
}

function belvoInvestment(row: BelvoRecord, connection: BelvoRecord) {
  const balance = record(row.balance);
  const net = moneyValue(field(balance ?? {}, 'net_value', 'netValue') ?? field(row, 'net_value', 'netValue'));
  const gross = moneyValue(field(balance ?? {}, 'gross_value', 'grossValue') ?? field(row, 'gross_value', 'grossValue'));
  return {
    name: label(field(row, 'product_name', 'productName', 'name')) || 'Investimento',
    institution: belvoInstitution(connection.institution) || belvoInstitution(row.institution),
    currency: currencyCode(field(row, 'currency', 'currency_code') ?? balance?.currency),
    balance: net ?? gross ?? moneyValue(balance?.current ?? balance?.amount ?? row.balance),
    balanceLabel: net !== null ? 'Valor líquido' : gross !== null ? 'Valor bruto' : 'Valor informado',
    date: label(field(balance ?? {}, 'reference_date', 'referenceDate') ?? row.reference_date).slice(0, 10),
  };
}

function belvoBill(row: BelvoRecord, connection: BelvoRecord) {
  return {
    name: label(field(row, 'bill_name', 'name', 'description')) || 'Fatura de cartão',
    institution: belvoInstitution(connection.institution) || belvoInstitution(row.institution),
    currency: currencyCode(field(row, 'currency', 'currency_code') ?? record(row.amount)?.currency),
    amount: moneyValue(field(row, 'total_amount', 'totalAmount', 'amount', 'balance')) ??
      moneyValue(record(row.amount)?.value),
    dueDate: label(field(row, 'due_date', 'dueDate', 'payment_due_date')).slice(0, 10),
  };
}

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
  const accounts: ReturnType<typeof belvoAccount>[] = [];
  const investments: ReturnType<typeof belvoInvestment>[] = [];
  const bills: ReturnType<typeof belvoBill>[] = [];
  const investmentLinks = new Set<string>();
  const billLinks = new Set<string>();
  let investmentFailures = 0;
  let billFailures = 0;
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
    const [accountResult, transactionResult, investmentResult, billResult] = await Promise.allSettled([
      read('open_finance_list_accounts', 'accounts', link),
      read('open_finance_list_transactions', 'transactions', link),
      read('open_finance_list_investments', 'investments', link),
      read('open_finance_list_bills', 'bills', link),
    ]);
    if (accountResult.status === 'rejected') skipped++;
    else accounts.push(...accountResult.value.map(account => belvoAccount(account, connection)));
    if (investmentResult.status === 'rejected') investmentFailures++;
    else for (const item of investmentResult.value) {
      const id = label(field(item, 'id', 'investment_id', 'investmentId'));
      if (id && investmentLinks.has(link + ':' + id)) continue;
      if (id) investmentLinks.add(link + ':' + id);
      investments.push(belvoInvestment(item, connection));
    }
    if (billResult.status === 'rejected') billFailures++;
    else for (const item of billResult.value) {
      const bill = belvoBill(item, connection);
      if (bill.dueDate && !bill.dueDate.startsWith(month)) continue;
      const id = label(field(item, 'id', 'bill_id', 'billId'));
      if (id && billLinks.has(link + ':' + id)) continue;
      if (id) billLinks.add(link + ':' + id);
      bills.push(bill);
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
  return { month, accounts, investments, bills, investmentFailures, billFailures, transactions: transactions.slice(0, 100), partial: partial || skipped > 0 || connections.length > 10 || transactions.length > 100, skipped };
}

type BelvoTokens = { access: string; refresh: string | null; expiresAt: number };

const demoFluxoIds = new Set(['dbd41ec9-a27c-4f29-a0c9-87a5756d9323', '6270b4e0-99ec-457a-87ed-83d5cddd25c8']);

async function belvoToken(params: Record<string, string>, previous?: string): Promise<BelvoTokens> {
  const response = await fetch('https://auth.panorama.belvo.com/oauth2/token', {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(12000),
    body: new URLSearchParams({ client_id: belvoClientId, resource: belvoResource, ...params }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || typeof data?.access_token !== 'string' || !data.access_token) {
    if (data?.error === 'invalid_grant') throw new RequestError(409, 'A autorização da Belvo expirou. Conecte sua conta novamente.');
    throw new RequestError(502, 'O Belvo não concluiu a autorização. Tente novamente.');
  }
  const expires = Number(data.expires_in);
  return {
    access: data.access_token,
    refresh: typeof data.refresh_token === 'string' ? data.refresh_token : previous ?? null,
    expiresAt: Date.now() + (Number.isFinite(expires) && expires > 0 ? expires : 300) * 1000,
  };
}

function exchangeBelvo(code: string, verifier: string) {
  return belvoToken({ grant_type: 'authorization_code', code, code_verifier: verifier, redirect_uri: fluxoPreviewOrigin + '/?belvo=1' });
}

async function belvoCipherKey(serviceKey: string) {
  const bytes = new TextEncoder().encode('fluxo:belvo:tokens:v1:' + serviceKey);
  return crypto.subtle.importKey('raw', await crypto.subtle.digest('SHA-256', bytes), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function sealBelvo(tokens: BelvoTokens, owner: string, serviceKey: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const bytes = new TextEncoder().encode(JSON.stringify(tokens));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(owner) }, await belvoCipherKey(serviceKey), bytes);
  return btoa(String.fromCharCode(...iv, ...new Uint8Array(ciphertext)));
}

async function openBelvo(cipher: string, owner: string, serviceKey: string): Promise<BelvoTokens> {
  try {
    const bytes = Uint8Array.from(atob(cipher), char => char.charCodeAt(0));
    const decrypted = await crypto.subtle.decrypt({
      name: 'AES-GCM', iv: bytes.slice(0, 12), additionalData: new TextEncoder().encode(owner),
    }, await belvoCipherKey(serviceKey), bytes.slice(12));
    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch { throw new RequestError(409, 'Conecte sua conta Belvo novamente para atualizar a autorização.'); }
}

async function verifyBelvo(token: string, month?: string) {
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
      redirect_uris: [fluxoPreviewOrigin + '/?belvo=1'], grant_types: ['authorization_code', 'refresh_token'],
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
    if (payload.action.startsWith('belvo-')) {
      if (origin && origin !== fluxoPreviewOrigin) throw new RequestError(403, 'Abra a prévia do Fluxo para acessar o Belvo.');
      const owner = user.id;
      const action = payload.action;
      const demo = demoFluxoIds.has(owner);
      if (action === 'belvo-disconnect') {
        await rpc('fluxo_disconnect_belvo', { actor: owner });
        return json({ connected: false });
      }
      if (!['belvo-check', 'belvo-read', 'belvo-connect', 'belvo-sync'].includes(action)) {
        throw new RequestError(400, 'Ação inválida.');
      }
      const month = action === 'belvo-check' ? undefined : payload.month;
      if (action !== 'belvo-check' && (typeof month !== 'string' || !/^20\d{2}-(0[1-9]|1[0-2])$/.test(month))) {
        throw new RequestError(400, 'Selecione um mês válido.');
      }

      const sessions = () => admin.from('fluxo_belvo_sessions');
      let lease: string | undefined;
      try {
        let tokens: BelvoTokens;
        if (action === 'belvo-sync') {
          if (demo) return json({ connected: false });
          const existing = await sessions().select('owner_id').eq('owner_id', owner).maybeSingle();
          if (existing.error) throw existing.error;
          if (!existing.data) return json({ connected: false });
          const cached = await admin.from('fluxo_belvo_snapshots').select('payload,updated_at')
            .eq('owner_id', owner).eq('month', month).maybeSingle();
          if (cached.error) throw cached.error;
          if (cached.data && Date.now() - Date.parse(cached.data.updated_at) < 120000) {
            return json({ connected: true, bankData: cached.data.payload, updatedAt: cached.data.updated_at });
          }

          const recent = new Date().toISOString();
          const candidate = crypto.randomUUID();
          const claimed = await sessions().update({ lease_id: candidate, lease_until: new Date(Date.now() + 90000).toISOString() })
            .eq('owner_id', owner).or('lease_until.is.null,lease_until.lt.' + recent).select('secret_cipher').maybeSingle();
          if (claimed.error) throw claimed.error;
          if (!claimed.data) return json({ connected: true, pending: true });
          lease = candidate;
          tokens = await openBelvo(claimed.data.secret_cipher, owner, serviceKey);
          if (tokens.expiresAt - Date.now() < 30000) {
            if (!tokens.refresh) throw new RequestError(409, 'Conecte sua conta Belvo novamente para atualizar a autorização.');
            tokens = await belvoToken({ grant_type: 'refresh_token', refresh_token: tokens.refresh }, tokens.refresh);
            const saved = await sessions().update({ secret_cipher: await sealBelvo(tokens, owner, serviceKey) })
              .eq('owner_id', owner).eq('lease_id', lease).select('owner_id').maybeSingle();
            if (saved.error) throw saved.error;
            if (!saved.data) throw new RequestError(409, 'A conexão mudou. Reabra o painel.');
          }
        } else {
          if (action === 'belvo-connect' && demo) throw new RequestError(403, 'Use seu login particular para salvar uma conexão bancária.');
          if (typeof payload.code !== 'string' || !payload.code || payload.code.length > 4096
            || typeof payload.verifier !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(payload.verifier)) {
            throw new RequestError(400, 'Retorno de autorização inválido.');
          }
          tokens = await exchangeBelvo(payload.code, payload.verifier);
          if (action === 'belvo-connect' && tokens.refresh) {
            const candidate = crypto.randomUUID();
            await rpc('fluxo_connect_belvo', { actor: owner, cipher: await sealBelvo(tokens, owner, serviceKey), lease: candidate });
            lease = candidate;
          }
        }
        const reading = await verifyBelvo(tokens.access, month);
        const updatedAt = new Date().toISOString();
        if (lease && reading.bankData) {
          const saved = await rpc<boolean>('fluxo_write_belvo_snapshot', { actor: owner, lease, period: month, data: reading.bankData });
          if (!saved) throw new RequestError(409, 'A conexão mudou. Reabra o painel.');
        }
        return json({ ...reading, connected: !!lease, updatedAt,
          ...(action === 'belvo-connect' && !tokens.refresh ? { manual: true } : {}) });
      } catch (error) {
        if (error instanceof RequestError) {
          if (action === 'belvo-sync' && error.status === 409) return json({ connected: false, reauthorize: true });
          throw error;
        }
        throw new RequestError(502, 'Não foi possível concluir a consulta ao Belvo. Tente novamente.');
      } finally {
        if (lease) await sessions().update({ lease_id: null, lease_until: null }).eq('owner_id', owner).eq('lease_id', lease);
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
