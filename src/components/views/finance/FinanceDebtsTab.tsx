import React, { useState } from 'react';
import { useFinance } from '../../../context/FinanceContext';
import { formatBRL, formatPercent } from '../../../utils/financeUtils';
import { FinanceDebt } from '../../../types/finance';
import {
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  Plus,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

export const FinanceDebtsTab: React.FC = () => {
  const {
    debts,
    emergencyFund,
    updateEmergencyFund,
    accounts,
    payDebtInstallment,
    addDebt,
    emergencyCoverage,
  } = useFinance();

  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [creditor, setCreditor] = useState('');
  const [balance, setBalance] = useState('');
  const [interest, setInterest] = useState('1.5');
  const [installmentVal, setInstallmentVal] = useState('');
  const [remainingInst, setRemainingInst] = useState('12');
  const [priority, setPriority] = useState<FinanceDebt['priority']>('high');

  const [selectedMethod, setSelectedMethod] = useState<'avalanche' | 'snowball'>('avalanche');

  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const balanceNum = parseFloat(balance.replace(',', '.')) || 0;
    const installmentNum = parseFloat(installmentVal.replace(',', '.')) || 0;
    const totalInst = parseInt(remainingInst, 10) || 12;

    if (!creditor || !balanceNum) return;

    addDebt({
      creditor,
      type: 'financing',
      originalAmount: balanceNum,
      currentBalance: balanceNum,
      interestRateMonthly: parseFloat(interest) || 1.0,
      totalInstallments: totalInst,
      remainingInstallments: totalInst,
      installmentAmount: installmentNum || Math.round(balanceNum / totalInst),
      dueDay: 15,
      priority,
      status: 'active',
    });

    setIsAddDebtOpen(false);
    setCreditor('');
    setBalance('');
    setInstallmentVal('');
  };

  const totalDebtBalance = debts.reduce((acc, d) => (d.status === 'active' ? acc + d.currentBalance : 0), 0);
  const totalMonthlyPayment = debts.reduce((acc, d) => (d.status === 'active' ? acc + d.installmentAmount : 0), 0);

  // Emergency fund calculations
  const emergencyPct = Math.min(
    100,
    Math.round((emergencyFund.currentAmount / emergencyFund.targetAmount) * 100)
  );
  const remainingMonthsToComplete =
    emergencyFund.monthlyContribution > 0
      ? Math.ceil((emergencyFund.targetAmount - emergencyFund.currentAmount) / emergencyFund.monthlyContribution)
      : 0;

  return (
    <div className="space-y-8">
      {/* 1. Emergency Fund Module */}
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Reserva de Emergência Blindada
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Colchão de segurança para imprevistos e tranquilidade mental
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                emergencyCoverage.status === 'safe'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
              }`}
            >
              🛡️ {emergencyCoverage.monthsCovered} meses cobertos ({emergencyCoverage.status === 'safe' ? 'Seguro' : 'Em Construção'})
            </span>
          </div>
        </div>

        {/* Numbers Grid */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800/40">
            <span className="text-xs text-neutral-400 block">Valor Guardado Atual</span>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {formatBRL(emergencyFund.currentAmount)}
            </div>
            <span className="text-[10px] text-neutral-400">Em CDB 100% CDI / Tesouro Selic</span>
          </div>

          <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800/40">
            <span className="text-xs text-neutral-400 block">Meta da Reserva (6 Meses)</span>
            <div className="text-xl font-black text-neutral-900 dark:text-neutral-100 mt-0.5">
              {formatBRL(emergencyFund.targetAmount)}
            </div>
            <span className="text-[10px] text-neutral-400">6x Custos Fixos Essenciais</span>
          </div>

          <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800/40">
            <span className="text-xs text-neutral-400 block">Aporte Mensal Atual</span>
            <div className="text-xl font-black text-neutral-900 dark:text-neutral-100 mt-0.5">
              {formatBRL(emergencyFund.monthlyContribution)}
            </div>
            <span className="text-[10px] text-neutral-400">Destinado mensalmente</span>
          </div>

          <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800/40">
            <span className="text-xs text-neutral-400 block">Tempo Estimado Restante</span>
            <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
              ~{remainingMonthsToComplete} meses
            </div>
            <span className="text-[10px] text-neutral-400">Mantendo o aporte atual</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-500 font-medium">Progresso da Blindagem</span>
            <span className="font-bold text-neutral-900 dark:text-neutral-100">{emergencyPct}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${emergencyPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Debts Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Mapa de Dívidas & Plano de Quitação
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Saldo devedor total:{' '}
              <strong className="text-amber-600 dark:text-amber-400">
                {formatBRL(totalDebtBalance)}
              </strong>{' '}
              • Parcela mensal comprometida: <strong>{formatBRL(totalMonthlyPayment)}</strong>
            </p>
          </div>

          <button
            onClick={() => setIsAddDebtOpen(true)}
            className="flex items-center gap-1.5 rounded-2xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Cadastrar Dívida</span>
          </button>
        </div>

        {/* Add Debt Form */}
        {isAddDebtOpen && (
          <form
            onSubmit={handleAddDebt}
            className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-lg dark:border-neutral-800 dark:bg-neutral-900 space-y-4 animate-in fade-in"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                Cadastrar Nova Dívida / Financiamento
              </span>
              <button
                type="button"
                onClick={() => setIsAddDebtOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                  Credor / Instituição
                </label>
                <input
                  type="text"
                  required
                  value={creditor}
                  onChange={(e) => setCreditor(e.target.value)}
                  placeholder="Ex: Banco Alfa, Empréstimo..."
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                  Saldo Devedor (R$)
                </label>
                <input
                  type="text"
                  required
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="0,00"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                  Taxa de Juros (% a.m.)
                </label>
                <input
                  type="text"
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                  placeholder="1.5"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                  Valor da Parcela (R$)
                </label>
                <input
                  type="text"
                  value={installmentVal}
                  onChange={(e) => setInstallmentVal(e.target.value)}
                  placeholder="0,00"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddDebtOpen(false)}
                className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-amber-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
              >
                Salvar Dívida
              </button>
            </div>
          </form>
        )}

        {/* Strategy selector: Avalanche vs Snowball */}
        <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-800 dark:bg-neutral-800/40">
          <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300 pl-2">
            Estratégia de Amortização:
          </span>
          <button
            onClick={() => setSelectedMethod('avalanche')}
            className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
              selectedMethod === 'avalanche'
                ? 'bg-white text-indigo-700 shadow-sm dark:bg-neutral-700 dark:text-indigo-300'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            🏔️ Método Avalanche (Maior Juros Primeiro - Matemático)
          </button>
          <button
            onClick={() => setSelectedMethod('snowball')}
            className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
              selectedMethod === 'snowball'
                ? 'bg-white text-indigo-700 shadow-sm dark:bg-neutral-700 dark:text-indigo-300'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            ⛄ Bola de Neve (Menor Saldo Primeiro - Psicológico)
          </button>
        </div>

        {/* Debts list */}
        {debts.length === 0 ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-8 text-center text-xs text-emerald-800 dark:border-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-300">
            Parabéns! Nenhuma dívida ativa cadastrada. Seu foco pode estar 100% em Reserva e Liberdade Financeira!
          </div>
        ) : (
          <div className="space-y-3">
            {debts.map((debt) => {
              const paidPercent =
                debt.totalInstallments > 0
                  ? Math.round(
                      ((debt.totalInstallments - debt.remainingInstallments) / debt.totalInstallments) *
                        100
                    )
                  : 0;

              return (
                <div
                  key={debt.id}
                  className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                          {debt.creditor}
                        </h4>
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                          Juros: {debt.interestRateMonthly}% a.m.
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        Restam {debt.remainingInstallments} parcelas de {formatBRL(debt.installmentAmount)}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] text-neutral-400 block">Saldo Restante</span>
                        <div className="text-base font-black text-neutral-900 dark:text-neutral-100">
                          {formatBRL(debt.currentBalance)}
                        </div>
                      </div>

                      <button
                        onClick={() => payDebtInstallment(debt.id, accounts[0]?.id || '')}
                        className="rounded-xl bg-neutral-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 transition-colors shadow-sm"
                      >
                        Pagar Parcela
                      </button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-[10px] text-neutral-500">
                      <span>Progresso da Quitação</span>
                      <span>{paidPercent}% pago</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all"
                        style={{ width: `${paidPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
