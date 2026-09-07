import {
  FinanceAccount,
  CreditCard,
  FinanceTransaction,
  InstallmentPurchase,
  FinanceBill,
  FinanceDebt,
  EmergencyFund,
  FinancialGoalItem,
  InvestmentAssetItem,
  ZeroBasedBudget,
  MonthlyClosing,
  FinancialDiagnosisData,
} from '../types/finance';

export const INITIAL_ACCOUNTS: FinanceAccount[] = [];

export const INITIAL_CREDIT_CARDS: CreditCard[] = [];

export const INITIAL_INSTALLMENTS: InstallmentPurchase[] = [];

export const INITIAL_BILLS: FinanceBill[] = [];

export const INITIAL_TRANSACTIONS: FinanceTransaction[] = [];

export const INITIAL_DEBTS: FinanceDebt[] = [];

export const INITIAL_EMERGENCY_FUND: EmergencyFund = {
  targetAmount: 0,
  currentAmount: 0,
  monthlyContribution: 0,
  targetMonths: 6,
};

export const INITIAL_FINANCIAL_GOALS: FinancialGoalItem[] = [];

export const INITIAL_INVESTMENTS: InvestmentAssetItem[] = [];

export const INITIAL_ZERO_BASED_BUDGET: ZeroBasedBudget = {
  month: new Date().toISOString().slice(0, 7),
  plannedIncome: 0,
  allocations: {
    custos_fixos: 0,
    conforto: 0,
    metas: 0,
    prazeres: 0,
    liberdade_financeira: 0,
    conhecimento: 0,
  },
  notes: '',
};

export const INITIAL_PREVIOUS_MONTH_CLOSING: MonthlyClosing = {
  id: '',
  month: '',
  rating: 'regular',
  notes: '',
  savingsRate: 0,
  totalIncome: 0,
  totalExpenses: 0,
  totalInvested: 0,
  debtsPaid: 0,
  netWorth: 0,
  completedAt: '',
};

export const INITIAL_DIAGNOSIS: FinancialDiagnosisData = {
  monthlyIncome: 0,
  isIncomeVariable: false,
  fixedCosts: 0,
  comfortCosts: 0,
  leisureCosts: 0,
  currentDebtTotal: 0,
  monthlyDebtPayment: 0,
  emergencyFundAmount: 0,
  currentInvested: 0,
  monthlyTargetInvestment: 0,
  mainGoals: '',
  completedAt: undefined,
};
