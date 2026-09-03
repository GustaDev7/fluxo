import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CalendarRange,
  Target,
  DollarSign,
  FileText,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const MonthlyPlanView: React.FC = () => {
  const {
    monthlyPlan,
    updateMonthlyObjective,
    addMonthlyObjective,
    deleteMonthlyObjective,
    toggleFinanceStatus,
    addFinanceCommitment,
    deleteFinanceCommitment,
    updateFocusNotes,
  } = useApp();

  const [newObjTitle, setNewObjTitle] = useState('');
  const [newObjCategory, setNewObjCategory] = useState('Profissional');

  const [newFinanceTitle, setNewFinanceTitle] = useState('');
  const [newFinanceAmount, setNewFinanceAmount] = useState('');
  const [newFinanceDay, setNewFinanceDay] = useState(10);
  const [newFinanceType, setNewFinanceType] = useState<'expense' | 'income'>('expense');

  const completedObjs = monthlyPlan.objectives.filter((o) => o.completed).length;

  const totalExpenses = monthlyPlan.finances
    .filter((f) => f.type === 'expense')
    .reduce((acc, f) => acc + f.amount, 0);

  const totalPaid = monthlyPlan.finances
    .filter((f) => f.type === 'expense' && f.status === 'paid')
    .reduce((acc, f) => acc + f.amount, 0);

  const totalPending = totalExpenses - totalPaid;

  const handleAddObjective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObjTitle.trim()) return;
    addMonthlyObjective({
      title: newObjTitle.trim(),
      category: newObjCategory,
    });
    setNewObjTitle('');
  };

  const handleAddFinance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFinanceTitle.trim() || !newFinanceAmount) return;
    addFinanceCommitment({
      title: newFinanceTitle.trim(),
      amount: parseFloat(newFinanceAmount) || 0,
      dueDay: newFinanceDay,
      type: newFinanceType,
    });
    setNewFinanceTitle('');
    setNewFinanceAmount('');
  };

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarRange className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
              Planejamento Mensal — {monthlyPlan.month}
            </h1>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Defina metas estratégicas, compromissos financeiros e prioridades globais para este mês.
          </p>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            Objetivos Concluídos
          </span>
          <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {completedObjs} de {monthlyPlan.objectives.length}
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full"
              style={{
                width: `${
                  monthlyPlan.objectives.length > 0
                    ? (completedObjs / monthlyPlan.objectives.length) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            Total a Pagar no Mês
          </span>
          <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-[11px] text-neutral-400">
            {monthlyPlan.finances.length} compromissos financeiros
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            Contas Pagas / Pendentes
          </span>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-[11px] text-rose-500 font-medium">
            R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} pendente
          </p>
        </div>
      </div>

      {/* Main Grid: Objectives & Finances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pillar 1: Monthly Objectives */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Grandes Objetivos do Mês
              </h2>
            </div>
            <span className="text-xs font-semibold text-neutral-400">
              {completedObjs}/{monthlyPlan.objectives.length}
            </span>
          </div>

          {/* Objectives List */}
          <div className="space-y-2.5">
            {monthlyPlan.objectives.map((obj) => (
              <div
                key={obj.id}
                className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/60 p-3 text-xs dark:border-neutral-800 dark:bg-neutral-800/40"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateMonthlyObjective(obj.id, { completed: !obj.completed })}
                    className="text-neutral-400 hover:text-emerald-500"
                  >
                    {obj.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>
                  <div>
                    <p
                      className={`font-bold ${
                        obj.completed
                          ? 'line-through text-neutral-400'
                          : 'text-neutral-900 dark:text-neutral-100'
                      }`}
                    >
                      {obj.title}
                    </p>
                    <span className="text-[10px] text-neutral-400 font-medium">
                      Categoria: {obj.category}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => deleteMonthlyObjective(obj.id)}
                  className="text-neutral-400 hover:text-rose-500 p-1"
                  title="Remover objetivo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Objective Form */}
          <form onSubmit={handleAddObjective} className="flex gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <input
              type="text"
              value={newObjTitle}
              onChange={(e) => setNewObjTitle(e.target.value)}
              placeholder="+ Novo objetivo mensal..."
              className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs outline-none focus:border-indigo-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
            />
            <select
              value={newObjCategory}
              onChange={(e) => setNewObjCategory(e.target.value)}
              className="rounded-xl border border-neutral-200 bg-neutral-50 px-2 py-2 text-xs font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300"
            >
              <option value="Profissional">Profissional</option>
              <option value="Financeiro">Financeiro</option>
              <option value="Saúde">Saúde</option>
              <option value="Pessoal">Pessoal</option>
            </select>
            <button
              type="submit"
              disabled={!newObjTitle.trim()}
              className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-40"
            >
              Adicionar
            </button>
          </form>
        </div>

        {/* Pillar 2: Financial Commitments */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Compromissos Financeiros do Mês
              </h2>
            </div>
            <span className="text-xs font-semibold text-neutral-400">
              {monthlyPlan.finances.filter((f) => f.status === 'paid').length}/
              {monthlyPlan.finances.length} pagos
            </span>
          </div>

          {/* Finances List */}
          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {monthlyPlan.finances.map((fin) => (
              <div
                key={fin.id}
                className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/60 p-3 text-xs dark:border-neutral-800 dark:bg-neutral-800/40"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleFinanceStatus(fin.id)}
                    className="text-neutral-400 hover:text-emerald-500"
                  >
                    {fin.status === 'paid' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>
                  <div>
                    <p
                      className={`font-bold ${
                        fin.status === 'paid'
                          ? 'line-through text-neutral-400'
                          : 'text-neutral-900 dark:text-neutral-100'
                      }`}
                    >
                      {fin.title}
                    </p>
                    <span className="text-[10px] text-neutral-400 font-medium">
                      Vencimento: dia {fin.dueDay}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                    R$ {fin.amount.toFixed(2)}
                  </span>
                  <button
                    onClick={() => deleteFinanceCommitment(fin.id)}
                    className="text-neutral-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Financial Item Form */}
          <form onSubmit={handleAddFinance} className="flex flex-wrap gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <input
              type="text"
              value={newFinanceTitle}
              onChange={(e) => setNewFinanceTitle(e.target.value)}
              placeholder="Ex: Aluguel, Servidor Cloud..."
              className="flex-1 min-w-[140px] rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs outline-none focus:border-indigo-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
            />
            <input
              type="number"
              step="0.01"
              value={newFinanceAmount}
              onChange={(e) => setNewFinanceAmount(e.target.value)}
              placeholder="R$ Valor"
              className="w-24 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs outline-none focus:border-indigo-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
            />
            <input
              type="number"
              min="1"
              max="31"
              value={newFinanceDay}
              onChange={(e) => setNewFinanceDay(parseInt(e.target.value, 10) || 1)}
              title="Dia de vencimento"
              className="w-16 rounded-xl border border-neutral-200 bg-neutral-50 px-2 py-2 text-xs outline-none focus:border-indigo-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
            />
            <button
              type="submit"
              disabled={!newFinanceTitle.trim() || !newFinanceAmount}
              className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-40"
            >
              Adicionar
            </button>
          </form>
        </div>
      </div>

      {/* Pillar 3: Focus Notes & Strategy */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-3">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-3 dark:border-neutral-800">
          <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Notas de Foco, Estratégia e Aprendizados do Mês
          </h2>
        </div>

        <textarea
          rows={4}
          value={monthlyPlan.focusNotes}
          onChange={(e) => updateFocusNotes(e.target.value)}
          placeholder="Anote aqui reflexões sobre o mês: O que foi bem? O que precisa melhorar? Quais os principais marcos?"
          className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50/60 p-3.5 text-xs text-neutral-800 outline-none focus:border-indigo-500 focus:bg-white dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-neutral-200 dark:focus:bg-neutral-900 leading-relaxed"
        />
      </div>
    </div>
  );
};
