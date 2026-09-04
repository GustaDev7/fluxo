import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Flame,
  Plus,
  Trash2,
  Check,
  Calendar,
  Sparkles,
  Trophy,
  Repeat,
  FolderKanban,
  Clock,
} from 'lucide-react';
import { Habit } from '../../types';
import { getTodayDateString, formatDateToYYYYMMDD } from '../../utils/date';
import { isRoutineScheduledForDate, isRoutineCompletedOnDate } from '../../utils/routineUtils';

export const HabitsView: React.FC = () => {
  const {
    habits,
    toggleHabitDay,
    addHabit,
    deleteHabit,
    allProjectRoutines,
    toggleProjectRoutine,
    deleteProjectRoutine,
    setSelectedProjectId,
    setActiveTab,
  } = useApp();

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'routines' | 'habits'>('all');
  const [isNewHabitModalOpen, setIsNewHabitModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Saúde');
  const [color, setColor] = useState('#f97316');
  const [timeOfDay, setTimeOfDay] = useState<Habit['timeOfDay']>('morning');
  const [targetDaysPerWeek, setTargetDaysPerWeek] = useState(7);

  const todayStr = getTodayDateString();

  // Generate last 7 days array
  const last7Days: { dateStr: string; label: string; isToday: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = formatDateToYYYYMMDD(d);
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    last7Days.push({
      dateStr,
      label: dayNames[d.getDay()],
      isToday: dateStr === todayStr,
    });
  }

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addHabit({
      name: name.trim(),
      category,
      color,
      timeOfDay,
      targetDaysPerWeek,
      completedDates: [],
      currentStreak: 0,
      longestStreak: 0,
    });

    setName('');
    setIsNewHabitModalOpen(false);
  };

  const timeOfDayLabels: Record<Habit['timeOfDay'], string> = {
    morning: 'Manhã',
    afternoon: 'Tarde',
    evening: 'Noite',
    night: 'Noite',
    anytime: 'Qualquer hora',
  };

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-500" />
            <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
              Rastreador de Hábitos & Rotinas
            </h1>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Construa consistência diária com registro de ofensivas (streaks) e acompanhamento semanal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center rounded-xl border border-neutral-200 bg-neutral-100/80 p-1 text-xs font-semibold dark:border-neutral-800 dark:bg-neutral-800/80">
            <button
              onClick={() => setActiveCategoryFilter('all')}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                activeCategoryFilter === 'all'
                  ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-900 dark:text-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
              }`}
            >
              Todos ({habits.length + allProjectRoutines.length})
            </button>
            <button
              onClick={() => setActiveCategoryFilter('routines')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all ${
                activeCategoryFilter === 'routines'
                  ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-900 dark:text-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
              }`}
            >
              <Repeat className="h-3 w-3 text-indigo-500" />
              <span>Rotinas de Projetos ({allProjectRoutines.length})</span>
            </button>
            <button
              onClick={() => setActiveCategoryFilter('habits')}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                activeCategoryFilter === 'habits'
                  ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-900 dark:text-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
              }`}
            >
              Hábitos Pessoais ({habits.length})
            </button>
          </div>

          <button
            onClick={() => setIsNewHabitModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Novo Hábito</span>
          </button>
        </div>
      </div>

      {/* Habits Table Card */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        {/* Table Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50/70 p-4 dark:border-neutral-800 dark:bg-neutral-800/50">
          <div className="w-1/2 sm:w-2/5">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Rotina / Hábito & Frequência
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 sm:gap-4 flex-1">
            {last7Days.map((d) => (
              <div
                key={d.dateStr}
                className={`w-7 sm:w-8 text-center text-[11px] font-bold ${
                  d.isToday ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-neutral-400'
                }`}
              >
                {d.label}
              </div>
            ))}
            <div className="w-12 sm:w-16 text-center text-xs font-bold uppercase tracking-wider text-neutral-500">
              Score
            </div>
            <div className="w-12 text-right" />
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {/* Project Routines Section */}
          {(activeCategoryFilter === 'all' || activeCategoryFilter === 'routines') &&
            allProjectRoutines.map((routine) => {
              const weekDoneCount = last7Days.filter((d) =>
                routine.completedDates.includes(d.dateStr)
              ).length;

              return (
                <div
                  key={`routine-${routine.id}`}
                  className="group flex items-center justify-between p-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors bg-indigo-50/15 dark:bg-indigo-950/10"
                >
                  <div className="w-1/2 sm:w-2/5 truncate">
                    <div className="flex items-center gap-1.5 flex-wrap">
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
                      <h3 className="truncate text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        {routine.title}
                      </h3>
                    </div>
                    <p className="mt-0.5 text-[10px] text-neutral-400 truncate flex items-center gap-1">
                      <Repeat className="h-3 w-3 shrink-0 text-indigo-500" />
                      <span>
                        Rotina de Projeto •{' '}
                        {routine.frequency === 'daily'
                          ? 'Diária'
                          : routine.frequency === 'weekly'
                          ? 'Semanal'
                          : routine.frequency === 'biweekly'
                          ? 'Quinzenal'
                          : 'Mensal'}
                        {routine.preferredTime ? ` • ${routine.preferredTime}` : ''}
                      </span>
                    </p>
                  </div>

                  {/* 7 Days Checkboxes */}
                  <div className="flex items-center justify-end gap-2 sm:gap-4 flex-1">
                    {last7Days.map((d) => {
                      const isDone = isRoutineCompletedOnDate(routine, d.dateStr);
                      const isScheduled = isRoutineScheduledForDate(routine, d.dateStr);

                      return (
                        <button
                          key={d.dateStr}
                          onClick={() => toggleProjectRoutine(routine.projectId, routine.id, d.dateStr)}
                          className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl transition-all ${
                            isDone
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : isScheduled
                              ? 'border-2 border-indigo-300 bg-white hover:border-indigo-500 dark:border-indigo-800 dark:bg-neutral-800'
                              : 'border border-neutral-200/60 bg-neutral-50/50 hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900'
                          }`}
                          title={`[${routine.projectName}] ${routine.title} - ${d.label} (${
                            isDone ? 'Concluído' : isScheduled ? 'Agendado para hoje' : 'Não agendado'
                          })`}
                        >
                          {isDone ? (
                            <Check className="h-4 w-4 stroke-[3]" />
                          ) : isScheduled ? (
                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                          ) : null}
                        </button>
                      );
                    })}

                    {/* Streak / Count */}
                    <div className="w-12 sm:w-16 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-xs text-indigo-600 dark:text-indigo-400">
                        <Check className="h-3.5 w-3.5" />
                        {weekDoneCount}/7
                      </span>
                    </div>

                    {/* Actions: Open Project & Delete */}
                    <div className="w-12 flex items-center justify-end gap-1 text-right">
                      <button
                        onClick={() => {
                          setSelectedProjectId(routine.projectId);
                          setActiveTab('projects');
                        }}
                        className="text-neutral-400 hover:text-indigo-600 p-1 transition-colors"
                        title="Ver no Projeto"
                      >
                        <FolderKanban className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteProjectRoutine(routine.projectId, routine.id)}
                        className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-rose-500 p-1 transition-opacity"
                        title="Excluir rotina"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

          {/* Standard Habits */}
          {(activeCategoryFilter === 'all' || activeCategoryFilter === 'habits') &&
            habits.map((habit) => {
              return (
                <div
                  key={habit.id}
                  className="group flex items-center justify-between p-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                >
                  <div className="w-1/2 sm:w-2/5 truncate">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: habit.color }}
                      />
                      <h3 className="truncate text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        {habit.name}
                      </h3>
                    </div>
                    <p className="mt-0.5 text-[10px] text-neutral-400 truncate pl-4.5">
                      {habit.category} • {timeOfDayLabels[habit.timeOfDay]} • {habit.targetDaysPerWeek}x/sem
                    </p>
                  </div>

                  {/* 7 Days Checkboxes */}
                  <div className="flex items-center justify-end gap-2 sm:gap-4 flex-1">
                    {last7Days.map((d) => {
                      const isDone = habit.completedDates.includes(d.dateStr);
                      return (
                        <button
                          key={d.dateStr}
                          onClick={() => toggleHabitDay(habit.id, d.dateStr)}
                          className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl transition-all ${
                            isDone
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'border border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600'
                          }`}
                          title={`${d.label}: ${isDone ? 'Concluído' : 'Pendente'}`}
                        >
                          {isDone && <Check className="h-4 w-4 stroke-[3]" />}
                        </button>
                      );
                    })}

                    {/* Streak count */}
                    <div className="w-12 sm:w-16 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-xs text-orange-600 dark:text-orange-400">
                        <Flame className="h-3.5 w-3.5" />
                        {habit.currentStreak}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="w-12 text-right">
                      <button
                        onClick={() => deleteHabit(habit.id)}
                        className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-rose-500 p-1 transition-opacity"
                        title="Excluir hábito"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* New Habit Modal */}
      {isNewHabitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Criar Novo Hábito
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              Rotinas repetitivas ajudam a formar disciplina diária.
            </p>

            <form onSubmit={handleCreateHabit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Nome do Hábito
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Beber 2L de água, Meditação 10m..."
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 outline-none focus:border-indigo-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-900 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                  >
                    <option value="Saúde">Saúde</option>
                    <option value="Produtividade">Produtividade</option>
                    <option value="Mentalidade">Mentalidade</option>
                    <option value="Estudos">Estudos</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Período do Dia
                  </label>
                  <select
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-900 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                  >
                    <option value="morning">Manhã</option>
                    <option value="afternoon">Tarde</option>
                    <option value="night">Noite</option>
                    <option value="anytime">Qualquer hora</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewHabitModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                >
                  Salvar Hábito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
