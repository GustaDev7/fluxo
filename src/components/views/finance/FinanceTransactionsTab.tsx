import React, { useState, useMemo, useRef } from 'react';
import { useFinance } from '../../../context/FinanceContext';
import { MASTER_CATEGORY_CONFIG, formatBRL } from '../../../utils/financeUtils';
import { TransactionType, MasterCategory } from '../../../types/finance';
import {
  Search,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  TrendingUp,
  CreditCard,
  Download,
  Upload,
  Sparkles,
  Trash2,
  Filter,
  FolderKanban,
  Target,
  FileCheck,
} from 'lucide-react';

export const FinanceTransactionsTab: React.FC = () => {
  const {
    transactions,
    accounts,
    creditCards,
    deleteTransaction,
    openTransactionModal,
    quickAddTransaction,
    exportTransactions,
    importTransactions,
  } = useFinance();

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [quickInput, setQuickInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    quickAddTransaction(quickInput);
    setQuickInput('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        importTransactions(text);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Search
      const matchesSearch =
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.subcategory?.toLowerCase().includes(search.toLowerCase()) ||
        t.notes?.toLowerCase().includes(search.toLowerCase()) ||
        t.amount.toString().includes(search);

      if (!matchesSearch) return false;

      // Type
      if (selectedType !== 'all' && t.type !== selectedType) return false;

      // Category
      if (selectedCategory !== 'all' && t.masterCategory !== selectedCategory) return false;

      // Account or card
      if (selectedAccount !== 'all') {
        if (t.accountId !== selectedAccount && t.cardId !== selectedAccount) return false;
      }

      return true;
    });
  }, [transactions, search, selectedType, selectedCategory, selectedAccount]);

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    let investment = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expense += t.amount;
      else if (t.type === 'investment') investment += t.amount;
    });
    return { income, expense, investment, balance: income - (expense + investment) };
  }, [filteredTransactions]);

  const getAccountName = (accId?: string, cardId?: string) => {
    if (cardId) {
      const card = creditCards.find((c) => c.id === cardId);
      return card ? `💳 ${card.name}` : 'Cartão';
    }
    const acc = accounts.find((a) => a.id === accId);
    return acc ? acc.name : 'Conta';
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Quick Parse Input */}
        <form onSubmit={handleQuickAdd} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500" />
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder='Lançamento rápido: "Uber 32 reais", "Salário 5200", "Aporte tesouro 500"...'
              className="w-full rounded-2xl border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-xs text-neutral-900 shadow-sm outline-none focus:border-indigo-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </div>
          <button
            type="submit"
            className="rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors shrink-0"
          >
            Lançar
          </button>
        </form>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,.txt"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Importar extrato CSV"
            className="flex items-center gap-1.5 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Importar</span>
          </button>

          <button
            onClick={exportTransactions}
            title="Exportar transações em CSV"
            className="flex items-center gap-1.5 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          <button
            onClick={() => openTransactionModal('expense')}
            className="flex items-center gap-1.5 rounded-2xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white transition-all shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por descrição, valor ou nota..."
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-1.5 pl-8 pr-3 text-xs text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>

        {/* Type Filter */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-700 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
        >
          <option value="all">Todos os Tipos</option>
          <option value="expense">Despesas</option>
          <option value="income">Receitas</option>
          <option value="transfer">Transferências</option>
          <option value="investment">Investimentos</option>
          <option value="debt_payment">Pagamentos de Dívida</option>
        </select>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-700 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
        >
          <option value="all">Todas as Categorias AUVP</option>
          {Object.values(MASTER_CATEGORY_CONFIG).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Account Filter */}
        <select
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
          className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-700 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
        >
          <option value="all">Todas as Contas e Cartões</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
          {creditCards.map((c) => (
            <option key={c.id} value={c.id}>
              💳 {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Summary of Filtered Items */}
      <div className="flex items-center justify-between text-xs px-2 text-neutral-500">
        <div>
          Mostrando <span className="font-bold text-neutral-800 dark:text-neutral-200">{filteredTransactions.length}</span> lançamentos
        </div>
        <div className="flex items-center gap-4">
          <span>
            Receitas: <strong className="text-emerald-600">{formatBRL(summary.income)}</strong>
          </span>
          <span>
            Despesas: <strong className="text-rose-600">{formatBRL(summary.expense)}</strong>
          </span>
          <span>
            Aportes: <strong className="text-blue-600">{formatBRL(summary.investment)}</strong>
          </span>
        </div>
      </div>

      {/* Transactions Table/List */}
      <div className="rounded-3xl border border-neutral-200 bg-white overflow-hidden shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {filteredTransactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400">
              Nenhuma transação encontrada com os filtros selecionados.
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const catConfig = MASTER_CATEGORY_CONFIG[tx.masterCategory];
              const isIncome = tx.type === 'income';
              const isInvestment = tx.type === 'investment';
              const isTransfer = tx.type === 'transfer';
              const isDebt = tx.type === 'debt_payment';

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Icon */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                        isIncome
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : isInvestment
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                          : isTransfer
                          ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400'
                          : isDebt
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                          : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="h-5 w-5" />
                      ) : isInvestment ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : isTransfer ? (
                        <ArrowLeftRight className="h-5 w-5" />
                      ) : isDebt ? (
                        <CreditCard className="h-5 w-5" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                          {tx.description}
                        </span>
                        {tx.installments && (
                          <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                            {tx.installments.current}/{tx.installments.total}x
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                        <span>{tx.date}</span>
                        <span>•</span>
                        <span>{getAccountName(tx.accountId, tx.cardId)}</span>
                        <span>•</span>
                        <span
                          className="inline-flex items-center gap-1 font-semibold"
                          style={{ color: catConfig?.color }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: catConfig?.color }}
                          />
                          {catConfig?.name || tx.masterCategory}
                        </span>
                        {tx.projectId && (
                          <span className="rounded bg-neutral-100 px-1 py-0.2 text-[10px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 flex items-center gap-1">
                            <FolderKanban className="h-2.5 w-2.5" />
                            Projeto
                          </span>
                        )}
                        {tx.goalId && (
                          <span className="rounded bg-amber-50 px-1 py-0.2 text-[10px] text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 flex items-center gap-1">
                            <Target className="h-2.5 w-2.5" />
                            Meta
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Value & Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div
                        className={`text-sm font-black ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isInvestment
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-neutral-900 dark:text-neutral-100'
                        }`}
                      >
                        {isIncome ? '+' : '-'} {formatBRL(tx.amount)}
                      </div>
                      <div className="text-[10px] text-neutral-400 capitalize">
                        {tx.type === 'expense'
                          ? 'Despesa'
                          : tx.type === 'income'
                          ? 'Receita'
                          : tx.type === 'investment'
                          ? 'Aporte'
                          : tx.type === 'transfer'
                          ? 'Transf.'
                          : 'Dívida'}
                      </div>
                    </div>

                    <button
                      onClick={() => deleteTransaction(tx.id)}
                      title="Excluir Lançamento"
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
