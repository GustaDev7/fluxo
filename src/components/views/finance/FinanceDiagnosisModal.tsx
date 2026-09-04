import React, { useState } from 'react';
import { useFinance } from '../../../context/FinanceContext';
import { FinancialDiagnosisData } from '../../../types/finance';
import { formatBRL } from '../../../utils/financeUtils';
import {
  X,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Wallet,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Target,
  FileCheck,
} from 'lucide-react';

export const FinanceDiagnosisModal: React.FC = () => {
  const { isDiagnosisModalOpen, closeDiagnosisModal, saveDiagnosis, diagnosis } = useFinance();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FinancialDiagnosisData>(diagnosis || {
    monthlyIncome: 5200,
    isIncomeVariable: false,
    fixedCosts: 2100,
    comfortCosts: 500,
    leisureCosts: 400,
    currentDebtTotal: 4200,
    monthlyDebtPayment: 420,
    emergencyFundAmount: 4500,
    currentInvested: 15765,
    monthlyTargetInvestment: 1200,
    mainGoals: 'Reserva de Emergência e compra de veículo',
  });

  if (!isDiagnosisModalOpen) return null;

  const totalSteps = 7;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      saveDiagnosis({
        ...formData,
        completedAt: new Date().toISOString(),
      });
      closeDiagnosisModal();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col rounded-3xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Diagnóstico Financeiro AUVP
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Etapa {step} de {totalSteps} • Estruturação do Orçamento
              </p>
            </div>
          </div>
          <button
            onClick={closeDiagnosisModal}
            className="rounded-xl p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                <Wallet className="h-6 w-6" />
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  Renda Mensal Líquida
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                Quanto dinheiro cai líquido na sua conta bancária todos os meses (já descontados impostos, INSS, etc)?
              </p>
              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Renda Média Mensal (R$)
                </label>
                <input
                  type="number"
                  value={formData.monthlyIncome}
                  onChange={(e) => setFormData({ ...formData, monthlyIncome: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 p-3.5 text-xl font-black text-neutral-900 outline-none focus:border-emerald-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="variableIncome"
                  checked={formData.isIncomeVariable}
                  onChange={(e) => setFormData({ ...formData, isIncomeVariable: e.target.checked })}
                  className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="variableIncome" className="text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  Minha renda é variável (comissões, autônomo, PJ ou freelas)
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                <ShieldCheck className="h-6 w-6" />
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  Custos Fixos e Essenciais
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                Gastos vitais que não podem ser cortados: Moradia, Energia, Água, Internet, Saúde, Alimentação básica e Transporte essencial. Recomendação AUVP: 40% a 50% da renda ({formatBRL(formData.monthlyIncome * 0.45)}).
              </p>
              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Total de Custos Fixos (R$)
                </label>
                <input
                  type="number"
                  value={formData.fixedCosts}
                  onChange={(e) => setFormData({ ...formData, fixedCosts: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 p-3.5 text-xl font-black text-neutral-900 outline-none focus:border-blue-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/40 p-3 rounded-xl">
                Comprometimento atual dos custos fixos:{' '}
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {formData.monthlyIncome > 0 ? Math.round((formData.fixedCosts / formData.monthlyIncome) * 100) : 0}% da renda
                </span>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                <CreditCard className="h-6 w-6" />
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  Dívidas e Empréstimos
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                Você possui dívidas onerosas (empréstimos, cheque especial, financiamentos ou rotativo de cartão)? Se não tiver, deixe zero.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Saldo Devedor Total (R$)
                  </label>
                  <input
                    type="number"
                    value={formData.currentDebtTotal}
                    onChange={(e) => setFormData({ ...formData, currentDebtTotal: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-sm font-bold text-neutral-900 outline-none focus:border-amber-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Parcela Mensal Atual (R$)
                  </label>
                  <input
                    type="number"
                    value={formData.monthlyDebtPayment}
                    onChange={(e) => setFormData({ ...formData, monthlyDebtPayment: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-sm font-bold text-neutral-900 outline-none focus:border-amber-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-6 w-6" />
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  Reserva de Emergência
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                Quanto você tem guardado hoje em investimentos de liquidez imediata (Tesouro Selic, CDB 100% CDI com resgate diário)? Meta segura recomendada: 6 meses de custos fixos ({formatBRL(formData.fixedCosts * 6)}).
              </p>
              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Valor Atual Guardado na Reserva (R$)
                </label>
                <input
                  type="number"
                  value={formData.emergencyFundAmount}
                  onChange={(e) => setFormData({ ...formData, emergencyFundAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 p-3.5 text-xl font-black text-neutral-900 outline-none focus:border-emerald-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/40 p-3 rounded-xl">
                Cobertura estimada:{' '}
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formData.fixedCosts > 0 ? (formData.emergencyFundAmount / formData.fixedCosts).toFixed(1) : '0'} meses de sobrevivência garantida
                </span>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-3 text-purple-600 dark:text-purple-400">
                <TrendingUp className="h-6 w-6" />
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  Patrimônio Investido
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                Qual é o valor total aproximado que você possui aplicado em ações, fundos imobiliários, renda fixa de médio/longo prazo e cripto?
              </p>
              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Patrimônio Atual Investido (R$)
                </label>
                <input
                  type="number"
                  value={formData.currentInvested}
                  onChange={(e) => setFormData({ ...formData, currentInvested: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 p-3.5 text-xl font-black text-neutral-900 outline-none focus:border-purple-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                <Target className="h-6 w-6" />
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  Principais Metas Financeiras
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                Quais são suas prioridades materiais para os próximos 1 a 3 anos (ex: viagem, comprar carro, dar entrada em imóvel, transição de carreira)?
              </p>
              <div>
                <textarea
                  rows={3}
                  value={formData.mainGoals}
                  onChange={(e) => setFormData({ ...formData, mainGoals: e.target.value })}
                  placeholder="Ex: Formar reserva de 12 mil e dar entrada no carro em 2027..."
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-900 outline-none focus:border-amber-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                <FileCheck className="h-6 w-6" />
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  Meta de Aporte Mensal & Finalização
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                Quanto você pretende investir mensalmente com disciplina para alcançar a Liberdade Financeira? (Recomendado AUVP: 20% a 30% da renda = {formatBRL(formData.monthlyIncome * 0.25)}).
              </p>
              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Meta de Aporte Mensal (R$)
                </label>
                <input
                  type="number"
                  value={formData.monthlyTargetInvestment}
                  onChange={(e) => setFormData({ ...formData, monthlyTargetInvestment: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 p-3.5 text-xl font-black text-neutral-900 outline-none focus:border-emerald-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                  Tudo pronto para calibrar seu Orçamento Base Zero!
                </h4>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                  Ao concluir, o Fluxo irá distribuir automaticamente cada real da sua renda em Custos Fixos, Conforto, Metas, Prazeres, Liberdade Financeira e Conhecimento.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
          <button
            type="button"
            disabled={step === 1}
            onClick={handleBack}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Voltar</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all"
          >
            <span>{step === totalSteps ? 'Gerar Orçamento Base Zero' : 'Próxima Etapa'}</span>
            {step === totalSteps ? <CheckCircle2 className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
