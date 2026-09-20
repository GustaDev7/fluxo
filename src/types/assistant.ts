import type {
  FinanceAccount,
  FinanceBill,
  FinanceDebt,
  FinanceSubTab,
  FinanceTransaction,
  FinancialGoalItem,
  InvestmentAssetItem,
  MasterCategory,
  ZeroBasedBudget,
} from './finance';

export type FinanceAssistantRole = 'user' | 'assistant';

export interface ProposedTransaction {
  kind: 'create_transaction';
  status: 'pending' | 'confirmed' | 'cancelled';
  transaction: {
    type: 'income' | 'expense';
    amount: number;
    description: string;
    masterCategory: MasterCategory;
    subcategory?: string;
    accountId?: string;
  };
}

export interface FinanceAssistantMessageMetadata {
  suggestions?: string[];
  route?: FinanceSubTab;
  routeLabel?: string;
  action?: ProposedTransaction;
}

export interface FinanceAssistantMessage {
  id: string;
  role: FinanceAssistantRole;
  content: string;
  createdAt: string;
  metadata?: FinanceAssistantMessageMetadata;
}

export interface FinanceAssistantSnapshot {
  currentMonth: string;
  accounts: FinanceAccount[];
  transactions: FinanceTransaction[];
  bills: FinanceBill[];
  debts: FinanceDebt[];
  goals: FinancialGoalItem[];
  investments: InvestmentAssetItem[];
  budgets: ZeroBasedBudget[];
  currentBudget: ZeroBasedBudget;
  emergencyFund: {
    currentAmount: number;
    targetAmount: number;
    targetMonths: number;
  };
  monthIncome: number;
  monthExpenses: number;
  monthInvestments: number;
  monthDebtsPaid: number;
  availableCash: number;
  monthlyEssentialCosts: number;
  savingsRate: number;
  netWorth: number;
}

export interface FinanceAssistantReply {
  content: string;
  metadata?: FinanceAssistantMessageMetadata;
}
