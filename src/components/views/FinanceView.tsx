import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { FinanceOverviewTab } from './finance/FinanceOverviewTab';
import { FinanceTransactionModal } from './finance/FinanceTransactionModal';
import { FinanceDiagnosisModal } from './finance/FinanceDiagnosisModal';
import { EmergencyConfigModal } from './finance/EmergencyConfigModal';
import { EmergencyDepositModal } from './finance/EmergencyDepositModal';
import {
  LayoutDashboard,
  CalendarClock,
  ShieldAlert,
  Target,
  TrendingUp,
  Sparkles,
  CalendarDays,
  Download,
  LockKeyhole,
  MoreHorizontal,
  X,
} from 'lucide-react';
import { FinanceSubTab, MonthlyClosing } from '../../types/finance';

const FinanceBillsTab = lazy(() => import('./finance/FinanceBillsTab').then((module) => ({ default: module.FinanceBillsTab })));
const FinanceDebtsTab = lazy(() => import('./finance/FinanceDebtsTab').then((module) => ({ default: module.FinanceDebtsTab })));
const FinanceEmergencyTab = lazy(() => import('./finance/FinanceEmergencyTab').then((module) => ({ default: module.FinanceEmergencyTab })));
const FinanceGoalsTab = lazy(() => import('./finance/FinanceGoalsTab').then((module) => ({ default: module.FinanceGoalsTab })));
const FinanceInvestmentsTab = lazy(() => import('./finance/FinanceInvestmentsTab').then((module) => ({ default: module.FinanceInvestmentsTab })));

export const FinanceView: React.FC = () => {
  const {
    subTab: activeSubTab,
    setSubTab: setActiveSubTab,
    openDiagnosisModal,
    overdueBills,
    selectedMonth,
    setSelectedMonth,
    isSelectedMonthClosed,
    monthlyClosingHistory,
    saveMonthlyClosing,
    exportFinanceBackup,
  } = useFinance();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isClosingOpen, setIsClosingOpen] = useState(false);
  const [closingRating, setClosingRating] = useState<MonthlyClosing['rating']>('good');
  const [closingNotes, setClosingNotes] = useState('');
  const openClosing = () => {
    const savedClosing = monthlyClosingHistory.find((closing) => closing.month === selectedMonth);
    setClosingRating(savedClosing?.rating ?? 'good');
    setClosingNotes(savedClosing?.notes ?? '');
    setIsClosingOpen(true);
  };

  useEffect(() => {
    if (activeSubTab === 'transactions' || activeSubTab === 'accounts') setActiveSubTab('overview');
    contentRef.current?.scrollTo(0, 0);
  }, [activeSubTab, setActiveSubTab]);

  const navItems: { id: FinanceSubTab; label: string; mobileLabel: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Visão geral', mobileLabel: 'Início', icon: <LayoutDashboard size={19} aria-hidden="true" /> },
    { id: 'bills', label: 'Compromissos', mobileLabel: 'Agenda', icon: <CalendarClock size={19} aria-hidden="true" />, badge: overdueBills.length || undefined },
    { id: 'goals', label: 'Metas', mobileLabel: 'Metas', icon: <Target size={19} aria-hidden="true" /> },
    { id: 'debts', label: 'Dívidas', mobileLabel: 'Dívidas', icon: <ShieldAlert size={19} aria-hidden="true" /> },
    { id: 'investments', label: 'Investimentos', mobileLabel: 'Investir', icon: <TrendingUp size={19} aria-hidden="true" /> },
  ];
  const mobilePrimaryItems = navItems.filter((item) => item.id !== 'investments');
  const mobileMoreItems = navItems.filter((item) => item.id === 'investments');
  const isMobileMoreActive = mobileMoreItems.some((item) => item.id === activeSubTab);

  return (
    <div className="fx-workspace">
      <aside className="fx-rail">
        <nav aria-label="Navegação financeira" className="fx-desktop-nav">
          {navItems.map((item) => {
            const isActive = activeSubTab === item.id || (item.id === 'goals' && activeSubTab === 'emergency');
            return <button key={item.id} onClick={() => setActiveSubTab(item.id)} aria-current={isActive ? 'page' : undefined}>
              {item.icon}<span>{item.label}</span>
              {!!item.badge && <b className="fx-nav-badge" aria-label={item.badge + ' em atraso'}>{item.badge}</b>}
            </button>;
          })}
        </nav>
        <button className="fx-rail-tool" onClick={openDiagnosisModal}><Sparkles size={18} aria-hidden="true" />Diagnóstico</button>
      </aside>
      <div className="fx-content-scroll" ref={contentRef}>
        <div className="fx-content">
          <section className="fx-period" aria-label="Período financeiro">
            <label className="fx-period-picker">
              <span className="fx-period-icon"><CalendarDays size={19} aria-hidden="true" /></span>
              <span><span className="fx-period-label">Competência financeira</span>
                <input aria-label="Competência financeira" type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} />
              </span>
            </label>
            <span className="fx-period-status" data-closed={isSelectedMonthClosed}><i aria-hidden="true" />{isSelectedMonthClosed ? 'Mês fechado' : 'Em acompanhamento'}</span>
            <div className="fx-period-actions">
              <button onClick={exportFinanceBackup} aria-label="Backup" title="Baixar backup"><Download size={17} aria-hidden="true" /><span>Backup</span></button>
              <button onClick={openClosing}><LockKeyhole size={17} aria-hidden="true" />{isSelectedMonthClosed ? 'Atualizar mês' : 'Fechar mês'}</button>
            </div>
          </section>
          {activeSubTab === 'bills' && <h1 className="fx-page-title">Compromissos</h1>}
          {activeSubTab === 'emergency' && <h1 className="fx-page-title">Reserva de emergência</h1>}
          <Suspense fallback={<div role="status" className="grid min-h-72 place-items-center text-sm font-semibold text-neutral-500">Carregando área financeira...</div>}>
            <div className="fx-section-content">
              {activeSubTab === 'overview' && <FinanceOverviewTab />}
              {activeSubTab === 'emergency' && <FinanceEmergencyTab />}
              {activeSubTab === 'bills' && <FinanceBillsTab />}
              {activeSubTab === 'debts' && <FinanceDebtsTab />}
              {activeSubTab === 'goals' && <FinanceGoalsTab />}
              {activeSubTab === 'investments' && <FinanceInvestmentsTab />}
            </div>
          </Suspense>
        </div>
      </div>

      {/* Global Modals */}
      <FinanceTransactionModal />
      <FinanceDiagnosisModal />
      <EmergencyConfigModal />
      <EmergencyDepositModal />

      <nav aria-label="Navegação financeira móvel" className="fx-mobile-nav">
        {mobilePrimaryItems.map((item) => {
          const active = activeSubTab === item.id || (item.id === 'goals' && activeSubTab === 'emergency');
          return <button key={item.id} onClick={() => setActiveSubTab(item.id)} aria-current={active ? 'page' : undefined}>
            <span>{item.icon}{!!item.badge && <b className="fx-nav-badge" aria-label={item.badge + ' em atraso'}>{item.badge}</b>}</span>
            {item.mobileLabel}
          </button>;
        })}
        <button onClick={() => setIsMobileMoreOpen(true)} aria-expanded={isMobileMoreOpen} aria-current={isMobileMoreActive ? 'page' : undefined}>
          <span><MoreHorizontal size={21} aria-hidden="true" /></span>Mais
        </button>
      </nav>

      {isMobileMoreOpen && <div className="fx-mobile-overlay" role="presentation" onClick={() => setIsMobileMoreOpen(false)}>
        <section role="dialog" aria-modal="true" aria-labelledby="mobile-more-title" onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => { if (event.key === 'Escape') setIsMobileMoreOpen(false); }} className="fx-mobile-sheet">
          <div className="fx-panel-heading"><h2 id="mobile-more-title">Mais áreas</h2><button autoFocus aria-label="Fechar menu" onClick={() => setIsMobileMoreOpen(false)}><X size={21} /></button></div>
          <div className="fx-mobile-sheet-links">
            {mobileMoreItems.map((item) => <button key={item.id} aria-current={activeSubTab === item.id ? 'page' : undefined}
              onClick={() => { setActiveSubTab(item.id); setIsMobileMoreOpen(false); }}>{item.icon}{item.label}</button>)}
            <button onClick={() => { setIsMobileMoreOpen(false); openDiagnosisModal(); }}><Sparkles size={19} />Diagnóstico</button>
          </div>
        </section>
      </div>}

      {isClosingOpen && <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
        <form role="dialog" aria-modal="true" aria-labelledby="closing-title" onSubmit={(event) => { event.preventDefault(); saveMonthlyClosing(closingRating, closingNotes.trim()); setIsClosingOpen(false); }} className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-5 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-start justify-between gap-3"><div><h2 id="closing-title" className="text-lg font-black">Fechamento de {new Date(`${selectedMonth}-01T00:00:00Z`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</h2><p className="mt-1 text-xs text-neutral-500">Salvaremos uma fotografia dos resultados do período. Você poderá atualizar este fechamento depois.</p></div><button type="button" aria-label="Fechar" onClick={() => setIsClosingOpen(false)} className="rounded-xl p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="h-5 w-5" /></button></div>
          <label className="mt-5 block"><span className="mb-1 block text-xs font-bold text-neutral-600 dark:text-neutral-300">Como foi o mês?</span><select value={closingRating} onChange={(event) => setClosingRating(event.target.value as MonthlyClosing['rating'])} className="field-input"><option value="excellent">Excelente</option><option value="good">Bom</option><option value="regular">Regular</option><option value="poor">Precisa de atenção</option></select></label>
          <label className="mt-3 block"><span className="mb-1 block text-xs font-bold text-neutral-600 dark:text-neutral-300">Observações</span><textarea value={closingNotes} onChange={(event) => setClosingNotes(event.target.value)} rows={4} placeholder="O que funcionou e o que deve mudar no próximo mês?" className="field-input resize-none" /></label>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setIsClosingOpen(false)} className="min-h-11 rounded-xl border border-neutral-200 px-4 text-sm font-bold dark:border-neutral-700">Cancelar</button><button type="submit" className="min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white">Salvar fechamento</button></div>
        </form>
      </div>}
    </div>
  );
};
