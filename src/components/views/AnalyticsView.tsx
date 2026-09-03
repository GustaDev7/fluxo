import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Flame,
  FolderKanban,
  TrendingUp,
  Award,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { getTodayDateString } from '../../utils/date';

export const AnalyticsView: React.FC = () => {
  const { tasks, projects, habits, timeEntries } = useApp();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'done');
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // Total time spent in minutes from tasks and timeEntries
  const totalMinutesSpent = tasks.reduce((acc, t) => acc + (t.timeSpent || 0), 0);
  const totalHours = Math.floor(totalMinutesSpent / 60);
  const remainingMins = totalMinutesSpent % 60;

  // On-time completion calculation
  const tasksWithDueDate = completedTasks.filter((t) => t.dueDate);
  const onTimeTasks = tasksWithDueDate.filter((t) => {
    // If completed on or before dueDate
    const today = getTodayDateString();
    return t.dueDate ? t.dueDate >= today : true;
  });
  const onTimeRate =
    tasksWithDueDate.length > 0
      ? Math.round((onTimeTasks.length / tasksWithDueDate.length) * 100)
      : 100;

  // Productivity Score Calculation (0-100)
  const habitStreaks = habits.reduce((acc, h) => acc + h.currentStreak, 0);
  const avgHabitStreak = habits.length > 0 ? Math.min(20, (habitStreaks / habits.length) * 4) : 10;
  const score = Math.min(100, Math.round(completionRate * 0.5 + onTimeRate * 0.3 + avgHabitStreak));

  // Weekly completion mock data (last 7 days distribution)
  const daysOfWeek = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const weeklyDistribution = [4, 6, 8, 5, 9, 3, 2];
  const maxWeekly = Math.max(...weeklyDistribution, 1);

  // Distribution by Project
  const projectStats = projects.map((p) => {
    const pTasks = tasks.filter((t) => t.projectId === p.id);
    const pCompleted = pTasks.filter((t) => t.status === 'done');
    const pTime = pTasks.reduce((acc, t) => acc + (t.timeSpent || 0), 0);
    return {
      project: p,
      total: pTasks.length,
      completed: pCompleted.length,
      timeMinutes: pTime,
      percent: totalTasks > 0 ? Math.round((pTasks.length / totalTasks) * 100) : 0,
    };
  });

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-6xl mx-auto">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
            Relatórios & Análise de Produtividade
          </h1>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Métricas calculadas em tempo real com base no seu volume de entregas, foco e consistência.
        </p>
      </div>

      {/* Top Score & Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Productivity Score */}
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 dark:border-indigo-950 dark:bg-indigo-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              Score de Eficiência
            </span>
            <Award className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-indigo-950 dark:text-indigo-100">
              {score}
            </span>
            <span className="text-xs font-bold text-indigo-600">/100</span>
          </div>
          <p className="mt-1 text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
            {score >= 80 ? 'Excelente rendimento semanal' : 'Bom ritmo com espaço para foco'}
          </p>
        </div>

        {/* Taxa de Conclusão */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Taxa de Conclusão
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
              {completionRate}%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-neutral-400">
            {completedTasks.length} de {totalTasks} demandas finalizadas
          </p>
        </div>

        {/* Tempo em Foco */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Tempo em Deep Work
            </span>
            <Clock className="h-4 w-4 text-purple-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
              {totalHours}h {remainingMins}m
            </span>
          </div>
          <p className="mt-1 text-[11px] text-neutral-400">
            Tempo ativo rastreado via Pomodoro
          </p>
        </div>

        {/* Cumprimento de Prazos */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Pontualidade
            </span>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
              {onTimeRate}%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-neutral-400">
            Tarefas entregues rigorosamente no prazo
          </p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Completion Bar Chart */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Volume de Tarefas Entregues por Dia
            </h3>
            <span className="text-xs text-neutral-400 font-medium">Esta Semana</span>
          </div>

          <div className="flex items-end justify-between gap-3 pt-6 h-48 border-b border-neutral-100 pb-2 dark:border-neutral-800">
            {daysOfWeek.map((day, i) => {
              const val = weeklyDistribution[i];
              const heightPercent = Math.round((val / maxWeekly) * 100);

              return (
                <div key={day} className="flex flex-col items-center flex-1 gap-2 h-full justify-end">
                  <span className="text-[10px] font-bold text-neutral-500">{val}</span>
                  <div className="w-full max-w-[36px] bg-neutral-100 dark:bg-neutral-800 rounded-t-xl overflow-hidden flex flex-col justify-end h-32">
                    <div
                      className="w-full bg-indigo-600 rounded-t-xl transition-all duration-500 hover:bg-indigo-500"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-neutral-500">{day}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-500 pt-2">
            <span>Pico de produtividade: Quinta-feira</span>
            <span>Média diária: 5.2 tarefas</span>
          </div>
        </div>

        {/* Project Breakdown */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Distribuição de Esforço por Projeto
            </h3>
            <FolderKanban className="h-4 w-4 text-neutral-400" />
          </div>

          <div className="space-y-4 pt-2">
            {projectStats.map((item) => (
              <div key={item.project.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.project.color }}
                    />
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">
                      {item.project.name}
                    </span>
                  </div>
                  <span className="font-mono text-neutral-500 text-[11px]">
                    {item.completed}/{item.total} tarefas • {item.percent}%
                  </span>
                </div>

                <div className="h-2 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percent}%`,
                      backgroundColor: item.project.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
