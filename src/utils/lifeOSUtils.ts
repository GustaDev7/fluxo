import {
  LifeHealthOverview,
  LifeGraphNode,
  LifeGraphEdge,
  UserMemoryItem,
  Task,
  Project,
  CalendarEvent,
  Goal,
  Habit,
  AIExecutedAction,
} from '../types';
import { FinanceBill, FinanceTransaction, ZeroBasedBudget, FinanceAccount, InvestmentAssetItem } from '../types/finance';
import { getTodayDateString, isPastDate, isToday, formatDatePT, getTomorrowDateString } from './date';

export const INITIAL_USER_MEMORIES: UserMemoryItem[] = [
  {
    id: 'mem_1',
    key: 'mensalidade_faculdade',
    value: 'Faculdade mensal de R$ 240,00 com vencimento todo dia 10 (Categoria: Custos Fixos)',
    category: 'finance',
    confidence: 0.98,
    source: 'auto_inferred',
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'mem_2',
    key: 'transporte_uber',
    value: 'Gastos com Uber e mobilidade urbana pertencem à categoria Conforto (Transporte)',
    category: 'finance',
    confidence: 0.95,
    source: 'auto_inferred',
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'mem_3',
    key: 'conta_principal',
    value: 'Conta padrão para movimentações diárias: Nubank / Conta Digital',
    category: 'finance',
    confidence: 0.92,
    source: 'manual',
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'mem_4',
    key: 'horario_foco',
    value: 'Período de maior energia e foco profundo: manhãs entre 08:30 e 11:30',
    category: 'routine',
    confidence: 0.9,
    source: 'manual',
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'mem_5',
    key: 'meta_carro',
    value: 'Meta de longo prazo: Comprar carro próprio até dez/2027 (alvo R$ 30.000, aporte mensal R$ 770)',
    category: 'goal',
    confidence: 0.99,
    source: 'manual',
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'mem_6',
    key: 'dia_aporte',
    value: 'Aporte de Liberdade Financeira (investimentos) deve ocorrer todo dia 10 após recebimentos',
    category: 'finance',
    confidence: 0.96,
    source: 'auto_inferred',
    createdAt: new Date().toISOString(),
    isActive: true,
  },
];

export interface InterpretedLifeAction {
  category: 'finance_task' | 'finance_expense' | 'finance_income' | 'task' | 'calendar_event' | 'goal' | 'habit' | 'general';
  type?: 'finance' | 'bill' | 'goal' | 'task' | 'event' | 'habit' | 'general';
  summary: string;
  suggestedActions: AIExecutedAction[];
  details: {
    bill?: Partial<FinanceBill>;
    transaction?: Partial<FinanceTransaction>;
    task?: Partial<Task>;
    event?: Partial<CalendarEvent>;
    goal?: Partial<Goal>;
    habit?: Partial<Habit>;
  };
  // Convenience aliases for direct access
  transaction?: Partial<FinanceTransaction>;
  bill?: Partial<FinanceBill>;
  goal?: Partial<Goal>;
}

/**
 * Heurística avançada para interpretação omnichannel de vida
 * (funciona offline instantaneamente e complementa a chamada ao Gemini)
 */
export function interpretLifeInput(input: string, referenceDate?: string): InterpretedLifeAction {
  const text = input.trim();
  const lower = text.toLowerCase();
  const today = referenceDate || getTodayDateString();

  // 1. Caso: "Pagar faculdade dia 10" / "Tenho que pagar X dia Y"
  if (lower.includes('pagar') && (lower.includes('faculdade') || lower.includes('aluguel') || lower.includes('internet') || lower.includes('condom') || lower.includes('conta') || lower.includes('boleto'))) {
    // Extrai valor se houver ou usa memória
    let amount = 240;
    const valueMatch = text.match(/(?:r\$|\$)?\s*(\d+(?:[.,]\d+)?)/i);
    if (valueMatch && !lower.includes('dia ' + valueMatch[1])) {
      amount = parseFloat(valueMatch[1].replace(',', '.'));
    }

    // Extrai dia
    let dueDay = 10;
    const dayMatch = text.match(/dia\s*(\d{1,2})/i);
    if (dayMatch) {
      dueDay = parseInt(dayMatch[1], 10);
    }

    // Monta data correspondente
    const now = new Date();
    let targetYear = now.getFullYear();
    let targetMonth = now.getMonth() + 1;
    if (now.getDate() > dueDay) {
      targetMonth += 1;
      if (targetMonth > 12) {
        targetMonth = 1;
        targetYear += 1;
      }
    }
    const formattedDueDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;

    let itemDesc = 'Pagar faculdade';
    if (lower.includes('aluguel')) itemDesc = 'Pagar aluguel';
    else if (lower.includes('internet')) itemDesc = 'Pagar conta de internet';
    else if (lower.includes('condom')) itemDesc = 'Pagar condomínio';
    else if (lower.includes('boleto')) itemDesc = 'Pagar boleto';

    const billData: Partial<FinanceBill> = {
      title: itemDesc,
      amount,
      dueDate: formattedDueDate,
      masterCategory: 'custos_fixos',
      type: 'expense',
      status: 'pending',
    };

    return {
      category: 'finance_task',
      type: 'bill',
      bill: billData,
      summary: `Identificado compromisso financeiro: ${itemDesc} (R$ ${amount.toFixed(2)}) no dia ${dueDay}`,
      suggestedActions: [
        {
          id: `act_${Date.now()}_bill`,
          type: 'create_bill',
          status: 'executed',
          summary: `Conta a pagar: ${itemDesc} - R$ ${amount.toFixed(2)} (vencimento dia ${dueDay})`,
          data: {
            title: itemDesc,
            amount,
            dueDate: formattedDueDate,
            type: 'expense',
            masterCategory: 'custos_fixos',
          },
        },
        {
          id: `act_${Date.now()}_task`,
          type: 'create_task',
          status: 'executed',
          summary: `Tarefa no Fluxo: ${itemDesc} (vencimento em ${formatDatePT(formattedDueDate)})`,
          data: {
            title: `${itemDesc} (R$ ${amount.toFixed(2)})`,
            dueDate: formattedDueDate,
            priority: 'urgent',
            tags: ['financas', 'pagamento'],
          },
        },
        {
          id: `act_${Date.now()}_event`,
          type: 'create_event',
          status: 'executed',
          summary: `Evento na Agenda: Vencimento ${itemDesc}`,
          data: {
            title: `Vencimento: ${itemDesc}`,
            startDate: formattedDueDate,
            startTime: '09:00',
            endTime: '09:30',
            isAllDay: true,
          },
        },
      ],
      details: {
        bill: billData,
        task: {
          title: `${itemDesc} (R$ ${amount.toFixed(2)})`,
          dueDate: formattedDueDate,
          priority: 'urgent',
          tags: ['financas', 'pagamento'],
        },
        event: {
          title: `Vencimento: ${itemDesc}`,
          startDate: formattedDueDate,
          isAllDay: true,
        },
      },
    };
  }

  // 2. Caso: "Gastei 42 reais no Uber" / "Gasto de R$ 50 no almoço"
  if (lower.includes('gastei') || lower.includes('paguei') || lower.includes('comprei') || lower.includes('gasto')) {
    const valMatch = text.match(/(?:r\$|\$)?\s*(\d+(?:[.,]\d+)?)/i);
    const amount = valMatch ? parseFloat(valMatch[1].replace(',', '.')) : 42;

    let category = 'conforto';
    let subcategory = 'Transporte';
    let desc = 'Despesa';

    if (lower.includes('uber') || lower.includes('táxi') || lower.includes('99') || lower.includes('combustível')) {
      desc = 'Transporte Uber';
      category = 'conforto';
      subcategory = 'Transporte';
    } else if (lower.includes('almoço') || lower.includes('jantar') || lower.includes('lanche') || lower.includes('restaurante')) {
      desc = 'Alimentação';
      category = 'prazeres';
      subcategory = 'Alimentação';
    } else if (lower.includes('mercado') || lower.includes('feira')) {
      desc = 'Supermercado';
      category = 'custos_fixos';
      subcategory = 'Supermercado';
    } else if (lower.includes('livro') || lower.includes('curso')) {
      desc = 'Conhecimento / Estudo';
      category = 'conhecimento';
      subcategory = 'Educação';
    }

    const txData: Partial<FinanceTransaction> = {
      amount,
      type: 'expense',
      description: desc,
      masterCategory: category as any,
      subcategory,
      date: today,
    };

    return {
      category: 'finance_expense',
      type: 'finance',
      transaction: txData,
      summary: `Despesa identificada: R$ ${amount.toFixed(2)} em ${desc}`,
      suggestedActions: [
        {
          id: `act_${Date.now()}_tx`,
          type: 'create_transaction',
          status: 'executed',
          summary: `Lançar despesa de R$ ${amount.toFixed(2)} (${desc})`,
          data: {
            amount,
            type: 'expense',
            description: desc,
            masterCategory: category,
            subcategory,
            date: today,
          },
        },
      ],
      details: {
        transaction: txData,
      },
    };
  }

  // 3. Caso: "Recebi 2 mil reais hoje" / "Salário caiu"
  if (lower.includes('recebi') || lower.includes('salário') || lower.includes('pagamento recebido') || lower.includes('renda')) {
    let amount = 2000;
    if (lower.includes('2 mil') || lower.includes('2.000')) amount = 2000;
    else {
      const valMatch = text.match(/(?:r\$|\$)?\s*(\d+(?:[.,]\d+)?)/i);
      if (valMatch) amount = parseFloat(valMatch[1].replace(',', '.'));
    }

    const incomeTxData: Partial<FinanceTransaction> = {
      amount,
      type: 'income',
      description: 'Recebimento de Renda',
      masterCategory: 'liberdade_financeira',
      date: today,
    };

    return {
      category: 'finance_income',
      type: 'finance',
      transaction: incomeTxData,
      summary: `Recebimento identificado: R$ ${amount.toFixed(2)} adicionado à renda`,
      suggestedActions: [
        {
          id: `act_${Date.now()}_inc`,
          type: 'create_transaction',
          status: 'executed',
          summary: `Registrar entrada de R$ ${amount.toFixed(2)}`,
          data: {
            amount,
            type: 'income',
            description: 'Recebimento de Renda',
            masterCategory: 'liberdade_financeira',
            date: today,
          },
        },
      ],
      details: {
        transaction: incomeTxData,
      },
    };
  }

  // 4. Caso: "Comprar carro de 30 mil até dezembro de 2027" / Meta de longo prazo
  if (lower.includes('meta') || lower.includes('quero comprar') || lower.includes('economizar para') || (lower.includes('carro') && lower.includes('até'))) {
    let target = 30000;
    if (lower.includes('30 mil') || lower.includes('30000')) target = 30000;
    const deadline = '2027-12-31';

    const goalData: Partial<Goal> = {
      title: 'Comprar Carro Próprio',
      targetValue: target,
      currentValue: 0,
      deadline,
    };

    return {
      category: 'goal',
      type: 'goal',
      goal: goalData,
      summary: `Criando desdobramento integrado da Meta: "Comprar Carro (R$ ${target.toLocaleString('pt-BR')})"`,
      suggestedActions: [
        {
          id: `act_${Date.now()}_goal`,
          type: 'create_goal',
          status: 'executed',
          summary: `Meta financeira criada: R$ ${target.toLocaleString('pt-BR')} até dez/2027`,
          data: {
            title: 'Comprar Carro Próprio',
            targetValue: target,
            currentValue: 0,
            unit: 'R$',
            deadline,
            period: 'yearly',
          },
        },
        {
          id: `act_${Date.now()}_proj`,
          type: 'create_project',
          status: 'executed',
          summary: `Projeto no Fluxo: "Economizar para Carro"`,
          data: {
            name: 'Economizar para Carro',
            description: 'Acumular R$ 30.000 através de aportes mensais de R$ 770 até 2027',
            priority: 'high',
          },
        },
        {
          id: `act_${Date.now()}_task`,
          type: 'create_task',
          status: 'executed',
          summary: `Tarefa mensal: Aporte de R$ 770,00 no dia 10`,
          data: {
            title: 'Realizar Aporte Mensal Meta Carro (R$ 770)',
            dueDate: today,
            priority: 'high',
            tags: ['investimentos', 'meta-carro'],
          },
        },
      ],
      details: {
        goal: goalData,
        task: {
          title: 'Realizar Aporte Mensal Meta Carro (R$ 770)',
          dueDate: today,
          priority: 'high',
        },
      },
    };
  }

  // 5. Caso padrão: Tarefa / Compromisso com data ou horário
  let dueDate = today;
  if (lower.includes('amanhã')) {
    dueDate = getTomorrowDateString();
  } else if (lower.includes('sexta')) {
    // Calcula próxima sexta
    const d = new Date();
    const dayOfWeek = d.getDay(); // 0 dom, 5 sex
    const diff = (5 - dayOfWeek + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    dueDate = d.toISOString().slice(0, 10);
  }

  let dueTime: string | undefined = undefined;
  const timeMatch = text.match(/(\d{1,2})h(?:(\d{2}))?/i);
  if (timeMatch) {
    const hh = String(timeMatch[1]).padStart(2, '0');
    const mm = timeMatch[2] ? String(timeMatch[2]).padStart(2, '0') : '00';
    dueTime = `${hh}:${mm}`;
  }

  const cleanTitle = text
    .replace(/(me lembra|lembrar de|criar tarefa para|criar uma tarefa|adicionar tarefa|amanhã|hoje|sexta|às \d+h\d*)/gi, '')
    .trim() || text;

  return {
    category: dueTime ? 'calendar_event' : 'task',
    summary: `Tarefa e compromisso identificados: "${cleanTitle}" para ${formatDatePT(dueDate)}${dueTime ? ` às ${dueTime}` : ''}`,
    suggestedActions: [
      {
        id: `act_${Date.now()}_task`,
        type: 'create_task',
        status: 'executed',
        summary: `Tarefa: ${cleanTitle}`,
        data: {
          title: cleanTitle,
          dueDate,
          dueTime,
          priority: lower.includes('urgente') ? 'urgent' : lower.includes('importante') ? 'high' : 'medium',
        },
      },
      ...(dueTime
        ? [
            {
              id: `act_${Date.now()}_evt`,
              type: 'create_event' as const,
              status: 'executed' as const,
              summary: `Agenda: ${cleanTitle} às ${dueTime}`,
              data: {
                title: cleanTitle,
                startDate: dueDate,
                startTime: dueTime,
                endTime: `${String(parseInt(dueTime.split(':')[0], 10) + 1).padStart(2, '0')}:${dueTime.split(':')[1]}`,
              },
            },
          ]
        : []),
    ],
    details: {
      task: {
        title: cleanTitle,
        dueDate,
        dueTime,
        priority: 'medium',
      },
      ...(dueTime
        ? {
            event: {
              title: cleanTitle,
              startDate: dueDate,
              startTime: dueTime,
            },
          }
        : {}),
    },
  };
}

/**
 * Gera a visão de diagnóstico 360° "Como está minha vida?"
 */
export function generateLifeHealthOverview(
  tasks: Task[],
  projects: Project[],
  events: CalendarEvent[],
  habits: Habit[],
  goals: Goal[],
  financeBudget?: ZeroBasedBudget,
  financeBills: FinanceBill[] = [],
  transactions: FinanceTransaction[] = []
): LifeHealthOverview {
  const today = getTodayDateString();

  // 1. Tempo
  const pendingTasks = tasks.filter((t) => t.status !== 'done' && !t.isInbox);
  const completedToday = tasks.filter((t) => t.status === 'done' && (t.dueDate === today || isToday(t.createdAt)));
  const overdueTasks = tasks.filter((t) => t.status !== 'done' && t.dueDate && isPastDate(t.dueDate, t.dueTime));
  const plannedMinutes = tasks
    .filter((t) => t.dueDate === today)
    .reduce((acc, t) => acc + (t.estimatedDuration || 30), 0);
  const executedMinutes = tasks
    .filter((t) => t.dueDate === today)
    .reduce((acc, t) => acc + (t.timeSpent || 0), 0);

  const timeStatus: 'optimal' | 'warning' | 'critical' =
    overdueTasks.length > 3 ? 'critical' : overdueTasks.length > 0 ? 'warning' : 'optimal';

  // 2. Trabalho / Projetos
  const activeProjects = projects.filter((p) => p.status === 'active');
  const criticalProjects = activeProjects.filter((p) => p.priority === 'high');

  // 3. Finanças
  const monthlyIncome = financeBudget?.plannedIncome || 6000;
  const monthlyExpenses = transactions
    .filter((t) => t.type === 'expense' && t.date.startsWith(today.slice(0, 7)))
    .reduce((acc, t) => acc + t.amount, 0);

  const pendingBillsToday = financeBills.filter((b) => b.dueDate === today && b.status === 'pending');
  const pendingBillsTodayAmount = pendingBillsToday.reduce((acc, b) => acc + b.amount, 0);
  const savingsRate = monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100) : 20;

  const financeStatus: 'optimal' | 'warning' | 'critical' =
    pendingBillsToday.length > 0 && pendingBillsTodayAmount > 1000
      ? 'critical'
      : monthlyExpenses > monthlyIncome * 0.9
      ? 'warning'
      : 'optimal';

  // 4. Metas
  const primaryGoal = goals.find((g) => g.status === 'active') || goals[0];
  const primaryGoalProgress =
    primaryGoal && primaryGoal.targetValue > 0
      ? Math.round((primaryGoal.currentValue / primaryGoal.targetValue) * 100)
      : 64;

  // 5. Hábitos
  const completedHabitsToday = habits.filter((h) => h.completedDates.includes(today));
  const habitsPercent = habits.length > 0 ? Math.round((completedHabitsToday.length / habits.length) * 100) : 100;
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak), 0);

  // 6. Agenda
  const todayEvents = events.filter((e) => e.startDate === today);
  const nextEvent = todayEvents[0];

  // Cálculo de pontuação geral de harmonia da vida (0 - 100)
  let score = 75;
  if (overdueTasks.length === 0) score += 8;
  else score -= Math.min(15, overdueTasks.length * 4);

  if (habitsPercent >= 70) score += 7;
  if (savingsRate >= 20) score += 8;
  else if (savingsRate < 5) score -= 10;

  if (pendingBillsToday.length > 0) score -= 5;
  score = Math.max(25, Math.min(98, score));

  let title = 'Sua vida está em excelente equilíbrio e tração!';
  if (score < 60) title = 'Atenção necessária em pontos de pressão hoje.';
  else if (score < 80) title = 'Bom ritmo com oportunidades claras de otimização.';

  const summary = `Você tem ${pendingTasks.length} tarefas pendentes e ${todayEvents.length} compromissos agendados para hoje. Sua margem financeira mensal estimada é de ${savingsRate}%, com a meta principal (${primaryGoal?.title || 'Metas'}) em ${primaryGoalProgress}% de avanço.`;

  return {
    score,
    title,
    summary,
    time: {
      pendingTasksCount: pendingTasks.length,
      completedTodayCount: completedToday.length,
      plannedMinutes,
      executedMinutes,
      overdueCount: overdueTasks.length,
      status: timeStatus,
    },
    work: {
      activeProjectsCount: activeProjects.length,
      upcomingDeadlinesCount: criticalProjects.length,
      criticalProjectName: criticalProjects[0]?.name || activeProjects[0]?.name,
      status: criticalProjects.length > 0 ? 'warning' : 'optimal',
    },
    finance: {
      monthlyIncome,
      monthlyExpenses,
      savingsRatePercent: savingsRate,
      pendingBillsTodayCount: pendingBillsToday.length,
      pendingBillsAmount: pendingBillsTodayAmount,
      status: financeStatus,
    },
    goals: {
      primaryGoalTitle: primaryGoal?.title || 'Metas Pessoais',
      progressPercent: primaryGoalProgress,
      activeGoalsCount: goals.filter((g) => g.status === 'active').length,
      status: primaryGoalProgress >= 50 ? 'optimal' : 'warning',
    },
    habits: {
      currentStreak: bestStreak,
      completedTodayPercent: habitsPercent,
      habitsCount: habits.length,
      status: habitsPercent >= 60 ? 'optimal' : 'warning',
    },
    agenda: {
      eventsTodayCount: todayEvents.length,
      nextEventTitle: nextEvent?.title,
      nextEventTime: nextEvent?.startTime,
      status: todayEvents.length > 4 ? 'warning' : 'optimal',
    },
    priorities: {
      topItems: [
        overdueTasks.length > 0
          ? `Resolver ${overdueTasks.length} tarefa(s) com prazo vencido imediatamente`
          : `Executar o bloco de foco do projeto ${criticalProjects[0]?.name || 'principal'}`,
        pendingBillsToday.length > 0
          ? `Quitar conta de R$ ${pendingBillsTodayAmount.toFixed(2)} que vence hoje`
          : `Garantir o aporte planejado de investimento para a meta do mês`,
        habitsPercent < 100
          ? `Completar seus ${habits.length - completedHabitsToday.length} hábitos restantes para manter a sequência de ${bestStreak} dias`
          : `Revisão do fechamento diário às 18h`,
      ],
      actionAdvice:
        'Concentre seus primeiros 90 minutos do dia na prioridade número 1 sem distrações antes de abrir e-mails ou mensagens.',
    },
  };
}

/**
 * Constrói o Grafo de Relacionamentos da Vida (Life Graph)
 * META -> PROJETO -> ORÇAMENTO -> TAREFA -> CALENDÁRIO -> FINANÇAS -> PATRIMÔNIO
 */
export function buildLifeGraph(
  goals: Goal[],
  projects: Project[],
  tasks: Task[],
  events: CalendarEvent[],
  bills: FinanceBill[],
  accounts: FinanceAccount[],
  investments: InvestmentAssetItem[]
): { nodes: LifeGraphNode[]; edges: LifeGraphEdge[] } {
  const nodes: LifeGraphNode[] = [];
  const edges: LifeGraphEdge[] = [];

  // 1. Nó raiz de Metas
  const mainGoal = goals.find((g) => g.title.toLowerCase().includes('carro')) || goals[0] || {
    id: 'goal_carro',
    title: 'Comprar Carro Próprio',
    targetValue: 30000,
    currentValue: 12500,
    unit: 'R$',
  };

  const goalNodeId = `node_goal_${mainGoal.id}`;
  nodes.push({
    id: goalNodeId,
    type: 'goal',
    label: mainGoal.title,
    detail: `Alvo: R$ ${mainGoal.targetValue?.toLocaleString('pt-BR')} (Progresso: ${Math.round(
      ((mainGoal.currentValue || 0) / (mainGoal.targetValue || 1)) * 100
    )}%)`,
    color: '#8b5cf6', // purple
    linkTab: 'goals',
    value: `R$ ${mainGoal.currentValue?.toLocaleString('pt-BR')}`,
  });

  // 2. Projeto conectado
  const linkedProject =
    projects.find((p) => p.name.toLowerCase().includes('carro') || p.name.toLowerCase().includes('finance')) ||
    projects[0] || {
      id: 'proj_eco_carro',
      name: 'Economizar para Carro',
      status: 'active',
      progress: 42,
    };

  const projectNodeId = `node_proj_${linkedProject.id}`;
  nodes.push({
    id: projectNodeId,
    type: 'project',
    label: linkedProject.name,
    detail: `Projeto ativo • Progresso: ${linkedProject.progress || 40}%`,
    color: '#3b82f6', // blue
    linkTab: 'projects',
    value: `${linkedProject.progress || 40}%`,
  });

  edges.push({
    id: 'e_goal_to_proj',
    fromId: goalNodeId,
    toId: projectNodeId,
    relationship: 'Desdobra em Projeto',
  });

  // 3. Orçamento Base Zero (Alocação Mensal)
  const budgetNodeId = 'node_budget_aporte';
  nodes.push({
    id: budgetNodeId,
    type: 'budget',
    label: 'Orçamento AUVP: Metas',
    detail: 'Alocação planejada: R$ 770,00/mês (Metas de Longo Prazo)',
    color: '#10b981', // emerald
    linkTab: 'finance',
    value: 'R$ 770/mês',
  });

  edges.push({
    id: 'e_proj_to_budget',
    fromId: projectNodeId,
    toId: budgetNodeId,
    relationship: 'Alimenta Orçamento',
  });

  // 4. Tarefa de Aporte
  const taskAporte =
    tasks.find((t) => t.title.toLowerCase().includes('aporte')) || {
      id: 'task_aporte_mensal',
      title: 'Fazer aporte mensal meta carro',
      dueDate: 'Dia 10',
      status: 'todo',
    };

  const taskNodeId = `node_task_${taskAporte.id}`;
  nodes.push({
    id: taskNodeId,
    type: 'task',
    label: taskAporte.title,
    detail: 'Tarefa recorrente com prazo no dia 10 de cada mês',
    color: '#f59e0b', // amber
    linkTab: 'tasks',
    value: 'Prioridade Alta',
  });

  edges.push({
    id: 'e_budget_to_task',
    fromId: budgetNodeId,
    toId: taskNodeId,
    relationship: 'Gera Tarefa Mensal',
  });

  // 5. Calendário (Data de Execução)
  const calendarNodeId = 'node_cal_vencimento';
  nodes.push({
    id: calendarNodeId,
    type: 'calendar',
    label: 'Agenda: Vencimento & Aporte',
    detail: 'Bloqueio de agenda todo dia 10 após o fechamento bancário',
    color: '#06b6d4', // cyan
    linkTab: 'calendar',
    value: 'Dia 10 (Mensal)',
  });

  edges.push({
    id: 'e_task_to_cal',
    fromId: taskNodeId,
    toId: calendarNodeId,
    relationship: 'Agendado no Calendário',
  });

  // 6. Finanças / Transação
  const financeTxNodeId = 'node_fin_tx';
  nodes.push({
    id: financeTxNodeId,
    type: 'finance',
    label: 'Transferência p/ Corretora',
    detail: 'Saída da Conta Corrente → Entrada em Investimentos',
    color: '#ec4899', // pink
    linkTab: 'finance',
    value: 'R$ 770,00',
  });

  edges.push({
    id: 'e_cal_to_fin',
    fromId: calendarNodeId,
    toId: financeTxNodeId,
    relationship: 'Executa Transação',
  });

  // 7. Patrimônio Líquido Acumulado
  const netWorthNodeId = 'node_networth';
  const totalInvested = investments.reduce((acc, inv) => acc + (inv.currentValue || 0), 0) || 54200;
  nodes.push({
    id: netWorthNodeId,
    type: 'networth',
    label: 'Patrimônio & Renda Fixa',
    detail: 'Acumulado e rendendo IPCA+ e CDI para a meta',
    color: '#10b981', // green
    linkTab: 'finance',
    value: `R$ ${totalInvested.toLocaleString('pt-BR')}`,
  });

  edges.push({
    id: 'e_fin_to_networth',
    fromId: financeTxNodeId,
    toId: netWorthNodeId,
    relationship: 'Aumenta Patrimônio',
  });

  // Feedback loop de volta para a Meta!
  edges.push({
    id: 'e_networth_to_goal',
    fromId: netWorthNodeId,
    toId: goalNodeId,
    relationship: 'Atualiza Progresso da Meta (+)',
  });

  return { nodes, edges };
}
