import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Target,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { Goal } from '../../types';
import { formatDatePT } from '../../utils/date';

export const GoalsView: React.FC = () => {
  const {
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    incrementGoalProgress,
  } = useApp();

  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Profissional');
  const [targetValue, setTargetValue] = useState(10);
  const [unit, setUnit] = useState('unidades');
  const [period, setPeriod] = useState<Goal['period']>('monthly');
  const [deadline, setDeadline] = useState('');

  const filteredGoals = goals.filter((g) => {
    if (periodFilter !== 'all' && g.period !== periodFilter) return false;
    return true;
  });

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addGoal({
      title: title.trim(),
      category,
      targetValue,
      unit,
      period,
      deadline: deadline || undefined,
      currentValue: 0,
    });

    setTitle('');
    setIsNewGoalModalOpen(false);
  };

  const periodLabels: Record<Goal['period'], string> = {
    daily: 'Diária',
    weekly: 'Semanal',
    monthly: 'Mensal',
    quarterly: 'Trimestral',
    annual: 'Anual',
    yearly: 'Anual',
  };

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Target className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
              Metas & Objetivos
            </h1>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Acompanhe indicadores-chave com metas numéricas mensuráveis e prazos estabelecidos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Filter */}
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
          >
            <option value="all">Todos os Períodos</option>
            <option value="weekly">Semanais</option>
            <option value="monthly">Mensais</option>
            <option value="quarterly">Trimestrais</option>
            <option value="annual">Anuais</option>
          </select>

          <button
            onClick={() => setIsNewGoalModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nova Meta</span>
          </button>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGoals.map((goal) => {
          const progressPercent = Math.min(
            100,
            Math.round((goal.currentValue / (goal.targetValue || 1)) * 100)
          );
          const isCompleted = goal.status === 'completed' || goal.currentValue >= goal.targetValue;

          return (
            <div
              key={goal.id}
              className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                    {periodLabels[goal.period]} • {goal.category}
                  </span>

                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="text-neutral-400 hover:text-rose-500 p-1"
                    title="Excluir meta"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <h3 className="mt-3 text-base font-bold text-neutral-900 dark:text-neutral-100">
                  {goal.title}
                </h3>
                {goal.description && (
                  <p className="mt-1 text-xs text-neutral-500 line-clamp-2">{goal.description}</p>
                )}
              </div>

              {/* Progress section */}
              <div className="mt-6 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
                    {goal.currentValue}{' '}
                    <span className="text-xs font-normal text-neutral-500">
                      / {goal.targetValue} {goal.unit}
                    </span>
                  </span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {progressPercent}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCompleted
                        ? 'bg-emerald-500'
                        : 'bg-gradient-to-r from-indigo-500 to-violet-600'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Quick Increment Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => incrementGoalProgress(goal.id, -1)}
                      className="h-7 w-7 rounded-lg border border-neutral-200 bg-neutral-50 text-xs font-bold text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => incrementGoalProgress(goal.id, 1)}
                      className="h-7 w-7 rounded-lg border border-neutral-200 bg-neutral-50 text-xs font-bold text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => incrementGoalProgress(goal.id, 5)}
                      className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs font-bold text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                    >
                      +5
                    </button>
                  </div>

                  {goal.deadline && (
                    <span className="flex items-center gap-1 text-[11px] text-neutral-400">
                      <Calendar className="h-3 w-3" />
                      {formatDatePT(goal.deadline)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Goal Modal */}
      {isNewGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Definir Nova Meta
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              Defina um valor alvo quantificável e um prazo.
            </p>

            <form onSubmit={handleCreateGoal} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Título da Meta
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Ler 12 livros no ano, Faturar 50k..."
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 outline-none focus:border-indigo-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Valor Alvo
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={targetValue}
                    onChange={(e) => setTargetValue(parseInt(e.target.value, 10) || 1)}
                    className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-900 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Unidade
                  </label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Ex: horas, livros, clientes..."
                    className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-900 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Período
                  </label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as Goal['period'])}
                    className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-900 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                  >
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="annual">Anual</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Prazo Final
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-900 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewGoalModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                >
                  Criar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
