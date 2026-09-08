import React, { useState, useEffect } from 'react';
import { useFinance } from '../../../context/FinanceContext';
import { useApp } from '../../../context/AppContext';
import { TransactionType, MasterCategory } from '../../../types/finance';
import { MASTER_CATEGORY_CONFIG, smartParseTransaction } from '../../../utils/financeUtils';
import { getTodayDateString } from '../../../utils/date';
import {
  X,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  TrendingUp,
  CreditCard as CardIcon,
  Sparkles,
  Check,
  Calendar,
  Layers,
  FolderKanban,
  Target,
} from 'lucide-react';

export const FinanceTransactionModal: React.FC = () => {
  const {
    isTransactionModalOpen,
    closeTransactionModal,
    transactionModalInitialType,
    transactionModalInitialCategory,
    addTransaction,
    accounts,
    creditCards,
    goals,
  } = useFinance();
  const { projects } = useApp();

  const [type, setType] = useState<TransactionType>(transactionModalInitialType);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [masterCategory, setMasterCategory] = useState<MasterCategory>('custos_fixos');
  const [subcategory, setSubcategory] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [destinationAccountId, setDestinationAccountId] = useState<string>('');
  const [cardId, setCardId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [goalId, setGoalId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [recurrence, setRecurrence] = useState<'none' | 'monthly' | 'weekly' | 'yearly'>('none');
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState(3);

  // Quick Smart Input text
  const [smartInput, setSmartInput] = useState('');

  useEffect(() => {
    if (isTransactionModalOpen) {
      setType(transactionModalInitialType);
      setAmount('');
      setDescription('');
      setDate(getTodayDateString());
      setMasterCategory(
        transactionModalInitialCategory || (transactionModalInitialType === 'investment'
          ? 'liberdade_financeira'
          : transactionModalInitialType === 'income'
          ? 'custos_fixos'
          : 'custos_fixos')
      );
      setSubcategory('');
      setAccountId(accounts[0]?.id || '');
      setDestinationAccountId(accounts[1]?.id || '');
      setCardId('');
      setProjectId('');
      setGoalId('');
      setNotes('');
      setRecurrence('none');
      setIsInstallment(false);
      setSmartInput('');
    }
  }, [isTransactionModalOpen, transactionModalInitialType, transactionModalInitialCategory, accounts]);

  if (!isTransactionModalOpen) return null;

  const handleApplySmartInput = () => {
    if (!smartInput.trim()) return;
    const parsed = smartParseTransaction(smartInput);
    setType(parsed.type);
    if (parsed.amount > 0) setAmount(parsed.amount.toString());
    if (parsed.description) setDescription(parsed.description);
    setMasterCategory(parsed.masterCategory);
    if (parsed.subcategory) setSubcategory(parsed.subcategory);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (!numAmount || numAmount <= 0) return;

    addTransaction({
      type,
      amount: numAmount,
      date,
      description: description.trim() || 'Sem descrição',
      masterCategory,
      subcategory: subcategory.trim() || undefined,
      accountId: cardId ? undefined : accountId || undefined,
      destinationAccountId: type === 'transfer' ? destinationAccountId : undefined,
      cardId: cardId || undefined,
      projectId: projectId || undefined,
      goalId: goalId || undefined,
      recurrence: recurrence !== 'none' ? recurrence : undefined,
      notes: notes.trim() || undefined,
      installments:
        isInstallment && cardId
          ? {
              current: 1,
              total: totalInstallments,
            }
          : undefined,
    });

    closeTransactionModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col rounded-3xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">Novo Lançamento</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Sistema financeiro conectado ao Fluxo
              </p>
            </div>
          </div>
          <button
            onClick={closeTransactionModal}
            className="rounded-xl p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Smart Quick Capture Pill */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3 dark:border-indigo-950/60 dark:bg-indigo-950/20">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Preenchimento Inteligente</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={smartInput}
                onChange={(e) => setSmartInput(e.target.value)}
                placeholder='Ex: "Uber 32 reais", "Salário 5200", "Aluguel 1500"...'
                className="flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-900 outline-none focus:border-indigo-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplySmartInput();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleApplySmartInput}
                className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Identificar
              </button>
            </div>
          </div>

          {/* Transaction Type Selector */}
          <div>
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1.5">
              Tipo de Operação
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {[
                { id: 'expense', label: 'Despesa', icon: ArrowUpRight, color: 'text-rose-600' },
                { id: 'income', label: 'Receita', icon: ArrowDownLeft, color: 'text-emerald-600' },
                { id: 'transfer', label: 'Transf.', icon: ArrowLeftRight, color: 'text-blue-600' },
                { id: 'investment', label: 'Investir', icon: TrendingUp, color: 'text-emerald-600' },
                { id: 'debt_payment', label: 'Dívida', icon: CardIcon, color: 'text-amber-600' },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = type === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setType(item.id as TransactionType);
                      if (item.id === 'investment') setMasterCategory('liberdade_financeira');
                    }}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/80 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-600 shadow-sm'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-white dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${item.color}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Value and Date row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                Valor (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-400">
                  R$
                </span>
                <input
                  type="text"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-3 text-base font-bold text-neutral-900 outline-none focus:border-indigo-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                Data do Registro
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 outline-none focus:border-indigo-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
              Descrição do Lançamento *
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Supermercado, Aluguel, Salário, Aporte IPCA+..."
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 outline-none focus:border-indigo-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>

          {/* Master Category AUVP */}
          {type !== 'transfer' && (
            <div>
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                Categoria AUVP
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.values(MASTER_CATEGORY_CONFIG).map((cat) => {
                  const isSelected = masterCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setMasterCategory(cat.id)}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/80 font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-500'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-white dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-300'
                      }`}
                    >
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Account / Credit Card destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                {type === 'transfer' ? 'Conta de Origem' : 'Conta de Movimentação'}
              </label>
              <select
                disabled={Boolean(cardId)}
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 outline-none focus:border-indigo-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100 disabled:opacity-50"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (R$ {acc.balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {type === 'transfer' ? (
              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Conta de Destino
                </label>
                <select
                  value={destinationAccountId}
                  onChange={(e) => setDestinationAccountId(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 outline-none focus:border-indigo-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id} disabled={acc.id === accountId}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Ou Pagar com Cartão de Crédito
                </label>
                <select
                  value={cardId}
                  onChange={(e) => setCardId(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 outline-none focus:border-indigo-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                >
                  <option value="">Nenhum (Debitar da conta acima)</option>
                  {creditCards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.name} (Disp: R$ {card.availableLimit.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Installment options when Credit Card is selected */}
          {cardId && type === 'expense' && (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-800/40">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                <input
                  type="checkbox"
                  checked={isInstallment}
                  onChange={(e) => setIsInstallment(e.target.checked)}
                  className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Compra Parcelada no Cartão?</span>
              </label>

              {isInstallment && (
                <div className="mt-2.5 flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[11px] text-neutral-500 dark:text-neutral-400 block mb-1">
                      Total de Parcelas
                    </label>
                    <select
                      value={totalInstallments}
                      onChange={(e) => setTotalInstallments(parseInt(e.target.value, 10))}
                      className="w-full rounded-lg border border-neutral-200 bg-white p-1.5 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    >
                      {[2, 3, 4, 5, 6, 8, 10, 12, 18, 24, 36, 48].map((n) => (
                        <option key={n} value={n}>
                          {n}x de R${' '}
                          {amount ? (parseFloat(amount.replace(',', '.')) / n).toFixed(2) : '0,00'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Links to Projects / Goals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                Vincular a Projeto do Fluxo (Opcional)
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 outline-none focus:border-indigo-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
              >
                <option value="">Nenhum Projeto</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                Vincular a Meta Financeira (Opcional)
              </label>
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 outline-none focus:border-indigo-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
              >
                <option value="">Nenhuma Meta</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes & Recurrence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                Recorrência
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as any)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 outline-none focus:border-indigo-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
              >
                <option value="none">Única (Não se repete)</option>
                <option value="monthly">Mensal (Todo mês)</option>
                <option value="weekly">Semanal</option>
                <option value="yearly">Anual</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                Observações
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalhes adicionais..."
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 outline-none focus:border-indigo-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.99] transition-all"
            >
              <Check className="h-4 w-4 stroke-[3]" />
              <span>Confirmar Lançamento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
