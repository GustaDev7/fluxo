import { describe, expect, it } from 'vitest';
import { amountFromPercentage, budgetCategoryTag, calculateBudget, copyBudgetToMonth, createBudgetForMonth, ensureBudgetForMonth, percentageFromAmount, replaceBudgetForMonth, resolveCategory, transactionMatchesBudgetCategory } from './budgetEngine';
import { BudgetCategory, FinanceTransaction, ZeroBasedBudget } from '../types/finance';

const category = (overrides: Partial<BudgetCategory> = {}): BudgetCategory => ({
  id: crypto.randomUUID(), name: 'Teste', color: '#6366f1', allocationMode: 'percentage',
  percentage: '40', fixedAmount: 0, plannedAmount: 0, priority: 1, archived: false, ...overrides,
});

const budget = (categories: BudgetCategory[], income = 4600): ZeroBasedBudget => ({
  month: '2026-09', plannedIncome: income, allocations: { custos_fixos: 0, conforto: 0, metas: 0, prazeres: 0, liberdade_financeira: 0, conhecimento: 0 }, categories,
});

describe('budgetEngine', () => {
  it('converte 45% de 4600 em 2070', () => expect(amountFromPercentage('45', 4600)).toBe(2070));
  it('mantém precisão interna ao converter valor fixo', () => expect(percentageFromAmount(2000, 4600)).toBe('43.478260869565'));
  it('identifica orçamento equilibrado', () => expect(calculateBudget(budget([category({ percentage: '100' })])).status).toBe('balanced'));
  it('mostra sobra sem considerá-la erro', () => expect(calculateBudget(budget([category({ percentage: '80' })])).balance).toBe(920));
  it('mostra excesso e não bloqueia', () => expect(calculateBudget(budget([category({ percentage: '105' })])).balance).toBe(-230));
  it('valor fixo não muda quando a renda muda', () => expect(resolveCategory(category({ allocationMode: 'fixed', fixedAmount: 1000 }), 5000).plannedAmount).toBe(1000));
  it('soma fontes previstas e realizadas separadamente', () => {
    const result = calculateBudget({ ...budget([]), incomeSources: [{ id: '1', name: 'Salário', type: 'salary', plannedAmount: 4600, receivedAmount: 4200, recurring: true }] });
    expect(result.plannedIncome).toBe(4600); expect(result.receivedIncome).toBe(4200);
  });
  it('não soma subcategoria duas vezes', () => expect(calculateBudget(budget([category({ id: 'pai', percentage: '50' }), category({ parentId: 'pai', percentage: '20' })])).totalAllocated).toBe(2300));
  it('mantém a renda recebida isolada por mês', () => {
    const september = { ...budget([]), month: '2026-09', incomeSources: [{ id: 'sep', name: 'Salário', type: 'salary' as const, plannedAmount: 4600, receivedAmount: 4600, recurring: true }] };
    const october = { ...budget([]), month: '2026-10', incomeSources: [{ id: 'oct', name: 'Salário + extra', type: 'extra' as const, plannedAmount: 5200, receivedAmount: 5700, recurring: false }] };
    const months = replaceBudgetForMonth([september], october);

    expect(months.find((item) => item.month === '2026-09')?.incomeSources?.[0].receivedAmount).toBe(4600);
    expect(months.find((item) => item.month === '2026-10')?.incomeSources?.[0].receivedAmount).toBe(5700);
  });
  it('copia um orçamento sem reutilizar identidades ou valores recebidos', () => {
    const source = { ...budget([category({ id: 'parent' }), category({ id: 'child', parentId: 'parent' })]), id: 'budget-sep', incomeSources: [{ id: 'income-sep', name: 'Salário', type: 'salary' as const, plannedAmount: 4600, receivedAmount: 4600, recurring: true }] };
    const copy = copyBudgetToMonth(source, '2026-10');

    expect(copy.id).toBeUndefined();
    expect(copy.incomeSources?.[0].id).not.toBe('income-sep');
    expect(copy.incomeSources?.[0].receivedAmount).toBe(0);
    expect(copy.categories?.[1].parentId).toBe(copy.categories?.[0].id);
  });
  it('inicia um mês novo sem replicar renda planejada ou recebida', () => {
    const september = {
      ...budget([
        category({ id: 'percentual', allocationMode: 'percentage', percentage: '40', plannedAmount: 1840 }),
        category({ id: 'fixa', allocationMode: 'fixed', fixedAmount: 900, plannedAmount: 900 }),
      ]),
      month: '2026-09',
      incomeSources: [
        { id: 'salary', name: 'Salário variável', type: 'salary' as const, plannedAmount: 4600, receivedAmount: 5100, recurring: true },
        { id: 'extra', name: 'Renda extra', type: 'extra' as const, plannedAmount: 800, receivedAmount: 800, recurring: false },
      ],
    };

    const october = createBudgetForMonth(september, '2026-10');

    expect(october.month).toBe('2026-10');
    expect(october.plannedIncome).toBe(0);
    expect(october.incomeSources).toHaveLength(1);
    expect(october.incomeSources?.[0]).toMatchObject({ name: 'Salário variável', plannedAmount: 0, receivedAmount: 0 });
    expect(october.incomeSources?.[0].id).not.toBe('salary');
    expect(october.categories?.find((item) => item.id !== 'percentual' && item.allocationMode === 'fixed')?.fixedAmount).toBe(0);
    expect(calculateBudget(october).plannedIncome).toBe(0);
    expect(september.incomeSources[0].receivedAmount).toBe(5100);
  });
  it('registra a nova competência como orçamento independente ao trocar de mês', () => {
    const september = {
      ...budget([]),
      month: '2026-09',
      incomeSources: [
        { id: 'salary-september', name: 'Salário', type: 'salary' as const, plannedAmount: 5120, receivedAmount: 4900, recurring: true },
      ],
    };

    const octoberState = ensureBudgetForMonth([september], september, '2026-10');

    expect(octoberState.created).toBe(true);
    expect(octoberState.budget.month).toBe('2026-10');
    expect(calculateBudget(octoberState.budget).plannedIncome).toBe(0);
    expect(octoberState.budgets).toHaveLength(2);
    expect(octoberState.budgets.find((item) => item.month === '2026-09')?.incomeSources?.[0].plannedAmount).toBe(5120);
    expect(octoberState.budgets.find((item) => item.month === '2026-10')?.incomeSources?.[0].plannedAmount).toBe(0);

    const septemberState = ensureBudgetForMonth(octoberState.budgets, octoberState.budget, '2026-09');
    expect(septemberState.created).toBe(false);
    expect(septemberState.budget.incomeSources?.[0].plannedAmount).toBe(5120);
  });
  it('vincula despesas a uma categoria personalizada sem misturar com a categoria padrão', () => {
    const custom = category({ id: 'dizimos', masterCategory: undefined });
    const standard = category({ id: 'fixos', masterCategory: 'custos_fixos' });
    const taggedExpense: FinanceTransaction = {
      id: 'tx-custom', type: 'expense', amount: 100, date: '2026-09-20', description: 'Dízimo',
      masterCategory: 'custos_fixos', tags: [budgetCategoryTag(custom.id)],
    };

    expect(transactionMatchesBudgetCategory(taggedExpense, custom)).toBe(true);
    expect(transactionMatchesBudgetCategory(taggedExpense, standard)).toBe(false);
  });
  it('mantém despesas comuns na categoria padrão', () => {
    const standard = category({ id: 'fixos', masterCategory: 'custos_fixos' });
    const expense: FinanceTransaction = {
      id: 'tx-standard', type: 'expense', amount: 100, date: '2026-09-20', description: 'Internet',
      masterCategory: 'custos_fixos',
    };

    expect(transactionMatchesBudgetCategory(expense, standard)).toBe(true);
  });
});
