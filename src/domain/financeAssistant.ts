import type { FinanceTransaction, MasterCategory } from '../types/finance';
import type { FinanceAssistantReply, FinanceAssistantSnapshot, ProposedTransaction } from '../types/assistant';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const monthNames = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const categoryNames: Record<MasterCategory, string> = {
  custos_fixos: 'Custos Fixos',
  conforto: 'Conforto',
  metas: 'Metas',
  prazeres: 'Prazeres',
  liberdade_financeira: 'Liberdade Financeira',
  conhecimento: 'Conhecimento',
};

const defaultSuggestions = [
  'Para onde foi meu salário?',
  'Quanto ainda posso gastar?',
  'Compare este mês com o anterior',
  'Qual dívida devo priorizar?',
];

const normalize = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

const parseBrazilianNumber = (raw: string): number => {
  const cleaned = raw.replace(/\s/g, '').replace(/^r\$/i, '');
  if (cleaned.includes(',')) return Number(cleaned.replace(/\./g, '').replace(',', '.'));
  const dotParts = cleaned.split('.');
  if (dotParts.length > 1 && dotParts.at(-1)?.length !== 2) return Number(cleaned.replace(/\./g, ''));
  return Number(cleaned);
};

const extractAmount = (text: string): number => {
  const match = text.match(/(?:r\$\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)/i);
  if (!match) return 0;
  const value = parseBrazilianNumber(match[1]);
  return Number.isFinite(value) ? value : 0;
};

const inferCategory = (text: string): MasterCategory => {
  const value = normalize(text);
  if (/curso|livro|faculdade|escola|estudo|certificacao/.test(value)) return 'conhecimento';
  if (/invest|aporte|acao|fii|tesouro|reserva/.test(value)) return 'liberdade_financeira';
  if (/meta|viagem planejada|objetivo/.test(value)) return 'metas';
  if (/cinema|bar|show|lazer|delivery|restaurante|roupa|presente|jogo/.test(value)) return 'prazeres';
  if (/mercado|supermercado|farmacia|gasolina|uber|transporte|academia/.test(value)) return 'conforto';
  return 'custos_fixos';
};

const cleanDescription = (text: string): string => {
  const withoutAmount = text
    .replace(/(?:r\$\s*)?\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|(?:r\$\s*)?\d+(?:[.,]\d{1,2})?/i, '')
    .replace(/\b(gastei|paguei|comprei|despesa|recebi|ganhei|entrou|renda|no|na|de|com|por)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return withoutAmount ? withoutAmount.charAt(0).toUpperCase() + withoutAmount.slice(1) : 'Lançamento pelo Fluxo IA';
};

export const parseTransactionRequest = (
  question: string,
  snapshot: FinanceAssistantSnapshot,
): ProposedTransaction | null => {
  const text = normalize(question);
  const isExpense = /\b(gastei|paguei|comprei|despesa|anotar gasto|registrar gasto)\b/.test(text);
  const isIncome = /\b(recebi|ganhei|entrou|renda extra|registrar renda|salario caiu)\b/.test(text);
  if (!isExpense && !isIncome) return null;

  const amount = extractAmount(question);
  if (amount <= 0) return null;
  const defaultAccount = snapshot.accounts.find((account) => account.isActive && account.type === 'checking')
    || snapshot.accounts.find((account) => account.isActive);

  return {
    kind: 'create_transaction',
    status: 'pending',
    transaction: {
      type: isIncome ? 'income' : 'expense',
      amount,
      description: cleanDescription(question),
      masterCategory: isIncome ? 'custos_fixos' : inferCategory(question),
      subcategory: isIncome ? 'Renda' : undefined,
      accountId: defaultAccount?.id,
    },
  };
};

const summarizeMonth = (transactions: FinanceTransaction[], month: string) => {
  let income = 0;
  let expenses = 0;
  let investments = 0;
  let debts = 0;
  for (const transaction of transactions) {
    if (!transaction.date.startsWith(month)) continue;
    if (transaction.type === 'income') income += transaction.amount;
    if (transaction.type === 'expense') expenses += transaction.amount;
    if (transaction.type === 'investment') investments += transaction.amount;
    if (transaction.type === 'debt_payment') debts += transaction.amount;
  }
  return { income, expenses, investments, debts, balance: income - expenses - investments - debts };
};

const findRequestedMonths = (text: string, currentMonth: string): string[] => {
  const normalized = normalize(text);
  const year = Number(currentMonth.slice(0, 4));
  const found = monthNames
    .map((month, index) => ({ month, index }))
    .filter(({ month }) => normalized.includes(month))
    .map(({ index }) => `${year}-${String(index + 1).padStart(2, '0')}`);
  return [...new Set(found)];
};

const previousMonth = (month: string): string => {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 2, 1));
  return date.toISOString().slice(0, 7);
};

const monthLabel = (month: string) => new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
}).format(new Date(`${month}-01T00:00:00Z`));

const topExpenseCategories = (snapshot: FinanceAssistantSnapshot) => {
  const totals = new Map<MasterCategory, number>();
  for (const transaction of snapshot.transactions) {
    if (transaction.type !== 'expense' || !transaction.date.startsWith(snapshot.currentMonth)) continue;
    totals.set(transaction.masterCategory, (totals.get(transaction.masterCategory) || 0) + transaction.amount);
  }
  return [...totals.entries()].sort((a, b) => b[1] - a[1]);
};

const activeDebts = (snapshot: FinanceAssistantSnapshot) => snapshot.debts
  .filter((debt) => !['paid', 'cancelled'].includes(debt.status));

const buildOverview = (snapshot: FinanceAssistantSnapshot): FinanceAssistantReply => {
  const balance = snapshot.monthIncome - snapshot.monthExpenses - snapshot.monthInvestments - snapshot.monthDebtsPaid;
  const mainCategory = topExpenseCategories(snapshot)[0];
  const categoryText = mainCategory
    ? ` A maior categoria de gastos é **${categoryNames[mainCategory[0]]}**, com ${currency.format(mainCategory[1])}.`
    : '';
  return {
    content: `Neste mês entraram **${currency.format(snapshot.monthIncome)}** e saíram **${currency.format(snapshot.monthExpenses)}** em despesas, **${currency.format(snapshot.monthInvestments)}** em investimentos e **${currency.format(snapshot.monthDebtsPaid)}** em dívidas. Seu saldo mensal está em **${currency.format(balance)}**.${categoryText}`,
    metadata: { suggestions: ['Quanto ainda posso gastar?', 'Onde estou gastando mais?', 'Como está minha reserva?'], route: 'overview', routeLabel: 'Abrir visão geral' },
  };
};

export function buildFinanceAssistantWelcome(snapshot: FinanceAssistantSnapshot, firstName: string): FinanceAssistantReply {
  const balance = snapshot.monthIncome - snapshot.monthExpenses - snapshot.monthInvestments - snapshot.monthDebtsPaid;
  if (!snapshot.transactions.length && !snapshot.accounts.length) {
    return {
      content: `Olá, ${firstName}. Eu sou o **Fluxo IA**. Ainda não há dados suficientes para uma análise, mas posso ajudar você a começar pelo orçamento, cadastrar contas ou registrar um gasto por mensagem.`,
      metadata: { suggestions: ['Como começo a organizar meu dinheiro?', 'Abrir meu orçamento', 'Registrar gasto de R$ 50 no mercado'], route: 'budget', routeLabel: 'Começar pelo orçamento' },
    };
  }
  return {
    content: `Olá, ${firstName}. Analisei os dados registrados no Fluxo. Seu saldo do mês está em **${currency.format(balance)}** e seu patrimônio líquido em **${currency.format(snapshot.netWorth)}**. O que você quer entender agora?`,
    metadata: { suggestions: defaultSuggestions },
  };
}

export function answerFinanceQuestion(question: string, snapshot: FinanceAssistantSnapshot): FinanceAssistantReply {
  const text = normalize(question);
  const action = parseTransactionRequest(question, snapshot);
  if (action) {
    const kind = action.transaction.type === 'income' ? 'entrada' : 'despesa';
    const account = snapshot.accounts.find((item) => item.id === action.transaction.accountId);
    return {
      content: `Preparei uma ${kind} de **${currency.format(action.transaction.amount)}** como **${action.transaction.description}**${account ? ` na conta **${account.name}**` : ''}. Confira antes de registrar.`,
      metadata: { action, suggestions: ['Quanto ainda posso gastar?', 'Ver meu orçamento'] },
    };
  }

  if (/^(oi|ola|bom dia|boa tarde|boa noite)\b/.test(text)) {
    return { content: 'Olá! Posso analisar seus gastos, orçamento, dívidas, metas, reserva e investimentos usando os dados registrados no Fluxo.', metadata: { suggestions: defaultSuggestions } };
  }

  if (/como comeco|como organizar|por onde comecar/.test(text)) {
    return {
      content: 'Comece por três passos: **1)** cadastre suas contas e saldos; **2)** informe a renda do mês no orçamento; **3)** registre cada entrada e saída. A partir daí eu consigo mostrar vazamentos, limites seguros e prioridades.',
      metadata: { route: 'budget', routeLabel: 'Abrir orçamento', suggestions: ['Abrir meu orçamento', 'Como registrar um gasto?'] },
    };
  }

  if (/abrir.*orcamento|meu orcamento/.test(text) && !/como|quanto|analise/.test(text)) {
    return { content: 'Seu orçamento mensal está pronto para revisão. Ali você define a renda e distribui cada real entre as categorias.', metadata: { route: 'budget', routeLabel: 'Abrir orçamento', suggestions: ['Quanto ainda posso gastar?'] } };
  }

  if (/compar|mes anterior|ultimo mes/.test(text)) {
    const requested = findRequestedMonths(question, snapshot.currentMonth);
    const months = requested.length >= 2 ? requested.slice(0, 2) : [previousMonth(snapshot.currentMonth), snapshot.currentMonth];
    const [first, second] = months;
    const a = summarizeMonth(snapshot.transactions, first);
    const b = summarizeMonth(snapshot.transactions, second);
    const expenseDelta = b.expenses - a.expenses;
    const direction = expenseDelta > 0 ? 'aumentaram' : expenseDelta < 0 ? 'diminuíram' : 'ficaram iguais';
    return {
      content: `Comparando **${monthLabel(first)}** com **${monthLabel(second)}**: as despesas ${direction} em **${currency.format(Math.abs(expenseDelta))}**. O saldo passou de **${currency.format(a.balance)}** para **${currency.format(b.balance)}**.`,
      metadata: { route: 'budget', routeLabel: 'Ver orçamento', suggestions: ['Onde estou gastando mais?', 'Quanto entrou neste mês?'] },
    };
  }

  if (/onde.*gast|para onde|maior gasto|categoria|vazamento/.test(text)) {
    const categories = topExpenseCategories(snapshot);
    if (!categories.length) return { content: 'Ainda não há despesas registradas neste mês. Registre seus gastos para eu identificar para onde o salário está indo.', metadata: { suggestions: ['Registrar gasto de R$ 50 no mercado'], route: 'budget', routeLabel: 'Abrir orçamento' } };
    const details = categories.slice(0, 3).map(([category, amount], index) => `${index + 1}. **${categoryNames[category]}:** ${currency.format(amount)}`).join('\n');
    return { content: `Estas são as categorias que mais consumiram dinheiro neste mês:\n\n${details}`, metadata: { route: 'budget', routeLabel: 'Ajustar orçamento', suggestions: ['Quanto ainda posso gastar?', 'Compare com o mês anterior'] } };
  }

  if (/quanto.*(gastar|disponivel|sobra)|posso gastar|ate o fim/.test(text)) {
    const balance = snapshot.monthIncome - snapshot.monthExpenses - snapshot.monthInvestments - snapshot.monthDebtsPaid;
    const pendingThisMonth = snapshot.bills
      .filter((bill) => bill.status === 'pending' && bill.type === 'expense' && bill.dueDate.startsWith(snapshot.currentMonth))
      .reduce((sum, bill) => sum + bill.amount, 0);
    const safe = Math.max(0, balance - pendingThisMonth);
    const now = new Date();
    const daysLeft = Math.max(1, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1);
    const daily = safe / daysLeft;
    return {
      content: `Depois das saídas já registradas e de **${currency.format(pendingThisMonth)}** em contas pendentes deste mês, o valor livre estimado é **${currency.format(safe)}**. Isso equivale a aproximadamente **${currency.format(daily)} por dia** até o fim do mês.`,
      metadata: { route: 'bills', routeLabel: 'Ver compromissos', suggestions: ['Onde estou gastando mais?', 'Consigo comprar algo de R$ 500?'] },
    };
  }

  if (/consigo (comprar|pagar)|posso comprar|cabe no orcamento/.test(text)) {
    const amount = extractAmount(question);
    if (amount <= 0) return { content: 'Informe o valor da compra para eu simular. Exemplo: “Consigo comprar algo de R$ 800?”', metadata: { suggestions: ['Consigo comprar algo de R$ 800?'] } };
    const balance = snapshot.monthIncome - snapshot.monthExpenses - snapshot.monthInvestments - snapshot.monthDebtsPaid;
    const after = balance - amount;
    const answer = after >= 0
      ? `A compra cabe no saldo mensal registrado e deixaria **${currency.format(after)}** disponíveis.`
      : `A compra ultrapassaria o saldo mensal registrado em **${currency.format(Math.abs(after))}**.`;
    return { content: `${answer} Antes de decidir, confira também as contas ainda não pagas e evite usar a reserva de emergência para consumo.`, metadata: { route: 'budget', routeLabel: 'Revisar orçamento', suggestions: ['Quais contas ainda vencem?', 'Quanto ainda posso gastar?'] } };
  }

  if (/divida|quitar|juros/.test(text)) {
    const debts = activeDebts(snapshot).sort((a, b) => b.interestRateMonthly - a.interestRateMonthly || b.currentBalance - a.currentBalance);
    if (!debts.length) return { content: 'Você não possui dívidas ativas registradas. Continue protegendo o orçamento e construindo sua reserva.', metadata: { route: 'debts', routeLabel: 'Ver dívidas', suggestions: ['Como está minha reserva?', 'Quanto consigo guardar?'] } };
    const debt = debts[0];
    return { content: `Pelos dados registrados, a prioridade é **${debt.name || debt.creditor}**, com saldo de **${currency.format(debt.currentBalance)}** e juros de **${debt.interestRateMonthly.toFixed(2).replace('.', ',')}% ao mês**. A regra usada é atacar primeiro a maior taxa, mantendo as demais parcelas em dia.`, metadata: { route: 'debts', routeLabel: 'Simular quitação', suggestions: ['Quanto pago de dívidas por mês?', 'Como está minha reserva?'] } };
  }

  if (/reserva|emergencia|seguranca/.test(text)) {
    const target = snapshot.emergencyFund.targetAmount || snapshot.monthlyEssentialCosts * (snapshot.emergencyFund.targetMonths || 6);
    const missing = Math.max(0, target - snapshot.emergencyFund.currentAmount);
    const coverage = snapshot.monthlyEssentialCosts > 0 ? snapshot.emergencyFund.currentAmount / snapshot.monthlyEssentialCosts : 0;
    return { content: `Sua reserva está em **${currency.format(snapshot.emergencyFund.currentAmount)}** de uma meta de **${currency.format(target)}**. Ela cobre aproximadamente **${coverage.toFixed(1).replace('.', ',')} meses** de custos essenciais e faltam **${currency.format(missing)}** para a meta.`, metadata: { route: 'goals', routeLabel: 'Ver reserva e metas', suggestions: ['Se eu guardar R$ 400 por mês, quanto tempo leva?', 'Quanto ainda posso gastar?'] } };
  }

  if (/guardar|aportar|meta|objetivo/.test(text)) {
    const amount = extractAmount(question);
    const goal = snapshot.goals
      .filter((item) => item.currentAmount < item.targetAmount)
      .sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999'))[0];
    const target = goal?.targetAmount || snapshot.emergencyFund.targetAmount;
    const current = goal?.currentAmount || snapshot.emergencyFund.currentAmount;
    const remaining = Math.max(0, target - current);
    if (amount > 0 && remaining > 0) {
      const months = Math.ceil(remaining / amount);
      return { content: `Aplicando **${currency.format(amount)} por mês** em **${goal?.title || 'Reserva de Emergência'}**, você levaria cerca de **${months} meses** para cobrir os **${currency.format(remaining)}** restantes, sem considerar rendimentos.`, metadata: { route: 'goals', routeLabel: 'Abrir metas', suggestions: ['Como está minha reserva?', 'Quanto ainda posso gastar?'] } };
    }
    return { content: 'Posso simular o prazo de uma meta. Informe um aporte mensal, por exemplo: “Se eu guardar R$ 400 por mês, quanto tempo leva?”', metadata: { route: 'goals', routeLabel: 'Abrir metas', suggestions: ['Se eu guardar R$ 400 por mês, quanto tempo leva?'] } };
  }

  if (/conta|venc|boleto|compromisso/.test(text)) {
    const pending = snapshot.bills
      .filter((bill) => bill.status !== 'paid')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    if (!pending.length) return { content: 'Não há compromissos pendentes registrados.', metadata: { route: 'bills', routeLabel: 'Abrir compromissos', suggestions: ['Quanto ainda posso gastar?'] } };
    const total = pending.reduce((sum, bill) => sum + bill.amount, 0);
    const list = pending.slice(0, 3).map((bill) => `- **${bill.title}:** ${currency.format(bill.amount)} · ${new Date(`${bill.dueDate}T00:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`).join('\n');
    return { content: `Você tem **${pending.length} compromissos pendentes**, somando **${currency.format(total)}**. Os próximos são:\n\n${list}`, metadata: { route: 'bills', routeLabel: 'Ver todos os compromissos', suggestions: ['Quanto ainda posso gastar?', 'Quais estão atrasados?'] } };
  }

  if (/invest|carteira|rendimento|patrimonio/.test(text)) {
    const invested = snapshot.investments.reduce((sum, item) => sum + item.totalInvested, 0);
    const current = snapshot.investments.reduce((sum, item) => sum + item.currentValue, 0);
    const result = current - invested;
    return { content: `Sua carteira registrada vale **${currency.format(current)}**, frente a **${currency.format(invested)}** aportados. O resultado informado é **${currency.format(result)}**. Posso explicar a composição, mas não substituo uma recomendação profissional de investimento.`, metadata: { route: 'investments', routeLabel: 'Abrir investimentos', suggestions: ['Como está meu patrimônio?', 'Quanto investi neste mês?'] } };
  }

  if (/salario|renda|receita|quanto entrou/.test(text)) {
    const planned = snapshot.currentBudget.plannedIncome || 0;
    return { content: `Neste mês foram registradas **${currency.format(snapshot.monthIncome)}** em receitas. A renda planejada no orçamento é **${currency.format(planned)}**.`, metadata: { route: 'budget', routeLabel: 'Revisar renda do mês', suggestions: ['Para onde foi meu salário?', 'Compare com o mês anterior'] } };
  }

  if (/resumo|panorama|como est|saude financeira|meu dinheiro/.test(text)) return buildOverview(snapshot);

  return {
    content: 'Não consegui relacionar essa pergunta aos seus dados financeiros. Tente perguntar sobre gastos, saldo do mês, contas, dívidas, reserva, metas ou investimentos.',
    metadata: { suggestions: defaultSuggestions },
  };
}

export const assistantFormatting = { currency, categoryNames };
