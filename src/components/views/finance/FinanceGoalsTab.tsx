import React, { useState } from 'react';
import { useFinance } from '../../../context/FinanceContext';
import { formatBRL } from '../../../utils/financeUtils';
import { FinancialGoalItem } from '../../../types/finance';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  TrendingUp,
  X,
  ListTodo,
  Sparkles,
} from 'lucide-react';

export const FinanceGoalsTab: React.FC = () => {
  const {
    goals,
    accounts,
    addFinancialGoal,
    contributeToGoal,
    generateTaskForGoal,
  } = useFinance();

  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTargetAmount, setNewTargetAmount] = useState('');
  const [newCurrentAmount, setNewCurrentAmount] = useState('0');
  const [newDeadline, setNewDeadline] = useState('2027-12-31');
  const [newMonthlyContribution, setNewMonthlyContribution] = useState('');
  const [newColor, setNewColor] = useState('#3B82F6');

  // Modal contribute to goal
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = parseFloat(newTargetAmount.replace(',', '.')) || 0;
    const currentNum = parseFloat(newCurrentAmount.replace(',', '.')) || 0;
    const monthlyNum = parseFloat(newMonthlyContribution.replace(',', '.')) || 0;

    if (!newTitle || !targetNum) return;

    addFinancialGoal({
      title: newTitle,
      targetAmount: targetNum,
      currentAmount: currentNum,
      deadline: newDeadline,
      monthlyContribution: monthlyNum,
      masterCategory: 'metas',
      color: newColor,
    });

    setIsAddGoalOpen(false);
    setNewTitle('');
    setNewTargetAmount('');
    setNewMonthlyContribution('');
  };

  const handleContribute = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(contributeAmount.replace(',', '.')) || 0;
    if (!contributeGoalId || !amountVal) return;

    contributeToGoal(contributeGoalId, amountVal, selectedAccountId);
    setContributeGoalId(null);
    setContributeAmount('');
  };

  const totalGoalsTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const totalGoalsAccumulated = goals.reduce((acc, g) => acc + g.currentAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            Metas Financeiras Conectadas
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Acumulado:{' '}
            <strong className="text-emerald-600 dark:text-emerald-400">
              {formatBRL(totalGoalsAccumulated)}
            </strong>{' '}
            de {formatBRL(totalGoalsTarget)}
          </p>
        </div>

        <button
          onClick={() => setIsAddGoalOpen(true)}
          className="flex items-center gap-1.5 rounded-2xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Meta</span>
        </button>
      </div>

      {/* New Goal Modal */}
      {isAddGoalOpen && (
        <form
          onSubmit={handleCreateGoal}
          className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-lg dark:border-neutral-800 dark:bg-neutral-900 space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
            <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Cadastrar Meta Financeira
            </span>
            <button
              type="button"
              onClick={() => setIsAddGoalOpen(false)}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                Título da Meta
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Carro Próprio, Viagem..."
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                Valor Total Alvo (R$)
              </label>
              <input
                type="text"
                required
                value={newTargetAmount}
                onChange={(e) => setNewTargetAmount(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                Aporte Mensal Alvo (R$)
              </label>
              <input
                type="text"
                value={newMonthlyContribution}
                onChange={(e) => setNewMonthlyContribution(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                Prazo Estimado
              </label>
              <input
                type="date"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddGoalOpen(false)}
              className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-amber-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
            >
              Salvar Meta
            </button>
          </div>
        </form>
      )}

      {/* Contribute Modal */}
      {contributeGoalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleContribute}
            className="w-full max-w-sm rounded-3xl border border-neutral-200 bg-white p-5 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 space-y-4 animate-in fade-in"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                Aporte em Meta Financeira
              </span>
              <button
                type="button"
                onClick={() => setContributeGoalId(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                Valor do Aporte (R$)
              </label>
              <input
                type="text"
                required
                value={contributeAmount}
                onChange={(e) => setContributeAmount(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-base font-bold text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                Debitar da Conta
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} (R$ {a.balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setContributeGoalId(null)}
                className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
              >
                Confirmar Aporte
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {goals.map((goal) => {
          const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

          return (
            <div
              key={goal.id}
              className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-white font-bold text-xs shadow-sm"
                      style={{ backgroundColor: goal.color }}
                    >
                      <Target className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        {goal.title}
                      </h4>
                      <p className="text-[10px] text-neutral-400">
                        Prazo: {goal.deadline}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Numbers */}
                <div className="grid grid-cols-2 gap-2 bg-neutral-50 dark:bg-neutral-800/40 p-3 rounded-2xl mb-4">
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Acumulado</span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      {formatBRL(goal.currentAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Meta Final</span>
                    <span className="text-sm font-black text-neutral-900 dark:text-neutral-100">
                      {formatBRL(goal.targetAmount)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-neutral-500">Concluído</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">{progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${progress}%`, backgroundColor: goal.color }}
                    />
                  </div>
                </div>

                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Aporte recomendado: <strong>{formatBRL(goal.monthlyContribution)}/mês</strong>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => generateTaskForGoal(goal)}
                  title="Criar tarefa mensal de aporte no Fluxo"
                  className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  <ListTodo className="h-3.5 w-3.5" />
                  <span>Gerar Tarefa</span>
                </button>

                <button
                  onClick={() => {
                    setContributeGoalId(goal.id);
                    setContributeAmount(goal.monthlyContribution.toString());
                  }}
                  className="rounded-xl bg-neutral-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 transition-colors shadow-sm"
                >
                  Aportar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
