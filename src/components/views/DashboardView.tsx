import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  formatDatePT,
  getGreetingPT,
  getTodayDateString,
  isPastDate,
  isToday,
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
  Layers,
  BookOpen,
  Repeat,
} from 'lucide-react';
import { Task } from '../../types';
import { isRoutineScheduledForDate, isRoutineCompletedOnDate } from '../../utils/routineUtils';

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
  } = useApp();

  const [aiBriefing, setAiBriefing] = useState<{
    briefing?: string;
    suggestions?: string[];
  } | null>(null);
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);

  const todayStr = getTodayDateString();

  // Metrics calculation
  const pendingTasks = tasks.filter((t) => t.status !== 'done' && !t.isInbox);
  const completedTasks = tasks.filter((t) => t.status === 'done');
  const overdueTasks = tasks.filter(
    (t) => t.status !== 'done' && t.dueDate && isPastDate(t.dueDate, t.dueTime)
  );
  const todayTasks = tasks.filter(
    (t) => t.dueDate === todayStr && !t.isInbox
  );
  const activeProjects = projects.filter((p) => p.status === 'active');
  const todayEvents = events.filter((e) => e.startDate === todayStr);

  const todayProjectRoutines = allProjectRoutines.filter((routine) =>
    isRoutineScheduledForDate(routine, todayStr)
  );
  const completedTodayRoutines = todayProjectRoutines.filter((r) =>
    isRoutineCompletedOnDate(r, todayStr)
  );

  const totalPlannedMinutes = todayTasks.reduce((acc, t) => acc + (t.estimatedDuration || 30), 0);
  const totalExecutedMinutes = todayTasks.reduce((acc, t) => acc + (t.timeSpent || 0), 0);

  const completionRate =
    tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  // Smart priorities: Top 3 urgent or high priority pending tasks
  const smartPriorityTasks = [...pendingTasks]
    .sort((a, b) => {
      const pWeights = { urgent: 4, high: 3, medium: 2, low: 1, none: 0 };
      return pWeights[b.priority] - pWeights[a.priority];
    })
    .slice(0, 3);

  const handleRequestAiBriefing = async () => {
    const res = await aiGetSmartPriorities();
    if (res) {
      setAiBriefing({
        briefing: res.briefing,
        suggestions: res.suggestions,
      });
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Top Greeting & Date Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {formatDatePT(todayStr, 'long')}
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
            {getGreetingPT()}{user?.name?.trim() ? `, ${user.name.trim().split(' ')[0]}` : ''} 👋
          </h1>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Você tem <strong className="text-neutral-900 dark:text-neutral-100">{todayTasks.filter((t) => t.status !== 'done').length} tarefas</strong> e <strong className="text-neutral-900 dark:text-neutral-100">{todayEvents.length} compromissos</strong> agendados para hoje.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('assistant')}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 shadow-xs hover:from-indigo-100 hover:to-violet-100 dark:border-indigo-900/60 dark:from-indigo-950/40 dark:to-violet-950/40 dark:text-indigo-300"
            title="Abrir Assistente de Voz com Gemini"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
            <span>Assistente IA & Voz</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-2 text-xs font-semibold text-indigo-700 shadow-xs hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
            title="Aprenda a usar o sistema (Guia & Boas Práticas)"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Como Usar</span>
          </button>

          <button
            onClick={() => setIsWidgetModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-600 shadow-sm hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
            title="Personalizar Widgets"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Widgets</span>
          </button>

          <button
            onClick={() => setIsQuickCaptureOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Adicionar Demanda</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      {user.visibleWidgets.metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-[11px] font-medium uppercase tracking-wider">Pendentes</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {pendingTasks.length}
            </p>
            <p className="text-[11px] text-neutral-400">Em andamento</p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-[11px] font-medium uppercase tracking-wider">Concluídas</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {completedTasks.length}
            </p>
            <p className="text-[11px] text-neutral-400">{completionRate}% taxa total</p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-[11px] font-medium uppercase tracking-wider">Atrasadas</span>
              <AlertCircle className="h-4 w-4 text-rose-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
              {overdueTasks.length}
            </p>
            <p className="text-[11px] text-neutral-400">Requerem ação</p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-[11px] font-medium uppercase tracking-wider">Projetos</span>
              <FolderKanban className="h-4 w-4 text-indigo-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {activeProjects.length}
            </p>
            <p className="text-[11px] text-neutral-400">Projetos ativos</p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-[11px] font-medium uppercase tracking-wider">Horas Hoje</span>
              <Clock className="h-4 w-4 text-purple-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {(totalExecutedMinutes / 60).toFixed(1)}h
            </p>
            <p className="text-[11px] text-neutral-400">de {(totalPlannedMinutes / 60).toFixed(1)}h planejadas</p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-[11px] font-medium uppercase tracking-wider">Produtividade</span>
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {Math.min(100, Math.round((completedTasks.length / (tasks.length || 1)) * 100))}%
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Ritmo consistente</p>
          </div>
        </div>
      )}

      {/* AI Smart Priorities & Day Briefing Card */}
      {user.visibleWidgets.smartPriorities && (
        <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-violet-50/50 p-5 shadow-sm dark:border-indigo-950 dark:from-neutral-900 dark:via-neutral-900 dark:to-indigo-950/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100/60 pb-4 dark:border-indigo-950/60">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/30">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Prioridades Inteligentes do Dia
                </h2>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  As 3 ações de maior impacto recomendadas para hoje
                </p>
              </div>
            </div>

            <button
              onClick={handleRequestAiBriefing}
              disabled={isAiLoading}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-800 dark:bg-neutral-800 dark:text-indigo-300"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{isAiLoading ? 'Analisando...' : 'Pedir Análise à IA'}</span>
            </button>
          </div>

          {/* AI Briefing text if loaded */}
          {aiBriefing?.briefing && (
            <div className="mt-3 rounded-xl border border-indigo-200/60 bg-white/80 p-3 text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-300">
              <p className="font-medium leading-relaxed">{aiBriefing.briefing}</p>
              {aiBriefing.suggestions && aiBriefing.suggestions.length > 0 && (
                <ul className="mt-2 space-y-1 text-[11px] text-neutral-600 dark:text-neutral-400">
                  {aiBriefing.suggestions.map((sug, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      <span>{sug}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Top 3 Priority Cards */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            {smartPriorityTasks.map((t, index) => (
              <div
                key={t.id}
                className="group relative flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/90 dark:hover:border-indigo-900"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                      #{index + 1}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                        t.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>

                  <h3
                    onClick={() => setSelectedTaskId(t.id)}
                    className="mt-2 text-xs font-bold text-neutral-900 hover:text-indigo-600 cursor-pointer dark:text-neutral-100 dark:hover:text-indigo-400 line-clamp-2"
                  >
                    {t.title}
                  </h3>

                  {t.dueDate && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-neutral-400">
                      <Calendar className="h-3 w-3" />
                      <span>Vence {formatDatePT(t.dueDate, 'relative')} {t.dueTime ? `às ${t.dueTime}` : ''}</span>
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    onClick={() => startFocusTimer(t.id, t.title, 25)}
                    className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300"
                  >
                    <Play className="h-2.5 w-2.5 fill-current" />
                    <span>Focar 25m</span>
                  </button>

                  <button
                    onClick={() => updateTask(t.id, { status: 'done' })}
                    className="flex items-center gap-1 text-[11px] font-medium text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Concluir</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Today's Tasks & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Tasks (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {user.visibleWidgets.todayTasks && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Tarefas do Dia ({todayTasks.filter((t) => t.status === 'done').length}/{todayTasks.length})
                  </h2>
                </div>

                <button
                  onClick={() => setActiveTab('tasks')}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  <span>Ver todas</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {todayTasks.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-400">
                    Nenhuma tarefa agendada especificamente para hoje.
                  </div>
                ) : (
                  todayTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`group flex items-center justify-between rounded-xl border p-3 transition-all ${
                        task.status === 'done'
                          ? 'border-neutral-100 bg-neutral-50/50 opacity-60 dark:border-neutral-800/40 dark:bg-neutral-800/20'
                          : 'border-neutral-200/80 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <button
                          onClick={() => updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' })}
                          className="text-neutral-400 hover:text-emerald-500"
                        >
                          {task.status === 'done' ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border border-neutral-300 dark:border-neutral-700" />
                          )}
                        </button>

                        <div className="truncate">
                          <p
                            onClick={() => setSelectedTaskId(task.id)}
                            className={`cursor-pointer text-xs font-semibold ${
                              task.status === 'done'
                                ? 'line-through text-neutral-400'
                                : 'text-neutral-900 hover:text-indigo-600 dark:text-neutral-100 dark:hover:text-indigo-400'
                            }`}
                          >
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                            {task.dueTime && <span>🕒 {task.dueTime}</span>}
                            {task.tags.map((t) => (
                              <span key={t}>#{t}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {task.status !== 'done' && (
                          <button
                            onClick={() => startFocusTimer(task.id, task.title, 25)}
                            className="rounded-lg p-1.5 text-neutral-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60"
                            title="Focar nesta tarefa"
                          >
                            <Play className="h-3.5 w-3.5 fill-current" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Overdue alert if any */}
          {user.visibleWidgets.overdueTasks && overdueTasks.length > 0 && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 shadow-sm dark:border-rose-950 dark:bg-rose-950/20">
              <div className="flex items-center justify-between border-b border-rose-200/60 pb-3 dark:border-rose-900/40">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4" />
                  <h2 className="text-sm font-bold">Tarefas Atrasadas ({overdueTasks.length})</h2>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {overdueTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-xl border border-rose-200/80 bg-white p-3 text-xs dark:border-rose-900/60 dark:bg-neutral-900"
                  >
                    <div>
                      <p
                        onClick={() => setSelectedTaskId(task.id)}
                        className="font-bold text-neutral-900 hover:underline cursor-pointer dark:text-neutral-100"
                      >
                        {task.title}
                      </p>
                      <span className="text-[10px] text-rose-600 dark:text-rose-400">
                        Venceu em {formatDatePT(task.dueDate)}
                      </span>
                    </div>
                    <button
                      onClick={() => updateTask(task.id, { dueDate: todayStr })}
                      className="rounded-lg bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-200 dark:bg-rose-900/60 dark:text-rose-200"
                    >
                      Mover para hoje
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Goals Progress Widget */}
          {user.visibleWidgets.goals && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Progresso das Metas</h2>
                </div>
                <button
                  onClick={() => setActiveTab('goals')}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  <span>Ver todas</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-3 space-y-4">
                {goals.slice(0, 3).map((goal) => {
                  const percent = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
                  return (
                    <div key={goal.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">{goal.title}</span>
                        <span className="text-[11px] font-bold text-neutral-500">
                          {goal.currentValue} / {goal.targetValue} {goal.unit} ({percent}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Schedule & Habits (1 col) */}
        <div className="space-y-6">
          {/* Today's Schedule / Events */}
          {user.visibleWidgets.upcomingEvents && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Agenda de Hoje</h2>
                </div>
                <button
                  onClick={() => setActiveTab('agenda')}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  <span>Agenda completa</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-3 space-y-2.5">
                {todayEvents.length === 0 ? (
                  <p className="py-6 text-center text-xs text-neutral-400">Sem compromissos agendados hoje.</p>
                ) : (
                  todayEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-3 text-xs dark:border-neutral-800 dark:bg-neutral-800/40"
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-neutral-900 dark:text-neutral-100 truncate">{evt.title}</span>
                        <span className="text-[11px] text-indigo-600 dark:text-indigo-400 shrink-0 font-mono">
                          {evt.startTime} - {evt.endTime}
                        </span>
                      </div>
                      {evt.location && (
                        <p className="mt-1 text-[11px] text-neutral-500">{evt.location}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Daily Habits Checklist */}
          {user.visibleWidgets.habits && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Hábitos do Dia</h2>
                </div>
                <button
                  onClick={() => setActiveTab('habits')}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  <span>Ver todos</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {habits.map((habit) => {
                  const isDoneToday = habit.completedDates.includes(todayStr);
                  return (
                    <div
                      key={habit.id}
                      className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/50 p-2.5 text-xs dark:border-neutral-800 dark:bg-neutral-800/30"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <button
                          onClick={() => toggleHabitDay(habit.id, todayStr)}
                          className={`flex h-6 w-6 items-center justify-center rounded-lg transition-colors ${
                            isDoneToday
                              ? 'bg-emerald-500 text-white'
                              : 'border border-neutral-300 bg-white text-transparent dark:border-neutral-700 dark:bg-neutral-800'
                          }`}
                        >
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </button>
                        <span
                          className={`truncate font-medium ${
                            isDoneToday ? 'line-through text-neutral-400' : 'text-neutral-800 dark:text-neutral-200'
                          }`}
                        >
                          {habit.name}
                        </span>
                      </div>

                      <span className="flex items-center gap-1 text-[11px] font-bold text-orange-600 dark:text-orange-400">
                        <Flame className="h-3 w-3" />
                        {habit.currentStreak}d
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Project Routines Widget */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Rotinas dos Projetos ({completedTodayRoutines.length}/{todayProjectRoutines.length})
                </h2>
              </div>
              <button
                onClick={() => setActiveTab('projects')}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                <span>Ver Projetos</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {todayProjectRoutines.length === 0 ? (
                <p className="py-6 text-center text-xs text-neutral-400">
                  Nenhuma rotina recorrente de projeto agendada para hoje.
                </p>
              ) : (
                todayProjectRoutines.map((routine) => {
                  const isDone = isRoutineCompletedOnDate(routine, todayStr);
                  return (
                    <div
                      key={routine.id}
                      className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/50 p-2.5 text-xs dark:border-neutral-800 dark:bg-neutral-800/30 transition-all"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <button
                          onClick={() => toggleProjectRoutine(routine.projectId, routine.id, todayStr)}
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors ${
                            isDone
                              ? 'bg-emerald-500 text-white'
                              : 'border border-neutral-300 bg-white text-transparent hover:border-indigo-400 dark:border-neutral-700 dark:bg-neutral-800'
                          }`}
                          title={isDone ? 'Concluída hoje' : 'Marcar como concluída hoje'}
                        >
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </button>
                        <div className="truncate">
                          <div className="flex items-center gap-1.5 truncate">
                            <span
                              className="rounded-md px-1.5 py-0.2 text-[9px] font-extrabold uppercase shrink-0 border"
                              style={{
                                backgroundColor: `${routine.projectColor}20`,
                                borderColor: `${routine.projectColor}50`,
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
                          <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                            {routine.preferredTime || 'Horário flexível'} • Rotina {routine.frequency === 'daily' ? 'Diária' : 'Periódica'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedProjectId(routine.projectId);
                          setActiveTab('projects');
                        }}
                        className="p-1 text-neutral-400 hover:text-indigo-600 rounded-md shrink-0 transition-colors"
                        title="Abrir no Projeto"
                      >
                        <FolderKanban className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Customize Widgets Modal */}
      {isWidgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Personalizar Widgets do Dashboard
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              Escolha quais seções deseja visualizar na sua tela inicial:
            </p>

            <div className="mt-4 space-y-2.5">
              {[
                { key: 'metrics', label: 'Cards de Indicadores de Produtividade' },
                { key: 'smartPriorities', label: 'Prioridades Inteligentes & Análise de IA' },
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
                    className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 p-3 text-xs font-medium dark:border-neutral-800 dark:bg-neutral-800"
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
              className="mt-5 w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              Salvar Preferências
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
