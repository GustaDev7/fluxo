import { describe, expect, it } from 'vitest';
import { parseOfx } from './ofx';

const transaction = '<STMTTRN><DTPOSTED>20261125[-3:BRT]<TRNAMT>-12,50<FITID>entry-1<NAME>Café &amp; Pão</STMTTRN>';
const statement = (entry: string, type = 'STMTRS') =>
  `<OFX><${type}><CURDEF>BRL<BANKID>000<ACCTID>123<BANKTRANLIST>${entry}</BANKTRANLIST><LEDGERBAL><BALAMT>100.50<DTASOF>20261129</LEDGERBAL></${type}></OFX>`;

describe('OFX statements', () => {
  it('reads SGML transactions, currency, and latest balance', () => {
    const data = parseOfx(statement(transaction));
    expect(data).toMatchObject({
      accountKind: 'BANK', currency: 'BRL', balanceDate: '2026-11-29', balance: 100.50,
      entries: [{ fit_id: 'entry-1', description: 'Café & Pão', posted_on: '2026-11-25', amount: 12.50, direction: 'DEBIT' }],
    });
  });

  it('reads XML-tagged credit card entries', () => {
    const data = parseOfx(statement('<STMTTRN><DTPOSTED>20261125</DTPOSTED><TRNAMT>25.00</TRNAMT><FITID>refund</FITID><MEMO>Estorno</MEMO></STMTTRN>', 'CCSTMTRS'));
    expect(data.accountKind).toBe('CREDIT');
    expect(data.entries[0]).toMatchObject({ direction: 'CREDIT', description: 'Estorno', amount: 25 });
  });

  it('rejects invalid dates and multiple accounts', () => {
    expect(() => parseOfx(statement(transaction.replace('20261125', '20260230')))).toThrow('lançamento 1');
    expect(() => parseOfx(statement(transaction) + statement(transaction))).toThrow('uma única conta');
  });
});
