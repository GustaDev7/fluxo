export const belvoAccountSections = [
  { id: 'cash', title: 'Contas bancárias' },
  { id: 'card', title: 'Cartões de crédito' },
  { id: 'debt', title: 'Empréstimos e financiamentos' },
  { id: 'other', title: 'Outros produtos' },
] as const;

interface BelvoProduct {
  name: string;
  currency: string;
  institution?: string;
}

export interface BelvoAccount extends BelvoProduct {
  balance: number | null;
  group?: typeof belvoAccountSections[number]['id'];
  lastFour?: string | null;
  balanceLabel?: string;
  reserves?: { name: string; currency: string; balance: number | null }[];
}

export interface BelvoInvestment extends BelvoProduct {
  balance: number | null;
  balanceLabel: string;
  date: string;
}

export interface BelvoBill extends BelvoProduct {
  dueDate: string;
  amount: number | null;
}

export interface BelvoData {
  month: string;
  accounts: BelvoAccount[];
  investments?: BelvoInvestment[];
  bills?: BelvoBill[];
  transactions: { description: string; date: string; amount: number; currency: string; direction: string }[];
  partial: boolean;
  skipped: number;
  investmentFailures?: number;
  billFailures?: number;
}

export function formatBelvoMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(amount);
}
