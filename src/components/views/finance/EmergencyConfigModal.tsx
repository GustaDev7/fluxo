import React, { useState, useEffect } from 'react';
import { useFinance } from '../../../context/FinanceContext';
import { formatBRL } from '../../../utils/financeUtils';
import {
  X,
  ShieldCheck,
  Sparkles,
  Calculator,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  Target,
} from 'lucide-react';

export const EmergencyConfigModal: React.FC = () => {
  const {
    emergencyFund,
    updateEmergencyFund,
    monthlyEssentialCosts,
    monthlyFreeCash,
    monthIncome,
    budget,
    diagnosis,
    isEmergencyConfigModalOpen,
    closeEmergencyConfigModal,
  } = useFinance();

  const [currentAmountInput, setCurrentAmountInput] = useState('');
  const [targetMonths, setTargetMonths] = useState(6);
  const [monthlyCostInput, setMonthlyCostInput] = useState('');
  const [monthlyContributionInput, setMonthlyContributionInput] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync with current context on open
  useEffect(() => {
    if (isEmergencyConfigModalOpen) {
      setCurrentAmountInput(emergencyFund.currentAmount ? String(emergencyFund.currentAmount) : '0');
      setTargetMonths(emergencyFund.targetMonths || 6);

      const baseCost =
        monthlyEssentialCosts > 0
          ? monthlyEssentialCosts
          : emergencyFund.targetAmount > 0
          ? Math.round(emergencyFund.targetAmount / (emergencyFund.targetMonths || 6))
          : 2500;

      setMonthlyCostInput(String(baseCost));

      const contribution = emergencyFund.monthlyContribution > 0
        ? emergencyFund.monthlyContribution
        : monthlyFreeCash > 0
        ? Math.min(monthlyFreeCash, 500)
        : 300;

      setMonthlyContributionInput(String(contribution));
      setSavedSuccess(false);
    }
  }, [isEmergencyConfigModalOpen, emergencyFund, monthlyEssentialCosts, monthlyFreeCash]);

  if (!isEmergencyConfigModalOpen) return null;

  const currentAmountNum = parseFloat(currentAmountInput.replace(',', '.')) || 0;
  const monthlyCostNum = parseFloat(monthlyCostInput.replace(',', '.')) || 0;
  const contributionNum = parseFloat(monthlyContributionInput.replace(',', '.')) || 0;

  const calculatedTarget = monthlyCostNum * targetMonths;
  const remainingToGoal = Math.max(0, calculatedTarget - currentAmountNum);
  const monthsToComplete = contributionNum > 0 ? Math.ceil(remainingToGoal / contributionNum) : 0;
  const coverageMonths = monthlyCostNum > 0 ? Math.round((currentAmountNum / monthlyCostNum) * 10) / 10 : 0;

  const effectiveIncome = monthIncome > 0 ? monthIncome : budget.plannedIncome || diagnosis.monthlyIncome || 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmergencyFund({
      currentAmount: currentAmountNum,
      targetAmount: calculatedTarget,
      targetMonths,
      monthlyContribution: contributionNum,
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      closeEmergencyConfigModal();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col rounded-3xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Configurar Minha Reserva de Emergência
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Diretrizes AUVP: Segurança antes de qualquer investimento
              </p>
            </div>
          </div>
          <button
            onClick={closeEmergencyConfigModal}
            className="rounded-xl p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Current amount */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 dark:border-emerald-950/60 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <span>1. Quanto você tem guardado hoje na reserva?</span>
              </label>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                Saldo Atual
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-400">
                R$
              </span>
              <input
                type="number"
                step="any"
                required
                min="0"
                value={currentAmountInput}
                onChange={(e) => setCurrentAmountInput(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-xl border border-emerald-200 bg-white py-2.5 pl-10 pr-4 text-lg font-black text-neutral-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2">
              Valor guardado em conta remunerada, CDB com liquidez diária ou Tesouro Selic.
            </p>
          </div>

          {/* 2. Monthly Essential Cost & Target Months */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block mb-1">
                2. Qual seu custo de vida essencial mensal? (Custos Fixos)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-400">
                  R$
                </span>
                <input
                  type="number"
                  step="any"
                  required
                  min="0"
                  value={monthlyCostInput}
                  onChange={(e) => setMonthlyCostInput(e.target.value)}
                  placeholder="Ex: 2500"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-sm font-bold text-neutral-900 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                Moradia, alimentação, contas básicas, saúde e transporte essencial.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block mb-2">
                Quantos meses de segurança você quer cobrir? (Perfil AUVP)
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { months: 3, label: '3 Meses', sub: 'CLT estável' },
                  { months: 6, label: '6 Meses', sub: 'Recomendado AUVP' },
                  { months: 12, label: '12 Meses', sub: 'Autônomo / PJ' },
                ].map((item) => {
                  const isSelected = targetMonths === item.months;
                  return (
                    <button
                      key={item.months}
                      type="button"
                      onClick={() => setTargetMonths(item.months)}
                      className={`flex flex-col items-center justify-center rounded-2xl border p-3 text-center transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                          : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-300'
                      }`}
                    >
                      <span className="text-sm font-black">{item.label}</span>
                      <span className="text-[10px] text-neutral-400 mt-0.5">{item.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Target Result Box */}
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Meta Calculada da Reserva:</span>
              <span className="text-base font-black text-neutral-900 dark:text-neutral-100">
                {formatBRL(calculatedTarget)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">Sua cobertura atual:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 inline" />
                <span>{coverageMonths} meses garantidos</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">Faltam para atingir 100%:</span>
              <span className="font-bold text-neutral-800 dark:text-neutral-200">
                {formatBRL(remainingToGoal)}
              </span>
            </div>
          </div>

          {/* 3. Monthly Contribution (How much can I put?) */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 dark:border-indigo-950/50 dark:bg-indigo-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <Calculator className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>3. Quanto você pode colocar por mês?</span>
              </label>
            </div>

            {effectiveIncome > 0 && (
              <div className="rounded-xl bg-white/80 p-2.5 text-xs text-neutral-600 dark:bg-neutral-800/80 dark:text-neutral-300">
                Renda mensal: <strong>{formatBRL(effectiveIncome)}</strong> • Custos essenciais:{' '}
                <strong>{formatBRL(monthlyCostNum)}</strong>
                {monthlyFreeCash > 0 ? (
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-300 font-semibold mt-1 flex items-center gap-1">
                    <Lightbulb className="h-3.5 w-3.5 inline text-amber-500 shrink-0" />
                    <span>Você tem aproximadamente <strong>{formatBRL(monthlyFreeCash)}</strong> livres por mês.</span>
                  </p>
                ) : null}
              </div>
            )}

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-400">
                R$
              </span>
              <input
                type="number"
                step="any"
                required
                min="0"
                value={monthlyContributionInput}
                onChange={(e) => setMonthlyContributionInput(e.target.value)}
                placeholder="Ex: 500"
                className="w-full rounded-xl border border-indigo-200 bg-white py-2.5 pl-10 pr-4 text-sm font-bold text-neutral-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>

            {contributionNum > 0 && remainingToGoal > 0 && (
              <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium flex items-center gap-1">
                <Target className="h-3.5 w-3.5 inline shrink-0" />
                <span>
                  Aportando <strong>{formatBRL(contributionNum)}/mês</strong>, você completará sua reserva em{' '}
                  <strong>~{monthsToComplete} meses</strong>!
                </span>
              </p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeEmergencyConfigModal}
              className="rounded-2xl border border-neutral-200 px-4 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Reserva Configurada!</span>
                </>
              ) : (
                <span>Salvar Configuração</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
