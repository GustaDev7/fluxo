import React, { useMemo, useState } from 'react';
import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Edit2,
  History,
  Layers3,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  WalletCards,
  X,
} from 'lucide-react';
import { useFinance } from '../../../context/FinanceContext';
import { FinanceDebt } from '../../../types/finance';
import { formatBRL, formatPercent, getDebtDueDateStatus } from '../../../utils/financeUtils';
import { getTodayDateString } from '../../../utils/date';

type DebtFilter = 'all' | 'open' | 'overdue' | 'paid';
type DetailTab = 'overview' | 'installments' | 'history';
type DebtFormState = {
  creditor: string;
  balance: string;
  totalInstallments: string;
  paidInstallments: string;
  dueDay: string;
  priority: FinanceDebt['priority'];
};

const emptyForm = (): DebtFormState => ({
  creditor: '', balance: '', totalInstallments: '12', paidInstallments: '0', dueDay: '10', priority: 'medium',
});

const moneyValue = (value: string) => Number(value.replace(',', '.')) || 0;
const wholeValue = (value: string) => Math.max(0, Math.trunc(Number(value) || 0));
const installmentAmount = (balance: number, remaining: number) => remaining > 0 ? Math.round((balance / remaining) * 100) / 100 : 0;

const debtStatusLabel = (debt: FinanceDebt) => debt.status === 'paid' ? 'Quitada' : debt.status === 'overdue' ? 'Em atraso' : debt.status === 'suspended' ? 'Pausada' : debt.status === 'renegotiated' ? 'Renegociada' : 'Em andamento';
const debtStatusClass = (debt: FinanceDebt) => debt.status === 'paid' ? 'bg-emerald-500/15 text-emerald-500' : debt.status === 'overdue' ? 'bg-rose-500/15 text-rose-500' : debt.status === 'suspended' ? 'bg-neutral-500/15 text-neutral-500' : 'bg-indigo-500/15 text-indigo-500';

const futureInstallments = (debt: FinanceDebt) => {
  const remaining = Math.max(0, debt.remainingInstallments);
  const standardAmount = installmentAmount(debt.currentBalance, remaining);
  const today = new Date();
  return Array.from({ length: remaining }, (_, index) => {
    const monthOffset = index + (today.getDate() > debt.dueDay ? 1 : 0);
    const dueDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, Math.min(debt.dueDay, 28));
    const amount = index === remaining - 1 ? Math.max(0, Math.round((debt.currentBalance - standardAmount * index) * 100) / 100) : standardAmount;
    return { number: debt.totalInstallments - remaining + index + 1, amount, date: dueDate.toLocaleDateString('pt-BR') };
  });
};

export const FinanceDebtsTab: React.FC = () => {
  const { debts, accounts, monthIncome, addDebt, updateDebt, deleteDebt, payDebtInstallment, addTransaction } = useFinance();
  const [filter, setFilter] = useState<DebtFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedDebtId, setSelectedDebtId] = useState('');
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');
  const [form, setForm] = useState<DebtFormState>(emptyForm);
  const [formMode, setFormMode] = useState<'add' | 'edit' | null>(null);
  const [editingDebtId, setEditingDebtId] = useState<string>();
  const [payingDebt, setPayingDebt] = useState<FinanceDebt>();
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [reducingDebt, setReducingDebt] = useState<FinanceDebt>();
  const [reductionAmount, setReductionAmount] = useState('');
  const [reductionAccountId, setReductionAccountId] = useState('');
  const [deletingDebt, setDeletingDebt] = useState<FinanceDebt>();

  const activeDebts = debts.filter((debt) => !['paid', 'cancelled', 'suspended'].includes(debt.status));
  const overdueDebts = debts.filter((debt) => debt.status === 'overdue');
  const paidDebts = debts.filter((debt) => debt.status === 'paid');
  const totalBalance = activeDebts.reduce((sum, debt) => sum + debt.currentBalance, 0);
  const totalMonthly = activeDebts.reduce((sum, debt) => sum + debt.installmentAmount, 0);
  const commitment = monthIncome > 0 ? totalMonthly / monthIncome * 100 : 0;
  const selectedDebt = debts.find((debt) => debt.id === selectedDebtId) || activeDebts[0] || debts[0];
  const nextDebt = [...activeDebts].sort((a, b) => getDebtDueDateStatus(a.dueDay || 10).daysRemaining - getDebtDueDateStatus(b.dueDay || 10).daysRemaining)[0];

  const visibleDebts = useMemo(() => debts.filter((debt) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || `${debt.name || ''} ${debt.creditor}`.toLowerCase().includes(query);
    const matchesFilter = filter === 'all'
      || (filter === 'open' && !['paid', 'cancelled', 'suspended'].includes(debt.status))
      || (filter === 'overdue' && debt.status === 'overdue')
      || (filter === 'paid' && debt.status === 'paid');
    return matchesSearch && matchesFilter;
  }), [debts, filter, search]);

  const openAdd = () => { setForm(emptyForm()); setEditingDebtId(undefined); setFormMode('add'); };
  const openEdit = (debt: FinanceDebt) => {
    setForm({ creditor: debt.name || debt.creditor, balance: String(debt.currentBalance), totalInstallments: String(debt.totalInstallments), paidInstallments: String(Math.max(0, debt.totalInstallments - debt.remainingInstallments)), dueDay: String(debt.dueDay || 10), priority: debt.priority });
    setEditingDebtId(debt.id); setFormMode('edit');
  };

  const saveDebt = (event: React.FormEvent) => {
    event.preventDefault();
    const balance = moneyValue(form.balance);
    const total = Math.max(1, wholeValue(form.totalInstallments));
    const paid = Math.min(total, wholeValue(form.paidInstallments));
    const remaining = Math.max(0, total - paid);
    const payment = installmentAmount(balance, remaining);
    const dueDay = Math.min(28, Math.max(1, wholeValue(form.dueDay) || 10));
    const creditor = form.creditor.trim();
    if (!creditor || balance <= 0) return;

    if (formMode === 'edit' && editingDebtId) {
      updateDebt(editingDebtId, { name: creditor, creditor, currentBalance: balance, totalInstallments: total, remainingInstallments: remaining, installmentAmount: payment, dueDay, priority: form.priority, interestRateMonthly: 0, amortizationSystem: 'no_interest', status: remaining === 0 || balance === 0 ? 'paid' : 'active' });
    } else {
      addDebt({ name: creditor, creditor, type: 'other', originalAmount: balance, currentBalance: balance, interestRateMonthly: 0, totalInstallments: total, remainingInstallments: remaining, installmentAmount: payment, dueDay, priority: form.priority, status: remaining === 0 ? 'paid' : 'active', amortizationSystem: 'no_interest', interestRegime: 'simple', ratePeriod: 'monthly', rateKind: 'effective' });
    }
    setFormMode(null);
  };

  const confirmPayment = () => { if (!payingDebt) return; payDebtInstallment(payingDebt.id, paymentAccountId || undefined); setPayingDebt(undefined); };
  const confirmReduction = () => {
    if (!reducingDebt) return;
    const amount = moneyValue(reductionAmount);
    if (amount <= 0) return;
    const paidAmount = Math.min(amount, reducingDebt.currentBalance);
    const nextBalance = Math.max(0, reducingDebt.currentBalance - paidAmount);
    const nextRemaining = nextBalance > 0 ? Math.max(1, Math.ceil(nextBalance / Math.max(reducingDebt.installmentAmount, 0.01))) : 0;
    updateDebt(reducingDebt.id, { currentBalance: nextBalance, remainingInstallments: nextRemaining, installmentAmount: installmentAmount(nextBalance, nextRemaining), interestRateMonthly: 0, amortizationSystem: 'no_interest', status: nextBalance === 0 ? 'paid' : 'active' });
    addTransaction({ type: 'debt_payment', amount: paidAmount, date: getTodayDateString(), description: `Abatimento de dívida: ${reducingDebt.name || reducingDebt.creditor}`, masterCategory: 'custos_fixos', subcategory: 'Abatimento de dívida', accountId: reductionAccountId || undefined, tags: ['dívida', 'abatimento'] });
    setReducingDebt(undefined);
  };

  return <div className="space-y-5">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-2xl font-black">Dívidas</h2><p className="mt-1 text-sm text-neutral-500">Acompanhe saldos, parcelas e pagamentos sem complicação.</p></div><button onClick={openAdd} className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white"><Plus className="h-4 w-4" />Nova dívida</button></header>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={Layers3} tone="rose" label="Saldo total" value={formatBRL(totalBalance)} detail={`${activeDebts.length} em andamento`} />
      <Metric icon={CircleDollarSign} tone="indigo" label="Parcelas do mês" value={formatBRL(totalMonthly)} detail={monthIncome > 0 ? `${formatPercent(commitment)} da renda` : 'Renda não informada'} />
      <Metric icon={CheckCircle2} tone="emerald" label="Dívidas quitadas" value={String(paidDebts.length)} detail={paidDebts.length === 1 ? 'dívida concluída' : 'dívidas concluídas'} />
      <Metric icon={Clock3} tone="amber" label="Próximo vencimento" value={nextDebt ? getDebtDueDateStatus(nextDebt.dueDay).formattedDate : '—'} detail={nextDebt ? nextDebt.name || nextDebt.creditor : 'Nenhum vencimento'} />
    </section>

    {monthIncome > 0 && activeDebts.length > 0 && <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"><div className="flex items-center justify-between gap-3 text-sm"><div><b>Comprometimento da renda</b><p className="mt-1 text-xs text-neutral-500">Quanto das suas entradas mensais está reservado para parcelas.</p></div><strong className={commitment > 40 ? 'text-rose-500' : commitment > 25 ? 'text-amber-500' : 'text-emerald-500'}>{formatPercent(commitment)}</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"><div className={`h-full rounded-full ${commitment > 40 ? 'bg-rose-500' : commitment > 25 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(commitment, 100)}%` }} /></div></section>}

    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex gap-1 overflow-x-auto pb-1">{([['all', 'Todas', debts.length], ['open', 'Em andamento', activeDebts.length], ['overdue', 'Em atraso', overdueDebts.length], ['paid', 'Quitadas', paidDebts.length]] as const).map(([id, label, count]) => <button key={id} onClick={() => setFilter(id)} className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold ${filter === id ? 'border border-indigo-500/60 bg-indigo-500/10 text-indigo-500' : 'text-neutral-500'}`}>{label} ({count})</button>)}</div><label className="flex min-w-0 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 dark:border-neutral-800 dark:bg-neutral-900 sm:min-w-72"><Search className="h-4 w-4 text-neutral-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar dívida..." className="w-full min-w-0 bg-transparent py-2.5 text-sm outline-none" /></label></div>

    {debts.length === 0 ? <EmptyDebt onAdd={openAdd} /> : <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_390px]"><div className="min-w-0 space-y-3">{visibleDebts.map((debt) => <div key={debt.id}><DebtRow debt={debt} selected={selectedDebt?.id === debt.id} onClick={() => { setSelectedDebtId(debt.id); setDetailTab('overview'); }} /></div>)}{visibleDebts.length === 0 && <div className="rounded-2xl border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500 dark:border-neutral-700">Nenhuma dívida encontrada.</div>}</div>{selectedDebt && <DebtDetail debt={selectedDebt} tab={detailTab} onTab={setDetailTab} onEdit={() => openEdit(selectedDebt)} onPay={() => { setPayingDebt(selectedDebt); setPaymentAccountId(accounts[0]?.id || ''); }} onReduce={() => { setReducingDebt(selectedDebt); setReductionAmount(''); setReductionAccountId(accounts[0]?.id || ''); }} onDelete={() => setDeletingDebt(selectedDebt)} />}</div>}

    {formMode && <DebtFormModal mode={formMode} form={form} setForm={setForm} onClose={() => setFormMode(null)} onSubmit={saveDebt} />}
    {payingDebt && <ActionModal title="Pagar parcela" description={`${payingDebt.name || payingDebt.creditor} · ${formatBRL(Math.min(payingDebt.installmentAmount, payingDebt.currentBalance))}`} onClose={() => setPayingDebt(undefined)} onConfirm={confirmPayment} confirmLabel="Confirmar pagamento"><AccountSelect accounts={accounts} value={paymentAccountId} onChange={setPaymentAccountId} /></ActionModal>}
    {reducingDebt && <ActionModal title="Abater saldo" description={`Saldo atual: ${formatBRL(reducingDebt.currentBalance)}`} onClose={() => setReducingDebt(undefined)} onConfirm={confirmReduction} confirmLabel="Confirmar abatimento"><label className="block text-sm font-bold">Valor do abatimento<input autoFocus type="number" min="0.01" max={reducingDebt.currentBalance} step="0.01" value={reductionAmount} onChange={(event) => setReductionAmount(event.target.value)} className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-base outline-none focus:border-indigo-500 dark:border-neutral-700 dark:bg-neutral-800" /></label><AccountSelect accounts={accounts} value={reductionAccountId} onChange={setReductionAccountId} /></ActionModal>}
    {deletingDebt && <ActionModal title="Excluir dívida" description={`A dívida “${deletingDebt.name || deletingDebt.creditor}” será removida.`} onClose={() => setDeletingDebt(undefined)} onConfirm={() => { deleteDebt(deletingDebt.id); if (selectedDebtId === deletingDebt.id) setSelectedDebtId(''); setDeletingDebt(undefined); }} confirmLabel="Excluir" destructive />}
  </div>;
};

const Metric = ({ icon: Icon, tone, label, value, detail }: { icon: typeof Layers3; tone: 'rose' | 'indigo' | 'emerald' | 'amber'; label: string; value: string; detail: string }) => {
  const tones = { rose: 'bg-rose-500/15 text-rose-500', indigo: 'bg-indigo-500/15 text-indigo-500', emerald: 'bg-emerald-500/15 text-emerald-500', amber: 'bg-amber-500/15 text-amber-500' };
  return <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"><div className="flex items-start gap-3"><span className={`rounded-xl p-2.5 ${tones[tone]}`}><Icon className="h-5 w-5" /></span><div className="min-w-0"><span className="text-xs text-neutral-500">{label}</span><strong className="mt-1 block truncate text-lg">{value}</strong><span className="text-xs text-neutral-500">{detail}</span></div></div></div>;
};

const DebtRow = ({ debt, selected, onClick }: { debt: FinanceDebt; selected: boolean; onClick: () => void }) => {
  const total = Math.max(1, debt.totalInstallments); const paid = Math.max(0, total - debt.remainingInstallments); const progress = Math.min(100, paid / total * 100); const due = getDebtDueDateStatus(debt.dueDay || 10);
  return <button onClick={onClick} className={`w-full rounded-2xl border bg-white p-4 text-left dark:bg-neutral-900 ${selected ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'border-neutral-200 dark:border-neutral-800'}`}><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-500/10 text-indigo-500"><Banknote className="h-5 w-5" /></span><div className="min-w-0"><strong className="block truncate text-sm">{debt.name || debt.creditor}</strong><span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${debtStatusClass(debt)}`}>{debtStatusLabel(debt)}</span></div></div><ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" /></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><DebtValue label="Saldo" value={formatBRL(debt.currentBalance)} /><DebtValue label="Parcela" value={formatBRL(debt.installmentAmount)} /><DebtValue label="Progresso" value={`${paid} de ${total}`} /><DebtValue label="Vencimento" value={debt.status === 'paid' ? 'Concluída' : due.formattedDate} /></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${progress}%` }} /></div></button>;
};

const DebtValue = ({ label, value }: { label: string; value: string }) => <div><span className="block text-xs text-neutral-500">{label}</span><strong className="mt-0.5 block truncate text-sm">{value}</strong></div>;

const DebtDetail = ({ debt, tab, onTab, onEdit, onPay, onReduce, onDelete }: { debt: FinanceDebt; tab: DetailTab; onTab: (tab: DetailTab) => void; onEdit: () => void; onPay: () => void; onReduce: () => void; onDelete: () => void }) => {
  const total = Math.max(1, debt.totalInstallments); const remaining = Math.max(0, debt.remainingInstallments); const paid = total - remaining; const progress = Math.min(100, paid / total * 100); const due = getDebtDueDateStatus(debt.dueDay || 10); const installments = futureInstallments(debt); const payments = [...(debt.payments || [])].reverse();
  return <aside className="h-fit min-w-0 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 2xl:sticky 2xl:top-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-lg font-black">{debt.name || debt.creditor}</h3><span className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-bold ${debtStatusClass(debt)}`}>{debtStatusLabel(debt)}</span></div><div className="flex gap-1"><button aria-label="Editar dívida" onClick={onEdit} className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"><Edit2 className="h-4 w-4" /></button><button aria-label="Excluir dívida" onClick={onDelete} className="rounded-lg p-2 text-rose-500 hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button></div></div><div className="mt-4 flex border-b border-neutral-200 dark:border-neutral-800">{([['overview', 'Resumo'], ['installments', 'Parcelas'], ['history', 'Histórico']] as const).map(([id, label]) => <button key={id} onClick={() => onTab(id)} className={`flex-1 border-b-2 px-2 py-2.5 text-xs font-bold ${tab === id ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-neutral-500'}`}>{label}</button>)}</div>
    {tab === 'overview' && <div className="mt-4 space-y-3"><div className="rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800/50"><span className="text-xs text-neutral-500">Saldo atual</span><strong className="mt-1 block text-2xl">{formatBRL(debt.currentBalance)}</strong><div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${progress}%` }} /></div><div className="mt-2 flex justify-between text-xs text-neutral-500"><span>{paid} parcelas pagas</span><span>{remaining} restantes</span></div></div><div className="grid grid-cols-2 gap-2"><DebtMini icon={WalletCards} label="Parcela" value={formatBRL(debt.installmentAmount)} /><DebtMini icon={CalendarDays} label="Vencimento" value={debt.status === 'paid' ? 'Concluída' : due.formattedDate} /><DebtMini icon={ReceiptText} label="Valor inicial" value={formatBRL(debt.originalAmount)} /><DebtMini icon={CheckCircle2} label="Progresso" value={formatPercent(progress)} /></div></div>}
    {tab === 'installments' && <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">{installments.length ? installments.map((item) => <div key={item.number} className="flex items-center justify-between rounded-xl border border-neutral-200 p-3 text-sm dark:border-neutral-800"><div><b>Parcela {item.number}</b><span className="block text-xs text-neutral-500">{item.date}</span></div><strong>{formatBRL(item.amount)}</strong></div>) : <div className="py-10 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" /><p className="mt-2 text-sm font-bold">Todas as parcelas foram concluídas.</p></div>}</div>}
    {tab === 'history' && <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">{payments.length ? payments.map((payment) => <div key={payment.id} className="flex items-center justify-between rounded-xl border border-neutral-200 p-3 text-sm dark:border-neutral-800"><div><b>Pagamento</b><span className="block text-xs text-neutral-500">{new Date(`${payment.paidOn}T00:00:00`).toLocaleDateString('pt-BR')}</span></div><strong>{formatBRL(payment.amount)}</strong></div>) : <div className="py-10 text-center"><History className="mx-auto h-8 w-8 text-neutral-400" /><p className="mt-2 text-sm text-neutral-500">Nenhum pagamento registrado.</p></div>}</div>}
    <div className="mt-4 grid grid-cols-2 gap-2"><button disabled={remaining <= 0} onClick={onPay} className="rounded-xl bg-indigo-600 px-3 py-2.5 text-xs font-bold text-white disabled:opacity-40">Pagar parcela</button><button disabled={debt.currentBalance <= 0} onClick={onReduce} className="rounded-xl border border-neutral-200 px-3 py-2.5 text-xs font-bold dark:border-neutral-700 disabled:opacity-40">Abater saldo</button></div></aside>;
};

const DebtMini = ({ icon: Icon, label, value }: { icon: typeof WalletCards; label: string; value: string }) => <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800"><Icon className="h-4 w-4 text-neutral-400" /><span className="mt-2 block text-xs text-neutral-500">{label}</span><strong className="mt-0.5 block truncate text-sm">{value}</strong></div>;
const EmptyDebt = ({ onAdd }: { onAdd: () => void }) => <div className="rounded-2xl border border-dashed border-neutral-300 p-12 text-center dark:border-neutral-700"><Banknote className="mx-auto h-10 w-10 text-neutral-400" /><h3 className="mt-3 font-black">Nenhuma dívida cadastrada</h3><p className="mt-1 text-sm text-neutral-500">Cadastre uma dívida para acompanhar o saldo e as parcelas.</p><button onClick={onAdd} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Nova dívida</button></div>;

const DebtFormModal = ({ mode, form, setForm, onClose, onSubmit }: { mode: 'add' | 'edit'; form: DebtFormState; setForm: React.Dispatch<React.SetStateAction<DebtFormState>>; onClose: () => void; onSubmit: (event: React.FormEvent) => void }) => {
  const total = Math.max(1, wholeValue(form.totalInstallments)); const paid = Math.min(total, wholeValue(form.paidInstallments)); const remaining = Math.max(0, total - paid); const payment = installmentAmount(moneyValue(form.balance), remaining); const update = (key: keyof DebtFormState, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"><form onSubmit={onSubmit} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl dark:bg-neutral-900 sm:p-6"><div className="flex items-center justify-between"><div><h3 className="text-lg font-black">{mode === 'add' ? 'Nova dívida' : 'Editar dívida'}</h3><p className="text-sm text-neutral-500">Informe apenas os dados essenciais.</p></div><button type="button" aria-label="Fechar" onClick={onClose} className="rounded-xl p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="h-5 w-5" /></button></div><div className="mt-5 space-y-4"><Field label="Nome da dívida"><input autoFocus required value={form.creditor} onChange={(event) => update('creditor', event.target.value)} placeholder="Ex.: Empréstimo pessoal" className="field-input" /></Field><Field label="Saldo atual"><input required type="number" min="0.01" step="0.01" value={form.balance} onChange={(event) => update('balance', event.target.value)} placeholder="0,00" className="field-input" /></Field><div className="grid grid-cols-2 gap-3"><Field label="Total de parcelas"><input required type="number" min="1" value={form.totalInstallments} onChange={(event) => update('totalInstallments', event.target.value)} className="field-input" /></Field><Field label="Parcelas já pagas"><input required type="number" min="0" max={total} value={form.paidInstallments} onChange={(event) => update('paidInstallments', event.target.value)} className="field-input" /></Field></div><div className="grid grid-cols-2 gap-3"><Field label="Dia do vencimento"><input required type="number" min="1" max="28" value={form.dueDay} onChange={(event) => update('dueDay', event.target.value)} className="field-input" /></Field><Field label="Prioridade"><select value={form.priority} onChange={(event) => update('priority', event.target.value)} className="field-input"><option value="urgent">Urgente</option><option value="high">Alta</option><option value="medium">Média</option><option value="low">Baixa</option></select></Field></div><div className="rounded-xl bg-indigo-500/10 p-4"><span className="text-xs text-neutral-500">Parcela calculada</span><strong className="mt-1 block text-lg text-indigo-500">{formatBRL(payment)}</strong><span className="text-xs text-neutral-500">{remaining} parcelas restantes</span></div></div><div className="mt-6 flex gap-2"><button type="button" onClick={onClose} className="flex-1 rounded-xl border border-neutral-200 py-3 text-sm font-bold dark:border-neutral-700">Cancelar</button><button type="submit" className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white">Salvar dívida</button></div></form></div>;
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block text-sm font-bold"><span className="mb-1.5 block">{label}</span>{children}</label>;
const AccountSelect = ({ accounts, value, onChange }: { accounts: Array<{ id: string; name: string }>; value: string; onChange: (value: string) => void }) => <label className="block text-sm font-bold">Conta usada<select value={value} onChange={(event) => onChange(event.target.value)} className="field-input mt-2"><option value="">Não descontar de uma conta</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>;
const ActionModal = ({ title, description, children, onClose, onConfirm, confirmLabel, destructive = false }: { title: string; description: string; children?: React.ReactNode; onClose: () => void; onConfirm: () => void; confirmLabel: string; destructive?: boolean }) => <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl dark:bg-neutral-900"><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-black">{title}</h3><p className="mt-1 text-sm text-neutral-500">{description}</p></div><button aria-label="Fechar" onClick={onClose} className="rounded-xl p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="h-5 w-5" /></button></div>{children && <div className="mt-5 space-y-4">{children}</div>}<div className="mt-6 flex gap-2"><button onClick={onClose} className="flex-1 rounded-xl border border-neutral-200 py-3 text-sm font-bold dark:border-neutral-700">Cancelar</button><button onClick={onConfirm} className={`flex-1 rounded-xl py-3 text-sm font-bold text-white ${destructive ? 'bg-rose-600' : 'bg-indigo-600'}`}>{confirmLabel}</button></div></div></div>;
