import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, LayoutGrid, List, Plus, Save, Sparkles, Table2, Trash2 } from 'lucide-react';
import { useFinance } from '../../../context/FinanceContext';
import { BudgetCategory, BudgetIncomeSource, MasterCategory, ZeroBasedBudget } from '../../../types/finance';
import { calculateBudget, resolveCategory } from '../../../domain/budgetEngine';
import { MASTER_CATEGORY_CONFIG, formatBRL } from '../../../utils/financeUtils';

const AUVP: Array<[MasterCategory, string]> = [
  ['custos_fixos', '40'], ['conforto', '13.5'], ['metas', '11.3'], ['prazeres', '5'],
  ['liberdade_financeira', '24.5'], ['conhecimento', '5.7'],
];

function initialCategories(budget: ZeroBasedBudget): BudgetCategory[] {
  return AUVP.map(([key, percentage], index) => ({
    id: crypto.randomUUID(), masterCategory: key, name: MASTER_CATEGORY_CONFIG[key].name,
    description: MASTER_CATEGORY_CONFIG[key].description, color: MASTER_CATEGORY_CONFIG[key].color,
    allocationMode: budget.allocations[key] > 0 ? 'fixed' : 'percentage', percentage,
    fixedAmount: budget.allocations[key], plannedAmount: budget.allocations[key], priority: index + 1, archived: false,
  }));
}

const newIncome = (name = 'Salário'): BudgetIncomeSource => ({
  id: crypto.randomUUID(), name, type: name === 'Salário' ? 'salary' : 'other',
  plannedAmount: 0, receivedAmount: 0, recurring: true,
});

export const FinanceBudgetTab: React.FC = () => {
  const { budget, updateBudgetPlan, transactions } = useFinance();
  const [draft, setDraft] = useState<ZeroBasedBudget>(() => ({ ...budget,
    incomeSources: budget.incomeSources?.length ? budget.incomeSources : [newIncome()],
    categories: budget.categories?.length ? budget.categories : initialCategories(budget),
    viewMode: budget.viewMode || 'cards', advancedMode: budget.advancedMode || false,
  }));
  const [editing, setEditing] = useState(false);
  const [suggestion, setSuggestion] = useState(false);
  const result = useMemo(() => calculateBudget(draft), [draft]);

  const actual = useMemo(() => {
    const values: Record<string, number> = {};
    transactions.filter((tx) => tx.date.startsWith(draft.month) && ['expense', 'investment', 'debt_payment'].includes(tx.type))
      .forEach((tx) => { values[tx.masterCategory] = (values[tx.masterCategory] || 0) + tx.amount; });
    return values;
  }, [transactions, draft.month]);

  const updateCategory = (id: string, patch: Partial<BudgetCategory>) => setDraft((current) => {
    const income = calculateBudget(current).plannedIncome;
    return { ...current, categories: current.categories?.map((item) =>
      item.id === id ? resolveCategory({ ...item, ...patch }, income) : item) };
  });

  const save = () => {
    const calculated = calculateBudget(draft);
    const allocations = { ...draft.allocations };
    calculated.categories.forEach((category) => {
      if (category.masterCategory && !category.parentId) allocations[category.masterCategory] = category.plannedAmount;
    });
    const next = { ...draft, plannedIncome: calculated.plannedIncome, allocations, categories: calculated.categories };
    setDraft(next); updateBudgetPlan(next); setEditing(false);
  };

  const applyAuvp = () => {
    const percentages = new Map(AUVP);
    setDraft((current) => ({ ...current, categories: current.categories?.map((category) => {
      const percentage = category.masterCategory ? percentages.get(category.masterCategory) : undefined;
      return percentage ? resolveCategory({ ...category, allocationMode: 'percentage', percentage }, result.plannedIncome) : category;
    }) }));
    setSuggestion(false); setEditing(true);
  };

  const roots = result.categories.filter((category) => !category.parentId && !category.archived).sort((a, b) => a.priority - b.priority);
  const statusText = result.status === 'balanced' ? 'Orçamento equilibrado' : result.status === 'under'
    ? `${formatBRL(result.balance)} não alocados` : `${formatBRL(Math.abs(result.balance))} acima da renda`;

  return <div className="space-y-5">
    <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[.18em] text-indigo-600">Planejamento mensal</p><h2 className="mt-1 text-xl font-black">Orçamento Base Zero</h2><p className="mt-1 text-xs text-neutral-500">O sistema calcula e orienta. Você decide.</p></div>
        <div className="flex flex-wrap gap-2">
          <input aria-label="Mês" type="month" value={draft.month} onChange={(e) => setDraft({ ...draft, month: e.target.value })} className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-bold dark:border-neutral-700 dark:bg-neutral-800"/>
          <button onClick={() => setSuggestion(true)} className="flex items-center gap-2 rounded-xl border border-indigo-200 px-3 py-2 text-xs font-bold text-indigo-700 dark:border-indigo-800 dark:text-indigo-300"><Sparkles className="h-4 w-4"/>Padrão AUVP</button>
          <button onClick={() => editing ? save() : setEditing(true)} className="flex items-center gap-2 rounded-xl bg-neutral-950 px-4 py-2 text-xs font-bold text-white dark:bg-white dark:text-neutral-950">{editing && <Save className="h-4 w-4"/>}{editing ? 'Salvar orçamento' : 'Editar orçamento'}</button>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Renda prevista', formatBRL(result.plannedIncome), 'Base do planejamento'],
          ['Renda recebida', formatBRL(result.receivedIncome), `Impacto ${formatBRL(result.receivedIncome - result.plannedIncome)}`],
          ['Total alocado', formatBRL(result.totalAllocated), `${Number(result.percentageAllocated).toFixed(2).replace('.', ',')}% distribuídos`],
          ['Situação', formatBRL(Math.abs(result.balance)), statusText],
        ].map(([label, value, detail], index) => <div key={label} className={`rounded-2xl border p-4 ${index === 3 ? result.status === 'balanced' ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20' : result.status === 'under' ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/20' : 'border-rose-200 bg-rose-50 dark:bg-rose-950/20' : 'border-neutral-100 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/40'}`}><span className="text-xs text-neutral-500">{label}</span><div className="mt-1 text-xl font-black">{value}</div><div className="mt-1 flex items-center gap-1 text-[11px] text-neutral-500">{index === 3 && (result.status === 'balanced' ? <CheckCircle2 className="h-3.5 w-3.5"/> : <AlertTriangle className="h-3.5 w-3.5"/>)}{detail}</div></div>)}
      </div>
    </section>

    <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between"><div><h3 className="text-sm font-black">Fontes de renda</h3><p className="text-xs text-neutral-500">Previsto e recebido ficam separados.</p></div>{editing && <button onClick={() => setDraft({ ...draft, incomeSources: [...(draft.incomeSources || []), newIncome('Nova renda')] })} className="flex items-center gap-1 text-xs font-bold text-indigo-600"><Plus className="h-4 w-4"/>Adicionar</button>}</div>
      <div className="mt-4 space-y-2">{draft.incomeSources?.map((item) => <div key={item.id} className="grid grid-cols-[1fr_105px_105px_auto] gap-2 rounded-xl bg-neutral-50 p-2 dark:bg-neutral-800/40">
        <input disabled={!editing} value={item.name} onChange={(e) => setDraft({ ...draft, incomeSources: draft.incomeSources?.map((s) => s.id === item.id ? { ...s, name: e.target.value } : s) })} className="min-w-0 bg-transparent px-2 text-xs font-bold disabled:opacity-100"/>
        <input disabled={!editing} aria-label="Previsto" title="Previsto" type="number" min="0" step="0.01" value={item.plannedAmount} onChange={(e) => setDraft({ ...draft, incomeSources: draft.incomeSources?.map((s) => s.id === item.id ? { ...s, plannedAmount: Number(e.target.value) } : s) })} className="rounded-lg border border-neutral-200 bg-white px-2 text-xs dark:border-neutral-700 dark:bg-neutral-900"/>
        <input disabled={!editing} aria-label="Recebido" title="Recebido" type="number" min="0" step="0.01" value={item.receivedAmount} onChange={(e) => setDraft({ ...draft, incomeSources: draft.incomeSources?.map((s) => s.id === item.id ? { ...s, receivedAmount: Number(e.target.value) } : s) })} className="rounded-lg border border-neutral-200 bg-white px-2 text-xs dark:border-neutral-700 dark:bg-neutral-900"/>
        {editing && <button aria-label="Excluir fonte" onClick={() => setDraft({ ...draft, incomeSources: draft.incomeSources?.filter((s) => s.id !== item.id) })}><Trash2 className="h-4 w-4 text-neutral-400"/></button>}
      </div>)}</div>
    </section>

    <section>
      <div className="mb-3 flex items-center justify-between"><div><h3 className="text-sm font-black">Distribuição</h3><p className="text-xs text-neutral-500">Percentual e valor estão conectados.</p></div><div className="flex rounded-xl border border-neutral-200 p-1 dark:border-neutral-800">{([['cards', LayoutGrid], ['list', List], ['table', Table2]] as const).map(([mode, Icon]) => <button key={mode} aria-label={mode} onClick={() => setDraft({ ...draft, viewMode: mode })} className={`rounded-lg p-2 ${draft.viewMode === mode ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'text-neutral-400'}`}><Icon className="h-4 w-4"/></button>)}</div></div>
      <div className={draft.viewMode === 'cards' ? 'grid gap-3 md:grid-cols-2' : 'space-y-2'}>{roots.map((category) => {
        const spent = category.masterCategory ? actual[category.masterCategory] || 0 : 0;
        const remaining = category.plannedAmount - spent;
        const execution = category.plannedAmount > 0 ? spent / category.plannedAmount * 100 : 0;
        return <article key={category.id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex justify-between gap-2"><div className="flex min-w-0 items-center gap-2"><span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: category.color }}/><input disabled={!editing} value={category.name} onChange={(e) => updateCategory(category.id, { name: e.target.value })} className="min-w-0 bg-transparent text-sm font-black disabled:opacity-100"/></div>{editing && <button aria-label="Arquivar" onClick={() => updateCategory(category.id, { archived: true })}><Trash2 className="h-4 w-4 text-neutral-400"/></button>}</div>
          {editing && <div className="mt-3 grid grid-cols-3 gap-2"><select value={category.allocationMode} onChange={(e) => updateCategory(category.id, { allocationMode: e.target.value as BudgetCategory['allocationMode'] })} className="rounded-lg border border-neutral-200 bg-white px-2 text-xs dark:border-neutral-700 dark:bg-neutral-900"><option value="percentage">Percentual</option><option value="fixed">Valor fixo</option><option value="unbudgeted">Sem orçamento</option></select><input aria-label="Percentual" disabled={category.allocationMode !== 'percentage'} type="number" step="0.01" value={category.percentage} onChange={(e) => updateCategory(category.id, { percentage: e.target.value })} className="rounded-lg border border-neutral-200 px-2 text-xs disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-900"/><input aria-label="Valor" disabled={category.allocationMode !== 'fixed'} type="number" step="0.01" value={category.fixedAmount} onChange={(e) => updateCategory(category.id, { fixedAmount: Number(e.target.value) })} className="rounded-lg border border-neutral-200 px-2 text-xs disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-900"/></div>}
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs"><div><span className="text-neutral-400">Planejado</span><b className="block">{formatBRL(category.plannedAmount)}</b></div><div><span className="text-neutral-400">Realizado</span><b className="block">{formatBRL(spent)}</b></div><div><span className="text-neutral-400">{remaining >= 0 ? 'Restante' : 'Excesso'}</span><b className={remaining < 0 ? 'block text-rose-600' : 'block'}>{formatBRL(Math.abs(remaining))}</b></div></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"><div className={`h-full rounded-full ${execution > 100 ? 'bg-rose-500' : execution >= 80 ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(execution, 100)}%` }}/></div><div className="mt-2 flex justify-between text-[10px] text-neutral-400"><span>{Number(category.percentage).toFixed(2).replace('.', ',')}% da renda</span><span>{execution.toFixed(0)}% executado</span></div>
        </article>;
      })}</div>
      {editing && <button onClick={() => setDraft({ ...draft, categories: [...(draft.categories || []), { id: crypto.randomUUID(), name: 'Nova categoria', color: '#6366f1', allocationMode: 'fixed', percentage: '0', fixedAmount: 0, plannedAmount: 0, priority: roots.length + 1, archived: false }] })} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 py-3 text-xs font-bold dark:border-neutral-700"><Plus className="h-4 w-4"/>Nova categoria</button>}
    </section>

    {suggestion && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><div className="w-full max-w-md rounded-3xl bg-white p-6 dark:bg-neutral-900"><Sparkles className="h-6 w-6 text-indigo-600"/><h3 className="mt-3 text-lg font-black">Prévia do padrão AUVP</h3><p className="text-sm text-neutral-500">Sugestão personalizável. Nada muda sem confirmação.</p><div className="mt-4 space-y-2">{AUVP.map(([key, pct]) => <div key={key} className="flex justify-between text-sm"><span>{MASTER_CATEGORY_CONFIG[key].name}</span><b>{pct}% · {formatBRL(result.plannedIncome * Number(pct) / 100)}</b></div>)}</div><div className="mt-5 flex gap-2"><button onClick={() => setSuggestion(false)} className="flex-1 rounded-xl border py-2 text-xs font-bold">Cancelar</button><button onClick={applyAuvp} className="flex-1 rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white">Aplicar sugestão</button></div></div></div>}
  </div>;
};
