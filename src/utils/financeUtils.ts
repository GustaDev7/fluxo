import {
  MasterCategory,
  FinanceTransaction,
  FinanceAccount,
  CreditCard,
  FinanceDebt,
  InvestmentAssetItem,
  EmergencyFund,
  ZeroBasedBudget,
  FinancialHealthScore,
} from '../types/finance';
import Decimal from 'decimal.js';
import { pricePayment } from '../domain/debtEngine';

export const MASTER_CATEGORY_CONFIG: Record<
  MasterCategory,
  {
    id: MasterCategory;
    name: string;
    color: string;
    bgLight: string;
    description: string;
    recommendedShare: string;
    examples: string;
  }
> = {
  custos_fixos: {
    id: 'custos_fixos',
    name: 'Custos Fixos',
    color: '#3B82F6',
    bgLight: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    description: 'Despesas essenciais e recorrentes indispensáveis para viver e trabalhar.',
    recommendedShare: '40% - 50%',
    examples: 'Aluguel, Condomínio, Energia, Água, Internet, Telefone, Transporte, Seguros, Saúde',
  },
  conforto: {
    id: 'conforto',
    name: 'Conforto',
    color: '#8B5CF6',
    bgLight: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    description: 'Gastos que melhoram a qualidade de vida e o bem-estar, mas não são vitais.',
    recommendedShare: '10% - 15%',
    examples: 'Streaming, Restaurantes, Delivery, Serviços de conveniência, Compras para o lar',
  },
  metas: {
    id: 'metas',
    name: 'Metas',
    color: '#F59E0B',
    bgLight: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    description: 'Recursos reservados para objetivos financeiros de curto e médio prazo.',
    recommendedShare: '10% - 15%',
    examples: 'Reserva de Emergência, Compra de Carro, Imóvel, Viagem de Férias, Fundo de Projeto',
  },
  prazeres: {
    id: 'prazeres',
    name: 'Prazeres',
    color: '#EC4899',
    bgLight: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border-pink-200 dark:border-pink-800',
    description: 'Lazer, entretenimento, hobbies e consumo pessoal sem culpa.',
    recommendedShare: '5% - 10%',
    examples: 'Cinema, Jogos, Passeios, Hobbies, Compras pessoais, Eventos sociais',
  },
  liberdade_financeira: {
    id: 'liberdade_financeira',
    name: 'Liberdade Financeira',
    color: '#10B981',
    bgLight: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    description: 'Construção patrimonial e investimentos de longo prazo geradores de renda passiva.',
    recommendedShare: '20% - 30%',
    examples: 'Ações, Fundos Imobiliários (FIIs), Renda Fixa, Previdência, Investimentos no Exterior',
  },
  conhecimento: {
    id: 'conhecimento',
    name: 'Conhecimento',
    color: '#06B6D4',
    bgLight: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    description: 'Investimentos em educação, livros, mentorias e qualificação profissional contínua.',
    recommendedShare: '5% - 10%',
    examples: 'Faculdade, Cursos, Livros, Certificações, Congressos, Idiomas',
  },
};

/**
 * Format any number as Brazilian Real (BRL)
 * Example: 18450 -> "R$ 18.450,00"
 */
export function formatBRL(value: number): string {
  if (isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage with 1 decimal
 * Example: 19.2 -> "19,2%"
 */
export function formatPercent(value: number): string {
  if (isNaN(value)) return '0,0%';
  return `${value.toFixed(1).replace('.', ',')}%`;
}

/**
 * Parse string into number safely
 */
export function parseBRLInput(str: string): number {
  if (!str) return 0;
  // Remove R$, spaces and replace comma with dot
  const clean = str.replace(/[R$\s.]/g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Calculate Net Worth = (Accounts Balance + Investment Assets Value) - (Debts + Credit Card Invoices)
 */
export function calculateNetWorth(
  accounts: FinanceAccount[],
  investments: InvestmentAssetItem[],
  debts: FinanceDebt[],
  cards: CreditCard[]
): {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  accountsTotal: number;
  investmentsTotal: number;
  debtsTotal: number;
  cardsInvoicesTotal: number;
} {
  const accountsTotal = accounts.reduce((acc, a) => acc + (a.isActive ? a.balance : 0), 0);
  const investmentsTotal = investments.reduce((acc, i) => acc + i.currentValue, 0);
  const totalAssets = accountsTotal + investmentsTotal;

  const debtsTotal = debts.reduce((acc, d) => (d.status === 'active' ? acc + d.currentBalance : 0), 0);
  const cardsInvoicesTotal = cards.reduce((acc, c) => acc + (c.currentInvoice || 0), 0);
  const totalLiabilities = debtsTotal + cardsInvoicesTotal;

  const netWorth = totalAssets - totalLiabilities;

  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    accountsTotal,
    investmentsTotal,
    debtsTotal,
    cardsInvoicesTotal,
  };
}

/**
 * Calculate Zero-Based Budget status
 */
export function calculateZeroBasedBudgetStatus(budget: ZeroBasedBudget): {
  totalAllocated: number;
  unallocated: number;
  status: 'balanced' | 'partially_planned' | 'over_budget';
  percentageAllocated: number;
} {
  const alloc = budget.allocations;
  const totalAllocated =
    (alloc.custos_fixos || 0) +
    (alloc.conforto || 0) +
    (alloc.metas || 0) +
    (alloc.prazeres || 0) +
    (alloc.liberdade_financeira || 0) +
    (alloc.conhecimento || 0);

  const unallocated = budget.plannedIncome - totalAllocated;
  const percentageAllocated =
    budget.plannedIncome > 0 ? Math.round((totalAllocated / budget.plannedIncome) * 100) : 0;

  let status: 'balanced' | 'partially_planned' | 'over_budget' = 'balanced';
  if (Math.abs(unallocated) <= 1) {
    status = 'balanced';
  } else if (unallocated > 1) {
    status = 'partially_planned';
  } else {
    status = 'over_budget';
  }

  return {
    totalAllocated,
    unallocated,
    status,
    percentageAllocated,
  };
}

/**
 * Calculate Emergency Fund coverage in months
 */
export function calculateEmergencyFundCoverage(
  currentFund: number,
  monthlyEssentialCosts: number
): {
  monthsCovered: number;
  status: 'safe' | 'building' | 'critical';
} {
  if (monthlyEssentialCosts <= 0) return { monthsCovered: 0, status: 'building' };
  const months = currentFund / monthlyEssentialCosts;
  let status: 'safe' | 'building' | 'critical' = 'building';
  if (months >= 6) status = 'safe';
  else if (months < 2) status = 'critical';

  return {
    monthsCovered: Math.round(months * 10) / 10,
    status,
  };
}

/**
 * Calculate Financial Health Score (0 - 100) based on AUVP and healthy personal finance metrics
 */
export function calculateFinancialHealthScore(params: {
  monthlyIncome: number;
  savingsRate: number; // in %
  emergencyFundMonths: number;
  debtCommitmentPercent: number; // in %
  isBudgetBalanced: boolean;
  overdueBillsCount: number;
  hasInvestments: boolean;
}): FinancialHealthScore {
  let score = 50; // baseline
  const factors: FinancialHealthScore['factors'] = [];

  // 1. Allocation rate (20 pts)
  if (params.savingsRate >= 20) {
    score += 15;
    factors.push({
      label: 'Boa Alocação Financeira',
      status: 'positive',
      detail: `Você destina ${formatPercent(params.savingsRate)} para metas e investimentos (excelente, acima de 20%).`,
    });
  } else if (params.savingsRate >= 10) {
    score += 8;
    factors.push({
      label: 'Alocação Financeira Moderada',
      status: 'neutral',
      detail: `Você destina ${formatPercent(params.savingsRate)} para metas e investimentos. O ideal é buscar gradualmente 20% da renda.`,
    });
  } else {
    score -= 10;
    factors.push({
      label: 'Alocação Financeira Baixa',
      status: 'negative',
      detail: `A alocação atual está em ${formatPercent(params.savingsRate)}. Busque reduzir custos não essenciais e priorizar suas metas.`,
    });
  }

  // 2. Emergency Fund (20 pts)
  if (params.emergencyFundMonths >= 6) {
    score += 15;
    factors.push({
      label: 'Reserva de Emergência Blindada',
      status: 'positive',
      detail: `Sua reserva cobre ${params.emergencyFundMonths} meses de custos fixos essenciais.`,
    });
  } else if (params.emergencyFundMonths >= 3) {
    score += 7;
    factors.push({
      label: 'Reserva em Construção',
      status: 'neutral',
      detail: `Cobre ${params.emergencyFundMonths} meses de custos fixos. Meta recomendada: 6 meses.`,
    });
  } else {
    score -= 10;
    factors.push({
      label: 'Reserva Insuficiente',
      status: 'negative',
      detail: `Reserva cobre apenas ${params.emergencyFundMonths} meses. Priorize formar o colchão de segurança.`,
    });
  }

  // 3. Debt Commitment Rate (20 pts)
  if (params.debtCommitmentPercent === 0) {
    score += 15;
    factors.push({
      label: 'Livre de Dívidas Onkrosas',
      status: 'positive',
      detail: '0% da renda mensal comprometida com parcelamentos de dívidas.',
    });
  } else if (params.debtCommitmentPercent <= 15) {
    score += 5;
    factors.push({
      label: 'Endividamento Sob Controle',
      status: 'neutral',
      detail: `${formatPercent(params.debtCommitmentPercent)} da renda gasta em parcelas de dívidas (abaixo de 15%).`,
    });
  } else {
    score -= 15;
    factors.push({
      label: 'Endividamento Elevado',
      status: 'negative',
      detail: `${formatPercent(params.debtCommitmentPercent)} da renda está comprometida com dívidas. Adote plano de quitação.`,
    });
  }

  // 4. Zero-Based Budget Balance (15 pts)
  if (params.isBudgetBalanced) {
    score += 10;
    factors.push({
      label: 'Orçamento Base Zero Equilibrado',
      status: 'positive',
      detail: 'Cada real da sua renda possui destino planejado sem sobra descontrolada.',
    });
  } else {
    score -= 5;
    factors.push({
      label: 'Orçamento Pendente de Equilíbrio',
      status: 'neutral',
      detail: 'Revise o orçamento do mês para destinar 100% da renda.',
    });
  }

  // 5. Overdue Bills Penalty
  if (params.overdueBillsCount > 0) {
    score -= params.overdueBillsCount * 10;
    factors.push({
      label: 'Contas Atrasadas',
      status: 'negative',
      detail: `Atenção: ${params.overdueBillsCount} conta(s) em atraso gerando juros e multas desnecessárias.`,
    });
  } else {
    score += 5;
    factors.push({
      label: 'Contas em Dia',
      status: 'positive',
      detail: 'Nenhum vencimento em atraso no período.',
    });
  }

  const finalScore = Math.max(5, Math.min(100, score));

  let rating: FinancialHealthScore['rating'] = 'Boa';
  if (finalScore >= 85) rating = 'Excelente';
  else if (finalScore >= 70) rating = 'Boa';
  else if (finalScore >= 50) rating = 'Regular';
  else rating = 'Atenção';

  return {
    score: finalScore,
    rating,
    factors,
  };
}

/**
 * Smart Quick Transaction Parser
 * Example: "Uber 32 reais" -> { type: 'expense', amount: 32, category: 'custos_fixos', description: 'Uber' }
 * Example: "Salário 5000" -> { type: 'income', amount: 5000, category: 'custos_fixos', description: 'Salário' }
 * Example: "Aporte tesouro 400" -> { type: 'investment', amount: 400, category: 'liberdade_financeira', description: 'Aporte tesouro' }
 */
export function smartParseTransaction(input: string): {
  type: FinanceTransaction['type'];
  amount: number;
  description: string;
  masterCategory: MasterCategory;
  subcategory?: string;
} {
  const text = input.trim();
  let type: FinanceTransaction['type'] = 'expense';
  let masterCategory: MasterCategory = 'custos_fixos';
  let subcategory: string | undefined = undefined;

  const lower = text.toLowerCase();

  // 1. Detect amount
  // Regex for numbers like 32, 32.50, 32,50, 1.250,00
  const numberMatch = text.match(/(\d+([.,]\d{1,2})?)/);
  let amount = 0;
  let remainingText = text;

  if (numberMatch) {
    const rawNum = numberMatch[1].replace(',', '.');
    amount = parseFloat(rawNum) || 0;
    remainingText = text.replace(numberMatch[0], '').replace(/\breais\b|\br\$\b/gi, '').trim();
  }

  const cleanDescription = remainingText.trim() || 'Lançamento Rápido';

  // 2. Detect type & category by keywords
  if (
    lower.includes('salário') ||
    lower.includes('salario') ||
    lower.includes('receita') ||
    lower.includes('pix recebido') ||
    lower.includes('venda') ||
    lower.includes('freela') ||
    lower.includes('dividendo')
  ) {
    type = 'income';
    masterCategory = 'custos_fixos';
  } else if (
    lower.includes('investimento') ||
    lower.includes('aporte') ||
    lower.includes('tesouro') ||
    lower.includes('fii') ||
    lower.includes('cdb') ||
    lower.includes('ações') ||
    lower.includes('cripto') ||
    lower.includes('bitcoin')
  ) {
    type = 'investment';
    masterCategory = 'liberdade_financeira';
    subcategory = 'Aporte Patrimonial';
  } else if (
    lower.includes('dívida') ||
    lower.includes('divida') ||
    lower.includes('empréstimo') ||
    lower.includes('financiamento') ||
    lower.includes('parcela carro')
  ) {
    type = 'debt_payment';
    masterCategory = 'custos_fixos';
    subcategory = 'Amortização';
  } else if (
    lower.includes('curso') ||
    lower.includes('livro') ||
    lower.includes('faculdade') ||
    lower.includes('certificação') ||
    lower.includes('aula') ||
    lower.includes('workshop')
  ) {
    type = 'expense';
    masterCategory = 'conhecimento';
    subcategory = 'Educação';
  } else if (
    lower.includes('cinema') ||
    lower.includes('show') ||
    lower.includes('jogo') ||
    lower.includes('bar') ||
    lower.includes('balada') ||
    lower.includes('cerveja') ||
    lower.includes('viagem') ||
    lower.includes('passeio') ||
    lower.includes('hobby')
  ) {
    type = 'expense';
    masterCategory = 'prazeres';
    subcategory = 'Lazer';
  } else if (
    lower.includes('ifood') ||
    lower.includes('delivery') ||
    lower.includes('restaurante') ||
    lower.includes('uber') ||
    lower.includes('streaming') ||
    lower.includes('netflix') ||
    lower.includes('spotify') ||
    lower.includes('café') ||
    lower.includes('mercado conforto')
  ) {
    type = 'expense';
    masterCategory = 'conforto';
    subcategory = 'Conveniência';
  } else if (
    lower.includes('aluguel') ||
    lower.includes('condomínio') ||
    lower.includes('energia') ||
    lower.includes('luz') ||
    lower.includes('água') ||
    lower.includes('internet') ||
    lower.includes('mercado') ||
    lower.includes('supermercado') ||
    lower.includes('farmácia') ||
    lower.includes('combustível') ||
    lower.includes('gasolina')
  ) {
    type = 'expense';
    masterCategory = 'custos_fixos';
    subcategory = 'Essencial';
  } else if (
    lower.includes('reserva') ||
    lower.includes('meta') ||
    lower.includes('fundo')
  ) {
    type = 'expense';
    masterCategory = 'metas';
    subcategory = 'Objetivo';
  }

  return {
    type,
    amount,
    description: cleanDescription,
    masterCategory,
    subcategory,
  };
}

/**
 * Export transactions to CSV format
 */
export function exportTransactionsToCSV(
  transactions: FinanceTransaction[],
  accounts: FinanceAccount[]
): string {
  const headers = [
    'ID',
    'Data',
    'Descrição',
    'Tipo',
    'Valor',
    'Categoria AUVP',
    'Subcategoria',
    'Conta',
    'Recorrência',
    'Tags',
    'Notas',
  ];

  const getAccountName = (id?: string) => accounts.find((a) => a.id === id)?.name || 'N/A';

  const rows = transactions.map((t) => [
    t.id,
    t.date,
    `"${t.description.replace(/"/g, '""')}"`,
    t.type,
    t.amount.toFixed(2),
    MASTER_CATEGORY_CONFIG[t.masterCategory]?.name || t.masterCategory,
    `"${(t.subcategory || '').replace(/"/g, '""')}"`,
    `"${getAccountName(t.accountId)}"`,
    t.recurrence || 'none',
    `"${(t.tags || []).join(', ')}"`,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Import transactions from CSV or OFX simplified text
 */
export function importTransactionsFromCSV(
  csvText: string,
  defaultAccountId: string
): Partial<FinanceTransaction>[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];

  const parsed: Partial<FinanceTransaction>[] = [];

  // Check if first line is header
  const startIndex = lines[0].toLowerCase().includes('data') || lines[0].toLowerCase().includes('date') ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    // Simple CSV parser supporting quotes
    const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    if (parts.length >= 3) {
      const dateRaw = parts[1]?.replace(/"/g, '').trim() || new Date().toISOString().split('T')[0];
      const desc = parts[2]?.replace(/"/g, '').trim() || parts[0]?.replace(/"/g, '').trim() || 'Importado';
      const amountVal = parseFloat(parts[4]?.replace(/"/g, '').replace('R$', '').trim() || parts[3] || '0') || 0;

      const detected = smartParseTransaction(desc);

      parsed.push({
        date: dateRaw,
        description: desc,
        amount: Math.abs(amountVal) || detected.amount || 50,
        type: amountVal < 0 ? 'expense' : detected.type,
        masterCategory: detected.masterCategory,
        subcategory: detected.subcategory,
        accountId: defaultAccountId,
      });
    }
  }

  return parsed;
}

export interface AmortizationEstimate {
  extraMonthly: number;
  originalMonths: number;
  newMonths: number;
  monthsSaved: number;
  originalTotalPaid: number;
  newTotalPaid: number;
  interestSaved: number;
  originalInterest: number;
  newInterest: number;
  originalPayoffDate: string;
  estimatedPayoffDate: string;
  lastInstallmentDiscount: {
    originalAmount: number;
    discountedAmount: number;
    discountSaved: number;
    discountPercent: number;
  };
}

/**
 * Calculates what happens if the user starts amortizing (extra monthly or anticipations)
 */
export function calculateAmortizationEstimate(
  currentBalance: number,
  installmentAmount: number,
  remainingInstallments: number,
  monthlyInterestRatePercent: number,
  extraMonthly: number = 100
): AmortizationEstimate {
  const remMonths = Math.max(1, remainingInstallments);
  const pmt = Math.max(0, installmentAmount);
  const rate = Math.max(0, monthlyInterestRatePercent) / 100;

  const originalTotalPaidDecimal = new Decimal(remMonths).mul(pmt);
  const originalTotalPaid = originalTotalPaidDecimal.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();

  // Use exact present value (principal / saldo devedor contábil) as basis for interest calculation
  const calculatedPV = rate > 0 ? calculateBalancePrice(pmt, remMonths, monthlyInterestRatePercent) : remMonths * pmt;
  const principalBase = calculatedPV > 0 ? calculatedPV : (currentBalance > 0 && currentBalance < originalTotalPaid ? currentBalance : originalTotalPaid);

  const originalInterest = Math.max(0, originalTotalPaid - principalBase);

  let balance = new Decimal(principalBase);
  let months = 0;
  let totalPaid = new Decimal(0);
  let totalInterest = new Decimal(0);
  const rateDecimal = new Decimal(rate);
  const regularPayment = new Decimal(pmt).plus(extraMonthly);
  const maxIterations = 1000;

  while (balance.gt('0.005') && months < maxIterations) {
    months++;
    const monthlyInterest = balance.mul(rateDecimal);
    const amountDue = balance.plus(monthlyInterest);
    const payment = Decimal.min(regularPayment, amountDue);
    const principal = Decimal.max(0, payment.minus(monthlyInterest));
    totalInterest = totalInterest.plus(monthlyInterest);
    totalPaid = totalPaid.plus(payment);
    balance = Decimal.max(0, balance.minus(principal));
  }

  const newMonths = months > 0 ? months : remMonths;
  const monthsSaved = Math.max(0, remMonths - newMonths);
  const newTotalPaid = totalPaid.gt(0) ? totalPaid.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber() : originalTotalPaid;
  const newInterest = totalInterest.gt(0) ? totalInterest.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber() : originalInterest;
  const interestSaved = Math.max(0, originalTotalPaid - newTotalPaid);

  const now = new Date();
  const getMonthYear = (addMonths: number) => {
    const d = new Date(now.getFullYear(), now.getMonth() + addMonths, 1);
    const month = d.toLocaleDateString('pt-BR', { month: 'short' });
    return `${month.charAt(0).toUpperCase() + month.slice(1)}/${d.getFullYear()}`;
  };

  const originalPayoffDate = getMonthYear(remMonths);
  const estimatedPayoffDate = getMonthYear(newMonths);

  // Antecipação da última parcela com desconto (Tabela Price / CDC)
  const discountFactor = new Decimal(1).plus(rate).pow(remMonths);
  const discountedAmount = rate > 0 && discountFactor.gt(1) ? new Decimal(pmt).div(discountFactor).toNumber() : pmt;
  const discountSaved = Math.max(0, pmt - discountedAmount);
  const discountPercent = pmt > 0 ? (discountSaved / pmt) * 100 : 0;

  return {
    extraMonthly,
    originalMonths: remMonths,
    newMonths,
    monthsSaved,
    originalTotalPaid,
    newTotalPaid,
    interestSaved,
    originalInterest,
    newInterest,
    originalPayoffDate,
    estimatedPayoffDate,
    lastInstallmentDiscount: {
      originalAmount: pmt,
      discountedAmount: Math.round(discountedAmount * 100) / 100,
      discountSaved: Math.round(discountSaved * 100) / 100,
      discountPercent: Math.round(discountPercent * 10) / 10,
    },
  };
}

/**
 * Calculates monthly installment (PMT) from present value (PV), remaining months (n),
 * and monthly interest rate (i) using Brazilian Tabela Price (CDC):
 * PMT = PV * [ i / (1 - (1 + i)^(-n)) ]
 */
export function calculateInstallmentPrice(
  presentValue: number,
  remainingInstallments: number,
  monthlyRatePercent: number
): number {
  const n = Math.max(1, remainingInstallments);
  const pv = Math.max(0, presentValue);
  const i = Math.max(0, monthlyRatePercent) / 100;
  if (pv === 0) return 0;
  if (i === 0) return Math.round((pv / n) * 100) / 100;
  return pricePayment(pv, monthlyRatePercent, n).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

/**
 * Calculates present value (PV / Saldo Devedor a Quitar Hoje) from monthly installment (PMT),
 * remaining months (n), and monthly interest rate (i) using Tabela Price:
 * PV = PMT * [ (1 - (1 + i)^(-n)) / i ]
 */
export function calculateBalancePrice(
  installmentAmount: number,
  remainingInstallments: number,
  monthlyRatePercent: number
): number {
  const n = Math.max(1, remainingInstallments);
  const pmt = Math.max(0, installmentAmount);
  const i = Math.max(0, monthlyRatePercent) / 100;
  if (pmt === 0) return 0;
  if (i === 0) return Math.round(pmt * n * 100) / 100;
  const rate = new Decimal(i);
  const pv = new Decimal(pmt).mul(new Decimal(1).minus(rate.plus(1).pow(-n)).div(rate));
  return pv.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

export interface NubankInstallmentItem {
  number: number;
  dueDate: string;
  dueDateLabel: string;
  daysRemaining: number;
  originalAmount: number;
  discountedAmount: number;
  savingsAmount: number;
  savingsPercent: number;
}

/**
 * Calculates exact installment-by-installment discount schedule matching Nubank CDC antecipação
 */
export function calculateNubankInstallmentsBreakdown(
  installmentAmount: number,
  totalInstallments: number,
  remainingInstallments: number,
  monthlyRatePercent: number,
  dueDay: number = 22
): NubankInstallmentItem[] {
  const pmt = Math.max(0, installmentAmount);
  const total = Math.max(1, totalInstallments);
  const remaining = Math.max(0, Math.min(total, remainingInstallments));
  const paidCount = Math.max(0, total - remaining);
  const rate = Math.max(0, monthlyRatePercent) / 100;

  if (remaining === 0 || pmt === 0) return [];

  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const day = Math.min(31, Math.max(1, dueDay || 22));

  // Determine starting month for the next installment
  let startYear = currentYear;
  let startMonth = currentMonth;
  if (currentDay > day) {
    startMonth += 1;
    if (startMonth > 11) {
      startMonth = 0;
      startYear += 1;
    }
  }

  const items: NubankInstallmentItem[] = [];

  const MONTH_SHORT_PT = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  for (let idx = 0; idx < remaining; idx++) {
    const parcelNum = paidCount + idx + 1;
    let parcelYear = startYear;
    let parcelMonth = startMonth + idx;
    while (parcelMonth > 11) {
      parcelMonth -= 12;
      parcelYear += 1;
    }

    const daysInMonth = new Date(parcelYear, parcelMonth + 1, 0).getDate();
    const actualDay = Math.min(day, daysInMonth);

    const parcelDate = new Date(parcelYear, parcelMonth, actualDay, 0, 0, 0);
    const todayZero = new Date(currentYear, currentMonth, currentDay, 0, 0, 0);
    const diffMs = parcelDate.getTime() - todayZero.getTime();
    const daysRemaining = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));

    const pad = (n: number) => String(n).padStart(2, '0');
    const dueDate = `${pad(actualDay)}/${pad(parcelMonth + 1)}/${parcelYear}`;
    const dueDateLabel = `${pad(actualDay)} ${MONTH_SHORT_PT[parcelMonth]} ${parcelYear}`;

    // Compound discount pro-rata die matching Nubank formula: PMT / (1 + i)^(days / 30.4167)
    let discountedAmount = pmt;
    let savingsAmount = 0;
    let savingsPercent = 0;

    if (rate > 0) {
      const periodsAhead = new Decimal(daysRemaining).mul(12).div(365);
      const discountFactor = new Decimal(1).plus(rate).pow(periodsAhead);
      if (discountFactor.gt(1)) {
        discountedAmount = new Decimal(pmt).div(discountFactor).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
        savingsAmount = new Decimal(pmt).minus(discountedAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
        savingsPercent = Math.round((savingsAmount / pmt) * 1000) / 10;
      }
    }

    items.push({
      number: parcelNum,
      dueDate,
      dueDateLabel,
      daysRemaining,
      originalAmount: pmt,
      discountedAmount,
      savingsAmount,
      savingsPercent,
    });
  }

  return items;
}

export interface DebtFinancialBreakdown {
  nominalTotal: number;
  payoffToday: number;
  interestSavings: number;
  ratePercent: number;
  remainingInstallments: number;
  totalInstallments: number;
  paidInstallments: number;
  installmentAmount: number;
  dueDay: number;
  items: NubankInstallmentItem[];
}

/**
 * Computes exact debt metrics: nominal remaining payments, net present payoff today, and interest savings
 */
export function calculateDebtInterestBreakdown(
  balancePV: number,
  installmentAmount: number,
  remainingInstallments: number,
  monthlyRatePercent: number,
  dueDay: number = 22,
  totalInstallments: number = 9
): DebtFinancialBreakdown {
  const n = Math.max(0, remainingInstallments);
  const pmt = Math.max(0, installmentAmount);
  const total = Math.max(n, totalInstallments || 9);
  const paid = Math.max(0, total - n);
  const nominalTotal = Math.round(n * pmt * 100) / 100;

  const items = calculateNubankInstallmentsBreakdown(pmt, total, n, monthlyRatePercent, dueDay);

  let payoffToday = nominalTotal;
  if (items.length > 0 && monthlyRatePercent > 0) {
    payoffToday = Math.round(items.reduce((acc, it) => acc + it.discountedAmount, 0) * 100) / 100;
  } else if (balancePV > 0 && balancePV < nominalTotal) {
    payoffToday = balancePV;
  }

  const interestSavings = Math.max(0, Math.round((nominalTotal - payoffToday) * 100) / 100);

  return {
    nominalTotal,
    payoffToday,
    interestSavings,
    ratePercent: monthlyRatePercent,
    remainingInstallments: n,
    totalInstallments: total,
    paidInstallments: paid,
    installmentAmount: pmt,
    dueDay,
    items,
  };
}

/**
 * Due Date Status and Countdown for Debt Cards
 */
export interface DebtDueDateStatus {
  formattedDate: string; // e.g. "19/09/2026"
  daysRemaining: number;
  isToday: boolean;
  isUrgent: boolean; // 1 to 5 days
  isPastDueThisMonth: boolean;
  statusLabel: string;
  badgeStyle: 'today' | 'urgent' | 'normal';
}

export function getDebtDueDateStatus(dueDay: number): DebtDueDateStatus {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const day = Math.min(31, Math.max(1, dueDay || 10));

  let targetYear = currentYear;
  let targetMonth = currentMonth;
  let isPastDueThisMonth = false;

  if (currentDay > day) {
    isPastDueThisMonth = true;
    targetMonth = currentMonth + 1;
    if (targetMonth > 11) {
      targetMonth = 0;
      targetYear++;
    }
  }

  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const actualTargetDay = Math.min(day, daysInTargetMonth);

  const targetDate = new Date(targetYear, targetMonth, actualTargetDay, 0, 0, 0);
  const todayDate = new Date(currentYear, currentMonth, currentDay, 0, 0, 0);

  const diffMs = targetDate.getTime() - todayDate.getTime();
  const daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const isToday = currentDay === day;
  const isUrgent = daysRemaining > 0 && daysRemaining <= 5;

  const pad = (n: number) => String(n).padStart(2, '0');
  const formattedDate = `${pad(actualTargetDay)}/${pad(targetMonth + 1)}/${targetYear}`;

  let statusLabel = '';
  let badgeStyle: 'today' | 'urgent' | 'normal' = 'normal';

  if (isToday) {
    statusLabel = 'Vence HOJE!';
    badgeStyle = 'today';
  } else if (isUrgent) {
    statusLabel = `Vence em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}!`;
    badgeStyle = 'urgent';
  } else if (isPastDueThisMonth) {
    statusLabel = `Próximo: ${formattedDate} (em ${daysRemaining}d)`;
    badgeStyle = 'normal';
  } else {
    statusLabel = `Próximo: ${formattedDate} (em ${daysRemaining}d)`;
    badgeStyle = 'normal';
  }

  return {
    formattedDate,
    daysRemaining,
    isToday,
    isUrgent,
    isPastDueThisMonth,
    statusLabel,
    badgeStyle,
  };
}
