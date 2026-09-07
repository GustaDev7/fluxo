import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  formatDatePT,
  getGreetingPT,
  getTodayDateString,
  isPastDate,
} from '../../utils/date';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderKanban,
  Flame,
  Target,
  Sparkles,
  ArrowUpRight,
  Play,
  Check,
  Plus,
  SlidersHorizontal,
  Calendar,
  Repeat,
  DollarSign,
  Send,
  Activity,
  ShieldCheck,
  Zap,
  ArrowRight,
  Circle,
  TrendingUp,
} from 'lucide-react';
import { isRoutineScheduledForDate, isRoutineCompletedOnDate } from '../../utils/routineUtils';
import { useFinance } from '../../context/FinanceContext';
import { LifeOverviewModal } from '../LifeOverviewModal';
import { interpretLifeInput } from '../../utils/lifeOSUtils';
import { formatBRL } from '../../utils/financeUtils';

export const DashboardView: React.FC = () => {
  const {
    user,
    tasks,
    projects,
    events,
    habits,
    goals,
    allProjectRoutines,
    toggleProjectRoutine,
    setSelectedProjectId,
    toggleHabitDay,
    updateTask,
    setSelectedTaskId,
    setActiveTab,
    setIsQuickCaptureOpen,
    toggleWidgetVisibility,
    startFocusTimer,
    aiGetSmartPriorities,
    isAiLoading,
    addTask,
    addGoal,
    addProject,
    activeTimer,
    pauseFocusTimer,
    resumeFocusTimer,
    stopFocusTimer,
    moveTaskStatus,
    showToast,
  } = useApp();

  const {
    netWorthSummary,
    zeroBasedStatus,
    todayBills,
    upcomingBills,
    overdueBills,
    healthScore,
    addTransaction,
    addBill,
  } = useFinance();

  const [aiBriefing, setAiBriefing] = useState<{
    briefing?: string;
    suggestions?: string[];
  } | null>(null);
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const [isLifeOverviewOpen, setIsLifeOverviewOpen] = useState(false);
  const [lifeInputText, setLifeInputText] = useState('');
  const [lifeFeedbackMessage, setLifeFeedbackMessage] = useState<string | null>(null);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [taskFilter, setTaskFilter] = useState<'pending' | 'done' | 'all'>('pending');

  const todayStr = getTodayDateString();

  // Metrics calculation
  const pendingTasks = tasks.filter((t) => t.status !== 'done' && !t.isInbox);
  const completedTasks = tasks.filter((t) => t.status === 'done');
  const overdueTasks = tasks.filter(
    (t) => t.status !== 'done' && t.dueDate && isPastDate(t.dueDate, t.dueTime)
  );
  const todayTasks = tasks.filter((t) => t.dueDate === todayStr && !t.isInbox);
  const todayPendingTasks = todayTasks.filter((t) => t.status !== 'done');
  const todayCompletedTasks = todayTasks.filter((t) => t.status === 'done');
  const todayEvents = events.filter((e) => e.startDate === todayStr);

  const todayProjectRoutines = allProjectRoutines.filter((routine) =>
    isRoutineScheduledForDate(routine, todayStr)
  );
  const completedTodayRoutines = todayProjectRoutines.filter((r) =>
    isRoutineCompletedOnDate(r, todayStr)
  );

  const totalPlannedMinutes = todayTasks.reduce((acc, t) => acc + (t.estimatedDuration || 30), 0);
  const totalExecutedMinutes = todayTasks.reduce((acc, t) => acc + (t.timeSpent || 0), 0);

  const habitsCompletedToday = habits.filter((h) => h.completedDates.includes(todayStr)).length;
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak), 0);

  // Top urgent or high priority pending tasks
  const smartPriorityTasks = [...pendingTasks]
    .sort((a, b) => {
      const pWeights = { urgent: 4, high: 3, medium: 2, low: 1, none: 0 };
      return pWeights[b.priority] - pWeights[a.priority];
    })
    .slice(0, 3);

  // The Single Next Best Action / "O Que Fazer Agora" (Princípio #39)
  const currentBestTask = (() => {
    const topToday = [...todayPendingTasks].sort((a, b) => {
      const pWeights = { urgent: 4, high: 3, medium: 2, low: 1, none: 0 };
      return pWeights[b.priority] - pWeights[a.priority];
    })[0];
    if (topToday) return topToday;

    if (overdueTasks.length > 0) return overdueTasks[0];
    if (smartPriorityTasks.length > 0) return smartPriorityTasks[0];
    return null;
  })();

  const handleRelieveOverload = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    let rescheduledCount = 0;
    todayPendingTasks.forEach((t) => {
      if (t.priority === 'none' || t.priority === 'low') {
        updateTask(t.id, { dueDate: tomorrowStr });
        rescheduledCount++;
      }
    });

    if (rescheduledCount > 0) {
      showToast(`${rescheduledCount} tarefa(s) secundárias adiadas para amanhã. Respire fundo!`);
    } else {
      showToast('Seu dia foi otimizado.');
    }
  };

  const handleRequestAiBriefing = async () => {
    const res = await aiGetSmartPriorities();
    if (res) {
      setAiBriefing({
        briefing: res.briefing,
        suggestions: res.suggestions,
      });
    }
  };

  const handleExecuteLifeInput = (rawText?: string) => {
    const textToProcess = (rawText || lifeInputText).trim();
    if (!textToProcess) return;

    const lower = textToProcess.toLowerCase();
    if (
      lower.includes('como está minha vida') ||
      lower.includes('diagnóstico') ||
      lower.includes('visão 360')
    ) {
      setIsLifeOverviewOpen(true);
      setLifeInputText('');
      setLifeFeedbackMessage('Abrindo Diagnóstico 360° da Vida...');
      setTimeout(() => setLifeFeedbackMessage(null), 4000);
      return;
    }

    const interpreted = interpretLifeInput(textToProcess);

    if (interpreted.type === 'finance' && interpreted.transaction) {
      addTransaction({
        amount: interpreted.transaction.amount || 42,
        type: interpreted.transaction.type || 'expense',
        description: interpreted.transaction.description || 'Despesa Capturada',
        masterCategory: (interpreted.transaction.masterCategory as any) || 'conforto',
        subcategory: interpreted.transaction.subcategory || 'Transporte',
        date: todayStr,
      });
      setLifeFeedbackMessage(
        `Transação registrada: ${formatBRL(interpreted.transaction.amount || 42)} (${interpreted.transaction.description}) no Orçamento Base Zero!`
      );
    } else if (interpreted.type === 'bill' && interpreted.bill) {
      const billTitle = interpreted.bill.title || 'Conta a pagar';
      const billAmt = interpreted.bill.amount || 240;
      const billDue = interpreted.bill.dueDate || todayStr;
      addBill({
        title: billTitle,
        amount: billAmt,
        dueDate: billDue,
        masterCategory: interpreted.bill.masterCategory || 'custos_fixos',
        status: 'pending',
        type: 'expense',
      });
      addTask({
        title: `Pagar ${billTitle} (${formatBRL(billAmt)})`,
        dueDate: billDue,
        priority: 'urgent',
        tags: ['financas', 'pagamento'],
      });
      setLifeFeedbackMessage(
        `Conta cadastrada: ${billTitle} (${formatBRL(billAmt)}) com vencimento em ${billDue}!`
      );
    } else if (interpreted.type === 'goal' && interpreted.goal) {
      addGoal({
        title: interpreted.goal.title || 'Nova Meta',
        targetValue: interpreted.goal.targetValue || 30000,
        currentValue: 0,
        deadline: interpreted.goal.deadline || '2027-12-31',
        period: 'yearly',
        category: 'financeira',
        unit: 'R$',
        linkedTaskIds: [],
        status: 'active',
      });
      addProject({
        name: `Projeto: ${interpreted.goal.title || 'Meta Financeira'}`,
        description: `Desdobramento prático para alcançar a meta até ${interpreted.goal.deadline || '2027-12-31'}`,
        color: '#3b82f6',
        priority: 'high',
        status: 'active',
      });
      setLifeFeedbackMessage(
        `Meta registrada: ${interpreted.goal.title} (${formatBRL(interpreted.goal.targetValue || 30000)}) integrada a Projetos!`
      );
    } else {
      addTask({
        title: textToProcess,
        dueDate: todayStr,
        priority: 'high',
        tags: ['captura-rapida'],
      });
      setLifeFeedbackMessage(`Demanda adicionada às tarefas de hoje: "${textToProcess}"!`);
    }

    setLifeInputText('');
    setTimeout(() => setLifeFeedbackMessage(null), 5000);
  };

  const handleAddQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    addTask({
      title: quickTaskTitle.trim(),
      dueDate: todayStr,
      priority: 'medium',
      tags: ['hoje'],
    });
    setQuickTaskTitle('');
  };

  const handleRescheduleAllOverdue = () => {
    overdueTasks.forEach((t) => {
      updateTask(t.id, { dueDate: todayStr });
    });
  };

  // Filtered today's tasks
  const displayedTodayTasks = todayTasks.filter((t) => {
    if (taskFilter === 'pending') return t.status !== 'done';
    if (taskFilter === 'done') return t.status === 'done';
    return true;
  });

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-7xl mx-auto">
      {/* 1. Header: Clean, Warm & Focused */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/70 pb-5 dark:border-neutral-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {formatDatePT(todayStr, 'long')}
          </span>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
            {getGreetingPT()}{user?.name?.trim() ? `, ${user.name.trim().split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {todayPendingTasks.length > 0 ? (
              <>
                Você tem <strong className="text-neutral-800 dark:text-neutral-200">{todayPendingTasks.length} tarefa{todayPendingTasks.length > 1 ? 's' : ''}</strong>
                {todayEvents.length > 0 && (
                  <> e <strong className="text-neutral-800 dark:text-neutral-200">{todayEvents.length} compromisso{todayEvents.length > 1 ? 's' : ''}</strong></>
                )} agendados para hoje.
              </>
            ) : (
              <span>Tudo em dia com as tarefas programadas para hoje!</span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsLifeOverviewOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-xs hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 transition-colors"
            title="Diagnóstico 360° da Vida (Tempo, Finanças e Metas)"
          >
            <Activity className="h-3.5 w-3.5 text-emerald-600" />
            <span>Diagnóstico 360°</span>
          </button>

          <button
            onClick={() => setIsWidgetModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-600 shadow-xs hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
            title="Personalizar seções do Dashboard"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Widgets</span>
          </button>

          <button
            onClick={() => setIsQuickCaptureOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nova Demanda</span>
          </button>
        </div>
      </div>

      {/* Life Feedback Banner */}
      {lifeFeedbackMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-900 shadow-xs dark:border-emerald-900/50 dark:bg-emerald-950/60 dark:text-emerald-200 animate-in fade-in duration-200">
          <span>{lifeFeedbackMessage}</span>
          <button
            onClick={() => setLifeFeedbackMessage(null)}
            className="ml-3 text-xs text-emerald-700 hover:text-emerald-900 dark:text-emerald-400"
          >
            Fechar
          </button>
        </div>
      )}

      {/* 2. Captura Rápida Integrada (Clean Spotlight-style Input) */}
      <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/70 p-3 sm:p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
            <Zap className="h-4 w-4" />
          </div>
          <div className="relative flex-1">
            <input
              type="text"
              value={lifeInputText}
              onChange={(e) => setLifeInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleExecuteLifeInput();
                }
              }}
              placeholder="Captura Rápida: digite uma despesa, tarefa ou compromisso (ex: 'Gastei 42 no Uber', 'Pagar internet dia 10')..."
              className="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-3.5 pr-20 text-xs text-neutral-900 placeholder:text-neutral-400 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
            <button
              onClick={() => handleExecuteLifeInput()}
              disabled={!lifeInputText.trim()}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg bg-indigo-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              Enviar
            </button>
          </div>
        </div>

        {/* Discreet Quick Examples */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pl-0 sm:pl-10 text-[11px]">
          <span className="text-neutral-400 font-medium">Exemplos:</span>
          {[
            { label: 'Uber R$ 42', text: 'Gastei 42 reais no Uber' },
            { label: 'Conta de luz dia 10', text: 'Pagar luz 180 reais dia 10' },
            { label: 'Revisar apresentação', text: 'Revisar apresentação com o time' },
            { label: 'Como está minha vida?', text: 'Como está minha vida?' },
          ].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleExecuteLifeInput(chip.text)}
              className="rounded-md border border-neutral-200 bg-white px-2 py-0.5 text-neutral-600 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300 transition-colors"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Pulso do Dia: 4 Indicadores Coesos e Alinhados */}
      {user.visibleWidgets.metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {/* Tarefas Hoje */}
          <div
            onClick={() => setActiveTab('tasks')}
            className="cursor-pointer rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-2xs hover:border-indigo-300 transition-all dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Tarefas de Hoje</span>
              <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
                {todayCompletedTasks.length}
              </span>
              <span className="text-xs text-neutral-400 font-medium">/ {todayTasks.length} concluídas</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                style={{
                  width: `${todayTasks.length > 0 ? (todayCompletedTasks.length / todayTasks.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Agenda / Compromissos */}
          <div
            onClick={() => setActiveTab('agenda')}
            className="cursor-pointer rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-2xs hover:border-indigo-300 transition-all dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Agenda & Horas</span>
              <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
                {todayEvents.length}
              </span>
              <span className="text-xs text-neutral-400 font-medium">
                {todayEvents.length === 1 ? 'evento hoje' : 'eventos hoje'}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
              {todayEvents[0]
                ? `Próximo: ${todayEvents[0].startTime} • ${todayEvents[0].title}`
                : `${(totalPlannedMinutes / 60).toFixed(1)}h de foco planejadas`}
            </p>
          </div>

          {/* Hábitos do Dia */}
          <div
            onClick={() => setActiveTab('habits')}
            className="cursor-pointer rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-2xs hover:border-orange-300 transition-all dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Hábitos Diários</span>
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
                {habitsCompletedToday}
              </span>
              <span className="text-xs text-neutral-400 font-medium">/ {habits.length} feitos</span>
            </div>
            <p className="mt-2 text-[11px] text-orange-600 dark:text-orange-400 font-semibold flex items-center gap-1">
              <Flame className="h-3 w-3 inline" />
              <span>Sequência máxima: {bestStreak} dias</span>
            </p>
          </div>

          {/* Finanças & Margem Livre (AUVP) */}
          <div
            onClick={() => setActiveTab('finance')}
            className="cursor-pointer rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-2xs hover:border-emerald-300 transition-all dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Finanças AUVP</span>
              <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 truncate">
                {formatBRL(zeroBasedStatus.unallocated)}
              </span>
              <span className="text-[10px] text-neutral-400 font-medium">livre</span>
            </div>
            <p className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
              {overdueBills.length > 0 ? (
                <span className="text-rose-600 font-bold flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 inline text-rose-600" />
                  <span>{overdueBills.length} conta(s) pendente(s)</span>
                </span>
              ) : (
                <span>Contas em dia • Saúde {healthScore.score}/100</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* 4. Main 2-Column Work Area: Foco & Execução (Esq) vs. Contexto & Rotina (Dir) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Tarefas, Prioridades e Rotinas */}
        <div className="lg:col-span-7 space-y-5">
          {/* Alertas Importantes (#4: Conta vencendo, Tarefa atrasada) */}
          {(overdueBills.length > 0 || overdueTasks.length > 0) && (
            <div className="space-y-2">
              {overdueBills.length > 0 && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
                  <div className="flex items-center gap-2 truncate">
                    <DollarSign className="h-4 w-4 text-rose-600 shrink-0" />
                    <span className="truncate">
                      <strong>Atenção financeira:</strong> Você tem {overdueBills.length} conta(s) pendente(s).
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab('finance')}
                    className="shrink-0 font-bold text-rose-700 hover:underline dark:text-rose-300"
                  >
                    Resolver Contas →
                  </button>
                </div>
              )}
              {overdueTasks.length > 0 && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                  <div className="flex items-center gap-2 truncate">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span className="truncate">
                      {overdueTasks.length} tarefa(s) com prazo expirado necessitando de revisão.
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab('tasks')}
                    className="shrink-0 font-bold text-amber-700 hover:underline dark:text-amber-300"
                  >
                    Revisar Prazos →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Prevenção de Sobrecarga (#37) */}
          {todayPendingTasks.length >= 6 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  Seu dia parece cheio ({todayPendingTasks.length} tarefas pendentes). Deseja aliviar a carga?
                </span>
              </div>
              <button
                onClick={handleRelieveOverload}
                className="shrink-0 rounded-xl bg-amber-600 px-3 py-1.5 font-bold text-white shadow-xs hover:bg-amber-700 active:scale-95 transition-all"
              >
                Reorganizar para Amanhã
              </button>
            </div>
          )}

          {/* O Que Fazer Agora? (#39 e #4) */}
          <div className="rounded-2xl border border-indigo-200/90 bg-linear-to-br from-indigo-50/70 to-purple-50/30 p-4 sm:p-5 dark:border-indigo-900/60 dark:from-indigo-950/40 dark:to-neutral-900 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xs">
                  <Play className="h-3 w-3 fill-current ml-0.5" />
                </div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
                  O Que Fazer Agora?
                </h2>
              </div>
              {activeTimer?.isRunning && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span>Foco em Andamento</span>
                </span>
              )}
            </div>

            {activeTimer?.isRunning ? (
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-white p-3.5 shadow-2xs dark:bg-neutral-800/80">
                <div>
                  <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    {activeTimer.taskTitle || 'Bloco de Foco sem Distrações'}
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Tempo restante: {Math.floor(activeTimer.secondsRemaining / 60)}m {activeTimer.secondsRemaining % 60}s
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={pauseFocusTimer}
                    className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  >
                    Pausar
                  </button>
                  <button
                    onClick={() => {
                      if (activeTimer.taskId) moveTaskStatus(activeTimer.taskId, 'done');
                      stopFocusTimer();
                    }}
                    className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Concluir Foco
                  </button>
                </div>
              </div>
            ) : currentBestTask ? (
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-white p-3.5 shadow-2xs dark:bg-neutral-800/80">
                <div className="truncate">
                  <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                    {currentBestTask.title}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    <span>Estimativa: {currentBestTask.estimatedDuration || 25} min</span>
                    {currentBestTask.dueDate && <span>• Prazo: {formatDatePT(currentBestTask.dueDate, 'relative')}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() =>
                      startFocusTimer({
                        taskId: currentBestTask.id,
                        taskTitle: currentBestTask.title,
                        durationMinutes: currentBestTask.estimatedDuration || 25,
                      })
                    }
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition-all"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>Iniciar Agora</span>
                  </button>
                  <button
                    onClick={() => moveTaskStatus(currentBestTask.id, 'done')}
                    className="rounded-xl border border-neutral-200 p-1.5 text-neutral-600 hover:border-emerald-500 hover:text-emerald-600 dark:border-neutral-700 dark:text-neutral-400 dark:hover:text-emerald-400"
                    title="Concluir tarefa"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      updateTask(currentBestTask.id, { dueDate: tomorrow.toISOString().split('T')[0] });
                      showToast('Tarefa adiada para amanhã');
                    }}
                    className="rounded-xl border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-700"
                    title="Adiar para amanhã"
                  >
                    Adiar
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex items-center justify-between rounded-xl bg-white/80 p-3 text-xs text-neutral-600 dark:bg-neutral-800/60 dark:text-neutral-400">
                <span>Tudo em dia para este momento! Nenhuma prioridade imediata.</span>
                <button
                  onClick={() => setIsQuickCaptureOpen(true)}
                  className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  + Nova demanda
                </button>
              </div>
            )}
          </div>

          {/* Prioridades em Destaque (Smart Priorities) */}
          {user.visibleWidgets.smartPriorities && smartPriorityTasks.length > 0 && (
            <div className="rounded-2xl border border-indigo-100 bg-white p-4 sm:p-5 shadow-2xs dark:border-indigo-950/70 dark:bg-neutral-900">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                    Prioridades em Destaque
                  </h2>
                </div>

                <button
                  onClick={handleRequestAiBriefing}
                  disabled={isAiLoading}
                  className="flex items-center gap-1 rounded-lg text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50 dark:text-indigo-400"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>{isAiLoading ? 'Analisando...' : 'Análise IA'}</span>
                </button>
              </div>

              {/* AI Briefing if generated */}
              {aiBriefing?.briefing && (
                <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-3 text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-300">
                  <p className="font-medium leading-relaxed">{aiBriefing.briefing}</p>
                </div>
              )}

              {/* Priority Tasks Cards */}
              <div className="mt-3 space-y-2">
                {smartPriorityTasks.map((task, idx) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100 bg-neutral-50/50 p-3 hover:border-neutral-200 dark:border-neutral-800/80 dark:bg-neutral-800/30 transition-all"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <p
                          onClick={() => setSelectedTaskId(task.id)}
                          className="cursor-pointer text-xs font-bold text-neutral-900 hover:text-indigo-600 dark:text-neutral-100 dark:hover:text-indigo-400 truncate"
                        >
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-0.5">
                          <span
                            className={`font-semibold uppercase ${
                              task.priority === 'urgent' ? 'text-rose-600' : 'text-amber-600'
                            }`}
                          >
                            {task.priority === 'urgent' ? 'Urgente' : 'Alta prioridade'}
                          </span>
                          {task.dueDate && <span>• Vence {formatDatePT(task.dueDate, 'relative')}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => startFocusTimer(task.id, task.title, 25)}
                        className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-indigo-700 border border-neutral-200 shadow-2xs hover:bg-indigo-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-indigo-300"
                        title="Iniciar Pomodoro de 25 min"
                      >
                        <Play className="h-2.5 w-2.5 fill-current" />
                        <span>Focar</span>
                      </button>

                      <button
                        onClick={() => updateTask(task.id, { status: 'done' })}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 dark:bg-neutral-800 dark:border-neutral-700 dark:hover:text-emerald-400 transition-colors"
                        title="Marcar como concluída"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tarefas de Hoje (Today's Tasks List) */}
          {user.visibleWidgets.todayTasks && (
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 sm:p-5 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3.5 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Tarefas de Hoje
                  </h2>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                    {todayPendingTasks.length} pendente{todayPendingTasks.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Task Filter Tabs */}
                  <div className="flex rounded-lg bg-neutral-100 p-0.5 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                    <button
                      onClick={() => setTaskFilter('pending')}
                      className={`rounded-md px-2.5 py-0.5 transition-colors ${
                        taskFilter === 'pending'
                          ? 'bg-white font-bold text-neutral-900 shadow-2xs dark:bg-neutral-700 dark:text-neutral-100'
                          : 'hover:text-neutral-900 dark:hover:text-neutral-200'
                      }`}
                    >
                      Pendentes
                    </button>
                    <button
                      onClick={() => setTaskFilter('done')}
                      className={`rounded-md px-2.5 py-0.5 transition-colors ${
                        taskFilter === 'done'
                          ? 'bg-white font-bold text-neutral-900 shadow-2xs dark:bg-neutral-700 dark:text-neutral-100'
                          : 'hover:text-neutral-900 dark:hover:text-neutral-200'
                      }`}
                    >
                      Feitas ({todayCompletedTasks.length})
                    </button>
                    <button
                      onClick={() => setTaskFilter('all')}
                      className={`rounded-md px-2.5 py-0.5 transition-colors ${
                        taskFilter === 'all'
                          ? 'bg-white font-bold text-neutral-900 shadow-2xs dark:bg-neutral-700 dark:text-neutral-100'
                          : 'hover:text-neutral-900 dark:hover:text-neutral-200'
                      }`}
                    >
                      Todas
                    </button>
                  </div>

                  <button
                    onClick={() => setActiveTab('tasks')}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                    title="Ver quadro completo de tarefas"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Overdue alert banner if any */}
              {user.visibleWidgets.overdueTasks && overdueTasks.length > 0 && (
                <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs dark:border-amber-950/60 dark:bg-amber-950/20">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>
                      Você tem <strong>{overdueTasks.length} tarefa{overdueTasks.length > 1 ? 's' : ''}</strong> de dias anteriores não concluída{overdueTasks.length > 1 ? 's' : ''}.
                    </span>
                  </div>
                  <button
                    onClick={handleRescheduleAllOverdue}
                    className="whitespace-nowrap rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-amber-700 transition-colors"
                  >
                    Mover para hoje
                  </button>
                </div>
              )}

              {/* Quick inline task add */}
              <form onSubmit={handleAddQuickTask} className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  placeholder="+ Adicionar tarefa rápida para hoje (Pressione Enter)..."
                  className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-100"
                />
                <button
                  type="submit"
                  disabled={!quickTaskTitle.trim()}
                  className="rounded-xl bg-neutral-900 px-3 py-2 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-30 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
                >
                  Adicionar
                </button>
              </form>

              {/* Task Items List */}
              <div className="mt-3 space-y-1.5">
                {displayedTodayTasks.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-400">
                    {taskFilter === 'pending'
                      ? 'Nenhuma tarefa pendente para hoje. Parabéns!'
                      : 'Nenhuma tarefa encontrada neste filtro.'}
                  </div>
                ) : (
                  displayedTodayTasks.map((task) => {
                    const isDone = task.status === 'done';
                    return (
                      <div
                        key={task.id}
                        className={`group flex items-center justify-between gap-3 rounded-xl border p-2.5 transition-all ${
                          isDone
                            ? 'border-neutral-100 bg-neutral-50/40 opacity-60 dark:border-neutral-800/40 dark:bg-neutral-800/20'
                            : 'border-neutral-200/70 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <button
                            onClick={() =>
                              updateTask(task.id, { status: isDone ? 'todo' : 'done' })
                            }
                            className="text-neutral-400 hover:text-emerald-500 shrink-0 transition-colors"
                          >
                            {isDone ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                          </button>

                          <div className="truncate">
                            <span
                              onClick={() => setSelectedTaskId(task.id)}
                              className={`cursor-pointer text-xs font-semibold ${
                                isDone
                                  ? 'line-through text-neutral-400'
                                  : 'text-neutral-900 hover:text-indigo-600 dark:text-neutral-100 dark:hover:text-indigo-400'
                              }`}
                            >
                              {task.title}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-0.5">
                              {task.dueTime && (
                                <span className="flex items-center gap-0.5">
                                  <Clock className="h-2.5 w-2.5 inline" />
                                  <span>{task.dueTime}</span>
                                </span>
                              )}
                              {task.tags && task.tags.length > 0 && (
                                <span>#{task.tags[0]}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {!isDone && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startFocusTimer(task.id, task.title, 25)}
                              className="rounded-lg p-1 text-neutral-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60"
                              title="Focar 25 min"
                            >
                              <Play className="h-3 w-3 fill-current" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Rotinas Recorrentes dos Projetos */}
          {todayProjectRoutines.length > 0 && (
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 sm:p-5 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                    Rotinas dos Projetos ({completedTodayRoutines.length}/{todayProjectRoutines.length})
                  </h2>
                </div>
                <button
                  onClick={() => setActiveTab('projects')}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  <span>Ver Projetos</span>
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {todayProjectRoutines.map((routine) => {
                  const isDone = isRoutineCompletedOnDate(routine, todayStr);
                  return (
                    <div
                      key={routine.id}
                      className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/50 p-2.5 text-xs dark:border-neutral-800 dark:bg-neutral-800/30 transition-all"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <button
                          onClick={() => toggleProjectRoutine(routine.projectId, routine.id, todayStr)}
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg transition-colors ${
                            isDone
                              ? 'bg-emerald-500 text-white'
                              : 'border border-neutral-300 bg-white text-transparent hover:border-indigo-400 dark:border-neutral-700 dark:bg-neutral-800'
                          }`}
                        >
                          <Check className="h-3 w-3 stroke-[3]" />
                        </button>
                        <div className="truncate">
                          <div className="flex items-center gap-1.5 truncate">
                            <span
                              className="rounded px-1.5 py-0.2 text-[9px] font-extrabold uppercase shrink-0 border"
                              style={{
                                backgroundColor: `${routine.projectColor}15`,
                                borderColor: `${routine.projectColor}40`,
                                color: routine.projectColor,
                              }}
                            >
                              {routine.projectName}
                            </span>
                            <span
                              className={`truncate font-semibold ${
                                isDone
                                  ? 'line-through text-neutral-400'
                                  : 'text-neutral-800 dark:text-neutral-200'
                              }`}
                            >
                              {routine.title}
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral-400 mt-0.5">
                            {routine.preferredTime || 'Horário flexível'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedProjectId(routine.projectId);
                          setActiveTab('projects');
                        }}
                        className="p-1 text-neutral-400 hover:text-indigo-600 rounded shrink-0 transition-colors"
                        title="Abrir no Projeto"
                      >
                        <FolderKanban className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Agenda, Hábitos, Metas & Finanças */}
        <div className="lg:col-span-5 space-y-5">
          {/* Agenda de Hoje */}
          {user.visibleWidgets.upcomingEvents && (
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 sm:p-5 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                    Agenda do Dia
                  </h2>
                </div>
                <button
                  onClick={() => setActiveTab('agenda')}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  <span>Abrir Agenda</span>
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {todayEvents.length === 0 ? (
                  <p className="py-5 text-center text-xs text-neutral-400">
                    Nenhum compromisso na agenda hoje.
                  </p>
                ) : (
                  todayEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="rounded-xl border border-neutral-100 bg-neutral-50/70 p-2.5 text-xs dark:border-neutral-800 dark:bg-neutral-800/40"
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-neutral-900 dark:text-neutral-100 truncate">{evt.title}</span>
                        <span className="text-[11px] text-indigo-600 dark:text-indigo-400 shrink-0 font-mono">
                          {evt.startTime} - {evt.endTime}
                        </span>
                      </div>
                      {evt.location && (
                        <p className="mt-0.5 text-[10px] text-neutral-400 truncate">{evt.location}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Hábitos Diários */}
          {user.visibleWidgets.habits && habits.length > 0 && (
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 sm:p-5 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                    Hábitos ({habitsCompletedToday}/{habits.length})
                  </h2>
                </div>
                <button
                  onClick={() => setActiveTab('habits')}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  <span>Ver todos</span>
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>

              <div className="mt-3 space-y-1.5">
                {habits.slice(0, 5).map((habit) => {
                  const isDoneToday = habit.completedDates.includes(todayStr);
                  return (
                    <div
                      key={habit.id}
                      className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/50 p-2 text-xs dark:border-neutral-800 dark:bg-neutral-800/30"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <button
                          onClick={() => toggleHabitDay(habit.id, todayStr)}
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg transition-colors ${
                            isDoneToday
                              ? 'bg-emerald-500 text-white'
                              : 'border border-neutral-300 bg-white text-transparent dark:border-neutral-700 dark:bg-neutral-800'
                          }`}
                        >
                          <Check className="h-3 w-3 stroke-[3]" />
                        </button>
                        <span
                          className={`truncate font-medium ${
                            isDoneToday
                              ? 'line-through text-neutral-400'
                              : 'text-neutral-800 dark:text-neutral-200'
                          }`}
                        >
                          {habit.name}
                        </span>
                      </div>

                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-orange-600 dark:text-orange-400">
                        <Flame className="h-3 w-3" />
                        {habit.currentStreak}d
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Metas em Andamento */}
          {user.visibleWidgets.goals && goals.length > 0 && (
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 sm:p-5 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                    Metas Principais
                  </h2>
                </div>
                <button
                  onClick={() => setActiveTab('goals')}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  <span>Metas</span>
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {goals.slice(0, 2).map((goal) => {
                  const percent = Math.min(
                    100,
                    Math.round((goal.currentValue / (goal.targetValue || 1)) * 100)
                  );
                  return (
                    <div key={goal.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                          {goal.title}
                        </span>
                        <span className="text-[11px] font-bold text-neutral-500 shrink-0">
                          {percent}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <div
                          className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Card Resumo 360° da Vida & Finanças AUVP */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-950/60 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Blindagem & Finanças AUVP
                </span>
              </div>
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                Score {healthScore.score}/100
              </span>
            </div>
            <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
              Patrimônio Líquido de <strong>{formatBRL(netWorthSummary.netWorth)}</strong>.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => setActiveTab('finance')}
                className="flex-1 rounded-xl bg-emerald-600 py-1.5 text-center text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition-colors"
              >
                Abrir Finanças
              </button>
              <button
                onClick={() => setIsLifeOverviewOpen(true)}
                className="rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-neutral-800 dark:text-emerald-300 transition-colors"
              >
                Visão 360°
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customize Widgets Modal */}
      {isWidgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Personalizar Seções do Dashboard
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              Escolha quais seções você deseja ver na tela inicial:
            </p>

            <div className="mt-4 space-y-2.5">
              {[
                { key: 'metrics', label: 'Cards de Indicadores de Produtividade & Finanças' },
                { key: 'smartPriorities', label: 'Prioridades em Destaque & Análise de IA' },
                { key: 'todayTasks', label: 'Tarefas de Hoje' },
                { key: 'overdueTasks', label: 'Alerta de Tarefas Atrasadas' },
                { key: 'upcomingEvents', label: 'Agenda & Eventos do Dia' },
                { key: 'habits', label: 'Hábitos do Dia' },
                { key: 'goals', label: 'Progresso das Metas' },
              ].map(({ key, label }) => {
                const k = key as keyof typeof user.visibleWidgets;
                const isChecked = user.visibleWidgets[k];
                return (
                  <label
                    key={key}
                    className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 p-3 text-xs font-medium dark:border-neutral-800 dark:bg-neutral-800/60"
                  >
                    <span className="text-neutral-800 dark:text-neutral-200">{label}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleWidgetVisibility(k)}
                      className="h-4 w-4 rounded text-indigo-600"
                    />
                  </label>
                );
              })}
            </div>

            <button
              onClick={() => setIsWidgetModalOpen(false)}
              className="mt-5 w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700"
            >
              Concluir
            </button>
          </div>
        </div>
      )}

      {/* 360° Life Overview Modal */}
      <LifeOverviewModal
        isOpen={isLifeOverviewOpen}
        onClose={() => setIsLifeOverviewOpen(false)}
      />
    </div>
  );
};
