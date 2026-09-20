import React, { lazy, Suspense, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { FinanceOverviewTab } from './finance/FinanceOverviewTab';
import { FinanceTransactionModal } from './finance/FinanceTransactionModal';
import { FinanceDiagnosisModal } from './finance/FinanceDiagnosisModal';
import { EmergencyConfigModal } from './finance/EmergencyConfigModal';
import { EmergencyDepositModal } from './finance/EmergencyDepositModal';
import {
  PieChart,
  DollarSign,
  ReceiptText,
  CalendarClock,
  ShieldAlert,
  Target,
  TrendingUp,
  Plus,
  Sparkles,
  ChevronDown,
  WalletCards,
} from 'lucide-react';
import { FinanceSubTab } from '../../types/finance';

const FinanceBudgetTab = lazy(() => import('./finance/FinanceBudgetTab').then((module) => ({ default: module.FinanceBudgetTab })));
const FinanceTransactionsTab = lazy(() => import('./finance/FinanceTransactionsTab').then((module) => ({ default: module.FinanceTransactionsTab })));
const FinanceAccountsTab = lazy(() => import('./finance/FinanceAccountsTab').then((module) => ({ default: module.FinanceAccountsTab })));
const FinanceBillsTab = lazy(() => import('./finance/FinanceBillsTab').then((module) => ({ default: module.FinanceBillsTab })));
const FinanceDebtsTab = lazy(() => import('./finance/FinanceDebtsTab').then((module) => ({ default: module.FinanceDebtsTab })));
const FinanceEmergencyTab = lazy(() => import('./finance/FinanceEmergencyTab').then((module) => ({ default: module.FinanceEmergencyTab })));
const FinanceGoalsTab = lazy(() => import('./finance/FinanceGoalsTab').then((module) => ({ default: module.FinanceGoalsTab })));
const FinanceInvestmentsTab = lazy(() => import('./finance/FinanceInvestmentsTab').then((module) => ({ default: module.FinanceInvestmentsTab })));

export const FinanceView: React.FC = () => {
  const {
    subTab: activeSubTab,
    setSubTab: setActiveSubTab,
    openTransactionModal,
    openDiagnosisModal,
    overdueBills,
  } = useFinance();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const navItems: { id: FinanceSubTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Visão Geral', icon: <PieChart className="h-4 w-4" /> },
    { id: 'budget', label: 'Orçamento', icon: <DollarSign className="h-4 w-4" /> },
    { id: 'transactions', label: 'Movimentações', icon: <ReceiptText className="h-4 w-4" /> },
    { id: 'accounts', label: 'Contas e cartões', icon: <WalletCards className="h-4 w-4" /> },
    { id: 'bills', label: 'Compromissos', icon: <CalendarClock className="h-4 w-4" />, badge: overdueBills.length || undefined },
    { id: 'goals', label: 'Metas', icon: <Target className="h-4 w-4" /> },
    { id: 'debts', label: 'Dívidas', icon: <ShieldAlert className="h-4 w-4" /> },
    { id: 'investments', label: 'Investimentos', icon: <TrendingUp className="h-4 w-4" /> },
  ];

  const pageMeta: Partial<Record<FinanceSubTab, { title: string; description: string }>> = {
    overview: { title: 'Visão Geral', description: 'Seu panorama financeiro consolidado, com dados de todas as áreas.' },
    budget: { title: 'Orçamento', description: 'Planeje, registre e acompanhe para onde seu dinheiro está indo.' },
    goals: { title: 'Metas', description: 'Direcione recursos para sua reserva e seus objetivos financeiros.' },
    debts: { title: 'Dívidas', description: 'Acompanhe obrigações e planeje a melhor estratégia de quitação.' },
    investments: { title: 'Investimentos', description: 'Acompanhe aportes, rendimentos e construção patrimonial.' },
    transactions: { title: 'Movimentações', description: 'Histórico único de entradas, saídas, aportes e transferências.' },
    accounts: { title: 'Contas e cartões', description: 'Instrumentos financeiros conectados ao seu fluxo de caixa.' },
    bills: { title: 'Compromissos', description: 'Vencimentos e obrigações financeiras do período.' },
    emergency: { title: 'Reserva de Emergência', description: 'Configuração detalhada da sua meta de segurança.' },
  };
  const currentMeta = pageMeta[activeSubTab] || pageMeta.overview!;

  return (
    <div className="h-full min-h-0 overflow-x-hidden overflow-y-auto bg-neutral-50/50 p-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:p-4 md:p-6 md:pb-6 dark:bg-neutral-950">
      <div className="mx-auto max-w-[1540px] space-y-5">
        {/* Top Header */}
        {!['overview', 'goals', 'debts', 'budget', 'investments'].includes(activeSubTab) && (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-neutral-400"><span>Finanças</span><span>›</span><span className="text-neutral-600 dark:text-neutral-300">{currentMeta.title}</span></div>
            <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-100">{currentMeta.title}</h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{currentMeta.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <button
              onClick={openDiagnosisModal}
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-indigo-200 bg-indigo-50/80 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300 transition-colors"
            >
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <span>Diagnóstico</span>
            </button>

            <button
              onClick={() => openTransactionModal('expense')}
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Lançamento</span>
            </button>
            <div className="relative col-span-2 sm:col-span-1">
              <button onClick={() => setIsMoreOpen((value) => !value)} className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"><span>Mais</span><ChevronDown className="h-3.5 w-3.5"/></button>
              {isMoreOpen && <div className="absolute right-0 top-11 z-30 w-52 rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
                <button onClick={() => { setActiveSubTab('transactions'); setIsMoreOpen(false); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"><ReceiptText className="h-4 w-4"/>Movimentações</button>
                <button onClick={() => { setActiveSubTab('accounts'); setIsMoreOpen(false); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"><WalletCards className="h-4 w-4"/>Contas e cartões</button>
                <button onClick={() => { setActiveSubTab('bills'); setIsMoreOpen(false); }} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"><span className="flex items-center gap-2"><CalendarClock className="h-4 w-4"/>Compromissos</span>{overdueBills.length > 0 && <b className="rounded-full bg-rose-600 px-1.5 text-[10px] text-white">{overdueBills.length}</b>}</button>
              </div>}
            </div>
          </div>
        </div>
        )}

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-neutral-200/80 dark:border-neutral-800">
          {navItems.map((item) => {
            const isActive = activeSubTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSubTab(item.id)}
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-[1px] ${
                  isActive
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
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
        <Suspense fallback={<div role="status" className="grid min-h-72 place-items-center text-sm font-semibold text-neutral-500">Carregando área financeira...</div>}>
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
        </Suspense>
      </div>

      {/* Global Modals */}
      <FinanceTransactionModal />
      <FinanceDiagnosisModal />
      <EmergencyConfigModal />
      <EmergencyDepositModal />

      <nav aria-label="Navegação financeira móvel" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-neutral-200 bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden dark:border-neutral-800 dark:bg-neutral-900/95">
        {navItems.slice(0, 5).map((item) => {
          const active = activeSubTab === item.id;
          return <button key={item.id} onClick={() => setActiveSubTab(item.id)} className={`relative flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-1 text-[10px] font-bold ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-500'}`}>
            {item.icon}<span className="max-w-full truncate">{item.id === 'accounts' ? 'Contas' : item.id === 'transactions' ? 'Lançamentos' : item.label}</span>
            {item.badge ? <span className="absolute right-3 top-2 rounded-full bg-rose-600 px-1.5 text-[9px] text-white">{item.badge}</span> : null}
          </button>;
        })}
      </nav>
    </div>
  );
};
