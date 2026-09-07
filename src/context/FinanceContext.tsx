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
import { useAuth } from './AuthContext';
import { loadFinanceData, saveFinanceData } from '../lib/supabaseStore';
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
  zeroBasedBudget: ZeroBasedBudget;
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
  monthlyEssentialCosts: number;
  monthlyFreeCash: number;
  recommendedEmergencyTarget: number;
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
  payDebtInstallment: (debtId: string, accountId?: string) => void;
  unpayDebtInstallment: (debtId: string) => void;

  updateEmergencyFund: (updates: Partial<EmergencyFund>) => void;
  depositToEmergencyFund: (amount: number, accountId?: string, notes?: string) => void;
  withdrawFromEmergencyFund: (amount: number, accountId?: string, notes?: string) => void;

  // Emergency Modals
  isEmergencyConfigModalOpen: boolean;
  openEmergencyConfigModal: () => void;
  closeEmergencyConfigModal: () => void;
  isEmergencyDepositModalOpen: boolean;
  openEmergencyDepositModal: () => void;
  closeEmergencyDepositModal: () => void;

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

  // Database Connection & Sync
  isFinanceDbConnected: boolean;
  isFinanceDbSaving: boolean;
  lastFinanceDbSyncedAt: string | null;
  forceFinanceDbSync: () => Promise<boolean>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addTask, addNotification, setSelectedTaskId, setActiveTab: setGlobalActiveTab } = useApp();
  const { user: authUser } = useAuth();

  // Navigation subTab
  const [subTab, setSubTab] = useState<FinanceSubTab>('overview');

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionModalInitialType, setTransactionModalInitialType] = useState<TransactionType>('expense');
  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false);

  // Entities with persistence (strictly sanitized from any previous sample data)
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);

  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);

  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);

  const [bills, setBills] = useState<FinanceBill[]>([]);

  const [debts, setDebts] = useState<FinanceDebt[]>([]);

  const [installments, setInstallments] = useState<InstallmentPurchase[]>([]);

  const [emergencyFund, setEmergencyFund] = useState<EmergencyFund>(INITIAL_EMERGENCY_FUND);

  const [goals, setGoals] = useState<FinancialGoalItem[]>([]);

  const [investments, setInvestments] = useState<InvestmentAssetItem[]>([]);

  const [budget, setBudget] = useState<ZeroBasedBudget>(INITIAL_ZERO_BASED_BUDGET);

  const [monthlyClosingHistory, setMonthlyClosingHistory] = useState<MonthlyClosing[]>([]);

  const [diagnosis, setDiagnosis] = useState<FinancialDiagnosisData>(INITIAL_DIAGNOSIS);

  // Server Database Connection & Synchronization
  const [isFinanceDbConnected, setIsFinanceDbConnected] = useState<boolean>(true);
  const [isFinanceDbSaving, setIsFinanceDbSaving] = useState<boolean>(false);
  const [lastFinanceDbSyncedAt, setLastFinanceDbSyncedAt] = useState<string | null>(null);
  const [isHydratedFromDb, setIsHydratedFromDb] = useState<boolean>(false);

  // Initial load from Supabase for the authenticated user.
  useEffect(() => {
    if (!authUser) return;
    let isMounted = true;
    async function loadFinanceFromDb() {
      try {
        const data = await loadFinanceData();
        if (data && isMounted) {
          setAccounts(data.accounts as FinanceAccount[]);
          setCreditCards(data.creditCards as CreditCard[]);
          setTransactions(data.transactions as FinanceTransaction[]);
          setBills(data.bills as FinanceBill[]);
          setDebts(data.debts as FinanceDebt[]);
          setInstallments(data.installments as InstallmentPurchase[]);
          if (data.emergencyFund) setEmergencyFund(data.emergencyFund as EmergencyFund);
          setGoals(data.goals as FinancialGoalItem[]);
          setInvestments(data.investments as InvestmentAssetItem[]);
          if (data.budget && Object.keys(data.budget).length) setBudget(data.budget as ZeroBasedBudget);
          setMonthlyClosingHistory(data.closings as MonthlyClosing[]);
          if (data.diagnosis && Object.keys(data.diagnosis).length) setDiagnosis(data.diagnosis as FinancialDiagnosisData);

          setIsFinanceDbConnected(true);
          setLastFinanceDbSyncedAt(new Date().toLocaleTimeString('pt-BR'));
        }
      } catch (err) {
        console.error('Could not load finance data from Supabase:', err);
        setIsFinanceDbConnected(false);
      } finally {
        if (isMounted) setIsHydratedFromDb(true);
      }
    }
    loadFinanceFromDb();
    return () => {
      isMounted = false;
    };
  }, [authUser]);

  // Payload for server database sync
  const financeDbPayload = useMemo(() => ({
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
    closings: monthlyClosingHistory,
    diagnosis,
  }), [accounts, creditCards, transactions, bills, debts, installments, emergencyFund, goals, investments, budget, monthlyClosingHistory, diagnosis]);

  // Auto-sync debounced to Supabase.
  useEffect(() => {
    if (!isHydratedFromDb || !authUser) return;

    const timer = setTimeout(async () => {
      try {
        setIsFinanceDbSaving(true);
        await saveFinanceData(authUser.id, financeDbPayload);
        setIsFinanceDbConnected(true);
        setLastFinanceDbSyncedAt(new Date().toLocaleTimeString('pt-BR'));
      } catch (error) {
        console.error('Could not save finance data to Supabase:', error);
        setIsFinanceDbConnected(false);
      } finally {
        setIsFinanceDbSaving(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [authUser, financeDbPayload, isHydratedFromDb]);

  const forceFinanceDbSync = useCallback(async (): Promise<boolean> => {
    if (!authUser) return false;
    setIsFinanceDbSaving(true);
    try {
      await saveFinanceData(authUser.id, financeDbPayload);
      setIsFinanceDbConnected(true);
      setLastFinanceDbSyncedAt(new Date().toLocaleTimeString('pt-BR'));
      return true;
    } catch {
      setIsFinanceDbConnected(false);
      return false;
    } finally {
      setIsFinanceDbSaving(false);
    }
  }, [authUser, financeDbPayload]);

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

  const [isEmergencyConfigModalOpen, setIsEmergencyConfigModalOpen] = useState(false);
  const openEmergencyConfigModal = useCallback(() => setIsEmergencyConfigModalOpen(true), []);
  const closeEmergencyConfigModal = useCallback(() => setIsEmergencyConfigModalOpen(false), []);

  const [isEmergencyDepositModalOpen, setIsEmergencyDepositModalOpen] = useState(false);
  const openEmergencyDepositModal = useCallback(() => setIsEmergencyDepositModalOpen(true), []);
  const closeEmergencyDepositModal = useCallback(() => setIsEmergencyDepositModalOpen(false), []);

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

  // Monthly fixed costs from budget, bills, or diagnosis
  const monthlyEssentialCosts = useMemo(() => {
    if (budget.allocations.custos_fixos > 0) return budget.allocations.custos_fixos;
    const fixedBillsTotal = bills
      .filter((b) => b.masterCategory === 'custos_fixos')
      .reduce((acc, b) => acc + b.amount, 0);
    if (fixedBillsTotal > 0) return fixedBillsTotal;
    if (diagnosis.fixedCosts > 0) return diagnosis.fixedCosts;
    return 0;
  }, [budget, bills, diagnosis]);

  const recommendedEmergencyTarget = useMemo(() => {
    const months = emergencyFund.targetMonths || 6;
    if (monthlyEssentialCosts > 0) {
      return monthlyEssentialCosts * months;
    }
    return emergencyFund.targetAmount || 0;
  }, [emergencyFund.targetMonths, emergencyFund.targetAmount, monthlyEssentialCosts]);

  const monthlyFreeCash = useMemo(() => {
    const effectiveIncome = monthIncome > 0 ? monthIncome : (budget.plannedIncome || diagnosis.monthlyIncome || 0);
    const effectiveExpenses = monthExpenses > 0 ? monthExpenses : (monthlyEssentialCosts + (budget.allocations.conforto || 0));
    return Math.max(0, effectiveIncome - effectiveExpenses);
  }, [monthIncome, budget, diagnosis, monthExpenses, monthlyEssentialCosts]);

  const emergencyCoverage = useMemo(() => {
    const baseCost = monthlyEssentialCosts > 0
      ? monthlyEssentialCosts
      : (emergencyFund.targetAmount > 0 ? emergencyFund.targetAmount / (emergencyFund.targetMonths || 6) : 0);
    return calculateEmergencyFundCoverage(emergencyFund.currentAmount, baseCost);
  }, [emergencyFund.currentAmount, emergencyFund.targetAmount, emergencyFund.targetMonths, monthlyEssentialCosts]);

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
      const newId = crypto.randomUUID();
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
    const newId = crypto.randomUUID();
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
    const newId = crypto.randomUUID();
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
    const newId = crypto.randomUUID();
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
    const newId = crypto.randomUUID();
    setDebts((prev) => [...prev, { ...debtData, id: newId }]);
  }, []);

  const updateDebt = useCallback((id: string, updates: Partial<FinanceDebt>) => {
    setDebts((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  }, []);

  const deleteDebt = useCallback((id: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const payDebtInstallment = useCallback(
    (debtId: string, accountId?: string) => {
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

      if (accountId) {
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
      }
    },
    [debts, updateDebt, addTransaction]
  );

  const unpayDebtInstallment = useCallback(
    (debtId: string) => {
      const debt = debts.find((d) => d.id === debtId);
      if (!debt) return;

      const newRemaining = Math.min(debt.totalInstallments, debt.remainingInstallments + 1);
      const newBalance = debt.currentBalance + debt.installmentAmount;

      updateDebt(debtId, {
        remainingInstallments: newRemaining,
        currentBalance: newBalance,
        status: 'active',
      });

      // Remove the latest debt_payment transaction for this creditor if exists
      setTransactions((prev) => {
        const idx = prev.findIndex(
          (t) => t.type === 'debt_payment' && t.description?.includes(debt.creditor)
        );
        if (idx !== -1) {
          const removed = prev[idx];
          return prev.filter((_, i) => i !== idx);
        }
        return prev;
      });
    },
    [debts, updateDebt]
  );

  // Emergency Fund
  const updateEmergencyFund = useCallback((updates: Partial<EmergencyFund>) => {
    setEmergencyFund((prev) => ({ ...prev, ...updates }));
  }, []);

  const depositToEmergencyFund = useCallback(
    (amount: number, accountId?: string, notes?: string) => {
      if (amount <= 0) return;
      setEmergencyFund((prev) => ({
        ...prev,
        currentAmount: prev.currentAmount + amount,
      }));

      if (accountId) {
        addTransaction({
          type: 'transfer',
          amount,
          date: getTodayDateString(),
          description: notes ? `Aporte Reserva: ${notes}` : 'Aporte na Reserva de Emergência',
          masterCategory: 'metas',
          subcategory: 'Reserva de Emergência',
          accountId,
          tags: ['reserva', 'segurança', 'auvp'],
        });
      }
    },
    [addTransaction]
  );

  const withdrawFromEmergencyFund = useCallback(
    (amount: number, accountId?: string, notes?: string) => {
      if (amount <= 0) return;
      setEmergencyFund((prev) => ({
        ...prev,
        currentAmount: Math.max(0, prev.currentAmount - amount),
      }));

      if (accountId) {
        addTransaction({
          type: 'income',
          amount,
          date: getTodayDateString(),
          description: notes ? `Resgate Reserva: ${notes}` : 'Resgate da Reserva de Emergência',
          masterCategory: 'metas',
          subcategory: 'Resgate Emergencial',
          accountId,
          tags: ['reserva', 'resgate', 'emergência'],
        });
      }
    },
    [addTransaction]
  );

  // Financial Goals
  const addFinancialGoal = useCallback((goalData: Omit<FinancialGoalItem, 'id'>) => {
    const newId = crypto.randomUUID();
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
        tags: ['meta'],
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
    const newId = crypto.randomUUID();
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
        message: `Fechamento financeiro de ${currentMonthStr} salvo com sucesso. Taxa de alocação para metas e investimentos: ${savingsRate.toFixed(1)}%.`,
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
    zeroBasedBudget: budget,
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
    monthlyEssentialCosts,
    monthlyFreeCash,
    recommendedEmergencyTarget,
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
    unpayDebtInstallment,

    updateEmergencyFund,
    depositToEmergencyFund,
    withdrawFromEmergencyFund,

    isEmergencyConfigModalOpen,
    openEmergencyConfigModal,
    closeEmergencyConfigModal,
    isEmergencyDepositModalOpen,
    openEmergencyDepositModal,
    closeEmergencyDepositModal,

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

    // Database Connection & Sync
    isFinanceDbConnected,
    isFinanceDbSaving,
    lastFinanceDbSyncedAt,
    forceFinanceDbSync,
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
