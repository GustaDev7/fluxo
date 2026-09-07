import React, { useState } from 'react';
import { useFinance } from '../../../context/FinanceContext';
import { formatBRL, formatPercent } from '../../../utils/financeUtils';
import {
  ShieldCheck,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Settings2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  Calculator,
  Lock,
  Landmark,
  PiggyBank,
  TrendingUp,
  Lightbulb,
} from 'lucide-react';

export const FinanceEmergencyTab: React.FC = () => {
  const {
    emergencyFund,
    emergencyCoverage,
    monthlyEssentialCosts,
    monthlyFreeCash,
    recommendedEmergencyTarget,
    monthIncome,
    budget,
    diagnosis,
    openEmergencyConfigModal,
    openEmergencyDepositModal,
  } = useFinance();

  const [simulatedContribution, setSimulatedContribution] = useState<number>(
    emergencyFund.monthlyContribution || (monthlyFreeCash > 0 ? Math.min(monthlyFreeCash, 500) : 300)
  );

  const targetAmount = emergencyFund.targetAmount || recommendedEmergencyTarget || 15000;
  const currentAmount = emergencyFund.currentAmount || 0;
  const progressPct = targetAmount > 0 ? Math.min(100, Math.round((currentAmount / targetAmount) * 100)) : 0;
  const remainingAmount = Math.max(0, targetAmount - currentAmount);

  const monthsToCompleteSimulated =
    simulatedContribution > 0 ? Math.ceil(remainingAmount / simulatedContribution) : 0;

  const effectiveIncome = monthIncome > 0 ? monthIncome : budget.plannedIncome || diagnosis.monthlyIncome || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Hero Headline & Quick Actions */}
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 md:p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                Pilar Fundamental AUVP
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  emergencyCoverage.status === 'safe'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                    : emergencyCoverage.status === 'critical'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                }`}
              >
                {emergencyCoverage.status === 'safe'
                  ? 'Blindagem Completa'
                  : emergencyCoverage.status === 'critical'
                  ? 'Prioridade Urgente'
                  : 'Em Construção'}
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-100">
              Reserva de Emergência
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-2xl leading-relaxed">
              Na metodologia AUVP, a reserva não foi feita para te enriquecer, mas sim para impedir que você empobreça. Ela garante que nenhum imprevisto te force a contrair dívidas ou vender investimentos no pior momento.
            </p>
          </div>

          {/* Top Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 sm:self-start lg:self-auto">
            <button
              onClick={openEmergencyDepositModal}
              className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Guardar na Reserva</span>
            </button>

            <button
              onClick={openEmergencyConfigModal}
              className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 transition-colors"
            >
              <Settings2 className="h-4 w-4" />
              <span>Configurar Minha Reserva</span>
            </button>
          </div>
        </div>

        {/* Big Numbers Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 dark:border-emerald-950/60 dark:bg-emerald-950/20">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              Saldo Atual Guardado
            </span>
            <div className="text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {formatBRL(currentAmount)}
            </div>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1 mt-1">
              <ShieldCheck className="h-3.5 w-3.5 inline" />
              <span>{emergencyCoverage.monthsCovered} meses de contas pagas</span>
            </span>
          </div>

          <div className="rounded-2xl border border-neutral-100 bg-neutral-50/80 p-5 dark:border-neutral-800 dark:bg-neutral-800/40">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              Meta da Reserva ({emergencyFund.targetMonths || 6} Meses)
            </span>
            <div className="text-2xl md:text-3xl font-black text-neutral-900 dark:text-neutral-100 mt-1">
              {formatBRL(targetAmount)}
            </div>
            <span className="text-[11px] text-neutral-400 block mt-1">
              {monthlyEssentialCosts > 0 ? `${formatBRL(monthlyEssentialCosts)}/mês de custo fixo` : 'Definido na meta'}
            </span>
          </div>

          <div className="rounded-2xl border border-neutral-100 bg-neutral-50/80 p-5 dark:border-neutral-800 dark:bg-neutral-800/40">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              Quanto Falta Guardar
            </span>
            <div className="text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              {formatBRL(remainingAmount)}
            </div>
            <span className="text-[11px] text-neutral-400 block mt-1">
              {remainingAmount === 0 ? 'Meta 100% batida!' : `${progressPct}% concluído`}
            </span>
          </div>

          <div className="rounded-2xl border border-neutral-100 bg-neutral-50/80 p-5 dark:border-neutral-800 dark:bg-neutral-800/40">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              Aporte Mensal Atual
            </span>
            <div className="text-2xl md:text-3xl font-black text-neutral-900 dark:text-neutral-100 mt-1">
              {formatBRL(emergencyFund.monthlyContribution || 0)}
            </div>
            <span className="text-[11px] text-neutral-400 block mt-1">
              {emergencyFund.monthlyContribution > 0 && remainingAmount > 0
                ? `~${Math.ceil(remainingAmount / emergencyFund.monthlyContribution)} meses restantes`
                : 'Definir aporte mensal'}
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-600 dark:text-neutral-400">
              Progresso até a Blindagem Total
            </span>
            <span className="font-black text-neutral-900 dark:text-neutral-100">
              {progressPct}% ({formatBRL(currentAmount)} de {formatBRL(targetAmount)})
            </span>
          </div>
          <div className="h-3.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Interactive Calculator: "Quanto posso colocar na reserva?" */}
      <div className="rounded-3xl border border-indigo-100 bg-white p-6 md:p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-3 border-b border-neutral-100 pb-4 dark:border-neutral-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Quanto posso colocar na minha reserva?
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Cálculo em tempo real do seu fluxo de caixa mensal
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Cash flow breakdown */}
          <div className="lg:col-span-6 space-y-4">
            <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800/50 space-y-3">
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block">
                Seu Fluxo de Caixa Mensal
              </span>

              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">Renda Mensal:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  + {formatBRL(effectiveIncome)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">Custos Essenciais Fixos:</span>
                <span className="font-bold text-neutral-700 dark:text-neutral-300">
                  - {formatBRL(monthlyEssentialCosts)}
                </span>
              </div>

              <div className="border-t border-neutral-200/60 dark:border-neutral-700 pt-2 flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Margem Livre Máxima:
                </span>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                  {formatBRL(monthlyFreeCash)} / mês
                </span>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400 flex items-start gap-1.5">
              <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong>Regra da AUVP:</strong> Se você tem dívidas caras (como rotativo de cartão ou cheque especial), quite-as primeiro. Se não tem dívidas de juros altos, direcione o máximo possível da sua sobra mensal para montar a reserva antes de se preocupar com ações ou fundos imobiliários.
              </span>
            </p>
          </div>

          {/* Right: Simulation slider and result */}
          <div className="lg:col-span-6 rounded-2xl border border-neutral-200 bg-neutral-50/50 p-5 dark:border-neutral-800 dark:bg-neutral-800/30 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Simular Aporte Mensal:
                </label>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {formatBRL(simulatedContribution)} / mês
                </span>
              </div>

              <input
                type="range"
                min="50"
                max={Math.max(2000, Math.round(monthlyFreeCash * 1.5) || 2000)}
                step="50"
                value={simulatedContribution}
                onChange={(e) => setSimulatedContribution(Number(e.target.value))}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:bg-neutral-700"
              />

              <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                <span>R$ 50</span>
                <span>R$ 500</span>
                <span>R$ 1.000</span>
                <span>{formatBRL(Math.max(2000, Math.round(monthlyFreeCash * 1.5) || 2000))}</span>
              </div>
            </div>

            {/* Projection Box */}
            <div className="rounded-xl bg-white p-4 shadow-xs dark:bg-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">Tempo estimado com este aporte:</span>
                <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                  ~{monthsToCompleteSimulated} meses
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Guardando <strong>{formatBRL(simulatedContribution)}</strong> todo mês, você atinge os{' '}
                <strong>{formatBRL(targetAmount)}</strong> da sua reserva em aproximadamente{' '}
                <strong>{monthsToCompleteSimulated} meses</strong>.
              </p>
            </div>

            <button
              onClick={openEmergencyDepositModal}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <ArrowUpRight className="h-4 w-4" />
              <span>Fazer Aporte com Esse Valor Agora</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Guia Rápido AUVP Sem Complexidade */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Landmark className="h-5 w-5" />
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Onde deixar o dinheiro?
            </h4>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Em ativos com <strong>liquidez imediata ou diária</strong> e risco quase zero: Tesouro Selic, CDB de banco sólido rendendo 100% do CDI com resgate diário, ou conta remunerada.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 space-y-2">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              O que NÃO fazer?
            </h4>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Nunca coloque reserva em Ações, Fundos Imobiliários, Cripto ou investimentos travados com carência. Reserva de emergência <strong>não é para especular</strong>.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Lock className="h-5 w-5" />
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Quando usar a reserva?
            </h4>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Apenas em <strong>imprevistos graves e inadiáveis</strong>: emergências médicas, perda de emprego/renda ou conserto essencial. Nunca para viagens ou compras por impulso.
          </p>
        </div>
      </div>
    </div>
  );
};
