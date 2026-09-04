import React, { useState } from 'react';
import { useFinance } from '../../../context/FinanceContext';
import { formatBRL } from '../../../utils/financeUtils';
import { FinanceAccountType } from '../../../types/finance';
import {
  Wallet,
  CreditCard,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Calendar,
  Layers,
  X,
  Check,
  Building2,
  PieChart,
} from 'lucide-react';

export const FinanceAccountsTab: React.FC = () => {
  const {
    accounts,
    creditCards,
    installments,
    addAccount,
    addCreditCard,
    updateAccount,
  } = useFinance();

  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccBank, setNewAccBank] = useState('');
  const [newAccType, setNewAccType] = useState<FinanceAccountType>('checking');
  const [newAccBalance, setNewAccBalance] = useState('');

  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [newCardName, setNewCardName] = useState('');
  const [newCardLimit, setNewCardLimit] = useState('');
  const [newCardClosing, setNewCardClosing] = useState(5);
  const [newCardDue, setNewCardDue] = useState(12);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName) return;
    addAccount({
      name: newAccName,
      bank: newAccBank || newAccName,
      type: newAccType,
      balance: parseFloat(newAccBalance.replace(',', '.')) || 0,
      color: '#3B82F6',
      isActive: true,
    });
    setIsAddAccountOpen(false);
    setNewAccName('');
    setNewAccBank('');
    setNewAccBalance('');
  };

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardName) return;
    const limitNum = parseFloat(newCardLimit.replace(',', '.')) || 3000;
    addCreditCard({
      name: newCardName,
      bank: newCardName,
      limit: limitNum,
      availableLimit: limitNum,
      closingDay: newCardClosing,
      dueDay: newCardDue,
      color: '#820AD1',
      currentInvoice: 0,
      nextInvoice: 0,
    });
    setIsAddCardOpen(false);
    setNewCardName('');
    setNewCardLimit('');
  };

  const totalAccountBalance = accounts.reduce((acc, a) => acc + (a.isActive ? a.balance : 0), 0);
  const totalInvoices = creditCards.reduce((acc, c) => acc + c.currentInvoice, 0);
  const totalRemainingInstallments = installments.reduce(
    (acc, i) => acc + (i.totalInstallments - i.paidInstallments) * i.installmentAmount,
    0
  );

  return (
    <div className="space-y-8">
      {/* 1. Accounts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Contas Bancárias & Carteiras
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Saldo total consolidado:{' '}
              <strong className="text-neutral-900 dark:text-neutral-100">
                {formatBRL(totalAccountBalance)}
              </strong>
            </p>
          </div>
          <button
            onClick={() => setIsAddAccountOpen(true)}
            className="flex items-center gap-1.5 rounded-2xl bg-neutral-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nova Conta</span>
          </button>
        </div>

        {/* New Account Modal */}
        {isAddAccountOpen && (
          <form
            onSubmit={handleCreateAccount}
            className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-lg dark:border-neutral-800 dark:bg-neutral-900 space-y-4 animate-in fade-in"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                Cadastrar Nova Conta
              </span>
              <button
                type="button"
                onClick={() => setIsAddAccountOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                  Nome da Conta
                </label>
                <input
                  type="text"
                  required
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  placeholder="Ex: Nubank, Inter..."
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                  Instituição
                </label>
                <input
                  type="text"
                  value={newAccBank}
                  onChange={(e) => setNewAccBank(e.target.value)}
                  placeholder="Ex: Banco Itaú..."
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                  Tipo
                </label>
                <select
                  value={newAccType}
                  onChange={(e) => setNewAccType(e.target.value as FinanceAccountType)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                >
                  <option value="checking">Conta Corrente</option>
                  <option value="digital">Conta Digital / Giro</option>
                  <option value="savings">Poupança</option>
                  <option value="brokerage">Corretora / Investimentos</option>
                  <option value="wallet">Carteira Física</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                  Saldo Inicial (R$)
                </label>
                <input
                  type="text"
                  value={newAccBalance}
                  onChange={(e) => setNewAccBalance(e.target.value)}
                  placeholder="0,00"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddAccountOpen(false)}
                className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
              >
                Adicionar Conta
              </button>
            </div>
          </form>
        )}

        {/* Accounts Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-white font-bold text-xs shadow-sm"
                      style={{ backgroundColor: acc.color }}
                    >
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        {acc.name}
                      </div>
                      <div className="text-[10px] text-neutral-400 uppercase tracking-wider">
                        {acc.type === 'checking'
                          ? 'Conta Corrente'
                          : acc.type === 'brokerage'
                          ? 'Corretora'
                          : acc.type === 'wallet'
                          ? 'Dinheiro Físico'
                          : 'Conta Digital'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-2">
                  <span className="text-[10px] text-neutral-400">Saldo Atual</span>
                  <div className="text-xl font-black text-neutral-900 dark:text-neutral-100">
                    {formatBRL(acc.balance)}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
                <span>{acc.bank}</span>
                <span className="text-emerald-600 font-semibold">Ativa</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Credit Cards Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Cartões de Crédito & Faturas
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Total em faturas abertas:{' '}
              <strong className="text-rose-600 dark:text-rose-400">
                {formatBRL(totalInvoices)}
              </strong>
            </p>
          </div>
          <button
            onClick={() => setIsAddCardOpen(true)}
            className="flex items-center gap-1.5 rounded-2xl bg-neutral-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Novo Cartão</span>
          </button>
        </div>

        {/* Credit Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {creditCards.map((card) => {
            const usedPct = card.limit > 0 ? Math.round((card.currentInvoice / card.limit) * 100) : 0;
            return (
              <div
                key={card.id}
                className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-md">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        {card.name}
                      </h4>
                      <p className="text-[11px] text-neutral-400">
                        Fecha dia {card.closingDay} • Vence dia {card.dueDay}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-2xl mb-4">
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Fatura Atual</span>
                    <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                      {formatBRL(card.currentInvoice)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Disponível</span>
                    <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                      {formatBRL(card.availableLimit)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Limite Total</span>
                    <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                      {formatBRL(card.limit)}
                    </span>
                  </div>
                </div>

                {/* Progress bar of limit */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-neutral-500">Limite Utilizado</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">
                      {usedPct}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <div
                      className="h-full rounded-full bg-purple-600 transition-all"
                      style={{ width: `${usedPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Installments Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            Compras Parceladas no Cartão
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Comprometimento futuro total:{' '}
            <strong className="text-amber-600 dark:text-amber-400">
              {formatBRL(totalRemainingInstallments)}
            </strong>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {installments.map((inst) => {
            const remaining = inst.totalInstallments - inst.paidInstallments;
            const remainingAmount = remaining * inst.installmentAmount;
            const progress = Math.round((inst.paidInstallments / inst.totalInstallments) * 100);

            return (
              <div
                key={inst.id}
                className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      {inst.description}
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      {inst.subcategory || 'Parcelamento'} • Início: {inst.startDate}
                    </div>
                  </div>
                  <div className="rounded-xl bg-neutral-100 px-2.5 py-1 text-xs font-bold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                    {inst.paidInstallments}/{inst.totalInstallments}x
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs bg-neutral-50 dark:bg-neutral-800/40 p-3 rounded-xl">
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Parcela</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">
                      {formatBRL(inst.installmentAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Restam</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {remaining} parcelas
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Saldo Devedor</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">
                      {formatBRL(remainingAmount)}
                    </span>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-neutral-500">
                    <span>Progresso de Quitação</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
