import { supabase } from './supabase';
import type {
  FinanceAccount, CreditCard, FinanceTransaction, FinanceBill, FinanceDebt,
  InvestmentAssetItem, FinancialGoalItem, EmergencyFund, InstallmentPurchase,
  ZeroBasedBudget, MonthlyClosing, FinancialDiagnosisData,
} from '../types/finance';

export interface FinanceLedger {
  accounts: FinanceAccount[];
  creditCards: CreditCard[];
  transactions: FinanceTransaction[];
  bills: FinanceBill[];
  debts: FinanceDebt[];
  investments: InvestmentAssetItem[];
  goals: FinancialGoalItem[];
  emergencyFund: EmergencyFund;
  installments: InstallmentPurchase[];
  budget: ZeroBasedBudget;
  budgets: ZeroBasedBudget[];
  closings: MonthlyClosing[];
  diagnosis: FinancialDiagnosisData;
}

export class FinanceConflictError extends Error {
  constructor() {
    super('Os dados foram alterados em outra sessão. Salve um backup antes de recarregar.');
    this.name = 'FinanceConflictError';
  }
}

export async function loadFinanceData(workspaceId: string) {
  const { data, error } = await supabase.rpc('fluxo_read_ledger', { target_workspace: workspaceId });
  if (error) throw error;
  return data as { payload: FinanceLedger; serverRevision: string } | null;
}

export async function saveFinanceData(workspaceId: string, ledger: FinanceLedger, expectedRevision: string | null) {
  const { data, error } = await supabase.rpc('fluxo_save_ledger', {
    target_workspace: workspaceId, expected_revision: expectedRevision, next_payload: ledger,
  });
  if (error?.code === '40001') throw new FinanceConflictError();
  if (error) throw error;
  return data as string;
}
