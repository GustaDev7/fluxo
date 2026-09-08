import { describe, expect, it } from 'vitest';
import { amountFromPercentage, calculateBudget, copyBudgetToMonth, percentageFromAmount, replaceBudgetForMonth, resolveCategory } from './budgetEngine';
import { BudgetCategory, ZeroBasedBudget } from '../types/finance';

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
});
