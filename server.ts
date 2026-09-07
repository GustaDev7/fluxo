import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { sql, eq } from 'drizzle-orm';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import * as repo from './src/db/repository.ts';
import { db } from './src/db/index.ts';
import {
  tasks,
  projects,
  calendarEvents,
  notes,
  goals,
  habits,
  timeEntries,
  financeTransactions,
  financeBills,
  financeCards,
  financeAccounts,
} from './src/db/schema.ts';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return aiClient;
}

// ================= API ROUTES =================

// Health check & DB connection probe
app.get('/api/health', async (req, res) => {
  try {
    const dbTest = await db.execute(sql`SELECT NOW() as db_time`);
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      engine: 'PostgreSQL (Cloud SQL)',
      dbTime: dbTest.rows[0]?.db_time || null,
    });
  } catch (error: any) {
    console.error('Health check DB error:', error);
    res.json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      database: 'error',
      message: error.message,
    });
  }
});

// GET persistent store status (PostgreSQL database health & counts)
app.get('/api/data/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.uid;
    const [tasks, projects, events, goals, habits, notes, timeEntries, finData] = await Promise.all([
      repo.getTasksByUserId(userId),
      repo.getProjectsByUserId(userId),
      repo.getEventsByUserId(userId),
      repo.getGoalsByUserId(userId),
      repo.getHabitsByUserId(userId),
      repo.getNotesByUserId(userId),
      repo.getTimeEntriesByUserId(userId),
      repo.getFinanceDataByUserId(userId),
    ]);

    return res.json({
      status: 'connected',
      connected: true,
      databaseType: 'PostgreSQL (Cloud SQL) via Drizzle ORM',
      user: {
        uid: userId,
        email: req.user!.email,
        name: req.user!.name,
      },
      counts: {
        tasks: tasks.length,
        projects: projects.length,
        events: events.length,
        goals: goals.length,
        habits: habits.length,
        notes: notes.length,
        timeEntries: timeEntries.length,
        financeAccounts: finData.accounts.length,
        financeCards: finData.cards.length,
        financeTransactions: finData.transactions.length,
        financeBills: finData.bills.length,
        financeDebts: finData.debts.length,
        financeInvestments: finData.investments.length,
        financeGoals: finData.goals.length,
      },
    });
  } catch (err: any) {
    console.error('Error fetching data status:', err);
    return res.status(500).json({ status: 'error', error: err.message });
  }
});

// GET persistent store (productivity data directly from Cloud SQL PostgreSQL)
app.get('/api/data', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.uid;
    const [tasks, projects, events, goals, habits, notes, timeEntries] = await Promise.all([
      repo.getTasksByUserId(userId),
      repo.getProjectsByUserId(userId),
      repo.getEventsByUserId(userId),
      repo.getGoalsByUserId(userId),
      repo.getHabitsByUserId(userId),
      repo.getNotesByUserId(userId),
      repo.getTimeEntriesByUserId(userId),
    ]);

    return res.json({
      user: {
        id: userId,
        name: req.user!.name || '',
        email: req.user!.email || '',
        avatar: req.user!.picture || '',
        role: 'Pro',
        theme: 'light',
        workStartHour: 8,
        workEndHour: 18,
        pomodoroMinutes: 25,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
        visibleWidgets: {
          todayTasks: true,
          overdueTasks: true,
          upcomingEvents: true,
          smartPriorities: true,
          habits: true,
          goals: true,
          metrics: true,
        },
      },
      tasks: tasks.map((t) => ({
        ...t,
        tags: Array.isArray(t.tags) ? t.tags : [],
        checklist: Array.isArray(t.checklist) ? t.checklist : [],
        subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
        dependencies: Array.isArray(t.dependencies) ? t.dependencies : [],
        reminders: Array.isArray(t.reminders) ? t.reminders : [],
        comments: Array.isArray(t.comments) ? t.comments : [],
        attachments: Array.isArray(t.attachments) ? t.attachments : [],
      })),
      projects: projects.map((p) => ({
        ...p,
        members: Array.isArray(p.members) ? p.members : [],
        routines: Array.isArray(p.routines) ? p.routines : [],
        links: Array.isArray(p.links) ? p.links : [],
        workLogs: Array.isArray(p.workLogs) ? p.workLogs : [],
      })),
      events: events.map((e) => ({
        ...e,
        participants: Array.isArray(e.participants) ? e.participants : [],
      })),
      goals: goals.map((g) => ({
        ...g,
        targetValue: Number(g.targetValue),
        currentValue: Number(g.currentValue),
        linkedTaskIds: Array.isArray(g.linkedTaskIds) ? g.linkedTaskIds : [],
      })),
      habits: habits.map((h) => ({
        ...h,
        completedDates: Array.isArray(h.completedDates) ? h.completedDates : [],
      })),
      notes: notes.map((n) => ({
        ...n,
        tags: Array.isArray(n.tags) ? n.tags : [],
        blocks: Array.isArray(n.blocks) ? n.blocks : [],
      })),
      timeEntries,
      monthlyPlan: {
        month: new Date().toISOString().slice(0, 7),
        objectives: [],
        finances: [],
        focusNotes: '',
      },
      notifications: [],
    });
  } catch (err: any) {
    console.error('Error reading data store from DB:', err);
    return res.status(500).json({ error: 'Failed to read data from PostgreSQL' });
  }
});

// POST save persistent store to Cloud SQL PostgreSQL
app.post('/api/data', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.uid;
    const data = req.body;

    await repo.syncProductivityStore(userId, data);
    return res.json({ success: true, savedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('Error saving data store to DB:', err);
    return res.status(500).json({ error: 'Failed to save data to PostgreSQL' });
  }
});

// GET finance data directly from PostgreSQL
app.get('/api/finance', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.uid;
    const finData = await repo.getFinanceDataByUserId(userId);
    return res.json({
      accounts: finData.accounts,
      creditCards: finData.cards,
      transactions: finData.transactions,
      bills: finData.bills,
      debts: finData.debts,
      installments: [],
      emergencyFund: {
        targetAmount: 0,
        currentAmount: 0,
        monthlyContribution: 0,
        targetMonths: 6,
      },
      goals: finData.goals,
      investments: finData.investments,
      budget: {
        month: new Date().toISOString().slice(0, 7),
        plannedIncome: 0,
        allocations: {
          custos_fixos: 0,
          conforto: 0,
          metas: 0,
          prazeres: 0,
          liberdade_financeira: 0,
          conhecimento: 0,
        },
        notes: '',
      },
      closings: [],
      diagnosis: {
        monthlyIncome: 0,
        isIncomeVariable: false,
        fixedCosts: 0,
        comfortCosts: 0,
        leisureCosts: 0,
        currentDebtTotal: 0,
        monthlyDebtPayment: 0,
        emergencyFundAmount: 0,
        currentInvested: 0,
        monthlyTargetInvestment: 0,
        mainGoals: '',
      },
    });
  } catch (err: any) {
    console.error('Error reading finance data from DB:', err);
    return res.status(500).json({ error: 'Failed to read finance database' });
  }
});

// POST save finance data to PostgreSQL
app.post('/api/finance', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.uid;
    await repo.syncFinanceStore(userId, req.body);
    return res.json({ success: true, savedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('Error saving finance data to DB:', err);
    return res.status(500).json({ error: 'Failed to save finance database' });
  }
});

// Finance Granular Deletions
app.delete('/api/finance/accounts/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const ok = await repo.deleteFinanceAccount(req.user!.uid, req.params.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/finance/cards/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const ok = await repo.deleteFinanceCard(req.user!.uid, req.params.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/finance/transactions/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const ok = await repo.deleteFinanceTransaction(req.user!.uid, req.params.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/finance/bills/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const ok = await repo.deleteFinanceBill(req.user!.uid, req.params.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/finance/debts/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const ok = await repo.deleteFinanceDebt(req.user!.uid, req.params.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/finance/investments/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const ok = await repo.deleteFinanceInvestment(req.user!.uid, req.params.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/finance/goals/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const ok = await repo.deleteFinanceGoal(req.user!.uid, req.params.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Dedicated CRUD routes for granular operations
// Tasks
app.get('/api/tasks', requireAuth, async (req: AuthRequest, res) => {
  try {
    const items = await repo.getTasksByUserId(req.user!.uid);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', requireAuth, async (req: AuthRequest, res) => {
  try {
    const item = await repo.upsertTask(req.user!.uid, req.body);
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const deleted = await repo.deleteTask(req.user!.uid, req.params.id);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Projects
app.get('/api/projects', requireAuth, async (req: AuthRequest, res) => {
  try {
    const items = await repo.getProjectsByUserId(req.user!.uid);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects', requireAuth, async (req: AuthRequest, res) => {
  try {
    const item = await repo.upsertProject(req.user!.uid, req.body);
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/projects/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const deleted = await repo.deleteProject(req.user!.uid, req.params.id);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Events
app.get('/api/events', requireAuth, async (req: AuthRequest, res) => {
  try {
    const items = await repo.getEventsByUserId(req.user!.uid);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/events', requireAuth, async (req: AuthRequest, res) => {
  try {
    const item = await repo.upsertEvent(req.user!.uid, req.body);
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/events/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const deleted = await repo.deleteEvent(req.user!.uid, req.params.id);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Notes
app.get('/api/notes', requireAuth, async (req: AuthRequest, res) => {
  try {
    const items = await repo.getNotesByUserId(req.user!.uid);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notes', requireAuth, async (req: AuthRequest, res) => {
  try {
    const item = await repo.upsertNote(req.user!.uid, req.body);
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/notes/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const deleted = await repo.deleteNote(req.user!.uid, req.params.id);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Goals
app.get('/api/goals', requireAuth, async (req: AuthRequest, res) => {
  try {
    const items = await repo.getGoalsByUserId(req.user!.uid);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/goals', requireAuth, async (req: AuthRequest, res) => {
  try {
    const item = await repo.upsertGoal(req.user!.uid, req.body);
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/goals/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const deleted = await repo.deleteGoal(req.user!.uid, req.params.id);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Habits
app.get('/api/habits', requireAuth, async (req: AuthRequest, res) => {
  try {
    const items = await repo.getHabitsByUserId(req.user!.uid);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/habits', requireAuth, async (req: AuthRequest, res) => {
  try {
    const item = await repo.upsertHabit(req.user!.uid, req.body);
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/habits/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const deleted = await repo.deleteHabit(req.user!.uid, req.params.id);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reset database for user
app.post('/api/data/reset', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.uid;
    // Delete items belonging to user in cascade/order
    await db.delete(tasks).where(eq(tasks.userId, userId));
    await db.delete(projects).where(eq(projects.userId, userId));
    await db.delete(calendarEvents).where(eq(calendarEvents.userId, userId));
    await db.delete(notes).where(eq(notes.userId, userId));
    await db.delete(goals).where(eq(goals.userId, userId));
    await db.delete(habits).where(eq(habits.userId, userId));
    await db.delete(timeEntries).where(eq(timeEntries.userId, userId));
    await db.delete(financeTransactions).where(eq(financeTransactions.userId, userId));
    await db.delete(financeBills).where(eq(financeBills.userId, userId));
    await db.delete(financeCards).where(eq(financeCards.userId, userId));
    await db.delete(financeAccounts).where(eq(financeAccounts.userId, userId));
    return res.json({ success: true, message: 'Dados do usuário limpos no banco de dados' });
  } catch (err: any) {
    console.error('Error resetting user store in DB:', err);
    return res.status(500).json({ error: 'Failed to reset user data' });
  }
});

// POST AI Parse Task from raw natural language
app.post('/api/ai/parse-task', requireAuth, async (req, res) => {
  try {
    const { prompt, referenceDate } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: 'Gemini API not configured' });
    }

    const systemInstruction = `Você é um assistente de produtividade especializado em interpretar comandos de criação de tarefas.
Data de referência atual: ${referenceDate || new Date().toISOString().split('T')[0]}.
A partir do texto do usuário, extraia as seguintes informações em formato JSON estrito:
{
  "title": "Título conciso da tarefa",
  "description": "Detalhes adicionais se houver ou string vazia",
  "dueDate": "YYYY-MM-DD ou null se não houver data mencionada",
  "dueTime": "HH:mm ou null se não houver horário mencionado",
  "priority": "urgent" | "high" | "medium" | "low" | "none",
  "estimatedDuration": número em minutos ou 30 por padrão,
  "tags": ["array", "de", "tags", "sem", "hashtag"]
}
Retorne APENAS o JSON válido sem marcações markdown de código adicionais.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (err: any) {
    console.error('AI parse-task error:', err);
    return res.status(500).json({ error: err.message || 'Falha ao processar com IA' });
  }
});

// POST AI Project Breakdown
app.post('/api/ai/breakdown-project', requireAuth, async (req, res) => {
  try {
    const { projectName, projectDescription, targetDueDate } = req.body;
    if (!projectName) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: 'Gemini API not configured' });
    }

    const systemInstruction = `Você é um consultor sênior de produtividade e gerenciamento de projetos.
Sua missão é quebrar um projeto em 5 a 8 tarefas práticas, bem sequenciadas e acionáveis.
Para cada tarefa forneça:
{
  "tasks": [
    {
      "title": "Nome acionável (ex: Elaborar wireframes iniciais)",
      "description": "Objetivo desta entrega",
      "priority": "urgent" | "high" | "medium" | "low",
      "estimatedDuration": minutos estimados (ex: 60, 120),
      "tags": ["design", "frontend", etc],
      "checklist": ["Passo 1", "Passo 2"]
    }
  ]
}
Retorne estritamente o JSON sem comentários adicionais.`;

    const promptText = `Projeto: "${projectName}".\nDescrição: "${projectDescription || 'Sem descrição'}".\nPrazo final estimado: ${targetDueDate || 'Próximas semanas'}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '{"tasks":[]}';
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (err: any) {
    console.error('AI breakdown-project error:', err);
    return res.status(500).json({ error: err.message || 'Falha ao quebrar projeto com IA' });
  }
});

// POST AI Suggest Recurring Routines & Operational SOPs for Projects
app.post('/api/ai/project-routines', requireAuth, async (req, res) => {
  try {
    const { projectName, projectDescription, recurrenceFrequency } = req.body;
    if (!projectName) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: 'Gemini API not configured' });
    }

    const systemInstruction = `Você é um especialista em estruturação de processos operacionais e projetos contínuos/recorrentes.
Analise o nome e a descrição do projeto contínuo e sugira de 4 a 7 rotinas e procedimentos operacionais periódicos recomendados.
Para cada rotina, defina a periodicidade recomendada (daily, weekly, biweekly, monthly).
Retorne no formato JSON:
{
  "routines": [
    {
      "title": "Ação recorrente clara e específica (ex: Revisão de métricas e alinhamento)",
      "frequency": "daily" | "weekly" | "biweekly" | "monthly"
    }
  ],
  "advice": "1 parágrafo com recomendação estratégica para manter este projeto contínuo saudável e sem gargalos."
}
Retorne estritamente o JSON sem comentários adicionais.`;

    const promptText = `Projeto: "${projectName}".\nDescrição: "${projectDescription || 'Demanda recorrente contínua'}".\nPeriodicidade principal: ${recurrenceFrequency || 'weekly'}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '{"routines":[]}';
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (err: any) {
    console.error('AI project-routines error:', err);
    return res.status(500).json({ error: err.message || 'Falha ao sugerir rotinas com IA' });
  }
});

// POST AI Smart Priorities & Daily Executive Briefing
app.post('/api/ai/smart-priorities', requireAuth, async (req, res) => {
  try {
    const { tasks, currentDate } = req.body;
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: 'Gemini API not configured' });
    }

    const systemInstruction = `Você é um assistente de produtividade pessoal inteligente.
Analise a lista de tarefas fornecida considerando urgência, prazos, dependências e impacto.
Retorne um JSON com as 3 tarefas mais críticas para focar hoje e uma breve análise executiva do dia:
{
  "topTaskIds": ["id1", "id2", "id3"],
  "briefing": "Parágrafo com tom positivo, enérgico e focado orientando como atacar o dia de hoje.",
  "suggestions": [
    "Dica prática 1",
    "Dica prática 2"
  ]
}
Retorne estritamente o JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: JSON.stringify({ currentDate, tasks: (tasks || []).slice(0, 20) }),
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (err: any) {
    console.error('AI smart-priorities error:', err);
    return res.status(500).json({ error: err.message || 'Falha ao analisar prioridades' });
  }
});

// POST Conversational AI Assistant with Voice & Full System Agency
app.post('/api/ai/assistant-chat', requireAuth, async (req, res) => {
  try {
    const { message, history = [], systemContext = {} } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Mensagem do usuário é obrigatória.' });
    }

    const {
      currentDate = new Date().toISOString().slice(0, 10),
      currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      userName = '',
      tasks = [],
      projects = [],
      events = [],
    } = systemContext;

    const ai = getGeminiClient();
    if (!ai) {
      // Graceful local rule-based fallback if no API key is available
      const lower = message.toLowerCase();
      if (lower.includes('criar tarefa') || lower.includes('nova tarefa') || lower.includes('adicionar tarefa')) {
        const titleMatch = message.replace(/(criar|nova|adicionar)\s+tarefa/i, '').trim();
        return res.json({
          reply: `Criei a tarefa "${titleMatch || 'Nova Tarefa'}" no seu sistema.`,
          actions: [
            {
              type: 'create_task',
              data: {
                title: titleMatch || 'Nova Tarefa',
                priority: lower.includes('urgente') ? 'urgent' : lower.includes('importante') ? 'high' : 'medium',
                dueDate: currentDate,
              },
            },
          ],
          suggestedPrompts: ['Quais são minhas tarefas de hoje?', 'Criar um evento na agenda'],
        });
      }
      return res.status(503).json({
        reply: 'Chave do Gemini API não configurada no servidor. Por favor configure GEMINI_API_KEY no arquivo .env.',
        actions: [],
      });
    }

    const systemInstruction = `Você é o Copiloto e Assistente de Voz Oficial do "Fluxo", uma plataforma avançada de produtividade pessoal e de equipe.
Data e hora atual de referência: ${currentDate} às ${currentTime}.
Nome do usuário: ${userName || 'Usuário'}.

ESTADO ATUAL DO SISTEMA:
- Tarefas cadastradas (${tasks.length}): ${JSON.stringify(
      tasks.slice(0, 30).map((t: any) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        dueTime: t.dueTime,
        tags: t.tags,
      }))
    )}
- Projetos cadastrados (${projects.length}): ${JSON.stringify(
      projects.map((p: any) => ({ id: p.id, name: p.name, progress: p.progress }))
    )}
- Compromissos e eventos de hoje/próximos (${events.length}): ${JSON.stringify(
      events.slice(0, 20).map((e: any) => ({
        id: e.id,
        title: e.title,
        startDate: e.startDate,
        startTime: e.startTime,
        endTime: e.endTime,
        location: e.location,
      }))
    )}

COMO AGIR:
1. Você tem AUTORIZAÇÃO TOTAL para trabalhar DENTRO do sistema e executar ações reais (criar tarefas, concluir tarefas, deletar tarefas, criar eventos na agenda, criar projetos, mudar abas).
2. O usuário pode estar interagindo por VOZ (fala) ou por TEXTO (escrita). Por isso, sua resposta deve ser natural, concisa, amigável e em português brasileiro fluído.
3. Se o usuário pedir para criar tarefas, calcular prazos ("amanhã", "segunda-feira que vem às 14h"), interpretar urgência ("isso é urgente"), você DEVE gerar as datas exatas no padrão YYYY-MM-DD com base na data de referência ${currentDate}.
4. Se o usuário perguntar o que tem para fazer hoje ou pedir resumo, consulte a lista de tarefas e compromissos do sistema e dê uma resposta executiva encorajadora e clara.
5. Se o usuário pedir para concluir ou remover uma tarefa, identifique o ID ou título da tarefa no estado do sistema e gere a ação.

FORMATO DE RESPOSTA ESTREITO:
Você deve retornar APENAS um JSON com o seguinte formato:
{
  "reply": "Resposta concisa em português para ser falada e lida pelo usuário.",
  "actions": [
    // Se precisar executar ações reais no sistema:
    // { "type": "create_task", "data": { "title": "...", "description": "...", "dueDate": "YYYY-MM-DD", "dueTime": "HH:mm", "priority": "urgent"|"high"|"medium"|"low"|"none", "tags": ["tag1"], "projectName": "..." } }
    // { "type": "complete_task", "data": { "taskTitleOrId": "..." } }
    // { "type": "delete_task", "data": { "taskTitleOrId": "..." } }
    // { "type": "create_event", "data": { "title": "...", "startDate": "YYYY-MM-DD", "startTime": "HH:mm", "endDate": "YYYY-MM-DD", "endTime": "HH:mm", "location": "...", "description": "..." } }
    // { "type": "create_project", "data": { "name": "...", "description": "...", "color": "#3b82f6", "priority": "high"|"medium"|"low" } }
    // { "type": "navigate", "data": { "tab": "dashboard"|"tasks"|"agenda"|"calendar"|"projects"|"goals"|"habits"|"notes"|"focus" } }
  ],
  "suggestedPrompts": [
    "Sugestão rápida 1",
    "Sugestão rápida 2"
  ]
}`;

    // Format conversation history for Gemini
    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const h of history.slice(-8)) {
        if (h.sender === 'user' || h.role === 'user') {
          contents.push({ role: 'user', parts: [{ text: h.text || h.content }] });
        } else if (h.sender === 'assistant' || h.role === 'model') {
          contents.push({ role: 'model', parts: [{ text: h.text || h.content }] });
        }
      }
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);
    return res.json({
      reply: parsed.reply || 'Comando processado com sucesso.',
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      suggestedPrompts: Array.isArray(parsed.suggestedPrompts) ? parsed.suggestedPrompts : [],
    });
  } catch (err: any) {
    console.error('AI assistant-chat error:', err);
    return res.status(500).json({
      error: err.message || 'Falha ao processar comando com IA',
      reply: 'Desculpe, ocorreu um erro temporário ao processar seu comando. Você pode tentar novamente ou digitar sua solicitação.',
      actions: [],
    });
  }
});

// ================= VITE MIDDLEWARE & SERVER START =================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Central de Produtividade server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
