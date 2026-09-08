import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowDownUp, BarChart3, CalendarDays, CheckCircle2, CircleDollarSign, Copy, History, LayoutGrid, Lightbulb, List, MoreHorizontal, Pencil, Plus, ReceiptText, Save, Search, Settings, Sparkles, Table2, Target, Trash2, Wand2, X } from 'lucide-react';
import { useFinance } from '../../../context/FinanceContext';
import { BudgetCategory, BudgetIncomeSource, CreditCard, FinanceAccount, FinanceTransaction, MasterCategory, ZeroBasedBudget } from '../../../types/finance';
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
  const { budget, updateBudgetPlan, transactions, monthlyClosingHistory, accounts, creditCards, openTransactionModal, addTransaction, updateTransaction, deleteTransaction } = useFinance();
  const [draft, setDraft] = useState<ZeroBasedBudget>(() => ({ ...budget,
    incomeSources: budget.incomeSources?.length ? budget.incomeSources : [newIncome()],
    categories: budget.categories?.length ? budget.categories : initialCategories(budget),
    viewMode: budget.viewMode || 'cards', advancedMode: budget.advancedMode || false,
  }));
  const [editing, setEditing] = useState(false);
  const [suggestion, setSuggestion] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>();
  const result = useMemo(() => calculateBudget(draft), [draft]);

  const actual = useMemo(() => {
    const values: Record<string, number> = {};
    transactions.filter((tx) => tx.date.startsWith(draft.month) && ['expense', 'investment', 'debt_payment'].includes(tx.type))
      .forEach((tx) => { values[tx.masterCategory] = (values[tx.masterCategory] || 0) + tx.amount; });
    return values;
  }, [transactions, draft.month]);
  const actualTotal = useMemo(() => Object.values(actual).reduce<number>((sum, value) => sum + Number(value), 0), [actual]);
  const monthlyEvolution = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' });
    const rows = monthlyClosingHistory.slice(-11).map((closing) => ({
      month: closing.month,
      label: formatter.format(new Date(`${closing.month}-01T00:00:00Z`)).replace('.', ''),
      planned: closing.totalIncome,
      actual: closing.totalExpenses + closing.totalInvested + closing.debtsPaid,
    }));
    const current = { month: draft.month, label: formatter.format(new Date(`${draft.month}-01T00:00:00Z`)).replace('.', ''), planned: result.totalAllocated, actual: actualTotal };
    return [...rows.filter((row) => row.month !== draft.month), current].slice(-12);
  }, [monthlyClosingHistory, draft.month, result.totalAllocated, actualTotal]);

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
  const donutBackground = useMemo(() => {
    if (result.totalAllocated <= 0) return 'conic-gradient(#262626 0 100%)';
    let cursor = 0;
    const segments = roots.map((category) => {
      const start = cursor;
      cursor += category.plannedAmount / result.totalAllocated * 100;
      return `${category.color} ${start}% ${cursor}%`;
    });
    return `conic-gradient(${segments.join(',')})`;
  }, [result.totalAllocated, roots]);
  const statusText = result.status === 'balanced' ? 'Orçamento equilibrado' : result.status === 'under'
    ? `${formatBRL(result.balance)} não alocados` : `${formatBRL(Math.abs(result.balance))} acima da renda`;

  return <div className="space-y-5">
    <section>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-2xl font-black">Orçamento Base Zero</h2><span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-bold text-indigo-500">Cada real com seu destino</span></div><p className="mt-1 text-sm text-neutral-500">Planeje e ajuste seu orçamento. A renda prevista deve ser totalmente alocada.</p></div>
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 dark:border-neutral-700 dark:bg-neutral-900"><CalendarDays className="h-4 w-4 text-neutral-500"/><input aria-label="Mês" type="month" value={draft.month} onChange={(e) => setDraft({ ...draft, month: e.target.value })} className="bg-transparent py-2.5 text-xs font-bold outline-none"/></label>
          <button onClick={() => editing ? save() : setEditing(true)} className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-bold dark:border-neutral-700 dark:bg-neutral-900">{editing ? <Save className="h-4 w-4"/> : <Settings className="h-4 w-4"/>}{editing ? 'Salvar orçamento' : 'Configurações'}</button>
          <button onClick={() => setSuggestion(true)} className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-bold dark:border-neutral-700 dark:bg-neutral-900"><MoreHorizontal className="h-4 w-4"/>Mais opções</button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-[repeat(3,minmax(0,1fr))_1.15fr]">
        {[
          ['Renda mensal prevista', formatBRL(result.plannedIncome), '100% da renda será alocada', CircleDollarSign, 'text-emerald-500 bg-emerald-500/10'],
          ['Total alocado', formatBRL(result.totalAllocated), `${Number(result.percentageAllocated).toFixed(2).replace('.', ',')}% da renda distribuída`, BarChart3, 'text-blue-500 bg-blue-500/10'],
          ['Saldo não alocado', formatBRL(Math.abs(result.balance)), statusText, CheckCircle2, result.status === 'balanced' ? 'text-emerald-500 bg-emerald-500/10' : 'text-amber-500 bg-amber-500/10'],
        ].map(([label, value, detail, Icon, color]) => { const MetricIcon = Icon as typeof CircleDollarSign; return <div key={label as string} className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"><div className="flex items-start gap-3"><span className={`rounded-xl p-2.5 ${color}`}><MetricIcon className="h-5 w-5"/></span><div><span className="text-xs text-neutral-500">{label as string}</span><strong className="mt-1 block text-xl">{value as string}</strong><span className="text-xs text-neutral-500">{detail as string}</span></div></div></div>; })}
        <div className={`flex items-start gap-3 rounded-2xl border p-4 ${result.status === 'balanced' ? 'border-emerald-500/40 bg-emerald-500/5' : result.status === 'under' ? 'border-amber-500/40 bg-amber-500/5' : 'border-rose-500/40 bg-rose-500/5'}`}>{result.status === 'balanced' ? <Lightbulb className="h-5 w-5 shrink-0 text-amber-400"/> : <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500"/>}<div><strong className="text-sm">{result.status === 'balanced' ? 'Orçamento equilibrado!' : result.status === 'under' ? 'Ainda há renda para distribuir' : 'Orçamento acima da renda'}</strong><p className="mt-1 text-xs leading-relaxed text-neutral-500">{result.status === 'balanced' ? 'Sua renda está 100% alocada. Continue acompanhando os valores realizados.' : statusText}</p></div></div>
      </div>
    </section>

    {editing && <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between"><div><h3 className="text-sm font-black">Fontes de renda</h3><p className="text-xs text-neutral-500">Previsto e recebido ficam separados.</p></div>{editing && <button onClick={() => setDraft({ ...draft, incomeSources: [...(draft.incomeSources || []), newIncome('Nova renda')] })} className="flex items-center gap-1 text-xs font-bold text-indigo-600"><Plus className="h-4 w-4"/>Adicionar</button>}</div>
      <div className="mt-4 space-y-2">{draft.incomeSources?.map((item) => <div key={item.id} className="grid grid-cols-[1fr_105px_105px_auto] gap-2 rounded-xl bg-neutral-50 p-2 dark:bg-neutral-800/40">
        <input disabled={!editing} value={item.name} onChange={(e) => setDraft({ ...draft, incomeSources: draft.incomeSources?.map((s) => s.id === item.id ? { ...s, name: e.target.value } : s) })} className="min-w-0 bg-transparent px-2 text-xs font-bold disabled:opacity-100"/>
        <input disabled={!editing} aria-label="Previsto" title="Previsto" type="number" min="0" step="0.01" value={item.plannedAmount} onChange={(e) => setDraft({ ...draft, incomeSources: draft.incomeSources?.map((s) => s.id === item.id ? { ...s, plannedAmount: Number(e.target.value) } : s) })} className="rounded-lg border border-neutral-200 bg-white px-2 text-xs dark:border-neutral-700 dark:bg-neutral-900"/>
        <input disabled={!editing} aria-label="Recebido" title="Recebido" type="number" min="0" step="0.01" value={item.receivedAmount} onChange={(e) => setDraft({ ...draft, incomeSources: draft.incomeSources?.map((s) => s.id === item.id ? { ...s, receivedAmount: Number(e.target.value) } : s) })} className="rounded-lg border border-neutral-200 bg-white px-2 text-xs dark:border-neutral-700 dark:bg-neutral-900"/>
        {editing && <button aria-label="Excluir fonte" onClick={() => setDraft({ ...draft, incomeSources: draft.incomeSources?.filter((s) => s.id !== item.id) })}><Trash2 className="h-4 w-4 text-neutral-400"/></button>}
      </div>)}</div>
    </section>}

    <nav className="flex gap-1 overflow-x-auto border-b border-neutral-200 dark:border-neutral-800" aria-label="Áreas do orçamento">
      {[
        ['Visão geral', BarChart3], ['Categorias', LayoutGrid], ['Análises', Target],
        ['Histórico', History], ['Cenários', Wand2], ['Metas', Target], ['Configurações', Settings],
      ].map(([label, Icon], index) => <button key={label as string} className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-xs font-bold ${index === 0 ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-neutral-500'}`}><Icon className="h-4 w-4"/>{label as string}</button>)}
    </nav>

    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
    <section>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-base font-black">Categorias</h3><p className="text-xs text-neutral-500">Gerencie quanto da renda será destinado a cada área.</p></div><div className="flex items-center gap-2"><div className="flex rounded-xl border border-neutral-200 p-1 dark:border-neutral-800">{([['cards', LayoutGrid], ['list', List], ['table', Table2]] as const).map(([mode, Icon]) => <button key={mode} aria-label={mode} onClick={() => setDraft({ ...draft, viewMode: mode })} className={`rounded-lg p-2 ${draft.viewMode === mode ? 'bg-indigo-600 text-white' : 'text-neutral-400'}`}><Icon className="h-4 w-4"/></button>)}</div><button onClick={() => { setEditing(true); setDraft({ ...draft, categories: [...(draft.categories || []), { id: crypto.randomUUID(), name: 'Nova categoria', color: '#6366f1', allocationMode: 'fixed', percentage: '0', fixedAmount: 0, plannedAmount: 0, priority: roots.length + 1, archived: false }] }); }} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white"><Plus className="h-4 w-4"/>Nova categoria</button></div></div>
      <div className={draft.viewMode === 'cards' ? 'grid gap-3 md:grid-cols-2 2xl:grid-cols-3' : 'space-y-2'}>{roots.map((category) => {
        const spent = category.masterCategory ? actual[category.masterCategory] || 0 : 0;
        const remaining = category.plannedAmount - spent;
        const execution = category.plannedAmount > 0 ? spent / category.plannedAmount * 100 : 0;
        const categoryTransactions = category.masterCategory ? transactions.filter((tx) => tx.type === 'expense' && tx.masterCategory === category.masterCategory && tx.date.startsWith(draft.month)) : [];
        const state = execution > 100 ? 'Excedido' : execution >= 90 ? 'Próximo do limite' : execution >= 75 ? 'Atenção' : 'Normal';
        return <article key={category.id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex justify-between gap-2"><div className="flex min-w-0 items-center gap-2"><span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: category.color }}/><input disabled={!editing} value={category.name} onChange={(e) => updateCategory(category.id, { name: e.target.value })} className="min-w-0 bg-transparent text-sm font-black disabled:opacity-100"/></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${execution > 100 ? 'bg-rose-500/10 text-rose-500' : execution >= 75 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{state}</span>{editing && <button aria-label="Arquivar" onClick={() => updateCategory(category.id, { archived: true })}><Trash2 className="h-4 w-4 text-neutral-400"/></button>}</div>
          {editing && <div className="mt-3 grid grid-cols-3 gap-2"><select value={category.allocationMode} onChange={(e) => updateCategory(category.id, { allocationMode: e.target.value as BudgetCategory['allocationMode'] })} className="rounded-lg border border-neutral-200 bg-white px-2 text-xs dark:border-neutral-700 dark:bg-neutral-900"><option value="percentage">Percentual</option><option value="fixed">Valor fixo</option><option value="unbudgeted">Sem orçamento</option></select><input aria-label="Percentual" disabled={category.allocationMode !== 'percentage'} type="number" step="0.01" value={category.percentage} onChange={(e) => updateCategory(category.id, { percentage: e.target.value })} className="rounded-lg border border-neutral-200 px-2 text-xs disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-900"/><input aria-label="Valor" disabled={category.allocationMode !== 'fixed'} type="number" step="0.01" value={category.fixedAmount} onChange={(e) => updateCategory(category.id, { fixedAmount: Number(e.target.value) })} className="rounded-lg border border-neutral-200 px-2 text-xs disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-900"/></div>}
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs"><div><span className="text-neutral-400">Orçamento</span><b className="block">{formatBRL(category.plannedAmount)}</b></div><div><span className="text-neutral-400">Gasto</span><b className="block">{formatBRL(spent)}</b></div><div><span className="text-neutral-400">{remaining >= 0 ? 'Disponível' : 'Excedente'}</span><b className={remaining < 0 ? 'block text-rose-600' : 'block'}>{formatBRL(Math.abs(remaining))}</b></div></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"><div className={`h-full rounded-full ${execution > 100 ? 'bg-rose-500' : execution >= 80 ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(execution, 100)}%` }}/></div><div className="mt-2 flex justify-between text-[10px] text-neutral-400"><span>{Number(category.percentage).toFixed(2).replace('.', ',')}% da renda</span><span>{execution.toFixed(0)}% executado</span></div>
          <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800"><span className="flex items-center gap-1.5 text-[11px] text-neutral-500"><ReceiptText className="h-3.5 w-3.5"/>{categoryTransactions.length} {categoryTransactions.length === 1 ? 'despesa' : 'despesas'}</span><div className="flex gap-2"><button disabled={!category.masterCategory} onClick={() => category.masterCategory && openTransactionModal('expense', category.masterCategory)} className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-bold text-white disabled:opacity-40">+ Adicionar gasto</button><button disabled={!category.masterCategory} onClick={() => setSelectedCategoryId(category.id)} className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[11px] font-bold dark:border-neutral-700 disabled:opacity-40">Ver despesas</button></div></div>
        </article>;
      })}</div>
      {editing && <button onClick={() => setDraft({ ...draft, categories: [...(draft.categories || []), { id: crypto.randomUUID(), name: 'Nova categoria', color: '#6366f1', allocationMode: 'fixed', percentage: '0', fixedAmount: 0, plannedAmount: 0, priority: roots.length + 1, archived: false }] })} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 py-3 text-xs font-bold dark:border-neutral-700"><Plus className="h-4 w-4"/>Nova categoria</button>}
      <BudgetEvolution rows={monthlyEvolution}/>
    </section>

    <aside className="space-y-3 xl:sticky xl:top-4">
      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="text-sm font-black">Distribuição da renda</h3>
        <div className="mt-4 flex items-center gap-5">
          <div className="relative h-32 w-32 shrink-0 rounded-full" style={{ background: donutBackground }}><div className="absolute inset-5 grid place-items-center rounded-full bg-white text-center dark:bg-neutral-900"><span><b className="block text-sm">{formatBRL(result.totalAllocated)}</b><small className="text-[10px] text-neutral-500">alocados</small></span></div></div>
          <div className="min-w-0 flex-1 space-y-2">{roots.map((category) => <div key={category.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-[11px]"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }}/><span className="truncate text-neutral-500">{category.name}</span><b>{Number(category.percentage).toFixed(1).replace('.', ',')}%</b></div>)}</div>
        </div>
      </section>
      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="text-sm font-black">Planejado x realizado</h3>
        <div className="mt-4 space-y-4">
          <div><div className="flex justify-between text-xs"><span className="text-neutral-500">Planejado</span><b>{formatBRL(result.totalAllocated)}</b></div><div className="mt-2 h-2 rounded-full bg-neutral-100 dark:bg-neutral-800"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(Number(result.percentageAllocated), 100)}%` }}/></div></div>
          <div><div className="flex justify-between text-xs"><span className="text-neutral-500">Realizado</span><b>{formatBRL(actualTotal)}</b></div><div className="mt-2 h-2 rounded-full bg-neutral-100 dark:bg-neutral-800"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${result.totalAllocated > 0 ? Math.min(actualTotal / result.totalAllocated * 100, 100) : 0}%` }}/></div></div>
        </div>
      </section>
      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"><h3 className="text-sm font-black">Ações rápidas</h3><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => setEditing(true)} className="rounded-xl border border-neutral-200 p-2 text-left text-[11px] font-bold dark:border-neutral-700">Ajustar percentuais</button><button onClick={() => setSuggestion(true)} className="rounded-xl border border-neutral-200 p-2 text-left text-[11px] font-bold dark:border-neutral-700">Equilibrar automaticamente</button><button onClick={() => { setDraft({ ...budget, month: draft.month, incomeSources: budget.incomeSources?.length ? budget.incomeSources : [newIncome()], categories: budget.categories?.length ? budget.categories : initialCategories(budget), viewMode: draft.viewMode }); setEditing(true); }} className="rounded-xl border border-neutral-200 p-2 text-left text-[11px] font-bold dark:border-neutral-700">Importar orçamento salvo</button><button onClick={save} className="rounded-xl border border-neutral-200 p-2 text-left text-[11px] font-bold dark:border-neutral-700">Salvar como modelo atual</button></div></section>
      <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/20"><div className="flex gap-3"><Lightbulb className="h-5 w-5 shrink-0 text-indigo-500"/><div><h3 className="text-sm font-black">Dica do orçamento</h3><p className="mt-1 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">Revise suas categorias mensalmente. As sugestões orientam, mas a decisão final é sempre sua.</p></div></div></section>
    </aside>
    </div>

    {suggestion && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><div className="w-full max-w-md rounded-3xl bg-white p-6 dark:bg-neutral-900"><Sparkles className="h-6 w-6 text-indigo-600"/><h3 className="mt-3 text-lg font-black">Prévia do padrão AUVP</h3><p className="text-sm text-neutral-500">Sugestão personalizável. Nada muda sem confirmação.</p><div className="mt-4 space-y-2">{AUVP.map(([key, pct]) => <div key={key} className="flex justify-between text-sm"><span>{MASTER_CATEGORY_CONFIG[key].name}</span><b>{pct}% · {formatBRL(result.plannedIncome * Number(pct) / 100)}</b></div>)}</div><div className="mt-5 flex gap-2"><button onClick={() => setSuggestion(false)} className="flex-1 rounded-xl border py-2 text-xs font-bold">Cancelar</button><button onClick={applyAuvp} className="flex-1 rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white">Aplicar sugestão</button></div></div></div>}
    {selectedCategoryId && <BudgetCategoryDetail
      category={roots.find((item) => item.id === selectedCategoryId)} month={draft.month}
      transactions={transactions} accounts={accounts} creditCards={creditCards}
      onClose={() => setSelectedCategoryId(undefined)}
      onAdd={(category) => openTransactionModal('expense', category)}
      onDuplicate={(tx) => addTransaction({ ...tx, date: new Date().toISOString().slice(0, 10) })}
      onUpdate={updateTransaction} onDelete={deleteTransaction}
    />}
  </div>;
};

const BudgetCategoryDetail = ({ category, month, transactions, accounts, creditCards, onClose, onAdd, onDuplicate, onUpdate, onDelete }: {
  category?: BudgetCategory; month: string; transactions: FinanceTransaction[]; accounts: FinanceAccount[]; creditCards: CreditCard[];
  onClose: () => void; onAdd: (category: MasterCategory) => void; onDuplicate: (transaction: Omit<FinanceTransaction, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<FinanceTransaction>) => void; onDelete: (id: string) => void;
}) => {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'recent' | 'highest' | 'lowest'>('recent');
  const [editing, setEditing] = useState<FinanceTransaction>();
  if (!category?.masterCategory) return null;
  const rows = transactions.filter((tx) => tx.type === 'expense' && tx.masterCategory === category.masterCategory && tx.date.startsWith(month) && [tx.description, tx.subcategory, String(tx.amount)].some((value) => value?.toLowerCase().includes(search.toLowerCase()))).sort((a, b) => sort === 'highest' ? b.amount - a.amount : sort === 'lowest' ? a.amount - b.amount : b.date.localeCompare(a.date));
  const spent = rows.reduce((sum, tx) => sum + tx.amount, 0);
  const allSpent = transactions.filter((tx) => tx.type === 'expense' && tx.masterCategory === category.masterCategory && tx.date.startsWith(month)).reduce((sum, tx) => sum + tx.amount, 0);
  const available = category.plannedAmount - allSpent;
  const subcategories = Object.entries(rows.reduce<Record<string, number>>((totals, tx) => { const key = tx.subcategory || 'Sem subcategoria'; totals[key] = (totals[key] || 0) + tx.amount; return totals; }, {})).sort((a, b) => b[1] - a[1]);
  return <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"><section className="flex h-full w-full max-w-2xl flex-col bg-neutral-50 shadow-2xl dark:bg-neutral-950">
    <header className="border-b border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 sm:p-6"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><span className="h-4 w-4 rounded-full" style={{ backgroundColor: category.color }}/><div><h2 className="text-xl font-black">{category.name}</h2><p className="text-xs text-neutral-500">Detalhamento de {new Date(`${month}-01T00:00:00Z`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</p></div></div><button aria-label="Fechar" onClick={onClose} className="rounded-xl p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="h-5 w-5"/></button></div>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{[['Orçamento', category.plannedAmount], ['Gasto', allSpent], [available >= 0 ? 'Disponível' : 'Excedente', Math.abs(available)], ['Lançamentos', transactions.filter((tx) => tx.type === 'expense' && tx.masterCategory === category.masterCategory && tx.date.startsWith(month)).length]].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-neutral-100 p-3 dark:bg-neutral-800"><span className="text-[10px] uppercase tracking-wide text-neutral-500">{label}</span><b className={`mt-1 block text-sm ${label === 'Excedente' ? 'text-rose-500' : ''}`}>{label === 'Lançamentos' ? value : formatBRL(Number(value))}</b></div>)}</div>
    </header>
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row"><label className="flex flex-1 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 dark:border-neutral-800 dark:bg-neutral-900"><Search className="h-4 w-4 text-neutral-400"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar despesas..." className="w-full bg-transparent py-2.5 text-sm outline-none"/></label><label className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 dark:border-neutral-800 dark:bg-neutral-900"><ArrowDownUp className="h-4 w-4 text-neutral-400"/><select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="bg-transparent py-2.5 text-xs font-bold outline-none"><option value="recent">Mais recentes</option><option value="highest">Maior valor</option><option value="lowest">Menor valor</option></select></label></div>
      {subcategories.length > 0 && <div className="mt-4 flex gap-2 overflow-x-auto pb-1">{subcategories.map(([name, total]) => <span key={name} className="shrink-0 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] dark:border-neutral-800 dark:bg-neutral-900">{name} <b className="ml-1">{formatBRL(total)}</b></span>)}</div>}
      <div className="mt-4 space-y-2">{rows.map((tx) => <article key={tx.id} className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">{editing?.id === tx.id ? <div className="grid gap-2 sm:grid-cols-2"><input value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="rounded-lg border p-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"/><input type="number" min="0.01" step="0.01" value={editing.amount} onChange={(e) => setEditing({ ...editing, amount: Number(e.target.value) })} className="rounded-lg border p-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"/><input type="date" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} className="rounded-lg border p-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"/><input value={editing.subcategory || ''} onChange={(e) => setEditing({ ...editing, subcategory: e.target.value })} placeholder="Subcategoria" className="rounded-lg border p-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"/><div className="flex gap-2 sm:col-span-2"><button onClick={() => { onUpdate(tx.id, editing); setEditing(undefined); }} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white">Salvar alterações</button><button onClick={() => setEditing(undefined)} className="rounded-lg border px-3 py-2 text-xs font-bold dark:border-neutral-700">Cancelar</button></div></div> : <div className="flex items-center justify-between gap-3"><div className="min-w-0"><b className="block truncate text-sm">{tx.description}</b><span className="text-xs text-neutral-500">{new Date(`${tx.date}T00:00:00`).toLocaleDateString('pt-BR')} · {tx.subcategory || 'Sem subcategoria'} · {accounts.find((item) => item.id === tx.accountId)?.name || creditCards.find((item) => item.id === tx.cardId)?.name || 'Sem conta'}</span></div><div className="shrink-0 text-right"><b className="block text-sm">{formatBRL(tx.amount)}</b><div className="mt-1 flex justify-end gap-1"><button aria-label="Editar" onClick={() => setEditing({ ...tx })} className="rounded-lg p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"><Pencil className="h-3.5 w-3.5"/></button><button aria-label="Duplicar" onClick={() => { const { id: _id, ...copy } = tx; onDuplicate(copy); }} className="rounded-lg p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"><Copy className="h-3.5 w-3.5"/></button><button aria-label="Excluir" onClick={() => window.confirm('Excluir este lançamento? Esta ação atualizará os totais do orçamento.') && onDelete(tx.id)} className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-500/10"><Trash2 className="h-3.5 w-3.5"/></button></div></div></div>}</article>)}{rows.length === 0 && <div className="rounded-2xl border border-dashed border-neutral-300 py-12 text-center dark:border-neutral-700"><ReceiptText className="mx-auto h-6 w-6 text-neutral-400"/><p className="mt-2 text-sm font-bold">Nenhuma despesa encontrada</p><p className="text-xs text-neutral-500">Registre o primeiro gasto desta categoria.</p></div>}</div>
      {search && <p className="mt-3 text-right text-xs text-neutral-500">Total filtrado: <b>{formatBRL(spent)}</b></p>}
    </div>
    <footer className="border-t border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"><button onClick={() => onAdd(category.masterCategory!)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white"><Plus className="h-4 w-4"/>Adicionar gasto em {category.name}</button></footer>
  </section></div>;
};

const BudgetEvolution = ({ rows }: { rows: Array<{ month: string; label: string; planned: number; actual: number }> }) => {
  const max = Math.max(1, ...rows.flatMap((row) => [row.planned, row.actual]));
  return <section className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="text-sm font-black">Evolução mensal</h3><p className="mt-1 text-xs text-neutral-500">Planejado e realizado com base nos fechamentos e lançamentos registrados.</p></div><div className="flex gap-4 text-xs"><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-indigo-500"/>Planejado</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-400"/>Realizado</span></div></div>
    {rows.length ? <div className="mt-5 flex h-48 items-end gap-2 overflow-x-auto border-b border-neutral-200 pb-1 dark:border-neutral-800">{rows.map((row) => <div key={row.month} className="flex h-full min-w-12 flex-1 flex-col items-center justify-end"><div className="flex h-[155px] w-full max-w-12 items-end justify-center gap-1"><div className="w-3 rounded-t bg-indigo-500" style={{ height: `${Math.max(2, row.planned / max * 100)}%` }} title={`Planejado: ${formatBRL(row.planned)}`}/><div className="w-3 rounded-t bg-emerald-400" style={{ height: `${Math.max(2, row.actual / max * 100)}%` }} title={`Realizado: ${formatBRL(row.actual)}`}/></div><span className="mt-2 text-[11px] capitalize text-neutral-500">{row.label}</span></div>)}</div> : <p className="py-12 text-center text-sm text-neutral-500">Ainda não há dados mensais para exibir.</p>}
  </section>;
};
