import React, { useState } from 'react';
import { useFinance } from '../../../context/FinanceContext';
import { MASTER_CATEGORY_CONFIG, formatBRL, formatPercent } from '../../../utils/financeUtils';
import { MasterCategory } from '../../../types/finance';
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Info,
  DollarSign,
  TrendingUp,
  Percent,
  Sliders,
} from 'lucide-react';

export const FinanceBudgetTab: React.FC = () => {
  const {
    budget,
    updateZeroBasedBudget,
    zeroBasedStatus,
    transactions,
  } = useFinance();

  const [plannedIncome, setPlannedIncome] = useState<number>(budget.plannedIncome || 5200);
  const [allocations, setAllocations] = useState(budget.allocations);
  const [isEditing, setIsEditing] = useState(false);

  // Calculate actual spending in this month per master category
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const actualSpentPerCategory: Record<MasterCategory, number> = {
    custos_fixos: 0,
    conforto: 0,
    metas: 0,
    prazeres: 0,
    liberdade_financeira: 0,
    conhecimento: 0,
  };

  transactions
    .filter((t) => t.date.startsWith(currentMonthStr))
    .forEach((t) => {
      if (t.type === 'expense' || t.type === 'investment' || t.type === 'debt_payment') {
        if (actualSpentPerCategory[t.masterCategory] !== undefined) {
          actualSpentPerCategory[t.masterCategory] += t.amount;
        }
      }
    });

  const handleSaveBudget = () => {
    updateZeroBasedBudget(allocations, plannedIncome);
    setIsEditing(false);
  };

  const handleAutoBalanceAUVP = () => {
    // 45% custos fixos, 12% conforto, 10% metas, 8% prazeres, 20% liberdade, 5% conhecimento
    const inc = plannedIncome || 5200;
    const balanced = {
      custos_fixos: Math.round(inc * 0.45),
      conforto: Math.round(inc * 0.12),
      metas: Math.round(inc * 0.10),
      prazeres: Math.round(inc * 0.08),
      liberdade_financeira: Math.round(inc * 0.20),
      conhecimento: Math.round(inc * 0.05),
    };
    setAllocations(balanced);
    updateZeroBasedBudget(balanced, inc);
  };

  const categories = Object.keys(MASTER_CATEGORY_CONFIG) as MasterCategory[];

  return (
    <div className="space-y-6">
      {/* Header & Status Card */}
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 pb-5 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Orçamento Base Zero AUVP
              </h2>
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                Cada real com seu destino
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              No Orçamento Base Zero, Renda Prevista menos Alocações deve ser exatamente igual a R$ 0,00.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAutoBalanceAUVP}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Equilibrar no Padrão AUVP</span>
            </button>

            {isEditing ? (
              <button
                type="button"
                onClick={handleSaveBudget}
                className="rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 transition-colors"
              >
                Salvar Alterações
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 transition-colors"
              >
                Editar Valores
              </button>
            )}
          </div>
        </div>

        {/* Income and Zero-Based Indicator */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-neutral-100 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              Renda Mensal Prevista
            </span>
            {isEditing ? (
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-sm font-bold text-neutral-500">R$</span>
                <input
                  type="number"
                  value={plannedIncome}
                  onChange={(e) => setPlannedIncome(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-neutral-300 bg-white p-1 text-base font-bold text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>
            ) : (
              <div className="text-xl font-black text-neutral-900 dark:text-neutral-100 mt-0.5">
                {formatBRL(budget.plannedIncome)}
              </div>
            )}
            <div className="text-[10px] text-neutral-400 mt-1">Base de distribuição 100%</div>
          </div>

          <div className="rounded-2xl border border-neutral-100 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              Total Alocado
            </span>
            <div className="text-xl font-black text-neutral-900 dark:text-neutral-100 mt-0.5">
              {formatBRL(zeroBasedStatus.totalAllocated)}
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">
              {zeroBasedStatus.percentageAllocated}% da renda distribuída
            </div>
          </div>

          {/* Status badge */}
          <div
            className={`rounded-2xl border p-4 flex flex-col justify-center ${
              zeroBasedStatus.status === 'balanced'
                ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200'
                : zeroBasedStatus.status === 'partially_planned'
                ? 'border-amber-200 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200'
                : 'border-rose-200 bg-rose-50/70 dark:border-rose-900/40 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {zeroBasedStatus.status === 'balanced' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
              )}
              <span className="text-xs font-bold">
                {zeroBasedStatus.status === 'balanced'
                  ? 'Orçamento 100% Equilibrado'
                  : zeroBasedStatus.status === 'partially_planned'
                  ? 'Sobrando sem Alocação'
                  : 'Orçamento Ultrapassado'}
              </span>
            </div>
            <div className="text-sm font-black mt-1">
              {zeroBasedStatus.status === 'balanced' ? (
                <span>Saldo não alocado: R$ 0,00</span>
              ) : (
                <span>Diferença: {formatBRL(Math.abs(zeroBasedStatus.unallocated))}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Categories Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((catKey) => {
          const catConfig = MASTER_CATEGORY_CONFIG[catKey];
          const plannedVal = isEditing ? allocations[catKey] || 0 : budget.allocations[catKey] || 0;
          const actualVal = actualSpentPerCategory[catKey] || 0;
          const pctOfIncome = budget.plannedIncome > 0 ? (plannedVal / budget.plannedIncome) * 100 : 0;
          const remainingToSpend = plannedVal - actualVal;
          const progressPct = plannedVal > 0 ? Math.min(100, Math.round((actualVal / plannedVal) * 100)) : 0;

          return (
            <div
              key={catKey}
              className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: catConfig.color }}
                    />
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      {catConfig.name}
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                    Alvo: {catConfig.recommendedShare}
                  </span>
                </div>

                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4">
                  {catConfig.description}
                </p>

                {/* Values row */}
                <div className="grid grid-cols-2 gap-3 bg-neutral-50 dark:bg-neutral-800/40 p-3 rounded-2xl mb-4">
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Planejado</span>
                    {isEditing ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xs font-bold text-neutral-500">R$</span>
                        <input
                          type="number"
                          value={allocations[catKey]}
                          onChange={(e) =>
                            setAllocations({
                              ...allocations,
                              [catKey]: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full rounded border border-neutral-300 bg-white px-1 py-0.5 text-xs font-bold text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                        />
                      </div>
                    ) : (
                      <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        {formatBRL(plannedVal)}
                      </div>
                    )}
                    <span className="text-[10px] text-neutral-400">{formatPercent(pctOfIncome)} da renda</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-400 block">Realizado</span>
                    <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      {formatBRL(actualVal)}
                    </div>
                    <span
                      className={`text-[10px] font-semibold ${
                        remainingToSpend >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {remainingToSpend >= 0
                        ? `Resta ${formatBRL(remainingToSpend)}`
                        : `Excedeu ${formatBRL(Math.abs(remainingToSpend))}`}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-neutral-500">Executado no mês</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">
                      {progressPct}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${progressPct}%`,
                        backgroundColor: progressPct > 100 ? '#EF4444' : catConfig.color,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 text-[10px] text-neutral-400 truncate">
                Exemplos: {catConfig.examples}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
