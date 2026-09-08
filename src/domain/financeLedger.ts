import Decimal from 'decimal.js';
import type { FinanceTransaction } from '../types/finance';

export const money = (value: number): number =>
  Number(new Decimal(Number.isFinite(value) ? value : 0).toDecimalPlaces(2));

export const isPositiveMoney = (value: number): boolean =>
  Number.isFinite(value) && new Decimal(value).greaterThan(0);

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
