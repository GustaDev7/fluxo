import React, { useState } from 'react';
import { useFinance } from '../../../context/FinanceContext';
import {
  formatBRL,
  formatPercent,
  calculateAmortizationEstimate,
  calculateInstallmentPrice,
  calculateBalancePrice,
  calculateDebtInterestBreakdown,
  getDebtDueDateStatus,
  AmortizationEstimate,
} from '../../../utils/financeUtils';
import { FinanceDebt } from '../../../types/finance';
import {
  ShieldCheck,
  Plus,
  X,
  Percent,
  Layers,
  Edit2,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Minus,
  AlertCircle,
  HelpCircle,
  Calendar,
  Zap,
  Sparkles,
  TrendingDown,
  ArrowRight,
  Clock,
  PiggyBank,
  Flame,
  Info,
  DollarSign,
} from 'lucide-react';

export const FinanceDebtsTab: React.FC = () => {
  const {
    debts,
    emergencyFund,
    accounts,
    payDebtInstallment,
    unpayDebtInstallment,
    addDebt,
    updateDebt,
    deleteDebt,
    addTransaction,
    emergencyCoverage,
    setSubTab,
  } = useFinance();

  // Modal / Form States
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<FinanceDebt | null>(null);

  // Pay Installment Confirmation Modal
  const [payingDebt, setPayingDebt] = useState<FinanceDebt | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  // Extra Amortization Modal
  const [amortizingDebt, setAmortizingDebt] = useState<FinanceDebt | null>(null);
  const [simExtraAmount, setSimExtraAmount] = useState<number>(100);
  const [extraAmortizationAmount, setExtraAmortizationAmount] = useState<string>('100');
  const [amortizationAccountId, setAmortizationAccountId] = useState<string>('');
  const [amortizationType, setAmortizationType] = useState<'balance' | 'last_installment'>('balance');

  // Delete Confirmation Modal
  const [deletingDebtId, setDeletingDebtId] = useState<string | null>(null);

  // Add Form Fields
  const [creditor, setCreditor] = useState('');
  const [balance, setBalance] = useState('');
  const [interest, setInterest] = useState('1.5');
  const [installmentVal, setInstallmentVal] = useState('');
  const [totalInst, setTotalInst] = useState('12');
  const [paidInst, setPaidInst] = useState('0');
  const [dueDay, setDueDay] = useState('10');
  const [priority, setPriority] = useState<FinanceDebt['priority']>('high');

  // Edit Form Fields
  const [editCreditor, setEditCreditor] = useState('');
  const [editBalance, setEditBalance] = useState('');
  const [editInterest, setEditInterest] = useState('');
  const [editInstallmentVal, setEditInstallmentVal] = useState('');
  const [editTotalInst, setEditTotalInst] = useState('');
  const [editPaidInst, setEditPaidInst] = useState('');
  const [editDueDay, setEditDueDay] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'paid'>('active');

  const [selectedMethod, setSelectedMethod] = useState<'avalanche' | 'snowball'>('avalanche');

  // --- Handlers for Add Form ---
  const handleOpenAdd = () => {
    setCreditor('');
    setBalance('');
    setInterest('4.0');
    setInstallmentVal('');
    setTotalInst('12');
    setPaidInst('0');
    setDueDay('10');
    setPriority('high');
    setIsAddDebtOpen(true);
  };

  const handleAddTotalChange = (val: string) => {
    setTotalInst(val);
    const tot = parseInt(val, 10) || 0;
    const paid = parseInt(paidInst, 10) || 0;
    const rem = Math.max(0, tot - paid);
    const inst = parseFloat(installmentVal.replace(',', '.')) || 0;
    const rate = parseFloat(interest.replace(',', '.')) || 0;
    if (inst > 0 && rem > 0) {
      const pv = calculateBalancePrice(inst, rem, rate);
      setBalance(pv.toFixed(2));
    }
  };

  const handleAddPaidChange = (val: string) => {
    setPaidInst(val);
    const tot = parseInt(totalInst, 10) || 0;
    const paid = parseInt(val, 10) || 0;
    const rem = Math.max(0, tot - paid);
    const inst = parseFloat(installmentVal.replace(',', '.')) || 0;
    const rate = parseFloat(interest.replace(',', '.')) || 0;
    if (inst > 0 && rem > 0) {
      const pv = calculateBalancePrice(inst, rem, rate);
      setBalance(pv.toFixed(2));
    }
  };

  const handleAddInstallmentChange = (val: string) => {
    setInstallmentVal(val);
    const inst = parseFloat(val.replace(',', '.')) || 0;
    const tot = parseInt(totalInst, 10) || 0;
    const paid = parseInt(paidInst, 10) || 0;
    const rem = Math.max(0, tot - paid);
    const rate = parseFloat(interest.replace(',', '.')) || 0;
    if (rem > 0 && inst > 0) {
      const pv = calculateBalancePrice(inst, rem, rate);
      setBalance(pv.toFixed(2));
    }
  };

  const handleAddBalanceChange = (val: string) => {
    setBalance(val);
    const bal = parseFloat(val.replace(',', '.')) || 0;
    const tot = parseInt(totalInst, 10) || 0;
    const paid = parseInt(paidInst, 10) || 0;
    const rem = Math.max(0, tot - paid);
    const rate = parseFloat(interest.replace(',', '.')) || 0;
    if (rem > 0 && bal > 0) {
      const pmt = calculateInstallmentPrice(bal, rem, rate);
      setInstallmentVal(pmt.toFixed(2));
    }
  };

  const handleAddInterestChange = (val: string) => {
    setInterest(val);
    const rate = parseFloat(val.replace(',', '.')) || 0;
    const inst = parseFloat(installmentVal.replace(',', '.')) || 0;
    const tot = parseInt(totalInst, 10) || 0;
    const paid = parseInt(paidInst, 10) || 0;
    const rem = Math.max(0, tot - paid);
    if (inst > 0 && rem > 0) {
      const pv = calculateBalancePrice(inst, rem, rate);
      setBalance(pv.toFixed(2));
    }
  };

  const handleSyncAddBalancePrice = () => {
    const tot = parseInt(totalInst, 10) || 0;
    const paid = parseInt(paidInst, 10) || 0;
    const rem = Math.max(0, tot - paid);
    const inst = parseFloat(installmentVal.replace(',', '.')) || 0;
    const rate = parseFloat(interest.replace(',', '.')) || 0;
    const pv = calculateBalancePrice(inst, rem, rate);
    setBalance(pv.toFixed(2));
  };

  const handleSyncAddInstallmentPrice = () => {
    const tot = parseInt(totalInst, 10) || 0;
    const paid = parseInt(paidInst, 10) || 0;
    const rem = Math.max(0, tot - paid);
    const bal = parseFloat(balance.replace(',', '.')) || 0;
    const rate = parseFloat(interest.replace(',', '.')) || 0;
    const pmt = calculateInstallmentPrice(bal, rem, rate);
    setInstallmentVal(pmt.toFixed(2));
  };

  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const balanceNum = parseFloat(balance.replace(',', '.')) || 0;
    const totalInstNum = parseInt(totalInst, 10) || 12;
    const paidInstNum = Math.min(totalInstNum, parseInt(paidInst, 10) || 0);
    const remainingInstNum = Math.max(0, totalInstNum - paidInstNum);
    const rateNum = parseFloat(interest.replace(',', '.')) || 0;
    const installmentNum =
      parseFloat(installmentVal.replace(',', '.')) ||
      (remainingInstNum > 0 ? calculateInstallmentPrice(balanceNum, remainingInstNum, rateNum) : 0);

    if (!creditor || !balanceNum) return;

    addDebt({
      creditor,
      type: 'financing',
      originalAmount: balanceNum,
      currentBalance: balanceNum,
      interestRateMonthly: rateNum,
      totalInstallments: totalInstNum,
      remainingInstallments: remainingInstNum,
      installmentAmount: installmentNum,
      dueDay: parseInt(dueDay, 10) || 10,
      priority,
      status: remainingInstNum === 0 ? 'paid' : 'active',
    });

    setIsAddDebtOpen(false);
  };

  // --- Handlers for Edit Form (with Tabela Price Compound Interest Recalculation) ---
  const handleOpenEdit = (debt: FinanceDebt) => {
    const paidCount = Math.max(0, debt.totalInstallments - debt.remainingInstallments);
    setEditingDebt(debt);
    setEditCreditor(debt.creditor);
    setEditBalance(String(debt.currentBalance));
    setEditInterest(String(debt.interestRateMonthly));
    setEditInstallmentVal(String(debt.installmentAmount));
    setEditTotalInst(String(debt.totalInstallments));
    setEditPaidInst(String(paidCount));
    setEditDueDay(String(debt.dueDay || 10));
    setEditStatus(debt.status);
  };

  const handleEditTotalChange = (val: string) => {
    setEditTotalInst(val);
    const tot = parseInt(val, 10) || 0;
    const paid = parseInt(editPaidInst, 10) || 0;
    const validPaid = Math.min(tot, paid);
    if (paid !== validPaid) setEditPaidInst(String(validPaid));

    const remaining = Math.max(0, tot - validPaid);
    const inst = parseFloat(editInstallmentVal.replace(',', '.')) || 0;
    const rate = parseFloat(editInterest.replace(',', '.')) || 0;
    if (inst > 0 && remaining > 0) {
      const pv = calculateBalancePrice(inst, remaining, rate);
      setEditBalance(pv.toFixed(2));
    }
  };

  const handleEditPaidChange = (val: string) => {
    const tot = parseInt(editTotalInst, 10) || 0;
    const rawPaid = parseInt(val, 10) || 0;
    const validPaid = Math.max(0, Math.min(tot, rawPaid));
    setEditPaidInst(String(validPaid));

    const remaining = Math.max(0, tot - validPaid);
    const inst = parseFloat(editInstallmentVal.replace(',', '.')) || 0;
    const rate = parseFloat(editInterest.replace(',', '.')) || 0;
    if (inst > 0 && remaining > 0) {
      const pv = calculateBalancePrice(inst, remaining, rate);
      setEditBalance(pv.toFixed(2));
    }
  };

  const handleEditInstallmentChange = (val: string) => {
    setEditInstallmentVal(val);
    const inst = parseFloat(val.replace(',', '.')) || 0;
    const tot = parseInt(editTotalInst, 10) || 0;
    const paid = parseInt(editPaidInst, 10) || 0;
    const remaining = Math.max(0, tot - paid);
    const rate = parseFloat(editInterest.replace(',', '.')) || 0;
    if (remaining > 0 && inst > 0) {
      const pv = calculateBalancePrice(inst, remaining, rate);
      setEditBalance(pv.toFixed(2));
    }
  };

  const handleEditBalanceChange = (val: string) => {
    setEditBalance(val);
    const bal = parseFloat(val.replace(',', '.')) || 0;
    const tot = parseInt(editTotalInst, 10) || 0;
    const paid = parseInt(editPaidInst, 10) || 0;
    const remaining = Math.max(0, tot - paid);
    const rate = parseFloat(editInterest.replace(',', '.')) || 0;
    if (remaining > 0 && bal > 0) {
      const pmt = calculateInstallmentPrice(bal, remaining, rate);
      setEditInstallmentVal(pmt.toFixed(2));
    }
  };

  const handleEditInterestChange = (val: string) => {
    setEditInterest(val);
    const rate = parseFloat(val.replace(',', '.')) || 0;
    const inst = parseFloat(editInstallmentVal.replace(',', '.')) || 0;
    const tot = parseInt(editTotalInst, 10) || 0;
    const paid = parseInt(editPaidInst, 10) || 0;
    const remaining = Math.max(0, tot - paid);
    if (inst > 0 && remaining > 0) {
      const pv = calculateBalancePrice(inst, remaining, rate);
      setEditBalance(pv.toFixed(2));
    }
  };

  const handleSyncBalanceFromInstallments = () => {
    const tot = parseInt(editTotalInst, 10) || 0;
    const paid = parseInt(editPaidInst, 10) || 0;
    const remaining = Math.max(0, tot - paid);
    const inst = parseFloat(editInstallmentVal.replace(',', '.')) || 0;
    const rate = parseFloat(editInterest.replace(',', '.')) || 0;
    const pv = calculateBalancePrice(inst, remaining, rate);
    setEditBalance(pv.toFixed(2));
  };

  const handleSyncInstallmentFromBalance = () => {
    const tot = parseInt(editTotalInst, 10) || 0;
    const paid = parseInt(editPaidInst, 10) || 0;
    const remaining = Math.max(0, tot - paid);
    const bal = parseFloat(editBalance.replace(',', '.')) || 0;
    const rate = parseFloat(editInterest.replace(',', '.')) || 0;
    if (remaining > 0 && bal > 0) {
      const pmt = calculateInstallmentPrice(bal, remaining, rate);
      setEditInstallmentVal(pmt.toFixed(2));
    }
  };

  const handleSyncSimpleNominal = () => {
    const tot = parseInt(editTotalInst, 10) || 0;
    const paid = parseInt(editPaidInst, 10) || 0;
    const remaining = Math.max(0, tot - paid);
    const inst = parseFloat(editInstallmentVal.replace(',', '.')) || 0;
    setEditBalance((remaining * inst).toFixed(2));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDebt) return;

    const totalNum = parseInt(editTotalInst, 10) || 1;
    const paidNum = Math.max(0, Math.min(totalNum, parseInt(editPaidInst, 10) || 0));
    const remainingNum = Math.max(0, totalNum - paidNum);
    const balanceNum = parseFloat(editBalance.replace(',', '.')) || 0;
    const installmentNum = parseFloat(editInstallmentVal.replace(',', '.')) || 0;
    const interestNum = parseFloat(editInterest.replace(',', '.')) || 0;
    const dueDayNum = parseInt(editDueDay, 10) || 10;

    updateDebt(editingDebt.id, {
      creditor: editCreditor,
      totalInstallments: totalNum,
      remainingInstallments: remainingNum,
      currentBalance: balanceNum,
      installmentAmount: installmentNum,
      interestRateMonthly: interestNum,
      dueDay: dueDayNum,
      status: remainingNum === 0 ? 'paid' : editStatus,
    });

    setEditingDebt(null);
  };

  const handleConfirmPay = () => {
    if (!payingDebt) return;
    payDebtInstallment(payingDebt.id, selectedAccountId || undefined);
    setPayingDebt(null);
  };

  // --- Handlers for Extra Amortization Registration ---
  const handleOpenAmortizeModal = (debt: FinanceDebt, type: 'balance' | 'last_installment' = 'balance') => {
    setAmortizingDebt(debt);
    setAmortizationType(type);
    setSelectedAccountId(accounts[0]?.id || '');
    setSimExtraAmount(100);

    if (type === 'last_installment') {
      const est = calculateAmortizationEstimate(
        debt.currentBalance,
        debt.installmentAmount,
        debt.remainingInstallments,
        debt.interestRateMonthly,
        100
      );
      setExtraAmortizationAmount(String(est.lastInstallmentDiscount.discountedAmount));
    } else {
      setExtraAmortizationAmount('100');
    }
  };

  const handleExecuteAmortization = () => {
    if (!amortizingDebt) return;

    const amortAmt = parseFloat(extraAmortizationAmount.replace(',', '.')) || 0;
    if (amortAmt <= 0) return;

    if (amortizationType === 'last_installment') {
      // It eliminates 1 installment from the back!
      const newRemaining = Math.max(0, amortizingDebt.remainingInstallments - 1);
      const newBalance = Math.max(0, amortizingDebt.currentBalance - amortizingDebt.installmentAmount);

      updateDebt(amortizingDebt.id, {
        remainingInstallments: newRemaining,
        currentBalance: newBalance,
        status: newRemaining === 0 ? 'paid' : 'active',
      });

      addTransaction({
        type: 'debt_payment',
        amount: amortAmt,
        date: new Date().toISOString().split('T')[0],
        description: `Amortização Última Parcela: ${amortizingDebt.creditor} (Com Desconto)`,
        masterCategory: 'custos_fixos',
        subcategory: 'Amortização Extra',
        accountId: amortizationAccountId || undefined,
        tags: ['amortização', 'antecipação', 'desconto_juros'],
      });
    } else {
      // Deducts directly from principal balance
      const newBalance = Math.max(0, amortizingDebt.currentBalance - amortAmt);
      // Recalculate remaining installments if installment amount is maintained
      let newRemaining = amortizingDebt.remainingInstallments;
      if (amortizingDebt.installmentAmount > 0) {
        newRemaining = Math.ceil(newBalance / amortizingDebt.installmentAmount);
      }

      updateDebt(amortizingDebt.id, {
        currentBalance: newBalance,
        remainingInstallments: newRemaining,
        status: newBalance <= 0.01 ? 'paid' : 'active',
      });

      addTransaction({
        type: 'debt_payment',
        amount: amortAmt,
        date: new Date().toISOString().split('T')[0],
        description: `Amortização Extra: ${amortizingDebt.creditor}`,
        masterCategory: 'custos_fixos',
        subcategory: 'Amortização Extra',
        accountId: amortizationAccountId || undefined,
        tags: ['amortização', 'abatimento_principal'],
      });
    }

    setAmortizingDebt(null);
  };

  const totalDebtBalance = debts.reduce(
    (acc, d) => (d.status === 'active' ? acc + d.currentBalance : 0),
    0
  );
  const totalMonthlyPayment = debts.reduce(
    (acc, d) => (d.status === 'active' ? acc + d.installmentAmount : 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* Quick Link to Dedicated Emergency Fund */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5 dark:border-emerald-950/60 dark:bg-emerald-950/20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Reserva de Emergência: {formatBRL(emergencyFund.currentAmount)} (
              {emergencyCoverage.monthsCovered} meses cobertos)
            </h4>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Consulte sua capacidade mensal de aportes, defina sua meta e guarde dinheiro na aba dedicada.
            </p>
          </div>
        </div>
        <button
          onClick={() => setSubTab('emergency')}
          className="flex items-center gap-1.5 self-start sm:self-auto whitespace-nowrap rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
        >
          <span>Abrir Reserva de Emergência</span>
        </button>
      </div>

      {/* 2. Debts Section */}
      <div className="space-y-5">
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
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 rounded-2xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Cadastrar Dívida</span>
          </button>
        </div>

        {/* Strategy selector: Avalanche vs Snowball */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-800 dark:bg-neutral-800/40">
          <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300 pl-2">
            Estratégia de Priorização:
          </span>
          <button
            onClick={() => setSelectedMethod('avalanche')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-bold transition-all ${
              selectedMethod === 'avalanche'
                ? 'bg-white text-indigo-700 shadow-sm dark:bg-neutral-700 dark:text-indigo-300'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Percent className="h-3.5 w-3.5 inline" />
            <span>Método Avalanche (Maior Juros Primeiro - Economiza Mais)</span>
          </button>
          <button
            onClick={() => setSelectedMethod('snowball')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-bold transition-all ${
              selectedMethod === 'snowball'
                ? 'bg-white text-indigo-700 shadow-sm dark:bg-neutral-700 dark:text-indigo-300'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Layers className="h-3.5 w-3.5 inline" />
            <span>Bola de Neve (Menor Saldo Primeiro - Motivação)</span>
          </button>
        </div>

        {/* Debts list */}
        {debts.length === 0 ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-8 text-center text-xs text-emerald-800 dark:border-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-300">
            Parabéns! Nenhuma dívida ativa cadastrada. Seu foco pode estar 100% em Reserva e Liberdade Financeira!
          </div>
        ) : (
          <div className="space-y-6">
            {debts.map((debt) => {
              const total = Math.max(1, debt.totalInstallments);
              const remaining = Math.max(0, Math.min(total, debt.remainingInstallments));
              const paid = Math.max(0, total - remaining);
              const paidPercent = Math.round((paid / total) * 100);
              const dueDateStatus = getDebtDueDateStatus(debt.dueDay || 10);
              const interestBreakdown = calculateDebtInterestBreakdown(
                debt.currentBalance,
                debt.installmentAmount,
                remaining,
                debt.interestRateMonthly
              );

              return (
                <div
                  key={debt.id}
                  className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 transition-all hover:border-neutral-300 dark:hover:border-neutral-700 space-y-4"
                >
                  {/* Top Card Row */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Creditor & Badges */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                          {debt.creditor}
                        </h4>
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                          Juros: {debt.interestRateMonthly}% a.m.
                        </span>
                        {debt.status === 'paid' ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                            Quitada
                          </span>
                        ) : dueDateStatus.isToday ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white animate-pulse shadow-xs">
                            <Flame className="h-3 w-3" />
                            <span>VENCE HOJE ({dueDateStatus.formattedDate})</span>
                          </span>
                        ) : dueDateStatus.isUrgent ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                            <Clock className="h-3 w-3" />
                            <span>VENCE EM {dueDateStatus.daysRemaining} DIAS ({dueDateStatus.formattedDate})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300">
                            <Calendar className="h-3 w-3 text-indigo-500" />
                            <span>Vencimento dia {debt.dueDay || 10} • Próx: {dueDateStatus.formattedDate}</span>
                          </span>
                        )}
                      </div>

                      {/* Explicit Installment Numbers */}
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                          Parcela {paid} de {total}
                        </span>
                        <span className="text-neutral-400">•</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          Restam {remaining} {remaining === 1 ? 'parcela' : 'parcelas'} de {formatBRL(debt.installmentAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Right: Balance & Interactive Controls */}
                    <div className="flex items-center gap-4 self-end lg:self-auto flex-wrap">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-semibold text-neutral-400 block tracking-wider">
                          Saldo Restante (Valor Presente)
                        </span>
                        <div className="text-lg font-black text-neutral-900 dark:text-neutral-100">
                          {formatBRL(debt.currentBalance)}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800/70 p-1 rounded-2xl">
                        {/* Undo installment payment */}
                        <button
                          type="button"
                          title="Desfazer última parcela paga (retorna 1 parcela)"
                          disabled={paid <= 0}
                          onClick={() => unpayDebtInstallment(debt.id)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                            paid > 0
                              ? 'bg-white text-neutral-700 shadow-xs hover:bg-neutral-50 hover:text-amber-600 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:text-amber-400'
                              : 'opacity-40 cursor-not-allowed text-neutral-400'
                          }`}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Desfazer</span>
                        </button>

                        {/* Pay Regular Installment */}
                        <button
                          type="button"
                          disabled={remaining <= 0}
                          onClick={() => {
                            setPayingDebt(debt);
                            setSelectedAccountId(accounts[0]?.id || '');
                          }}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                            remaining > 0
                              ? 'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white'
                              : 'opacity-40 cursor-not-allowed bg-neutral-400 text-neutral-200'
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Pagar Parcela</span>
                        </button>

                        {/* Amortize Extra Button */}
                        {debt.status === 'active' && (
                          <button
                            type="button"
                            title="Amortizar valor extra (reduz saldo e juros)"
                            onClick={() => handleOpenAmortizeModal(debt, 'balance')}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-xs transition-colors"
                          >
                            <Zap className="h-3.5 w-3.5" />
                            <span>Amortizar</span>
                          </button>
                        )}

                        {/* Edit Full Debt */}
                        <button
                          type="button"
                          title="Editar detalhes e parcelas da dívida livremente"
                          onClick={() => handleOpenEdit(debt)}
                          className="p-1.5 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-white dark:hover:text-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        {/* Delete Debt */}
                        <button
                          type="button"
                          title="Excluir dívida"
                          onClick={() => setDeletingDebtId(debt.id)}
                          className="p-1.5 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-white dark:hover:bg-neutral-700 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-500 dark:text-neutral-400">
                        Progresso de Quitação: <strong>{paid} de {total} parcelas pagas</strong>
                      </span>
                      <span className="font-bold text-neutral-800 dark:text-neutral-200">
                        {paidPercent}% quitado
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, paidPercent))}%` }}
                      />
                    </div>
                  </div>

                  {/* Detalhes Financeiros: Data de Vencimento e Juros da Tabela Price */}
                  {debt.status === 'active' && remaining > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 rounded-2xl bg-neutral-50/80 dark:bg-neutral-800/40 border border-neutral-200/70 dark:border-neutral-800 p-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-indigo-500" /> Próximo Vencimento
                        </span>
                        <div className="font-bold text-neutral-900 dark:text-neutral-100">
                          {dueDateStatus.formattedDate} <span className="text-[10px] text-neutral-500 font-normal">({dueDateStatus.daysRemaining === 0 ? 'Hoje' : `em ${dueDateStatus.daysRemaining}d`})</span>
                        </div>
                        <div className="text-[10px] text-neutral-500">
                          Parcela mensal: <strong className="text-neutral-700 dark:text-neutral-300">{formatBRL(debt.installmentAmount)}</strong>
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-amber-500" /> Quitação Hoje (Valor Presente)
                        </span>
                        <div className="font-bold text-amber-600 dark:text-amber-400">
                          {formatBRL(debt.currentBalance)}
                        </div>
                        <div className="text-[10px] text-neutral-500">
                          Abate os juros futuros das parcelas
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                          <TrendingDown className="h-3 w-3 text-emerald-500" /> Total a Prazo ({debt.interestRateMonthly}% a.m.)
                        </span>
                        <div className="font-bold text-neutral-800 dark:text-neutral-200">
                          {formatBRL(interestBreakdown.nominalTotal)}
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          {interestBreakdown.interestSavings > 0
                            ? `Economia de ${formatBRL(interestBreakdown.interestSavings)} em juros se quitar hoje!`
                            : 'Sem acréscimo de juros futuros'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Compact shortcut to open Amortization Simulation Popup */}
                  {debt.status === 'active' && remaining > 1 && (
                    <div className="pt-2 flex items-center justify-between flex-wrap gap-2 text-xs border-t border-neutral-100 dark:border-neutral-800/80">
                      <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 text-[11px]">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        <span>Quer economizar em juros ou quitar antes?</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenAmortizeModal(debt, 'balance')}
                        className="flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
                      >
                        <Zap className="h-3.5 w-3.5" />
                        <span>Abrir Simulador de Amortização</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: Cadastrar Nova Dívida */}
      {isAddDebtOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleAddDebt}
            className="w-full max-w-xl rounded-3xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Cadastrar Nova Dívida / Financiamento
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Defina o número de parcelas e o saldo devedor para acompanhar amortizações
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDebtOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                  Credor / Descrição
                </label>
                <input
                  type="text"
                  required
                  value={creditor}
                  onChange={(e) => setCreditor(e.target.value)}
                  placeholder="Ex: Empréstimo Nubank, Financiamento Carro..."
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                  Total de Parcelas
                </label>
                <input
                  type="number"
                  min="1"
                  max="480"
                  required
                  value={totalInst}
                  onChange={(e) => handleAddTotalChange(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                  Parcelas já pagas (se já iniciou)
                </label>
                <input
                  type="number"
                  min="0"
                  max={totalInst}
                  value={paidInst}
                  onChange={(e) => handleAddPaidChange(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                  Valor da Parcela Mensal (R$)
                </label>
                <input
                  type="text"
                  required
                  value={installmentVal}
                  onChange={(e) => handleAddInstallmentChange(e.target.value)}
                  placeholder="Ex: 277,47"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                  Saldo Devedor Restante (R$)
                </label>
                <input
                  type="text"
                  required
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="Ex: 2219,76"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-semibold text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                />
                <span className="text-[10px] text-neutral-500 block mt-1">
                  Calculado: {Math.max(0, (parseInt(totalInst, 10) || 0) - (parseInt(paidInst, 10) || 0))} parcelas rest. × R$ {installmentVal || '0'}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                  Taxa de Juros (% ao mês)
                </label>
                <input
                  type="text"
                  value={interest}
                  onChange={(e) => handleAddInterestChange(e.target.value)}
                  placeholder="4.0"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 font-bold"
                />
                <span className="text-[10px] text-neutral-400 block mt-1">
                  Base fundamental dos cálculos e amortizações
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                  Dia do Vencimento Mensal
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 font-bold"
                />
                {(() => {
                  const addDue = getDebtDueDateStatus(parseInt(dueDay, 10) || 10);
                  return (
                    <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 block mt-1">
                      📅 Próximo vencimento: <strong>{addDue.formattedDate}</strong> ({addDue.daysRemaining === 0 ? 'Hoje' : `em ${addDue.daysRemaining} dias`})
                    </span>
                  );
                })()}
              </div>

              {/* Price / CDC Math Synchronizer */}
              {(() => {
                const tot = parseInt(totalInst, 10) || 1;
                const paid = parseInt(paidInst, 10) || 0;
                const rem = Math.max(0, tot - paid);
                const inst = parseFloat(installmentVal.replace(',', '.')) || 0;
                const bal = parseFloat(balance.replace(',', '.')) || 0;
                const rate = parseFloat(interest.replace(',', '.')) || 0;
                const nominalTotal = rem * inst;
                const embeddedInterest = Math.max(0, nominalTotal - bal);

                return (
                  <div className="sm:col-span-2 rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/20 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <Percent className="h-3.5 w-3.5 text-amber-600" />
                        Sincronização com Juros ao Mês (Tabela Price)
                      </span>
                      <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                        {rate > 0 ? `${rate}% a.m.` : 'Sem juros'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="bg-white dark:bg-neutral-800 p-2.5 rounded-xl border border-amber-100 dark:border-neutral-700">
                        <span className="text-[10px] text-neutral-400 font-semibold block">Quitação Hoje (Valor Presente)</span>
                        <span className="text-xs font-black text-amber-600 dark:text-amber-400">{formatBRL(bal)}</span>
                        <span className="text-[9px] text-neutral-400 block mt-0.5">Saldo real descapitalizado</span>
                      </div>
                      <div className="bg-white dark:bg-neutral-800 p-2.5 rounded-xl border border-amber-100 dark:border-neutral-700">
                        <span className="text-[10px] text-neutral-400 font-semibold block">Total a Prazo ({rem}x)</span>
                        <span className="text-xs font-black text-neutral-800 dark:text-neutral-200">{formatBRL(nominalTotal)}</span>
                        <span className="text-[9px] text-neutral-400 block mt-0.5">Soma com juros futuros</span>
                      </div>
                      <div className="bg-white dark:bg-neutral-800 p-2.5 rounded-xl border border-amber-100 dark:border-neutral-700">
                        <span className="text-[10px] text-neutral-400 font-semibold block">Juros Embutidos</span>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{formatBRL(embeddedInterest)}</span>
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block mt-0.5">Economia quitando à vista</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 flex-wrap pt-1 text-[10px]">
                      <button
                        type="button"
                        onClick={handleSyncAddBalancePrice}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-bold hover:bg-amber-600 shadow-2xs transition-colors"
                      >
                        ⚡ Achar Saldo pela Parcela (Tabela Price)
                      </button>
                      <button
                        type="button"
                        onClick={handleSyncAddInstallmentPrice}
                        className="px-2.5 py-1 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-bold hover:bg-neutral-800 transition-colors"
                      >
                        ⚡ Achar Parcela pelo Saldo (Tabela Price)
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setIsAddDebtOpen(false)}
                className="rounded-xl border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-xs"
              >
                Salvar Dívida
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Edição Completa da Dívida com Atualização Automática do Saldo */}
      {editingDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-xl rounded-3xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Editar Dívida & Parcelas
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Ajuste o número de parcelas restantes, pagas ou o saldo devedor livremente
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingDebt(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                  Credor / Descrição
                </label>
                <input
                  type="text"
                  required
                  value={editCreditor}
                  onChange={(e) => setEditCreditor(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>

              {/* Installment Control Box */}
              <div className="sm:col-span-2 rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5 dark:border-amber-950/60 dark:bg-amber-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    Controle de Parcelas & Cálculo Automático do Saldo
                  </span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold">
                    Saldo atualizado automaticamente
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-neutral-600 dark:text-neutral-400 block mb-1">
                      Total de Parcelas
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={editTotalInst}
                      onChange={(e) => handleEditTotalChange(e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-white p-2 text-xs font-bold text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-neutral-600 dark:text-neutral-400 block mb-1">
                      Parcelas Já Pagas
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const cur = parseInt(editPaidInst, 10) || 0;
                          if (cur > 0) handleEditPaidChange(String(cur - 1));
                        }}
                        className="p-2 rounded-xl bg-neutral-200 text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-200"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        max={editTotalInst}
                        required
                        value={editPaidInst}
                        onChange={(e) => handleEditPaidChange(e.target.value)}
                        className="w-full text-center rounded-xl border border-neutral-200 bg-white p-2 text-xs font-bold text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const cur = parseInt(editPaidInst, 10) || 0;
                          const tot = parseInt(editTotalInst, 10) || 1;
                          if (cur < tot) handleEditPaidChange(String(cur + 1));
                        }}
                        className="p-2 rounded-xl bg-neutral-200 text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-200"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-neutral-600 dark:text-neutral-400 block mb-1">
                      Parcelas Restantes
                    </label>
                    <div className="p-2 rounded-xl bg-white border border-neutral-200 text-xs font-bold text-amber-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-amber-400 text-center">
                      {Math.max(0, (parseInt(editTotalInst, 10) || 1) - (parseInt(editPaidInst, 10) || 0))} restantes
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                  Saldo Devedor Restante (R$)
                </label>
                <input
                  type="text"
                  required
                  value={editBalance}
                  onChange={(e) => handleEditBalanceChange(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-semibold text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                />
                <div className="flex items-center justify-between text-[10px] mt-1 text-neutral-500">
                  <span>
                    Fórmula Price: PV pelo saldo ou parcelas
                  </span>
                  <button
                    type="button"
                    onClick={handleSyncBalanceFromInstallments}
                    className="text-amber-600 font-bold hover:underline"
                  >
                    Achar Saldo c/ Juros
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                  Valor da Parcela (R$)
                </label>
                <input
                  type="text"
                  required
                  value={editInstallmentVal}
                  onChange={(e) => handleEditInstallmentChange(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 font-bold"
                />
                <div className="flex justify-end text-[10px] mt-1 text-neutral-500">
                  <button
                    type="button"
                    onClick={handleSyncInstallmentFromBalance}
                    className="text-amber-600 font-bold hover:underline"
                  >
                    Calcular Parcela c/ Juros
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                  Taxa de Juros (% ao mês)
                </label>
                <input
                  type="text"
                  value={editInterest}
                  onChange={(e) => handleEditInterestChange(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 font-bold"
                />
                <span className="text-[10px] text-neutral-400 block mt-1">
                  Taxa mensal para cálculo de amortizações e juros futuros
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                  Dia do Vencimento Mensal
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={editDueDay}
                  onChange={(e) => setEditDueDay(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 font-bold"
                />
                {(() => {
                  const editDue = getDebtDueDateStatus(parseInt(editDueDay, 10) || 10);
                  return (
                    <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 block mt-1">
                      📅 Próximo vencimento: <strong>{editDue.formattedDate}</strong> ({editDue.daysRemaining === 0 ? 'Hoje' : `em ${editDue.daysRemaining} dias`})
                    </span>
                  );
                })()}
              </div>

              {/* Price / CDC Math Synchronizer */}
              {(() => {
                const tot = parseInt(editTotalInst, 10) || 1;
                const paid = parseInt(editPaidInst, 10) || 0;
                const rem = Math.max(0, tot - paid);
                const inst = parseFloat(editInstallmentVal.replace(',', '.')) || 0;
                const bal = parseFloat(editBalance.replace(',', '.')) || 0;
                const rate = parseFloat(editInterest.replace(',', '.')) || 0;
                const nominalTotal = rem * inst;
                const embeddedInterest = Math.max(0, nominalTotal - bal);
                const dueStatus = getDebtDueDateStatus(parseInt(editDueDay, 10) || 10);

                return (
                  <div className="sm:col-span-2 rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <Percent className="h-3.5 w-3.5 text-amber-600" />
                        Relação Matemática com Juros ao Mês (Tabela Price / CDC)
                      </span>
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-full">
                        {rate > 0 ? `${rate}% a.m.` : 'Sem juros'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="bg-white dark:bg-neutral-800 p-2.5 rounded-xl border border-amber-100 dark:border-neutral-700">
                        <span className="text-[10px] text-neutral-400 font-semibold block">Quitação Hoje (Valor Presente)</span>
                        <span className="text-xs font-black text-amber-600 dark:text-amber-400">{formatBRL(bal)}</span>
                        <span className="text-[9px] text-neutral-400 block mt-0.5">Saldo real descapitalizado</span>
                      </div>
                      <div className="bg-white dark:bg-neutral-800 p-2.5 rounded-xl border border-amber-100 dark:border-neutral-700">
                        <span className="text-[10px] text-neutral-400 font-semibold block">Total a Prazo ({rem}x)</span>
                        <span className="text-xs font-black text-neutral-800 dark:text-neutral-200">{formatBRL(nominalTotal)}</span>
                        <span className="text-[9px] text-neutral-400 block mt-0.5">Soma nominal das parcelas</span>
                      </div>
                      <div className="bg-white dark:bg-neutral-800 p-2.5 rounded-xl border border-amber-100 dark:border-neutral-700">
                        <span className="text-[10px] text-neutral-400 font-semibold block">Juros Futuros Embutidos</span>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{formatBRL(embeddedInterest)}</span>
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block mt-0.5">Economia quitando à vista</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 dark:text-indigo-400 font-semibold">
                        <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                        <span>Próximo vencimento: <strong>{dueStatus.formattedDate}</strong> ({dueStatus.daysRemaining === 0 ? 'HOJE' : `em ${dueStatus.daysRemaining}d`})</span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                        <button
                          type="button"
                          onClick={handleSyncBalanceFromInstallments}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-bold hover:bg-amber-600 shadow-2xs transition-colors"
                        >
                          ⚡ Achar Saldo pela Parcela
                        </button>
                        <button
                          type="button"
                          onClick={handleSyncInstallmentFromBalance}
                          className="px-2.5 py-1 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-bold hover:bg-neutral-800 transition-colors"
                        >
                          ⚡ Achar Parcela pelo Saldo
                        </button>
                        <button
                          type="button"
                          onClick={handleSyncSimpleNominal}
                          className="px-2 py-1 rounded-lg text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 font-semibold"
                        >
                          Soma Simples
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setEditingDebt(null)}
                className="rounded-xl border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-neutral-900 px-5 py-2 text-xs font-bold text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 transition-colors shadow-xs"
              >
                Atualizar Dívida
              </button>
            </div>
          </form>
        </div>
      )}

      {/* POPUP MODAL: Simulador Inteligente & Registro de Amortização */}
      {amortizingDebt && (() => {
        const amortTotal = Math.max(1, amortizingDebt.totalInstallments);
        const amortRemaining = Math.max(0, Math.min(amortTotal, amortizingDebt.remainingInstallments));
        const amortEstimate = calculateAmortizationEstimate(
          amortizingDebt.currentBalance,
          amortizingDebt.installmentAmount,
          amortRemaining,
          amortizingDebt.interestRateMonthly,
          simExtraAmount
        );
        const amortDueStatus = getDebtDueDateStatus(amortizingDebt.dueDay || 10);
        const amortInterest = calculateDebtInterestBreakdown(
          amortizingDebt.currentBalance,
          amortizingDebt.installmentAmount,
          amortRemaining,
          amortizingDebt.interestRateMonthly
        );

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-2xl rounded-3xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 space-y-5 max-h-[92vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-xs">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                      Simulador & Estimativa de Amortização
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      <span className="font-bold text-neutral-800 dark:text-neutral-200">
                        {amortizingDebt.creditor}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {amortizingDebt.interestRateMonthly}% a.m.
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                        <Calendar className="h-3 w-3" />
                        Vence dia {amortizingDebt.dueDay || 10} ({amortDueStatus.formattedDate})
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAmortizingDebt(null)}
                  className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Status financeiro atual */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 rounded-2xl bg-neutral-100/60 dark:bg-neutral-800/40 p-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Saldo a Quitar Hoje (PV)</span>
                  <span className="text-sm font-black text-amber-600 dark:text-amber-400">{formatBRL(amortizingDebt.currentBalance)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total a Prazo ({amortRemaining} parcelas)</span>
                  <span className="text-sm font-black text-neutral-800 dark:text-neutral-200">{formatBRL(amortInterest.nominalTotal)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Juros Embutidos Futuros</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatBRL(amortInterest.interestSavings)}</span>
                </div>
              </div>

              {/* SECTION 1: SIMULATOR CONTROLS & LIVE PROJECTIONS */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/60 pb-3 dark:border-amber-900/50">
                  <div>
                    <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">
                      Simulação de Aporte Extraordinário Mensal
                    </h4>
                    <p className="text-[11px] text-amber-800/80 dark:text-amber-400/90">
                      Descubra o impacto real nos juros e no tempo de quitação
                    </p>
                  </div>

                  {/* Pills selector */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[50, 100, 200, 300].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          setSimExtraAmount(val);
                          if (amortizationType === 'balance') setExtraAmortizationAmount(String(val));
                        }}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                          simExtraAmount === val
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white text-amber-900 hover:bg-amber-100 dark:bg-neutral-800 dark:text-amber-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        +R$ {val}/mês
                      </button>
                    ))}
                    <div className="flex items-center gap-1 bg-white dark:bg-neutral-800 rounded-lg px-2.5 py-1 border border-amber-200 dark:border-amber-800">
                      <span className="text-[10px] text-neutral-400 font-bold">R$</span>
                      <input
                        type="number"
                        min="10"
                        max="10000"
                        value={simExtraAmount}
                        onChange={(e) => {
                          const v = Math.max(0, parseInt(e.target.value, 10) || 0);
                          setSimExtraAmount(v);
                          if (amortizationType === 'balance') setExtraAmortizationAmount(String(v));
                        }}
                        className="w-16 text-xs font-bold text-neutral-900 dark:text-neutral-100 bg-transparent focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* 3 Result Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 1. Time Saved */}
                  <div className="rounded-xl bg-white p-3.5 border border-amber-100 dark:bg-neutral-800 dark:border-neutral-700 shadow-2xs space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Tempo até Quitar</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-black text-neutral-900 dark:text-neutral-100">
                        {amortEstimate.newMonths} meses
                      </span>
                      <span className="text-xs text-neutral-400 line-through">
                        {amortRemaining} meses
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      <span>Elimina {amortEstimate.monthsSaved} {amortEstimate.monthsSaved === 1 ? 'mês' : 'meses'} de dívida!</span>
                    </p>
                  </div>

                  {/* 2. Real Interest Saved */}
                  <div className="rounded-xl bg-white p-3.5 border border-amber-100 dark:bg-neutral-800 dark:border-neutral-700 shadow-2xs space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      <PiggyBank className="h-3.5 w-3.5" />
                      <span>Economia em Juros</span>
                    </div>
                    <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {formatBRL(amortEstimate.interestSaved)}
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Você não entrega esse dinheiro ao banco!
                    </p>
                  </div>

                  {/* 3. Anticipated Payoff Date */}
                  <div className="rounded-xl bg-white p-3.5 border border-amber-100 dark:bg-neutral-800 dark:border-neutral-700 shadow-2xs space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Data de Quitação</span>
                    </div>
                    <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                      {amortEstimate.estimatedPayoffDate}
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Sem amortizar: {amortEstimate.originalPayoffDate}
                    </p>
                  </div>
                </div>

                {/* Efeito Antecipação da Última Parcela (Desconto Nubank/CDC) */}
                {amortEstimate.lastInstallmentDiscount.discountSaved > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-amber-100/70 p-3 text-xs dark:bg-amber-900/30">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />
                      <div>
                        <span className="font-bold text-neutral-900 dark:text-neutral-100">
                          Antecipação da Última Parcela (Efeito Nubank / CDC):
                        </span>{' '}
                        <span className="text-neutral-700 dark:text-neutral-300">
                          Quitar a parcela final hoje custa apenas{' '}
                          <strong className="text-amber-900 dark:text-amber-200">
                            {formatBRL(amortEstimate.lastInstallmentDiscount.discountedAmount)}
                          </strong>{' '}
                          em vez de {formatBRL(amortizingDebt.installmentAmount)} (Economia imediata de{' '}
                          <strong className="text-emerald-700 dark:text-emerald-400">
                            {formatBRL(amortEstimate.lastInstallmentDiscount.discountSaved)} ({amortEstimate.lastInstallmentDiscount.discountPercent}%)
                          </strong>{' '}
                          em juros descapitalizados).
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAmortizationType('last_installment');
                        setExtraAmortizationAmount(String(amortEstimate.lastInstallmentDiscount.discountedAmount));
                      }}
                      className="self-start sm:self-auto shrink-0 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-800 transition-colors shadow-2xs"
                    >
                      Quitar com este Desconto
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 2: EXECUTE AMORTIZATION */}
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 dark:border-neutral-800 dark:bg-neutral-800/50 space-y-3.5">
                <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  Efetivar Amortização Agora (Opcional)
                </h4>

                {/* Type toggle */}
                <div className="flex gap-2 rounded-xl bg-neutral-200/70 p-1 dark:bg-neutral-700/60">
                  <button
                    type="button"
                    onClick={() => {
                      setAmortizationType('balance');
                      setExtraAmortizationAmount(String(simExtraAmount));
                    }}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                      amortizationType === 'balance'
                        ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-neutral-100'
                        : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-300'
                    }`}
                  >
                    Abater do Saldo Devedor
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAmortizationType('last_installment');
                      setExtraAmortizationAmount(String(amortEstimate.lastInstallmentDiscount.discountedAmount));
                    }}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                      amortizationType === 'last_installment'
                        ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-neutral-100'
                        : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-300'
                    }`}
                  >
                    Quitar Última Parcela com Desconto
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                      Valor a Amortizar Hoje (R$)
                    </label>
                    <input
                      type="text"
                      required
                      value={extraAmortizationAmount}
                      onChange={(e) => setExtraAmortizationAmount(e.target.value)}
                      placeholder="Ex: 100,00"
                      className="w-full rounded-xl border border-neutral-200 bg-white p-2.5 text-sm font-bold text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                      Debitar de uma Conta Bancária? (Opcional)
                    </label>
                    <select
                      value={amortizationAccountId}
                      onChange={(e) => setAmortizationAccountId(e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-white p-2.5 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    >
                      <option value="">Apenas abater saldo da dívida (não debitar conta)</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({formatBRL(acc.balance)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="rounded-xl bg-amber-100/60 dark:bg-amber-950/40 p-3 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <p className="font-semibold flex items-center gap-1">
                    <Info className="h-3.5 w-3.5 text-amber-600" />
                    Impacto do lançamento:
                  </p>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    {amortizationType === 'last_installment'
                      ? `Elimina a última parcela de ${formatBRL(amortizingDebt.installmentAmount)} por apenas ${formatBRL(parseFloat(extraAmortizationAmount.replace(',', '.')) || 0)}, abatendo o juro embutido e reduzindo 1 parcela do contrato!`
                      : `Reduz o saldo devedor de ${formatBRL(amortizingDebt.currentBalance)} para ${formatBRL(Math.max(0, amortizingDebt.currentBalance - (parseFloat(extraAmortizationAmount.replace(',', '.')) || 0)))}.`}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setAmortizingDebt(null)}
                  className="rounded-xl border border-neutral-200 px-4 py-2.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
                >
                  Fechar Simulação
                </button>
                <button
                  type="button"
                  onClick={handleExecuteAmortization}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-xs"
                >
                  <Zap className="h-4 w-4" />
                  <span>Confirmar Amortização</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: Confirmação de Pagamento de Parcela */}
      {payingDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Confirmar Pagamento de Parcela
              </h3>
              <button
                type="button"
                onClick={() => setPayingDebt(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-neutral-600 dark:text-neutral-300">
                Você está registrando o pagamento da próxima parcela de{' '}
                <strong>{payingDebt.creditor}</strong>:
              </p>

              <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-800 p-4 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Valor da Parcela:</span>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100">
                    {formatBRL(payingDebt.installmentAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Parcelas Restantes após pagamento:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {Math.max(0, payingDebt.remainingInstallments - 1)} parcelas
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                  Debitar de uma Conta Bancária? (Opcional)
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                >
                  <option value="">Apenas atualizar parcela (não debitar conta)</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatBRL(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setPayingDebt(null)}
                className="rounded-xl border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmPay}
                className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-xs"
              >
                Confirmar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Confirmação de Exclusão */}
      {deletingDebtId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Excluir Dívida?
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Esta ação removerá esta dívida do seu Mapa de Dívidas.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingDebtId(null)}
                className="rounded-xl border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteDebt(deletingDebtId);
                  setDeletingDebtId(null);
                }}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-xs"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
