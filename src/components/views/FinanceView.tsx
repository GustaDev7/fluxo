import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { FinanceOverviewTab } from './finance/FinanceOverviewTab';
import { FinanceBudgetTab } from './finance/FinanceBudgetTab';
import { FinanceTransactionsTab } from './finance/FinanceTransactionsTab';
import { FinanceAccountsTab } from './finance/FinanceAccountsTab';
import { FinanceBillsTab } from './finance/FinanceBillsTab';
import { FinanceDebtsTab } from './finance/FinanceDebtsTab';
import { FinanceEmergencyTab } from './finance/FinanceEmergencyTab';
import { FinanceGoalsTab } from './finance/FinanceGoalsTab';
import { FinanceInvestmentsTab } from './finance/FinanceInvestmentsTab';
import { FinanceTransactionModal } from './finance/FinanceTransactionModal';
import { FinanceDiagnosisModal } from './finance/FinanceDiagnosisModal';
import { EmergencyConfigModal } from './finance/EmergencyConfigModal';
import { EmergencyDepositModal } from './finance/EmergencyDepositModal';
import {
  PieChart,
  DollarSign,
  ReceiptText,
  CreditCard,
  CalendarClock,
  ShieldAlert,
  ShieldCheck,
  Target,
  TrendingUp,
  Plus,
  Sparkles,
} from 'lucide-react';
import { FinanceSubTab } from '../../types/finance';

export const FinanceView: React.FC = () => {
  const {
    subTab: activeSubTab,
    setSubTab: setActiveSubTab,
    openTransactionModal,
    openDiagnosisModal,
    overdueBills,
  } = useFinance();

  const navItems: { id: FinanceSubTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Visão Geral', icon: <PieChart className="h-4 w-4" /> },
    { id: 'emergency', label: 'Reserva de Emergência', icon: <ShieldCheck className="h-4 w-4" /> },
    { id: 'budget', label: 'Orçamento Base Zero', icon: <DollarSign className="h-4 w-4" /> },
    { id: 'transactions', label: 'Lançamentos', icon: <ReceiptText className="h-4 w-4" /> },
    { id: 'accounts', label: 'Contas & Cartões', icon: <CreditCard className="h-4 w-4" /> },
    {
      id: 'bills',
      label: 'Contas a Pagar',
      icon: <CalendarClock className="h-4 w-4" />,
      badge: overdueBills.length > 0 ? overdueBills.length : undefined,
    },
    { id: 'debts', label: 'Dívidas', icon: <ShieldAlert className="h-4 w-4" /> },
    { id: 'goals', label: 'Metas', icon: <Target className="h-4 w-4" /> },
    { id: 'investments', label: 'Investimentos', icon: <TrendingUp className="h-4 w-4" /> },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50/50 p-4 md:p-8 dark:bg-neutral-950">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                <DollarSign className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                Gestão Financeira AUVP
              </h1>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                Orçamento Base Zero
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Controle absoluto do seu dinheiro, faturas, aportes e construção de liberdade financeira.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={openDiagnosisModal}
              className="flex items-center gap-1.5 rounded-2xl border border-indigo-200 bg-indigo-50/80 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300 transition-colors"
            >
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <span>Diagnóstico AUVP</span>
            </button>

            <button
              onClick={() => openTransactionModal('expense')}
              className="flex items-center gap-1.5 rounded-2xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Lançamento</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-neutral-200/80 dark:border-neutral-800">
          {navItems.map((item) => {
            const isActive = activeSubTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSubTab(item.id)}
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-[1px] ${
                  isActive
                    ? 'border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="rounded-full bg-rose-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sub Tab Views */}
        <div className="pt-2">
          {activeSubTab === 'overview' && <FinanceOverviewTab />}
          {activeSubTab === 'emergency' && <FinanceEmergencyTab />}
          {activeSubTab === 'budget' && <FinanceBudgetTab />}
          {activeSubTab === 'transactions' && <FinanceTransactionsTab />}
          {activeSubTab === 'accounts' && <FinanceAccountsTab />}
          {activeSubTab === 'bills' && <FinanceBillsTab />}
          {activeSubTab === 'debts' && <FinanceDebtsTab />}
          {activeSubTab === 'goals' && <FinanceGoalsTab />}
          {activeSubTab === 'investments' && <FinanceInvestmentsTab />}
        </div>
      </div>

      {/* Global Modals */}
      <FinanceTransactionModal />
      <FinanceDiagnosisModal />
      <EmergencyConfigModal />
      <EmergencyDepositModal />
    </div>
  );
};
