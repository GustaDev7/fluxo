import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  FinanceAccount,
  CreditCard,
  FinanceTransaction,
  InstallmentPurchase,
  FinanceBill,
  FinanceDebt,
  EmergencyFund,
  FinancialGoalItem,
  InvestmentAssetItem,
  ZeroBasedBudget,
  MonthlyClosing,
  FinancialDiagnosisData,
  FinanceSubTab,
  TransactionType,
  FinancialHealthScore,
} from '../types/finance';
import {
  INITIAL_ACCOUNTS,
  INITIAL_CREDIT_CARDS,
  INITIAL_INSTALLMENTS,
  INITIAL_BILLS,
  INITIAL_TRANSACTIONS,
  INITIAL_DEBTS,
  INITIAL_EMERGENCY_FUND,
  INITIAL_FINANCIAL_GOALS,
  INITIAL_INVESTMENTS,
  INITIAL_ZERO_BASED_BUDGET,
  INITIAL_PREVIOUS_MONTH_CLOSING,
  INITIAL_DIAGNOSIS,
} from '../data/initialFinanceData';
import {
  calculateNetWorth,
  calculateZeroBasedBudgetStatus,
  calculateEmergencyFundCoverage,
  calculateFinancialHealthScore,
  smartParseTransaction,
  exportTransactionsToCSV,
  importTransactionsFromCSV,
} from '../utils/financeUtils';
import { useApp } from './AppContext';
import { getTodayDateString } from '../utils/date';

interface FinanceContextType {
  // Navigation
  subTab: FinanceSubTab;
  setSubTab: (tab: FinanceSubTab) => void;

  // Modals
  isTransactionModalOpen: boolean;
  openTransactionModal: (type?: TransactionType) => void;
  closeTransactionModal: () => void;
  transactionModalInitialType: TransactionType;
  isDiagnosisModalOpen: boolean;
  openDiagnosisModal: () => void;
  closeDiagnosisModal: () => void;

  // Data
  accounts: FinanceAccount[];
  creditCards: CreditCard[];
  transactions: FinanceTransaction[];
  bills: FinanceBill[];
  debts: FinanceDebt[];
  installments: InstallmentPurchase[];
  emergencyFund: EmergencyFund;
  goals: FinancialGoalItem[];
  investments: InvestmentAssetItem[];
  budget: ZeroBasedBudget;
  monthlyClosingHistory: MonthlyClosing[];
  diagnosis: FinancialDiagnosisData;

  // Computed
  netWorthSummary: ReturnType<typeof calculateNetWorth>;
  availableCash: number;
  monthIncome: number;
  monthExpenses: number;
  monthInvestments: number;
  monthDebtsPaid: number;
  savingsRate: number;
  emergencyCoverage: ReturnType<typeof calculateEmergencyFundCoverage>;
  healthScore: FinancialHealthScore;
  zeroBasedStatus: ReturnType<typeof calculateZeroBasedBudgetStatus>;
  overdueBills: FinanceBill[];
  todayBills: FinanceBill[];
  upcomingBills: FinanceBill[];

  // Actions
  addTransaction: (tx: Omit<FinanceTransaction, 'id'>) => FinanceTransaction;
  updateTransaction: (id: string, updates: Partial<FinanceTransaction>) => void;
  deleteTransaction: (id: string) => void;
  quickAddTransaction: (text: string) => FinanceTransaction;

  addAccount: (account: Omit<FinanceAccount, 'id'>) => void;
  updateAccount: (id: string, updates: Partial<FinanceAccount>) => void;
  deleteAccount: (id: string) => void;

  addCreditCard: (card: Omit<CreditCard, 'id'>) => void;
  updateCreditCard: (id: string, updates: Partial<CreditCard>) => void;
  deleteCreditCard: (id: string) => void;

  addBill: (bill: Omit<FinanceBill, 'id'>) => void;
  updateBill: (id: string, updates: Partial<FinanceBill>) => void;
  deleteBill: (id: string) => void;
  payBill: (billId: string, accountId?: string, cardId?: string) => void;
  generateTaskForBill: (bill: FinanceBill) => void;

  addDebt: (debt: Omit<FinanceDebt, 'id'>) => void;
  updateDebt: (id: string, updates: Partial<FinanceDebt>) => void;
  deleteDebt: (id: string) => void;
  payDebtInstallment: (debtId: string, accountId: string) => void;

  updateEmergencyFund: (updates: Partial<EmergencyFund>) => void;

  addFinancialGoal: (goal: Omit<FinancialGoalItem, 'id'>) => void;
  updateFinancialGoal: (id: string, updates: Partial<FinancialGoalItem>) => void;
  deleteFinancialGoal: (id: string) => void;
  contributeToGoal: (goalId: string, amount: number, accountId: string) => void;
  generateTaskForGoal: (goal: FinancialGoalItem) => void;

  addInvestmentAsset: (asset: Omit<InvestmentAssetItem, 'id'>) => void;
  updateInvestmentAsset: (id: string, updates: Partial<InvestmentAssetItem>) => void;
  deleteInvestmentAsset: (id: string) => void;
  recordAporte: (assetId: string, amount: number, accountId: string, quantity?: number) => void;

  updateZeroBasedBudget: (allocations: Partial<ZeroBasedBudget['allocations']>, plannedIncome?: number) => void;
  saveMonthlyClosing: (rating: MonthlyClosing['rating'], notes: string) => void;
  saveDiagnosis: (data: FinancialDiagnosisData) => void;

  exportTransactions: () => void;
  importTransactions: (csvText: string) => number;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addTask, addNotification, setSelectedTaskId, setActiveTab: setGlobalActiveTab } = useApp();

  // Navigation subTab
  const [subTab, setSubTab] = useState<FinanceSubTab>('overview');

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionModalInitialType, setTransactionModalInitialType] = useState<TransactionType>('expense');
  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false);

  // Entities with persistence
  const [accounts, setAccounts] = useState<FinanceAccount[]>(() => {
    try {
      const saved = localStorage.getItem('cp_fin_accounts');
      return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
    } catch {
      return INITIAL_ACCOUNTS;
    }
  });

  const [creditCards, setCreditCards] = useState<CreditCard[]>(() => {
    try {
      const saved = localStorage.getItem('cp_fin_cards');
      return saved ? JSON.parse(saved) : INITIAL_CREDIT_CARDS;
    } catch {
      return INITIAL_CREDIT_CARDS;
    }
  });

  const [transactions, setTransactions] = useState<FinanceTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('cp_fin_transactions');
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [bills, setBills] = useState<FinanceBill[]>(() => {
    try {
      const saved = localStorage.getItem('cp_fin_bills');
      return saved ? JSON.parse(saved) : INITIAL_BILLS;
    } catch {
      return INITIAL_BILLS;
    }
  });

  const [debts, setDebts] = useState<FinanceDebt[]>(() => {
    try {
      const saved = localStorage.getItem('cp_fin_debts');
      return saved ? JSON.parse(saved) : INITIAL_DEBTS;
    } catch {
      return INITIAL_DEBTS;
    }
  });

  const [installments, setInstallments] = useState<InstallmentPurchase[]>(() => {
    try {
      const saved = localStorage.getItem('cp_fin_installments');
      return saved ? JSON.parse(saved) : INITIAL_INSTALLMENTS;
    } catch {
      return INITIAL_INSTALLMENTS;
    }
  });

  const [emergencyFund, setEmergencyFund] = useState<EmergencyFund>(() => {
    try {
      const saved = localStorage.getItem('cp_fin_emergency');
      return saved ? JSON.parse(saved) : INITIAL_EMERGERGENCY_FUND_SAFE();
    } catch {
      return INITIAL_EMERGENCY_FUND;
    }
  });

  function INITIAL_EMERGERGENCY_FUND_SAFE() {
    return INITIAL_EMERGENCY_FUND;
  }

  const [goals, setGoals] = useState<FinancialGoalItem[]>(() => {
    try {
      const saved = localStorage.getItem('cp_fin_goals');
      return saved ? JSON.parse(saved) : INITIAL_FINANCIAL_GOALS;
    } catch {
      return INITIAL_FINANCIAL_GOALS;
    }
  });

  const [investments, setInvestments] = useState<InvestmentAssetItem[]>(() => {
    try {
      const saved = localStorage.getItem('cp_fin_investments');
      return saved ? JSON.parse(saved) : INITIAL_INVESTMENTS;
    } catch {
      return INITIAL_INVESTMENTS;
    }
  });

  const [budget, setBudget] = useState<ZeroBasedBudget>(() => {
    try {
      const saved = localStorage.getItem('cp_fin_budget');
      return saved ? JSON.parse(saved) : INITIAL_ZERO_BASED_BUDGET;
    } catch {
      return INITIAL_ZERO_BASED_BUDGET;
    }
  });

  const [monthlyClosingHistory, setMonthlyClosingHistory] = useState<MonthlyClosing[]>(() => {
    try {
      const saved = localStorage.getItem('cp_fin_closings');
      return saved ? JSON.parse(saved) : [INITIAL_PREVIOUS_MONTH_CLOSING];
    } catch {
      return [INITIAL_PREVIOUS_MONTH_CLOSING];
    }
  });

  const [diagnosis, setDiagnosis] = useState<FinancialDiagnosisData>(() => {
    try {
      const saved = localStorage.getItem('cp_fin_diagnosis');
      return saved ? JSON.parse(saved) : INITIAL_DIAGNOSIS;
    } catch {
      return INITIAL_DIAGNOSIS;
    }
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('cp_fin_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('cp_fin_cards', JSON.stringify(creditCards));
  }, [creditCards]);

  useEffect(() => {
    localStorage.setItem('cp_fin_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('cp_fin_bills', JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    localStorage.setItem('cp_fin_debts', JSON.stringify(debts));
  }, [debts]);

  useEffect(() => {
    localStorage.setItem('cp_fin_installments', JSON.stringify(installments));
  }, [installments]);

  useEffect(() => {
    localStorage.setItem('cp_fin_emergency', JSON.stringify(emergencyFund));
  }, [emergencyFund]);

  useEffect(() => {
    localStorage.setItem('cp_fin_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('cp_fin_investments', JSON.stringify(investments));
  }, [investments]);

  useEffect(() => {
    localStorage.setItem('cp_fin_budget', JSON.stringify(budget));
  }, [budget]);

  useEffect(() => {
    localStorage.setItem('cp_fin_closings', JSON.stringify(monthlyClosingHistory));
  }, [monthlyClosingHistory]);

  useEffect(() => {
    localStorage.setItem('cp_fin_diagnosis', JSON.stringify(diagnosis));
  }, [diagnosis]);

  // Modals
  const openTransactionModal = useCallback((type: TransactionType = 'expense') => {
    setTransactionModalInitialType(type);
    setIsTransactionModalOpen(true);
  }, []);

  const closeTransactionModal = useCallback(() => {
    setIsTransactionModalOpen(false);
  }, []);

  const openDiagnosisModal = useCallback(() => {
    setIsDiagnosisModalOpen(true);
  }, []);

  const closeDiagnosisModal = useCallback(() => {
    setIsDiagnosisModalOpen(false);
  }, []);

  // COMPUTED METRICS
  const netWorthSummary = useMemo(() => {
    return calculateNetWorth(accounts, investments, debts, creditCards);
  }, [accounts, investments, debts, creditCards]);

  const availableCash = useMemo(() => {
    // Checking, digital and wallet accounts
    return accounts
      .filter((a) => a.isActive && (a.type === 'checking' || a.type === 'digital' || a.type === 'wallet'))
      .reduce((acc, a) => acc + a.balance, 0);
  }, [accounts]);

  // Current month filter
  const currentMonthStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const currentMonthTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(currentMonthStr));
  }, [transactions, currentMonthStr]);

  const monthIncome = useMemo(() => {
    return currentMonthTransactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [currentMonthTransactions]);

  const monthExpenses = useMemo(() => {
    return currentMonthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [currentMonthTransactions]);

  const monthInvestments = useMemo(() => {
    return currentMonthTransactions
      .filter((t) => t.type === 'investment')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [currentMonthTransactions]);

  const monthDebtsPaid = useMemo(() => {
    return currentMonthTransactions
      .filter((t) => t.type === 'debt_payment')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [currentMonthTransactions]);

  // Savings rate = (metas + investments + reserve) / income
  const savingsRate = useMemo(() => {
    const goalsTransfers = currentMonthTransactions
      .filter((t) => t.masterCategory === 'metas' || t.tags?.includes('reserva'))
      .reduce((acc, t) => acc + t.amount, 0);

    const totalSaved = monthInvestments + goalsTransfers;
    const baseIncome = monthIncome > 0 ? monthIncome : budget.plannedIncome || 5200;
    return baseIncome > 0 ? (totalSaved / baseIncome) * 100 : 0;
  }, [currentMonthTransactions, monthInvestments, monthIncome, budget.plannedIncome]);

  // Monthly fixed costs from budget or bills
  const monthlyFixedCosts = useMemo(() => {
    return budget.allocations.custos_fixos || 2100;
  }, [budget]);

  const emergencyCoverage = useMemo(() => {
    return calculateEmergencyFundCoverage(emergencyFund.currentAmount, monthlyFixedCosts);
  }, [emergencyFund.currentAmount, monthlyFixedCosts]);

  // Bill groups
  const todayStr = useMemo(() => getTodayDateString(), []);

  const overdueBills = useMemo(() => {
    return bills.filter((b) => b.status === 'overdue' || (b.status === 'pending' && b.dueDate < todayStr));
  }, [bills, todayStr]);

  const todayBills = useMemo(() => {
    return bills.filter((b) => b.status === 'pending' && b.dueDate === todayStr);
  }, [bills, todayStr]);

  const upcomingBills = useMemo(() => {
    return bills.filter((b) => b.status === 'pending' && b.dueDate > todayStr);
  }, [bills, todayStr]);

  const zeroBasedStatus = useMemo(() => {
    return calculateZeroBasedBudgetStatus(budget);
  }, [budget]);

  const healthScore = useMemo(() => {
    const debtCommitment = debts.reduce((acc, d) => (d.status === 'active' ? acc + d.installmentAmount : 0), 0);
    const baseIncome = monthIncome > 0 ? monthIncome : budget.plannedIncome || 5000;
    const debtPercent = baseIncome > 0 ? (debtCommitment / baseIncome) * 100 : 0;

    return calculateFinancialHealthScore({
      monthlyIncome: baseIncome,
      savingsRate,
      emergencyFundMonths: emergencyCoverage.monthsCovered,
      debtCommitmentPercent: debtPercent,
      isBudgetBalanced: zeroBasedStatus.status === 'balanced',
      overdueBillsCount: overdueBills.length,
      hasInvestments: investments.length > 0,
    });
  }, [debts, monthIncome, budget.plannedIncome, savingsRate, emergencyCoverage, zeroBasedStatus, overdueBills, investments]);

  // ACTIONS

  const addTransaction = useCallback(
    (txData: Omit<FinanceTransaction, 'id'>): FinanceTransaction => {
      const newId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newTx: FinanceTransaction = { ...txData, id: newId };

      setTransactions((prev) => [newTx, ...prev]);

      // Update account balances
      if (newTx.accountId) {
        setAccounts((prev) =>
          prev.map((acc) => {
            if (acc.id !== newTx.accountId) return acc;
            if (newTx.type === 'income') {
              return { ...acc, balance: acc.balance + newTx.amount };
            } else if (newTx.type === 'expense' || newTx.type === 'investment' || newTx.type === 'debt_payment') {
              return { ...acc, balance: acc.balance - newTx.amount };
            } else if (newTx.type === 'transfer') {
              return { ...acc, balance: acc.balance - newTx.amount };
            }
            return acc;
          })
        );
      }

      // If transfer, credit destination account
      if (newTx.type === 'transfer' && newTx.destinationAccountId) {
        setAccounts((prev) =>
          prev.map((acc) => {
            if (acc.id !== newTx.destinationAccountId) return acc;
            return { ...acc, balance: acc.balance + newTx.amount };
          })
        );
      }

      // If credit card expense
      if (newTx.cardId) {
        setCreditCards((prev) =>
          prev.map((card) => {
            if (card.id !== newTx.cardId) return card;
            const newInvoice = card.currentInvoice + newTx.amount;
            const newAvail = Math.max(0, card.limit - newInvoice);
            return { ...card, currentInvoice: newInvoice, availableLimit: newAvail };
          })
        );
      }

      // If linked to a goal
      if (newTx.goalId) {
        setGoals((prev) =>
          prev.map((g) => {
            if (g.id !== newTx.goalId) return g;
            return { ...g, currentAmount: g.currentAmount + newTx.amount };
          })
        );
      }

      addNotification({
        title: 'Transação Registrada',
        message: `${newTx.type === 'income' ? 'Receita' : 'Despesa'} de R$ ${newTx.amount.toFixed(2)} cadastrada com sucesso.`,
        type: 'system',
      });

      return newTx;
    },
    [addNotification]
  );

  const updateTransaction = useCallback((id: string, updates: Partial<FinanceTransaction>) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const quickAddTransaction = useCallback(
    (text: string): FinanceTransaction => {
      const parsed = smartParseTransaction(text);
      const defaultAccount = accounts.find((a) => a.isActive && a.type === 'checking') || accounts[0];

      return addTransaction({
        type: parsed.type,
        amount: parsed.amount,
        date: getTodayDateString(),
        description: parsed.description,
        masterCategory: parsed.masterCategory,
        subcategory: parsed.subcategory,
        accountId: defaultAccount?.id,
        tags: ['rápido'],
      });
    },
    [accounts, addTransaction]
  );

  // Accounts
  const addAccount = useCallback((accData: Omit<FinanceAccount, 'id'>) => {
    const newId = `acc_${Date.now()}`;
    setAccounts((prev) => [...prev, { ...accData, id: newId }]);
  }, []);

  const updateAccount = useCallback((id: string, updates: Partial<FinanceAccount>) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  }, []);

  const deleteAccount = useCallback((id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Credit Cards
  const addCreditCard = useCallback((cardData: Omit<CreditCard, 'id'>) => {
    const newId = `card_${Date.now()}`;
    setCreditCards((prev) => [...prev, { ...cardData, id: newId }]);
  }, []);

  const updateCreditCard = useCallback((id: string, updates: Partial<CreditCard>) => {
    setCreditCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const deleteCreditCard = useCallback((id: string) => {
    setCreditCards((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // Bills (Contas a pagar)
  const addBill = useCallback((billData: Omit<FinanceBill, 'id'>) => {
    const newId = `bill_${Date.now()}`;
    setBills((prev) => [...prev, { ...billData, id: newId }]);
  }, []);

  const updateBill = useCallback((id: string, updates: Partial<FinanceBill>) => {
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  }, []);

  const deleteBill = useCallback((id: string) => {
    setBills((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const payBill = useCallback(
    (billId: string, accountId?: string, cardId?: string) => {
      const bill = bills.find((b) => b.id === billId);
      if (!bill) return;

      const chosenAccId = accountId || bill.accountId || accounts[0]?.id;

      // Mark bill as paid
      setBills((prev) => prev.map((b) => (b.id === billId ? { ...b, status: 'paid' } : b)));

      // Record transaction
      addTransaction({
        type: bill.type === 'income' ? 'income' : 'expense',
        amount: bill.amount,
        date: getTodayDateString(),
        description: `Pagamento: ${bill.title}`,
        masterCategory: bill.masterCategory,
        subcategory: bill.subcategory,
        accountId: cardId ? undefined : chosenAccId,
        cardId: cardId || bill.cardId,
        linkedBillId: billId,
        tags: ['conta-paga'],
      });
    },
    [bills, accounts, addTransaction]
  );

  // Cross-system Integration: Generate Task for a Bill
  const generateTaskForBill = useCallback(
    (bill: FinanceBill) => {
      const createdTask = addTask({
        title: `Pagar conta: ${bill.title} (R$ ${bill.amount.toFixed(2)})`,
        description: `Vencimento da conta de ${bill.title} no valor de R$ ${bill.amount.toFixed(2)}. Ao concluir esta tarefa, o pagamento pode ser baixado nas finanças.`,
        dueDate: bill.dueDate,
        priority: 'high',
        tags: ['finanças', bill.masterCategory.replace('_', '-')],
        estimatedDuration: 10,
      });

      // Update bill with task ID
      updateBill(bill.id, { linkedTaskId: createdTask.id });

      addNotification({
        title: 'Tarefa Criada no Fluxo',
        message: `Lembrete "Pagar conta: ${bill.title}" agendado para ${bill.dueDate}.`,
        type: 'task_due',
      });
    },
    [addTask, updateBill, addNotification]
  );

  // Debts
  const addDebt = useCallback((debtData: Omit<FinanceDebt, 'id'>) => {
    const newId = `debt_${Date.now()}`;
    setDebts((prev) => [...prev, { ...debtData, id: newId }]);
  }, []);

  const updateDebt = useCallback((id: string, updates: Partial<FinanceDebt>) => {
    setDebts((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  }, []);

  const deleteDebt = useCallback((id: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const payDebtInstallment = useCallback(
    (debtId: string, accountId: string) => {
      const debt = debts.find((d) => d.id === debtId);
      if (!debt) return;

      const newRemaining = Math.max(0, debt.remainingInstallments - 1);
      const newBalance = Math.max(0, debt.currentBalance - debt.installmentAmount);
      const isPaid = newRemaining === 0 || newBalance === 0;

      updateDebt(debtId, {
        remainingInstallments: newRemaining,
        currentBalance: newBalance,
        status: isPaid ? 'paid' : 'active',
      });

      addTransaction({
        type: 'debt_payment',
        amount: debt.installmentAmount,
        date: getTodayDateString(),
        description: `Amortização Dívida: ${debt.creditor} (${debt.totalInstallments - newRemaining}/${debt.totalInstallments})`,
        masterCategory: 'custos_fixos',
        subcategory: 'Amortização de Dívida',
        accountId,
        tags: ['dívida', 'amortização'],
      });
    },
    [debts, updateDebt, addTransaction]
  );

  // Emergency Fund
  const updateEmergencyFund = useCallback((updates: Partial<EmergencyFund>) => {
    setEmergencyFund((prev) => ({ ...prev, ...updates }));
  }, []);

  // Financial Goals
  const addFinancialGoal = useCallback((goalData: Omit<FinancialGoalItem, 'id'>) => {
    const newId = `fgoal_${Date.now()}`;
    setGoals((prev) => [...prev, { ...goalData, id: newId }]);
  }, []);

  const updateFinancialGoal = useCallback((id: string, updates: Partial<FinancialGoalItem>) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
  }, []);

  const deleteFinancialGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const contributeToGoal = useCallback(
    (goalId: string, amount: number, accountId: string) => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;

      updateFinancialGoal(goalId, {
        currentAmount: goal.currentAmount + amount,
      });

      addTransaction({
        type: 'transfer',
        amount,
        date: getTodayDateString(),
        description: `Aporte Meta: ${goal.title}`,
        masterCategory: 'metas',
        subcategory: goal.title,
        accountId,
        goalId,
        tags: ['meta', 'poupança'],
      });
    },
    [goals, updateFinancialGoal, addTransaction]
  );

  const generateTaskForGoal = useCallback(
    (goal: FinancialGoalItem) => {
      addTask({
        title: `Aporte Financeiro: Separar R$ ${goal.monthlyContribution.toFixed(2)} para ${goal.title}`,
        description: `Demanda financeira mensal vinculada à meta "${goal.title}". Progresso atual: R$ ${goal.currentAmount.toFixed(2)} / R$ ${goal.targetAmount.toFixed(2)}.`,
        dueDate: getTodayDateString(),
        priority: 'high',
        tags: ['finanças', 'metas-aporte'],
        estimatedDuration: 15,
      });

      addNotification({
        title: 'Demanda de Meta Criada',
        message: `Tarefa adicionada para o aporte de ${goal.title}.`,
        type: 'goal',
      });
    },
    [addTask, addNotification]
  );

  // Investments & Assets
  const addInvestmentAsset = useCallback((assetData: Omit<InvestmentAssetItem, 'id'>) => {
    const newId = `inv_${Date.now()}`;
    setInvestments((prev) => [...prev, { ...assetData, id: newId }]);
  }, []);

  const updateInvestmentAsset = useCallback((id: string, updates: Partial<InvestmentAssetItem>) => {
    setInvestments((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  }, []);

  const deleteInvestmentAsset = useCallback((id: string) => {
    setInvestments((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const recordAporte = useCallback(
    (assetId: string, amount: number, accountId: string, quantity = 1) => {
      const asset = investments.find((i) => i.id === assetId);
      if (!asset) return;

      const newInvested = asset.totalInvested + amount;
      const newQty = asset.quantity + quantity;
      const newCurrentVal = asset.currentValue + amount;

      updateInvestmentAsset(assetId, {
        totalInvested: newInvested,
        quantity: newQty,
        currentValue: newCurrentVal,
      });

      addTransaction({
        type: 'investment',
        amount,
        date: getTodayDateString(),
        description: `Aporte em Ativo: ${asset.tickerOrName}`,
        masterCategory: 'liberdade_financeira',
        subcategory: asset.category,
        accountId,
        tags: ['investimento', 'aporte'],
      });
    },
    [investments, updateInvestmentAsset, addTransaction]
  );

  // Zero-Based Budget
  const updateZeroBasedBudget = useCallback(
    (allocations: Partial<ZeroBasedBudget['allocations']>, plannedIncome?: number) => {
      setBudget((prev) => ({
        ...prev,
        plannedIncome: plannedIncome !== undefined ? plannedIncome : prev.plannedIncome,
        allocations: {
          ...prev.allocations,
          ...allocations,
        },
      }));
    },
    []
  );

  // Monthly Closing
  const saveMonthlyClosing = useCallback(
    (rating: MonthlyClosing['rating'], notes: string) => {
      const newClosing: MonthlyClosing = {
        id: `closing_${Date.now()}`,
        month: currentMonthStr,
        rating,
        notes,
        savingsRate,
        totalIncome: monthIncome,
        totalExpenses: monthExpenses,
        totalInvested: monthInvestments,
        debtsPaid: monthDebtsPaid,
        netWorth: netWorthSummary.netWorth,
        completedAt: new Date().toISOString(),
      };

      setMonthlyClosingHistory((prev) => [newClosing, ...prev]);

      addNotification({
        title: 'Fechamento do Mês Realizado!',
        message: `Fechamento financeiro de ${currentMonthStr} salvo com sucesso. Taxa de poupança: ${savingsRate.toFixed(1)}%.`,
        type: 'system',
      });
    },
    [currentMonthStr, savingsRate, monthIncome, monthExpenses, monthInvestments, monthDebtsPaid, netWorthSummary.netWorth, addNotification]
  );

  // Diagnosis
  const saveDiagnosis = useCallback(
    (data: FinancialDiagnosisData) => {
      setDiagnosis(data);

      // Automatically calibrate Zero-based budget
      setBudget({
        month: currentMonthStr,
        plannedIncome: data.monthlyIncome,
        allocations: {
          custos_fixos: data.fixedCosts,
          conforto: data.comfortCosts,
          prazeres: data.leisureCosts,
          metas: Math.round(data.monthlyIncome * 0.12),
          liberdade_financeira: data.monthlyTargetInvestment,
          conhecimento: Math.max(0, data.monthlyIncome - (data.fixedCosts + data.comfortCosts + data.leisureCosts + Math.round(data.monthlyIncome * 0.12) + data.monthlyTargetInvestment)),
        },
      });

      // Calibrate emergency fund target
      if (data.fixedCosts > 0) {
        setEmergencyFund((prev) => ({
          ...prev,
          currentAmount: data.emergencyFundAmount || prev.currentAmount,
          targetAmount: data.fixedCosts * 6, // 6 months of fixed costs
        }));
      }

      addNotification({
        title: 'Diagnóstico AUVP Atualizado',
        message: 'Seu primeiro Orçamento Base Zero foi gerado com sucesso!',
        type: 'system',
      });
    },
    [currentMonthStr, addNotification]
  );

  // Export / Import
  const exportTransactions = useCallback(() => {
    const csv = exportTransactionsToCSV(transactions, accounts);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fluxo_financas_${currentMonthStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [transactions, accounts, currentMonthStr]);

  const importTransactions = useCallback(
    (csvText: string): number => {
      const defaultAcc = accounts[0]?.id || 'acc_nubank';
      const parsed = importTransactionsFromCSV(csvText, defaultAcc);
      if (parsed.length === 0) return 0;

      let count = 0;
      parsed.forEach((item) => {
        if (item.amount && item.description) {
          addTransaction({
            type: item.type || 'expense',
            amount: item.amount,
            date: item.date || getTodayDateString(),
            description: item.description,
            masterCategory: item.masterCategory || 'custos_fixos',
            subcategory: item.subcategory,
            accountId: defaultAcc,
            tags: ['importado-csv'],
          });
          count++;
        }
      });

      return count;
    },
    [accounts, addTransaction]
  );

  const value = {
    subTab,
    setSubTab,
    isTransactionModalOpen,
    openTransactionModal,
    closeTransactionModal,
    transactionModalInitialType,
    isDiagnosisModalOpen,
    openDiagnosisModal,
    closeDiagnosisModal,

    accounts,
    creditCards,
    transactions,
    bills,
    debts,
    installments,
    emergencyFund,
    goals,
    investments,
    budget,
    monthlyClosingHistory,
    diagnosis,

    netWorthSummary,
    availableCash,
    monthIncome,
    monthExpenses,
    monthInvestments,
    monthDebtsPaid,
    savingsRate,
    emergencyCoverage,
    healthScore,
    zeroBasedStatus,
    overdueBills,
    todayBills,
    upcomingBills,

    addTransaction,
    updateTransaction,
    deleteTransaction,
    quickAddTransaction,

    addAccount,
    updateAccount,
    deleteAccount,

    addCreditCard,
    updateCreditCard,
    deleteCreditCard,

    addBill,
    updateBill,
    deleteBill,
    payBill,
    generateTaskForBill,

    addDebt,
    updateDebt,
    deleteDebt,
    payDebtInstallment,

    updateEmergencyFund,

    addFinancialGoal,
    updateFinancialGoal,
    deleteFinancialGoal,
    contributeToGoal,
    generateTaskForGoal,

    addInvestmentAsset,
    updateInvestmentAsset,
    deleteInvestmentAsset,
    recordAporte,

    updateZeroBasedBudget,
    saveMonthlyClosing,
    saveDiagnosis,

    exportTransactions,
    importTransactions,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};

export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
