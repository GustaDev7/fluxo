import { describe, expect, it } from 'vitest';
import type { FinanceAssistantSnapshot } from '../types/assistant';
import { answerFinanceQuestion, buildFinanceAssistantWelcome, parseTransactionRequest } from './financeAssistant';

const snapshot = (): FinanceAssistantSnapshot => ({
  currentMonth: '2026-09',
  accounts: [{
    id: 'checking-1',
    name: 'Conta principal',
    bank: 'Banco Fluxo',
    type: 'checking',
    balance: 3500,
    color: '#6366f1',
    isActive: true,
  }],
  transactions: [
    { id: 'income-aug', type: 'income', amount: 4500, date: '2026-08-05', description: 'Salário', masterCategory: 'custos_fixos' },
    { id: 'expense-aug', type: 'expense', amount: 1800, date: '2026-08-10', description: 'Despesas', masterCategory: 'custos_fixos' },
    { id: 'income-sep', type: 'income', amount: 5000, date: '2026-09-05', description: 'Salário', masterCategory: 'custos_fixos' },
    { id: 'rent-sep', type: 'expense', amount: 1800, date: '2026-09-10', description: 'Aluguel', masterCategory: 'custos_fixos' },
    { id: 'market-sep', type: 'expense', amount: 600, date: '2026-09-12', description: 'Mercado', masterCategory: 'conforto' },
  ],
  bills: [{
    id: 'bill-1',
    title: 'Energia',
    amount: 300,
    dueDate: '2026-09-25',
    type: 'expense',
    status: 'pending',
    masterCategory: 'custos_fixos',
  }],
  debts: [
    { id: 'debt-1', creditor: 'Banco A', name: 'Empréstimo barato', type: 'loan', originalAmount: 5000, currentBalance: 3000, interestRateMonthly: 2, totalInstallments: 12, remainingInstallments: 8, installmentAmount: 450, dueDay: 10, priority: 'medium', status: 'active' },
    { id: 'debt-2', creditor: 'Banco B', name: 'Cartão caro', type: 'credit_card', originalAmount: 2500, currentBalance: 1800, interestRateMonthly: 12, totalInstallments: 6, remainingInstallments: 5, installmentAmount: 400, dueDay: 15, priority: 'urgent', status: 'active' },
  ],
  goals: [],
  investments: [],
  budgets: [],
  currentBudget: {
    month: '2026-09',
    plannedIncome: 5000,
    allocations: { custos_fixos: 2500, conforto: 800, metas: 500, prazeres: 400, liberdade_financeira: 500, conhecimento: 300 },
  },
  emergencyFund: { currentAmount: 6000, targetAmount: 18000, targetMonths: 6 },
  monthIncome: 5000,
  monthExpenses: 2400,
  monthInvestments: 400,
  monthDebtsPaid: 300,
  availableCash: 1900,
  monthlyEssentialCosts: 3000,
  savingsRate: 8,
  netWorth: 25000,
});

describe('financeAssistant', () => {
  it('prepara uma despesa sem alterar dados e infere a categoria', () => {
    const action = parseTransactionRequest('Gastei R$ 150,50 no mercado', snapshot());

    expect(action).toMatchObject({
      status: 'pending',
      transaction: {
        type: 'expense',
        amount: 150.5,
        masterCategory: 'conforto',
        accountId: 'checking-1',
      },
    });
  });

  it('prepara uma renda extra na conta ativa', () => {
    const action = parseTransactionRequest('Recebi R$ 1.500 de renda extra', snapshot());

    expect(action?.transaction).toMatchObject({ type: 'income', amount: 1500, accountId: 'checking-1' });
  });

  it('não cria ação financeira sem valor explícito', () => {
    expect(parseTransactionRequest('Paguei a conta de energia', snapshot())).toBeNull();
  });

  it('desconta compromissos pendentes ao estimar o valor livre', () => {
    const reply = answerFinanceQuestion('Quanto ainda posso gastar?', snapshot());

    expect(reply.content).toContain('R$ 1.600,00');
    expect(reply.metadata?.route).toBe('bills');
  });

  it('prioriza a dívida com maior taxa de juros', () => {
    const reply = answerFinanceQuestion('Qual dívida devo priorizar?', snapshot());

    expect(reply.content).toContain('Cartão caro');
    expect(reply.content).toContain('12,00% ao mês');
  });

  it('compara o mês atual com o anterior usando transações registradas', () => {
    const reply = answerFinanceQuestion('Compare este mês com o anterior', snapshot());

    expect(reply.content).toContain('agosto de 2026');
    expect(reply.content).toContain('setembro de 2026');
    expect(reply.content).toContain('R$ 600,00');
  });

  it('simula uma compra sem registrar lançamento', () => {
    const reply = answerFinanceQuestion('Consigo comprar algo de R$ 2.000?', snapshot());

    expect(reply.content).toContain('R$ 100,00');
    expect(reply.metadata?.action).toBeUndefined();
  });

  it('orienta o primeiro uso quando ainda não há dados', () => {
    const empty = snapshot();
    empty.accounts = [];
    empty.transactions = [];

    const reply = buildFinanceAssistantWelcome(empty, 'Gustavo');
    expect(reply.content).toContain('Ainda não há dados suficientes');
    expect(reply.metadata?.route).toBe('budget');
  });
});
