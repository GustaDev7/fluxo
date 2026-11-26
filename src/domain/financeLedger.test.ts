import { describe, expect, it } from 'vitest';
import { calculateInvestmentContribution, getTransactionImpact, money, parseMoneyInput, recentClosings, summarizeMonthlyLedger } from './financeLedger';
import type { FinanceTransaction, MonthlyClosing } from '../types/finance';

const transaction = (updates: Partial<FinanceTransaction>): FinanceTransaction => ({
  id: 'tx', type: 'expense', amount: 100, date: '2026-09-08', description: 'Teste',
  masterCategory: 'custos_fixos', ...updates,
});

describe('finance ledger', () => {
  it('rounds monetary values without floating point residue', () => {
    expect(money(0.1 + 0.2)).toBe(0.3);
  });

  it('accepts Brazilian decimals and rejects truncated or malformed monetary input', () => {
    expect(parseMoneyInput('1.234,56')).toBe(1234.56);
    expect(parseMoneyInput('1000,25')).toBe(1000.25);
    expect(parseMoneyInput('1000.25')).toBe(1000.25);
    for (const invalid of ['1.23.456,00', '1.234abc', '0', '-120', '0,001']) {
      expect(parseMoneyInput(invalid)).toBeNull();
    }
  });

  it('counts each contribution once and keeps reserve withdrawals out of income', () => {
    const transactions = [
      transaction({ type: 'income', amount: 1000 }),
      transaction({ type: 'income', amount: 30, tags: ['reserva', 'resgate'] }),
      transaction({ type: 'expense', amount: 50, masterCategory: 'metas' }),
      transaction({ type: 'transfer', amount: 60, goalId: 'goal' }),
      transaction({ type: 'investment', amount: 40, masterCategory: 'metas' }),
      transaction({ type: 'transfer', amount: 20, tags: ['reserva'] }),
      transaction({ type: 'debt_payment', amount: 15 }),
    ];
    expect(summarizeMonthlyLedger(transactions, 0)).toEqual({
      income: 1000, expenses: 50, investments: 40, debtPayments: 15, savingsRate: 9,
    });
    expect(summarizeMonthlyLedger(transactions, 500).income).toBe(500);
  });

  it('orders historical records and excludes months after the period being viewed', () => {
    const rows = ['2026-10', '2026-06', '2026-09', '2026-08'].map((month) => ({ month } as MonthlyClosing));
    expect(recentClosings(rows, '2026-09', 2).map((row) => row.month)).toEqual(['2026-08', '2026-09']);
    expect(rows[0].month).toBe('2026-10');
  });

  it('debits an expense and only updates an invoice for card expenses', () => {
    expect(getTransactionImpact(transaction({ accountId: 'a' })).sourceAccount).toBe(-100);
    expect(getTransactionImpact(transaction({ cardId: 'c' })).cardInvoice).toBe(100);
    expect(getTransactionImpact(transaction({ type: 'investment', cardId: 'c' })).cardInvoice).toBe(0);
  });

  it('moves the same amount between accounts on transfers', () => {
    expect(getTransactionImpact(transaction({ type: 'transfer' }))).toEqual({
      sourceAccount: -100, destinationAccount: 100, cardInvoice: 0, goal: 0, emergencyFund: 0,
    });
  });

  it('credits income, redemption and linked goals correctly', () => {
    expect(getTransactionImpact(transaction({ type: 'income' })).sourceAccount).toBe(100);
    expect(getTransactionImpact(transaction({ type: 'redemption' })).sourceAccount).toBe(100);
    expect(getTransactionImpact(transaction({ type: 'transfer', goalId: 'g' })).goal).toBe(100);
  });

  it('tracks deposits and withdrawals from the emergency fund', () => {
    expect(getTransactionImpact(transaction({ type: 'transfer', tags: ['reserva'] })).emergencyFund).toBe(100);
    expect(getTransactionImpact(transaction({ type: 'income', tags: ['reserva', 'resgate'] })).emergencyFund).toBe(-100);
  });

  it('updates an investment position and weighted average on contribution', () => {
    expect(calculateInvestmentContribution({
      quantity: 10,
      totalInvested: 1_000,
      averagePrice: 100,
      currentPrice: 125,
      amount: 250,
    })).toEqual({
      quantity: 12,
      totalInvested: 1_250,
      averagePrice: 1_250 / 12,
      currentValue: 1_500,
    });
  });

  it('supports the first contribution when the asset has no price yet', () => {
    expect(calculateInvestmentContribution({
      quantity: 0,
      totalInvested: 0,
      averagePrice: 0,
      currentPrice: 0,
      amount: 300,
      acquiredQuantity: 3,
    })).toEqual({
      quantity: 3,
      totalInvested: 300,
      averagePrice: 100,
      currentValue: 300,
    });
  });
});
