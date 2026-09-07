import React, { useState, useEffect } from 'react';
import { useFinance } from '../../../context/FinanceContext';
import { formatBRL } from '../../../utils/financeUtils';
import {
  X,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Wallet,
} from 'lucide-react';

export const EmergencyDepositModal: React.FC = () => {
  const {
    emergencyFund,
    accounts,
    depositToEmergencyFund,
    withdrawFromEmergencyFund,
    monthlyFreeCash,
    isEmergencyDepositModalOpen,
    closeEmergencyDepositModal,
  } = useFinance();

  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [amountInput, setAmountInput] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isEmergencyDepositModalOpen) {
      setAmountInput('');
      setNotes('');
      setIsSuccess(false);
      if (accounts.length > 0) {
        setSelectedAccountId(accounts[0].id);
      }
    }
  }, [isEmergencyDepositModalOpen, accounts]);

  if (!isEmergencyDepositModalOpen) return null;

  const amountNum = parseFloat(amountInput.replace(',', '.')) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amountNum <= 0) return;

    if (mode === 'deposit') {
      depositToEmergencyFund(amountNum, selectedAccountId || undefined, notes);
    } else {
      withdrawFromEmergencyFund(amountNum, selectedAccountId || undefined, notes);
    }

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      closeEmergencyDepositModal();
    }, 1000);
  };

  const quickAmounts = [100, 250, 500, 1000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col rounded-3xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-2xl ${
                mode === 'deposit'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                  : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
              }`}
            >
              {mode === 'deposit' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {mode === 'deposit' ? 'Guardar Dinheiro na Reserva' : 'Resgatar da Reserva de Emergência'}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Saldo Atual: <strong>{formatBRL(emergencyFund.currentAmount)}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={closeEmergencyDepositModal}
            className="rounded-xl p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode switcher tabs */}
        <div className="flex border-b border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => setMode('deposit')}
            className={`flex-1 py-2.5 text-xs font-bold transition-all ${
              mode === 'deposit'
                ? 'border-b-2 border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 bg-emerald-50/20'
                : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            + Guardar Dinheiro
          </button>
          <button
            type="button"
            onClick={() => setMode('withdraw')}
            className={`flex-1 py-2.5 text-xs font-bold transition-all ${
              mode === 'withdraw'
                ? 'border-b-2 border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400 bg-amber-50/20'
                : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            - Resgatar por Emergência
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Amount input */}
          <div>
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
              Valor (R$)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-neutral-400">
                R$
              </span>
              <input
                type="number"
                step="any"
                required
                min="0.01"
                autoFocus
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="0,00"
                className={`w-full rounded-2xl border py-3 pl-12 pr-4 text-2xl font-black outline-none transition-all ${
                  mode === 'deposit'
                    ? 'border-emerald-200 bg-emerald-50/30 text-emerald-950 focus:border-emerald-600 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-100'
                    : 'border-amber-200 bg-amber-50/30 text-amber-950 focus:border-amber-600 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100'
                }`}
              />
            </div>

            {/* Quick buttons */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {quickAmounts.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmountInput(String(val))}
                  className="rounded-xl border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                >
                  +{formatBRL(val)}
                </button>
              ))}
              {mode === 'deposit' && monthlyFreeCash > 0 && (
                <button
                  type="button"
                  onClick={() => setAmountInput(String(monthlyFreeCash))}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                  Toda a Sobra ({formatBRL(monthlyFreeCash)})
                </button>
              )}
            </div>
          </div>

          {/* Account link */}
          {accounts.length > 0 && (
            <div>
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                {mode === 'deposit' ? 'Debitar de qual conta?' : 'Creditar em qual conta?'}
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-medium text-neutral-900 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              >
                <option value="">Apenas atualizar o valor da reserva (sem debitar conta)</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatBRL(acc.balance)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
              Motivo ou Anotação (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                mode === 'deposit'
                  ? 'Ex: Economia do mês, 13º salário, extra...'
                  : 'Ex: Conserto urgente do carro, remédios...'
              }
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeEmergencyDepositModal}
              className="rounded-2xl border border-neutral-200 px-4 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={amountNum <= 0}
              className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all disabled:opacity-50 ${
                mode === 'deposit'
                  ? 'bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700'
                  : 'bg-amber-600 shadow-amber-600/20 hover:bg-amber-700'
              }`}
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{mode === 'deposit' ? 'Valor Guardado!' : 'Resgate Realizado!'}</span>
                </>
              ) : (
                <span>{mode === 'deposit' ? 'Confirmar Aporte' : 'Confirmar Resgate'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
