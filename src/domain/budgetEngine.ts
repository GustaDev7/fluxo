import Decimal from 'decimal.js';
import { BudgetCategory, BudgetIncomeSource, ZeroBasedBudget } from '../types/finance';

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });
const D = (value: Decimal.Value | undefined) => new Decimal(value ?? 0);
const money = (value: Decimal.Value) => D(value).toDecimalPlaces(2).toNumber();

export const percentageFromAmount = (amount: Decimal.Value, income: Decimal.Value): string =>
  D(income).isZero() ? '0' : D(amount).div(income).mul(100).toDecimalPlaces(12).toString();

export const amountFromPercentage = (percentage: Decimal.Value, income: Decimal.Value): number =>
  money(D(income).mul(percentage).div(100));

export const plannedIncomeFromSources = (sources: BudgetIncomeSource[] = []): number =>
  money(sources.reduce((sum, source) => sum.plus(source.plannedAmount), D(0)));

export const receivedIncomeFromSources = (sources: BudgetIncomeSource[] = []): number =>
  money(sources.reduce((sum, source) => sum.plus(source.receivedAmount), D(0)));

export function resolveCategory(category: BudgetCategory, income: Decimal.Value): BudgetCategory {
  if (category.allocationMode === 'percentage') {
    return { ...category, plannedAmount: amountFromPercentage(category.percentage, income) };
  }
  if (category.allocationMode === 'fixed') {
    return {
      ...category,
      plannedAmount: money(category.fixedAmount),
      percentage: percentageFromAmount(category.fixedAmount, income),
    };
  }
  return { ...category, plannedAmount: 0, percentage: '0' };
}

export function calculateBudget(budget: ZeroBasedBudget) {
  const plannedIncome = budget.incomeSources?.length
    ? plannedIncomeFromSources(budget.incomeSources)
    : money(budget.plannedIncome);
  const categories = (budget.categories ?? []).map((category) => resolveCategory(category, plannedIncome));
  const roots = categories.filter((category) => !category.parentId && !category.archived);
  const totalAllocated = money(roots.reduce((sum, category) => sum.plus(category.plannedAmount), D(0)));
  const balance = money(D(plannedIncome).minus(totalAllocated));
  const percentageAllocated = D(plannedIncome).isZero()
    ? '0'
    : D(totalAllocated).div(plannedIncome).mul(100).toDecimalPlaces(12).toString();
  return {
    plannedIncome,
    receivedIncome: receivedIncomeFromSources(budget.incomeSources),
    categories,
    totalAllocated,
    balance,
    percentageAllocated,
    status: D(balance).isZero() ? 'balanced' as const : D(balance).isPositive() ? 'under' as const : 'over' as const,
  };
}

export function distributeRemainder(categories: BudgetCategory[], income: number, categoryIds: string[]) {
  const resolved = categories.map((category) => resolveCategory(category, income));
  const roots = resolved.filter((category) => !category.parentId && !category.archived);
  const allocated = roots.reduce((sum, category) => sum.plus(category.plannedAmount), D(0));
  const remainder = D(income).minus(allocated);
  if (!categoryIds.length || remainder.isZero()) return resolved;
  const share = remainder.div(categoryIds.length);
  let distributed = D(0);
  return resolved.map((category) => {
    if (!categoryIds.includes(category.id)) return category;
    const isLast = category.id === categoryIds.at(-1);
    const delta = isLast ? remainder.minus(distributed) : share.toDecimalPlaces(2);
    distributed = distributed.plus(delta);
    const next = D(category.plannedAmount).plus(delta);
    return { ...category, allocationMode: 'fixed' as const, fixedAmount: money(next), plannedAmount: money(next), percentage: percentageFromAmount(next, income) };
  });
}

export function copyBudgetToMonth(budget: ZeroBasedBudget, month: string): ZeroBasedBudget {
  return {
    ...budget,
    month,
    incomeSources: budget.incomeSources?.map((source) => ({ ...source, id: crypto.randomUUID(), receivedAmount: 0 })),
    categories: budget.categories?.map((category) => ({ ...category, id: crypto.randomUUID() })),
  };
}
