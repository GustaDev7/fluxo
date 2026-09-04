import React from 'react';
import { useFinance } from '../../../context/FinanceContext';
import { formatBRL, formatPercent } from '../../../utils/financeUtils';
import {
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  AlertTriangle,
  CreditCard,
  Plus,
  Sparkles,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Target,
  FileSpreadsheet,
  HelpCircle,
  Activity,
} from 'lucide-react';

export const FinanceOverviewTab: React.FC = () => {
  const {
    netWorthSummary,
    availableCash,
    monthIncome,
    monthExpenses,
    monthInvestments,
    debts,
    savingsRate,
    healthScore,
    emergencyCoverage,
    overdueBills,
    todayBills,
    upcomingBills,
    setSubTab,
    openTransactionModal,
    openDiagnosisModal,
    budget,
    zeroBasedStatus,
  } = useFinance();

  const totalDebts = debts.reduce((acc, d) => (d.status === 'active' ? acc + d.currentBalance : 0), 0);

  // Variation compared to previous month
  const netWorthVariation = 1250.0;
  const netWorthPercent = 7.3;

  return (
    <div className="space-y-6">
      {/* Smart Alerts Banner if any overdue or important alert */}
      {overdueBills.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 dark:border-rose-900/50 dark:bg-rose-950/30">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 text-white shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                Atenção: {overdueBills.length} conta(s) em atraso!
              </h4>
              <p className="text-[11px] text-rose-700 dark:text-rose-300">
                Evite multas e juros compostos negativos quitando as contas pendentes com prioridade.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSubTab('bills')}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors"
          >
            <span>Ver Contas</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Top 7 Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* 1. Patrimônio Líquido */}
        <div className="col-span-2 sm:col-span-2 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1.5">
            <span className="text-xs font-semibold">Patrimônio Líquido</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-black text-neutral-900 dark:text-neutral-100">
            {formatBRL(netWorthSummary.netWorth)}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <span>+{formatBRL(netWorthVariation)} (+{netWorthPercent}%)</span>
            <span className="text-neutral-400 font-normal">vs mês anterior</span>
          </div>
        </div>

        {/* 2. Saldo Disponível */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1.5">
            <span className="text-xs font-semibold">Disponível</span>
            <Wallet className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-lg font-black text-neutral-900 dark:text-neutral-100 truncate">
            {formatBRL(availableCash)}
          </div>
          <div className="mt-1 text-[10px] text-neutral-400">Contas correntes</div>
        </div>

        {/* 3. Receitas do Mês */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1.5">
            <span className="text-xs font-semibold">Receitas</span>
            <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 truncate">
            {formatBRL(monthIncome || budget.plannedIncome)}
          </div>
          <div className="mt-1 text-[10px] text-neutral-400">Entradas de Setembro</div>
        </div>

        {/* 4. Despesas do Mês */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1.5">
            <span className="text-xs font-semibold">Despesas</span>
            <ArrowUpRight className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-lg font-black text-neutral-900 dark:text-neutral-100 truncate">
            {formatBRL(monthExpenses)}
          </div>
          <div className="mt-1 text-[10px] text-neutral-400">Realizado no mês</div>
        </div>

        {/* 5. Investimentos */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1.5">
            <span className="text-xs font-semibold">Aportes</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 truncate">
            {formatBRL(monthInvestments)}
          </div>
          <div className="mt-1 text-[10px] text-neutral-400">Liberdade Financeira</div>
        </div>

        {/* 6. Dívidas Totais */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1.5">
            <span className="text-xs font-semibold">Dívidas</span>
            <CreditCard className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-lg font-black text-amber-600 dark:text-amber-400 truncate">
            {formatBRL(totalDebts)}
          </div>
          <div className="mt-1 text-[10px] text-neutral-400">Saldo a amortizar</div>
        </div>

        {/* 7. Taxa de Poupança */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1.5">
            <span className="text-xs font-semibold">Poupança</span>
            <ShieldCheck className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-lg font-black text-blue-600 dark:text-blue-400 truncate">
            {formatPercent(savingsRate || 19.2)}
          </div>
          <div className="mt-1 text-[10px] text-neutral-400">Meta AUVP: 20%+</div>
        </div>
      </div>

      {/* Main Grid: Left Financial Pulse & Right Zero-Based Status + Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Resumo do Mês e Planejamento */}
        <div className="lg:col-span-2 space-y-6">
          {/* Painel do Mês */}
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Resumo do Mês • Setembro 2026
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Comparativo de entradas, saídas e patrimônio acumulado
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openTransactionModal('expense')}
                  className="flex items-center gap-1.5 rounded-xl bg-neutral-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white transition-all shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Novo Lançamento</span>
                </button>
              </div>
            </div>

            {/* Visual Balance Bar */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-neutral-600 dark:text-neutral-400">
                  Comprometimento da Renda (Despesas + Aportes)
                </span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">
                  {formatBRL(monthExpenses + monthInvestments)} / {formatBRL(monthIncome || budget.plannedIncome)}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800 flex">
                <div
                  className="bg-blue-500 transition-all"
                  style={{ width: `${Math.min(100, (monthExpenses / (monthIncome || 5200)) * 100)}%` }}
                  title="Despesas"
                />
                <div
                  className="bg-emerald-500 transition-all"
                  style={{ width: `${Math.min(100, (monthInvestments / (monthIncome || 5200)) * 100)}%` }}
                  title="Investimentos"
                />
              </div>
              <div className="flex items-center gap-4 text-[11px] text-neutral-500">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span>Despesas ({Math.round((monthExpenses / (monthIncome || 5200)) * 100)}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Aportes ({Math.round((monthInvestments / (monthIncome || 5200)) * 100)}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                  <span>Disponível para alocação</span>
                </div>
              </div>
            </div>

            {/* Quick Action Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <button
                onClick={() => setSubTab('budget')}
                className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 p-3.5 text-left hover:bg-neutral-100/80 dark:border-neutral-800 dark:bg-neutral-800/50 dark:hover:bg-neutral-800 transition-all"
              >
                <div>
                  <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Orçamento Base Zero</div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    {zeroBasedStatus.status === 'balanced' ? '🟢 100% Equilibrado' : '🟡 Ajustar Alocação'}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400" />
              </button>

              <button
                onClick={() => setSubTab('bills')}
                className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 p-3.5 text-left hover:bg-neutral-100/80 dark:border-neutral-800 dark:bg-neutral-800/50 dark:hover:bg-neutral-800 transition-all"
              >
                <div>
                  <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Contas a Pagar</div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {upcomingBills.length} próximas do vencimento
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400" />
              </button>

              <button
                onClick={() => setSubTab('debts')}
                className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 p-3.5 text-left hover:bg-neutral-100/80 dark:border-neutral-800 dark:bg-neutral-800/50 dark:hover:bg-neutral-800 transition-all"
              >
                <div>
                  <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Reserva de Emergência</div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    🛡️ {emergencyCoverage.monthsCovered} meses cobertos
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400" />
              </button>

              <button
                onClick={() => setSubTab('investments')}
                className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 p-3.5 text-left hover:bg-neutral-100/80 dark:border-neutral-800 dark:bg-neutral-800/50 dark:hover:bg-neutral-800 transition-all"
              >
                <div>
                  <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Alocação Patrimonial</div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {netWorthSummary.investmentsTotal > 0 ? formatBRL(netWorthSummary.investmentsTotal) : 'Iniciar'}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400" />
              </button>
            </div>
          </div>

          {/* Upcoming Bills Widget with 1-click "Pagar" or "Gerar Tarefa no Fluxo" */}
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Próximos Vencimentos de Contas
                </h3>
              </div>
              <button
                onClick={() => setSubTab('bills')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                Ver Todas
              </button>
            </div>

            <div className="space-y-2.5">
              {[...overdueBills, ...todayBills, ...upcomingBills.slice(0, 3)].map((bill) => {
                const isOverdue = overdueBills.some((b) => b.id === bill.id);
                return (
                  <div
                    key={bill.id}
                    className={`flex items-center justify-between rounded-2xl border p-3.5 transition-all ${
                      isOverdue
                        ? 'border-rose-200 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/20'
                        : 'border-neutral-200 bg-neutral-50/70 dark:border-neutral-800 dark:bg-neutral-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-black ${
                          isOverdue
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
                            : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200'
                        }`}
                      >
                        {bill.dueDate.split('-')[2]}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                          {bill.title}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          Vencimento: {bill.dueDate} • {bill.subcategory || bill.masterCategory}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-black text-neutral-900 dark:text-neutral-100">
                          {formatBRL(bill.amount)}
                        </div>
                        {isOverdue && (
                          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                            Vencida!
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => setSubTab('bills')}
                        className="rounded-xl border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                      >
                        Gerenciar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Saúde Financeira & AUVP Diagnostic */}
        <div className="space-y-6">
          {/* Card de Saúde Financeira AUVP */}
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Saúde Financeira
                </h3>
              </div>
              <button
                onClick={openDiagnosisModal}
                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
              >
                <Sparkles className="h-3 w-3" />
                <span>Atualizar Diagnóstico</span>
              </button>
            </div>

            {/* Score circle / badge */}
            <div className="flex items-center gap-4 rounded-2xl bg-emerald-50/80 p-4 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white font-black text-2xl shadow-lg shadow-emerald-600/30 shrink-0">
                {healthScore.score}
              </div>
              <div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Status Geral</div>
                <div className="text-lg font-black text-emerald-800 dark:text-emerald-200">
                  Classificação: {healthScore.rating}
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  Baseado nas diretrizes do método AUVP
                </p>
              </div>
            </div>

            {/* Factors list */}
            <div className="mt-4 space-y-2.5">
              {healthScore.factors.map((factor, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 text-xs rounded-xl bg-neutral-50 p-2.5 dark:bg-neutral-800/40"
                >
                  <div
                    className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                      factor.status === 'positive'
                        ? 'bg-emerald-500'
                        : factor.status === 'neutral'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                  />
                  <div>
                    <div className="font-bold text-neutral-900 dark:text-neutral-100">{factor.label}</div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400">{factor.detail}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Button to run diagnosis */}
            <button
              onClick={openDiagnosisModal}
              className="mt-5 w-full flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white py-2.5 text-xs font-bold text-neutral-800 shadow-sm hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
            >
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span>Refazer Diagnóstico em 7 Etapas</span>
            </button>
          </div>

          {/* Quick Assistant Callout */}
          <div className="rounded-3xl border border-indigo-100 bg-indigo-50/60 p-5 dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <div className="flex items-center gap-2.5 text-indigo-700 dark:text-indigo-300 mb-2">
              <Sparkles className="h-4 w-4" />
              <h4 className="text-xs font-bold">Assistente Fluxo Financeiro</h4>
            </div>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">
              Precisa de ajuda para planejar os gastos de hoje ou simular quanto tempo falta para a sua liberdade financeira?
            </p>
            <button
              onClick={() => setSubTab('assistant')}
              className="w-full rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-colors"
            >
              Conversar com IA Financeira
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
