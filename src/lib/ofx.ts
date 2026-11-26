type Entry = { fit_id: string; description: string; posted_on: string; amount: number; direction: 'CREDIT' | 'DEBIT' };

function tag(text: string, name: string) {
  return new RegExp('<' + name + '>\\s*([^<\\r\\n]+)', 'i').exec(text)?.[1].trim();
}

function dateValue(value: string | undefined) {
  const parts = /^(\d{4})(\d{2})(\d{2})/.exec(value ?? '');
  if (!parts) return null;
  const date = parts.slice(1).join('-');
  const parsed = new Date(date + 'T00:00:00Z');
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().startsWith(date) ? date : null;
}

function amountValue(value: string | undefined) {
  if (!/^[+-]?(?:\d+(?:[.,]\d{1,2})?|[.,]\d{1,2})$/.test(value ?? '')) return null;
  const amount = Number(value!.replace(',', '.'));
  return Number.isFinite(amount) && Math.abs(amount) <= 999999999999.99 ? amount : null;
}

function textValue(value: string) {
  const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
  return value.replace(/&(amp|lt|gt|quot|apos);/g, (_, key: string) => entities[key]).trim();
}

export function parseOfx(text: string) {
  const statements = [...text.matchAll(/<(STMTRS|CCSTMTRS)>([\s\S]*?)<\/\1>/gi)];
  if (statements.length !== 1) throw new Error('Exporte um arquivo OFX com o extrato de uma única conta ou cartão.');
  const [, type, statement] = statements[0];
  const accountKind = type.toUpperCase() === 'CCSTMTRS' ? 'CREDIT' : 'BANK';
  const currency = tag(statement, 'CURDEF')?.toUpperCase();
  const accountId = tag(statement, 'ACCTID');
  if (!accountId || !currency || !/^[A-Z]{3}$/.test(currency)) throw new Error('O OFX precisa informar a conta e a moeda.');
  const records = [...statement.matchAll(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi)];
  if (!records.length || records.length > 2500) throw new Error('O extrato deve conter entre 1 e 2.500 lançamentos.');
  const entries: Entry[] = records.map(([, entry], index) => {
    const fitId = tag(entry, 'FITID');
    const amount = amountValue(tag(entry, 'TRNAMT'));
    const date = dateValue(tag(entry, 'DTPOSTED'));
    if (!fitId || fitId.length > 250 || amount === null || !date) throw new Error(`Revise o lançamento ${index + 1} do arquivo OFX.`);
    const description = textValue(tag(entry, 'NAME') || tag(entry, 'MEMO') || 'Lançamento bancário').slice(0, 400);
    return { fit_id: fitId, description, posted_on: date, amount: Math.abs(amount), direction: amount < 0 ? 'DEBIT' : 'CREDIT' };
  });
  const ledger = /<LEDGERBAL>([\s\S]*?)<\/LEDGERBAL>/i.exec(statement)?.[1] ?? '';
  const balance = amountValue(tag(ledger, 'BALAMT'));
  const balanceDate = balance === null ? null : dateValue(tag(ledger, 'DTASOF'));
  return {
    identity: [tag(text, 'FID') ?? tag(statement, 'BANKID') ?? tag(text, 'ORG') ?? '', tag(statement, 'BRANCHID') ?? '', accountId, accountKind, currency],
    accountKind, currency, entries, balanceDate, balance: balanceDate ? balance : null,
  };
}

export async function readOfx(file: File, institution: string) {
  if (file.size > 2 * 1024 * 1024) throw new Error('Selecione um OFX de até 2 MB.');
  const buffer = await file.arrayBuffer();
  let text: string;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(buffer); }
  catch { text = new TextDecoder('windows-1252').decode(buffer); }
  const result = parseOfx(text);
  const { identity, ...statement } = result;
  const bytes = new TextEncoder().encode(JSON.stringify([institution.trim().toLocaleLowerCase('pt-BR'), ...identity]));
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return { ...statement, key: Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('') };
}
