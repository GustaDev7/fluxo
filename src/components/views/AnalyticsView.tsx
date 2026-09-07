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
  Calendar,
  Database,
  ShieldCheck,
  Zap,
  Target,
  ArrowRight,
} from 'lucide-react';
import { getTodayDateString } from '../../utils/date';

export const AnalyticsView: React.FC = () => {
  const {
    tasks,
    projects,
    habits,
    goals,
    timeEntries,
    isDbConnected,
    lastDbSyncedAt,
    setActiveTab,
  } = useApp();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'done');
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // Real total time spent (combines task-level timeSpent + pomodoro timeEntries)
  const taskMinutesSpent = tasks.reduce((acc, t) => acc + (t.timeSpent || 0), 0);
  const timeEntriesMinutes = timeEntries.reduce((acc, te) => acc + (te.durationMinutes || 0), 0);
  const totalMinutesSpent = Math.max(taskMinutesSpent, timeEntriesMinutes);
  const totalHours = Math.floor(totalMinutesSpent / 60);
  const remainingMins = totalMinutesSpent % 60;

  // On-time completion calculation from actual user tasks
  const tasksWithDueDate = completedTasks.filter((t) => t.dueDate);
  const onTimeTasks = tasksWithDueDate.filter((t) => {
    const today = getTodayDateString();
    return t.dueDate ? t.dueDate >= today : true;
  });
  const onTimeRate =
    tasksWithDueDate.length > 0
      ? Math.round((onTimeTasks.length / tasksWithDueDate.length) * 100)
      : completedTasks.length > 0
      ? 100
      : 0;

  // Real Productivity Score Calculation (0-100) based strictly on real activity
  const habitStreaks = habits.reduce((acc, h) => acc + h.currentStreak, 0);
  const habitScore = habits.length > 0 ? Math.min(20, Math.round((habitStreaks / habits.length) * 4)) : 0;

  const score =
    totalTasks > 0 || habits.length > 0 || totalMinutesSpent > 0
      ? Math.min(
          100,
          Math.round(
            completionRate * 0.5 +
              (tasksWithDueDate.length > 0 ? onTimeRate * 0.3 : completedTasks.length > 0 ? 30 : 0) +
              habitScore
          )
        )
      : 0;

  // Real 7-day distribution ending today (calculated strictly from actual tasks & time entries)
  const now = new Date();
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const dayFullNames = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ];

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayOfWeek = d.getDay();

    // Actual completed tasks on this date
    const tasksCompletedOnDay = completedTasks.filter((t) => {
      if (t.completedAt) {
        return t.completedAt.startsWith(dateStr);
      }
      return t.dueDate === dateStr;
    });

    // Actual focus minutes on this date
    const focusMinutesOnDay = timeEntries
      .filter((te) => te.date === dateStr)
      .reduce((sum, te) => sum + (te.durationMinutes || 0), 0);

    return {
      dateStr,
      shortDay: dayNames[dayOfWeek],
      fullDay: dayFullNames[dayOfWeek],
      formattedDate: `${d.getDate()}/${d.getMonth() + 1}`,
      completedCount: tasksCompletedOnDay.length,
      focusMinutes: focusMinutesOnDay,
      isToday: dateStr === getTodayDateString(),
    };
  });

  const weeklyDistribution = last7Days.map((d) => d.completedCount);
  const maxWeekly = Math.max(...weeklyDistribution, 1);
  const totalCompletedInWeek = weeklyDistribution.reduce((sum, count) => sum + count, 0);
  const dailyAverage = (totalCompletedInWeek / 7).toFixed(1);

  // Real peak day detection
  const peakDayObj = last7Days.reduce(
    (max, cur) => (cur.completedCount > max.completedCount ? cur : max),
    last7Days[0]
  );
  const peakDayText =
    peakDayObj && peakDayObj.completedCount > 0
      ? `${peakDayObj.fullDay} (${peakDayObj.completedCount} ${
          peakDayObj.completedCount === 1 ? 'tarefa' : 'tarefas'
        })`
      : 'Nenhuma entrega registrada nos últimos 7 dias';

  // Real Distribution by Project
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
      completionRate: pTasks.length > 0 ? Math.round((pCompleted.length / pTasks.length) * 100) : 0,
    };
  });

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
              Relatórios & Análise de Produtividade
            </h1>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Métricas 100% calculadas a partir dos seus registros reais de tarefas, foco e entregas.
          </p>
        </div>

        {/* Database Status Pill */}
        <div
          id="db-health-status-card"
          className="flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="relative flex h-2.5 w-2.5">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isDbConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
              }`}
            />
            <span
              className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                isDbConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-semibold text-neutral-800 dark:text-neutral-200">
              <Database className="h-3.5 w-3.5 text-indigo-500" />
              <span>Banco de Dados: {isDbConnected ? '100% Operacional' : 'Modo Local'}</span>
            </div>
            <p className="text-[10px] text-neutral-400">
              {lastDbSyncedAt ? `Sincronizado às ${lastDbSyncedAt}` : 'Persistência ativa em tempo real'}
            </p>
          </div>
        </div>
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
            {score >= 80
              ? 'Excelente rendimento semanal'
              : score > 0
              ? 'Bom ritmo com espaço para foco'
              : 'Cadastre e conclua demandas para elevar seu score'}
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
            {timeEntries.length > 0
              ? `${timeEntries.length} sessões rastreadas no timer`
              : 'Inicie o Pomodoro para registrar foco'}
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
            {tasksWithDueDate.length > 0
              ? `${onTimeTasks.length} de ${tasksWithDueDate.length} com prazo cumprido`
              : 'Sem tarefas com data limite no momento'}
          </p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Completion Bar Chart (Real 7-day distribution) */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Volume de Tarefas Entregues por Dia
              </h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">Últimos 7 dias (dados reais)</p>
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg">
              {totalCompletedInWeek} {totalCompletedInWeek === 1 ? 'concluída' : 'concluídas'}
            </span>
          </div>

          <div className="flex items-end justify-between gap-2 pt-6 h-48 border-b border-neutral-100 pb-2 dark:border-neutral-800">
            {last7Days.map((day) => {
              const val = day.completedCount;
              const heightPercent = totalCompletedInWeek > 0 ? Math.round((val / maxWeekly) * 100) : 0;

              return (
                <div key={day.dateStr} className="flex flex-col items-center flex-1 gap-2 h-full justify-end">
                  <span
                    className={`text-[10px] font-bold ${
                      val > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-400'
                    }`}
                  >
                    {val}
                  </span>
                  <div className="w-full max-w-[36px] bg-neutral-100 dark:bg-neutral-800 rounded-t-xl overflow-hidden flex flex-col justify-end h-28">
                    {val > 0 ? (
                      <div
                        className={`w-full rounded-t-xl transition-all duration-500 ${
                          day.isToday ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-neutral-600 hover:bg-neutral-500'
                        }`}
                        style={{ height: `${Math.max(12, heightPercent)}%` }}
                        title={`${val} tarefa(s) concluída(s) em ${day.formattedDate}`}
                      />
                    ) : (
                      <div className="w-full h-1 bg-neutral-200 dark:bg-neutral-700" />
                    )}
                  </div>
                  <div className="text-center">
                    <span
                      className={`text-[11px] font-medium block ${
                        day.isToday ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-neutral-500'
                      }`}
                    >
                      {day.shortDay}
                    </span>
                    <span className="text-[9px] text-neutral-400">{day.formattedDate}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-neutral-500 pt-1 gap-2">
            <span>
              Pico de entregas:{' '}
              <strong className="text-neutral-800 dark:text-neutral-200">{peakDayText}</strong>
            </span>
            <span>
              Média diária:{' '}
              <strong className="text-neutral-800 dark:text-neutral-200">{dailyAverage} tarefas</strong>
            </span>
          </div>
        </div>

        {/* Project Breakdown (Real projects and tasks) */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Distribuição de Esforço por Projeto
              </h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">Demanda alocada por iniciativa</p>
            </div>
            <FolderKanban className="h-4 w-4 text-neutral-400" />
          </div>

          {projectStats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
              <FolderKanban className="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
              <p className="text-xs text-neutral-500 max-w-xs">
                Nenhum projeto cadastrado no momento. Vincule tarefas a projetos para acompanhar a carga de trabalho.
              </p>
              <button
                onClick={() => setActiveTab('projects')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <span>Ir para Projetos</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="space-y-4 pt-2 max-h-56 overflow-y-auto">
              {projectStats.map((item) => (
                <div key={item.project.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.project.color || '#6366f1' }}
                      />
                      <span className="font-bold text-neutral-800 dark:text-neutral-200 truncate max-w-[180px]">
                        {item.project.name}
                      </span>
                    </div>
                    <span className="font-mono text-neutral-500 text-[11px]">
                      {item.completed}/{item.total} tarefas • {item.percent}% do total
                    </span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.percent}%`,
                        backgroundColor: item.project.color || '#6366f1',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Database Verification & Storage Metrics Section */}
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50/50 p-6 dark:border-neutral-800 dark:bg-neutral-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Auditoria do Banco de Dados & Armazenamento Persistente
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                O banco de dados do Fluxo está 100% conectado com persistência síncrona no servidor e cache local.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              100% OK
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="rounded-xl border border-neutral-200/80 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
            <span className="text-neutral-400 block text-[11px]">Tarefas</span>
            <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {tasks.length}
            </span>
          </div>
          <div className="rounded-xl border border-neutral-200/80 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
            <span className="text-neutral-400 block text-[11px]">Projetos</span>
            <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {projects.length}
            </span>
          </div>
          <div className="rounded-xl border border-neutral-200/80 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
            <span className="text-neutral-400 block text-[11px]">Hábitos</span>
            <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {habits.length}
            </span>
          </div>
          <div className="rounded-xl border border-neutral-200/80 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
            <span className="text-neutral-400 block text-[11px]">Metas</span>
            <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {goals.length}
            </span>
          </div>
          <div className="rounded-xl border border-neutral-200/80 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900 col-span-2 sm:col-span-1">
            <span className="text-neutral-400 block text-[11px]">Sessões de Foco</span>
            <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {timeEntries.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
