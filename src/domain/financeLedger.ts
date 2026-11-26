import Decimal from 'decimal.js';
import type { FinanceTransaction, MonthlyClosing } from '../types/finance';

export const money = (value: number): number =>
  Number(new Decimal(Number.isFinite(value) ? value : 0).toDecimalPlaces(2));

export const isPositiveMoney = (value: number): boolean =>
  Number.isFinite(value) && new Decimal(value).greaterThan(0);

export function parseMoneyInput(value: string): number | null {
  const input = value.trim();
  const brazilian = /^\d+(?:,\d{1,2})$|^\d{1,3}(?:\.\d{3})+,\d{1,2}$/.test(input);
  const decimal = brazilian ? input.replaceAll('.', '').replace(',', '.') : input;
  if (!/^\d+(?:\.\d{1,2})?$/.test(decimal)) return null;
  const amount = Number(decimal);
  return Number.isFinite(amount) && amount >= 0.01 ? amount : null;
}

export function summarizeMonthlyLedger(transactions: FinanceTransaction[], reportedIncome: number) {
  let ledgerIncome = 0;
  let expenses = 0;
  let investments = 0;
  let debtPayments = 0;
  let saved = 0;
  for (const transaction of transactions) {
    const { amount, type, tags, goalId } = transaction;
    const reserve = tags?.includes('reserva');
    if (type === 'income' && !reserve) ledgerIncome += amount;
    if (type === 'expense') expenses += amount;
    if (type === 'investment') investments += amount;
    if (type === 'debt_payment') debtPayments += amount;
    if (reserve) saved += tags?.includes('resgate') ? -amount : amount;
    else if (type === 'investment' || (type === 'transfer' && goalId)) saved += amount;
  }
  const income = money(reportedIncome > 0 ? reportedIncome : ledgerIncome);
  return {
    income, expenses: money(expenses), investments: money(investments), debtPayments: money(debtPayments),
    savingsRate: income > 0 ? (money(saved) / income) * 100 : 0,
  };
}

export function recentClosings(closings: MonthlyClosing[], throughMonth: string, limit: number) {
  return closings.filter(({ month }) => /^\d{4}-(0[1-9]|1[0-2])$/.test(month) && month <= throughMonth)
    .sort((first, second) => first.month.localeCompare(second.month))
    .slice(-limit);
}

export interface TransactionImpact {
  sourceAccount: number;
  destinationAccount: number;
  cardInvoice: number;
  goal: number;
  emergencyFund: number;
}

export interface InvestmentPosition {
  quantity: number;
  totalInvested: number;
  averagePrice: number;
  currentValue: number;
}

export function calculateInvestmentContribution(input: {
  quantity: number;
  totalInvested: number;
  averagePrice: number;
  currentPrice: number;
  amount: number;
  acquiredQuantity?: number;
}): InvestmentPosition {
  const amount = money(input.amount);
  if (!isPositiveMoney(amount)) {
    throw new Error('O valor do aporte deve ser maior que zero.');
  }

  const unitPrice = input.currentPrice > 0 ? input.currentPrice : input.averagePrice;
  const acquiredQuantity = input.acquiredQuantity && input.acquiredQuantity > 0
    ? input.acquiredQuantity
    : unitPrice > 0
      ? amount / unitPrice
      : 0;
  const quantity = input.quantity + acquiredQuantity;
  const totalInvested = money(input.totalInvested + amount);
  const averagePrice = quantity > 0 ? totalInvested / quantity : 0;
  const currentValue = unitPrice > 0 ? money(quantity * unitPrice) : totalInvested;

  return { quantity, totalInvested, averagePrice, currentValue };
}

export function getTransactionImpact(transaction: FinanceTransaction): TransactionImpact {
  const amount = money(transaction.amount);
  const sourceAccount = transaction.type === 'income' || transaction.type === 'redemption'
    ? amount
    : ['expense', 'investment', 'debt_payment', 'transfer'].includes(transaction.type)
      ? -amount
      : 0;

  const isEmergencyFund = transaction.tags?.includes('reserva');
  const isEmergencyWithdrawal = isEmergencyFund && transaction.tags?.includes('resgate');
  return {
    sourceAccount,
    destinationAccount: transaction.type === 'transfer' ? amount : 0,
    cardInvoice: transaction.type === 'expense' && transaction.cardId ? amount : 0,
    goal: transaction.goalId ? amount : 0,
    emergencyFund: isEmergencyFund ? (isEmergencyWithdrawal ? -amount : amount) : 0,
  };
}
