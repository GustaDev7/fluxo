import { describe, expect, it } from 'vitest';
import { getTransactionImpact, money } from './financeLedger';
import type { FinanceTransaction } from '../types/finance';

const transaction = (updates: Partial<FinanceTransaction>): FinanceTransaction => ({
  id: 'tx', type: 'expense', amount: 100, date: '2026-09-08', description: 'Teste',
  masterCategory: 'custos_fixos', ...updates,
});

describe('finance ledger', () => {
  it('rounds monetary values without floating point residue', () => {
    expect(money(0.1 + 0.2)).toBe(0.3);
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
});
