import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { readOfx } from './ofx';

export interface BankAccount {
  name: string;
  kind: 'BANK' | 'CREDIT';
  currency: string;
  balance: number | null;
}
export interface BankConnection {
  id: string;
  institution: string;
  owned: boolean;
  shared: boolean;
  source: 'pluggy' | 'ofx';
  status: 'pending' | 'ready' | 'action_required' | 'error' | 'disconnecting';
  syncedAt: string | null;
  accounts: BankAccount[];
}
export interface BankOverview {
  connections: BankConnection[];
  count: number;
  transactions: {
    id: string; connectionId: string; description: string; date: string; amount: number;
    currency: string; direction: 'DEBIT' | 'CREDIT'; account: string;
  }[];
}
export interface WidgetConfig {
  connectToken: string;
  connectorIds: number[];
  sandbox: boolean;
  updateItem?: string;
}

export async function loadBankOverview(workspaceId: string, month: string, page: number): Promise<BankOverview> {
  const { data, error } = await supabase.rpc('fluxo_bank_overview', {
    target_workspace: workspaceId, month_start: month + '-01', tx_offset: page * 50,
  });
  if (error) throw error;
  return data;
}

export async function shareBank(connectionId: string, workspaceId: string | null) {
  const { error } = await supabase.rpc('fluxo_share_bank', { connection_id: connectionId, target_workspace: workspaceId });
  if (error) throw error;
}

export async function importStatement(file: File, institution: string, accountName: string): Promise<number> {
  const statement = await readOfx(file, institution);
  const { data, error } = await supabase.rpc('fluxo_import_statement', {
    statement_key: statement.key, institution_name: institution, account_name: accountName,
    account_kind: statement.accountKind, currency_code: statement.currency, closing_balance: statement.balance,
    balance_date: statement.balanceDate, entries: statement.entries,
  });
  if (error) throw error;
  return data;
}

export async function removeStatement(id: string) {
  const { error } = await supabase.rpc('fluxo_remove_statement', { target: id });
  if (error) throw error;
}

export async function bankAction<T>(action: string, fields: Record<string, string> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke('open-finance', { body: { action, ...fields } });
  if (error instanceof FunctionsHttpError) {
    const body = await error.context.json().catch(() => null);
    if (body?.error) throw new Error(body.error);
  }
  if (error) throw new Error('O Open Finance está indisponível neste ambiente.');
  return data;
}
