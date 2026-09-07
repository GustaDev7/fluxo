import React from 'react';
import { useApp } from '../context/AppContext';
import { useFinance } from '../context/FinanceContext';
import { generateLifeHealthOverview } from '../utils/lifeOSUtils';
import { formatBRL } from '../utils/financeUtils';
import {
  X,
  Sparkles,
  Clock,
  Briefcase,
  DollarSign,
  Target,
  Flame,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Lightbulb,
} from 'lucide-react';

interface LifeOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LifeOverviewModal: React.FC<LifeOverviewModalProps> = ({ isOpen, onClose }) => {
  const {
    tasks,
    projects,
    events,
    habits,
    goals,
    setActiveTab,
  } = useApp();

  const {
    zeroBasedBudget,
    bills,
    transactions,
  } = useFinance();

  if (!isOpen) return null;

  const overview = generateLifeHealthOverview(
    tasks,
    projects,
    events,
    habits,
    goals,
    zeroBasedBudget,
    bills,
    transactions
  );

  const getStatusBadge = (status: 'optimal' | 'warning' | 'critical') => {
    switch (status) {
      case 'optimal':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3" /> Em dia
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
            <AlertTriangle className="h-3 w-3" /> Atenção
          </span>
        );
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
            <AlertTriangle className="h-3 w-3" /> Crítico
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 bg-gradient-to-r from-indigo-50/70 via-white to-purple-50/70 px-6 py-4 dark:border-neutral-800 dark:from-indigo-950/30 dark:via-neutral-900 dark:to-purple-950/30">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                  Diagnóstico Integrado: "Como está minha vida?"
                </h2>
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  Visão 360°
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Avaliação em tempo real de Tempo, Trabalho, Finanças, Metas, Hábitos e Agenda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {/* Main Score Banner */}
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-5 dark:border-indigo-900/50">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                    {overview.score}/100
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-300">
                    Índice de Harmonia & Tração
                  </span>
                </div>
                <h3 className="mt-1 text-base font-bold text-neutral-900 dark:text-white">
                  {overview.title}
                </h3>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                  {overview.summary}
                </p>
              </div>

              <div className="flex flex-shrink-0 items-center gap-2">
                <button
                  onClick={() => {
                    onClose();
                    setActiveTab('assistant');
                  }}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-700"
                >
                  <Zap className="h-4 w-4" /> Conversar com Fluxo AI
                </button>
              </div>
            </div>
          </div>

          {/* 6 Key Life Pillars Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* 1. Tempo */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-800/30">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  <Clock className="h-4 w-4 text-blue-500" /> Tempo & Tarefas
                </span>
                {getStatusBadge(overview.time.status)}
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Pendentes hoje:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {overview.time.pendingTasksCount}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Concluídas hoje:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {overview.time.completedTodayCount}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Atrasadas:</span>
                  <span className={`font-bold ${overview.time.overdueCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-600'}`}>
                    {overview.time.overdueCount}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Trabalho & Projetos */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-800/30">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  <Briefcase className="h-4 w-4 text-indigo-500" /> Trabalho & Projetos
                </span>
                {getStatusBadge(overview.work.status)}
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Projetos ativos:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {overview.work.activeProjectsCount}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Prazos críticos:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {overview.work.upcomingDeadlinesCount}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Projeto foco:</span>
                  <span className="truncate font-semibold text-neutral-900 dark:text-white max-w-[130px]">
                    {overview.work.criticalProjectName || 'Geral'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Finanças AUVP */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-800/30">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  <DollarSign className="h-4 w-4 text-emerald-500" /> Finanças AUVP
                </span>
                {getStatusBadge(overview.finance.status)}
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Margem financeira mensal:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {overview.finance.savingsRatePercent}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Contas vencendo hoje:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {overview.finance.pendingBillsTodayCount} ({formatBRL(overview.finance.pendingBillsAmount)})
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Orçamento Base Zero:</span>
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">Equilibrado</span>
                </div>
              </div>
            </div>

            {/* 4. Metas de Vida */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-800/30">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  <Target className="h-4 w-4 text-purple-500" /> Metas de Longo Prazo
                </span>
                {getStatusBadge(overview.goals.status)}
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Meta principal:</span>
                  <span className="font-bold text-neutral-900 dark:text-white truncate max-w-[140px]">
                    {overview.goals.primaryGoalTitle}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Progresso atual:</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">
                    {overview.goals.progressPercent}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-700">
                  <div
                    className="h-1.5 rounded-full bg-purple-600"
                    style={{ width: `${Math.min(100, overview.goals.progressPercent)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 5. Hábitos & Rotina */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-800/30">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  <Flame className="h-4 w-4 text-orange-500" /> Hábitos & Disciplina
                </span>
                {getStatusBadge(overview.habits.status)}
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Maior sequência:</span>
                  <span className="font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1">
                    <span>{overview.habits.currentStreak} dias</span>
                    <Flame className="h-3 w-3 inline text-orange-500" />
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Concluídos hoje:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {overview.habits.completedTodayPercent}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Total de hábitos:</span>
                  <span className="font-bold text-neutral-700 dark:text-neutral-300">
                    {overview.habits.habitsCount}
                  </span>
                </div>
              </div>
            </div>

            {/* 6. Agenda & Compromissos */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-800/30">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  <Calendar className="h-4 w-4 text-teal-500" /> Agenda & Compromissos
                </span>
                {getStatusBadge(overview.agenda.status)}
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Eventos hoje:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {overview.agenda.eventsTodayCount}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Próximo:</span>
                  <span className="font-semibold text-neutral-900 dark:text-white truncate max-w-[130px]">
                    {overview.agenda.nextEventTitle || 'Nenhum próximo'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Horário:</span>
                  <span className="font-bold text-teal-600 dark:text-teal-400">
                    {overview.agenda.nextEventTime || '--:--'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Priorities & Action Advice */}
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-800/50">
            <h4 className="flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-white">
              <Zap className="h-4 w-4 text-amber-500" />
              Prioridades de Máxima Alavancagem para Hoje
            </h4>
            <div className="mt-3 space-y-2">
              {overview.priorities.topItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl bg-white p-3 border border-neutral-200/70 text-sm text-neutral-800 dark:border-neutral-700/60 dark:bg-neutral-900 dark:text-neutral-200"
                >
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {idx + 1}
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-xl bg-indigo-50/50 p-3 text-xs text-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-300">
              <Lightbulb className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
              <span><strong>Recomendação Executiva do Fluxo:</strong> {overview.priorities.actionAdvice}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-3 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Fluxo Life OS • Sistema Operacional da Vida
          </span>
          <button
            onClick={onClose}
            className="rounded-xl bg-neutral-200 px-4 py-2 text-xs font-bold text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            Fechar Diagnóstico
          </button>
        </div>
      </div>
    </div>
  );
};
