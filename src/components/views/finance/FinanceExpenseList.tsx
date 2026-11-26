import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Copy, Pencil, Trash2, X } from 'lucide-react';
import { useFinance } from '../../../context/FinanceContext';
import { parseMoneyInput } from '../../../domain/financeLedger';
import type { FinanceTransaction } from '../../../types/finance';
import { formatDatePT, getTodayDateString } from '../../../utils/date';
import { formatBRL, MASTER_CATEGORY_CONFIG } from '../../../utils/financeUtils';

export function FinanceExpenseList({ onClose }: { onClose: () => void }) {
  const { selectedMonth, selectedMonthTransactions, updateTransaction, addTransaction, deleteTransaction } = useFinance();
  const dialog = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState<FinanceTransaction>();
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const query = search.trim().toLocaleLowerCase('pt-BR');
  const expenses = selectedMonthTransactions.filter((entry) => entry.type === 'expense')
    .filter((entry) => !query || [entry.description, entry.subcategory, MASTER_CATEGORY_CONFIG[entry.masterCategory]?.name]
      .some((value) => value?.toLocaleLowerCase('pt-BR').includes(query)))
    .sort((a, b) => b.date.localeCompare(a.date));

  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    const description = String(form.get('description')).trim();
    const amount = parseMoneyInput(String(form.get('amount')));
    const date = String(form.get('date'));
    if (!description || amount === null || !date) {
      setError('Preencha a descrição, a data e um valor válido.');
      return;
    }
    updateTransaction(editing.id, { description, amount, date, subcategory: String(form.get('subcategory')).trim() || undefined });
    setEditing(undefined);
  }

  function duplicate(expense: FinanceTransaction) {
    const today = getTodayDateString();
    addTransaction({
      ...expense,
      date: today.startsWith(selectedMonth) ? today : selectedMonth + '-01',
      linkedBillId: undefined,
      linkedTaskId: undefined,
      isRecurringInstance: false,
      tags: expense.tags?.filter((tag) => tag !== 'conta-paga'),
    });
  }

  return <dialog ref={dialog} onClose={onClose} aria-labelledby="expense-list-title"
    className="fx-panel fixed inset-0 m-auto max-h-[min(85dvh,760px)] w-[calc(100%-1.5rem)] max-w-xl overflow-y-auto text-inherit backdrop:bg-black/65">
    <header className="fx-panel-heading">
      <h2 id="expense-list-title">Despesas do mês</h2>
      <button type="button" aria-label="Fechar despesas" className="rounded-lg p-2 hover:bg-neutral-800" onClick={() => dialog.current?.close()}><X size={18} /></button>
    </header>
    {editing ? <form key={editing.id} onSubmit={save} className="grid gap-3">
      <label className="grid gap-1 text-sm">Descrição<input name="description" required defaultValue={editing.description} className="field-input" /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">Valor (R$)<input name="amount" required inputMode="decimal" defaultValue={String(editing.amount).replace('.', ',')} className="field-input" /></label>
        <label className="grid gap-1 text-sm">Data<input name="date" type="date" required defaultValue={editing.date} className="field-input" /></label>
      </div>
      <label className="grid gap-1 text-sm">Subcategoria<input name="subcategory" defaultValue={editing.subcategory} className="field-input" /></label>
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setEditing(undefined)} className="fx-top-button">Cancelar</button>
        <button type="submit" className="fx-top-button fx-new">Salvar alterações</button>
      </div>
    </form> : <>
      <input aria-label="Buscar despesas" type="search" placeholder="Buscar despesas" value={search}
        onChange={(event) => setSearch(event.target.value)} className="field-input mb-2" />
      {expenses.length ? <ul className="divide-y divide-neutral-800">
      {expenses.map((expense) => <li key={expense.id} className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <strong className="block break-words text-sm">{expense.description}</strong>
          <small className="text-xs text-neutral-400">{[MASTER_CATEGORY_CONFIG[expense.masterCategory]?.name, expense.subcategory, formatDatePT(expense.date)].filter(Boolean).join(' · ')}</small>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <b className="mr-auto">{formatBRL(expense.amount)}</b>
          <button type="button" title="Editar" aria-label={'Editar ' + expense.description} className="rounded-lg p-2 hover:bg-neutral-800"
            onClick={() => { setError(''); setEditing(expense); }}><Pencil size={16} /></button>
          <button type="button" title="Duplicar" aria-label={'Duplicar ' + expense.description} className="rounded-lg p-2 hover:bg-neutral-800" onClick={() => duplicate(expense)}><Copy size={16} /></button>
          <button type="button" title="Excluir" aria-label={'Excluir ' + expense.description} className="rounded-lg p-2 text-rose-300 hover:bg-neutral-800"
            onClick={() => { if (window.confirm('Excluir a despesa “' + expense.description + '”?')) deleteTransaction(expense.id); }}><Trash2 size={16} /></button>
        </div>
      </li>)}
      </ul> : <p className="fx-empty">{query ? 'Nenhuma despesa corresponde à busca.' : 'Nenhuma despesa registrada neste mês.'}</p>}
    </>}
  </dialog>;
}
