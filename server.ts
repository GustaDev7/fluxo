import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// File storage path
const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error('Failed to create data directory:', e);
  }
}

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET persistent store status
app.get('/api/data/status', (req, res) => {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const stats = fs.statSync(STORE_FILE);
      const content = fs.readFileSync(STORE_FILE, 'utf-8');
      const data = JSON.parse(content);
      return res.json({
        status: 'connected',
        connected: true,
        lastModified: stats.mtime.toISOString(),
        fileSizeBytes: stats.size,
        counts: {
          tasks: data.tasks?.length || 0,
          projects: data.projects?.length || 0,
          events: data.events?.length || 0,
          goals: data.goals?.length || 0,
          habits: data.habits?.length || 0,
          notes: data.notes?.length || 0,
          finances: data.monthlyPlan?.finances?.length || 0,
          timeEntries: data.timeEntries?.length || 0,
        },
      });
    }
    return res.json({ status: 'connected', connected: true, fileSizeBytes: 0, counts: {} });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', error: err.message });
  }
});

// Clean default empty store
const CLEAN_EMPTY_STORE = {
  user: {
    id: 'user_1',
    name: '',
    email: '',
    avatar: '',
    role: '',
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
  tasks: [],
  projects: [],
  events: [],
  goals: [],
  habits: [],
  notes: [],
  monthlyPlan: {
    month: new Date().toISOString().slice(0, 7),
    objectives: [],
    finances: [],
    focusNotes: '',
  },
  notifications: [],
  timeEntries: [],
};

// GET persistent store
app.get('/api/data', (req, res) => {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, 'utf-8');
      if (content.includes('Alexandre') || content.includes('Cliente Beta') || content.includes('task_1')) {
        fs.writeFileSync(STORE_FILE, JSON.stringify(CLEAN_EMPTY_STORE, null, 2), 'utf-8');
        return res.json(CLEAN_EMPTY_STORE);
      }
      return res.json(JSON.parse(content));
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(CLEAN_EMPTY_STORE, null, 2), 'utf-8');
    return res.json(CLEAN_EMPTY_STORE);
  } catch (err) {
    console.error('Error reading store file:', err);
    return res.status(500).json({ error: 'Failed to read data store' });
  }
});

// POST save persistent store (atomic write to prevent corruption)
app.post('/api/data', (req, res) => {
  try {
    const data = req.body;
    // Discard any incoming data that still carries legacy mock data
    if (data?.user?.name === 'Alexandre Mendes' || (Array.isArray(data?.tasks) && data.tasks.some((t: any) => t.id === 'task_1'))) {
      fs.writeFileSync(STORE_FILE, JSON.stringify(CLEAN_EMPTY_STORE, null, 2), 'utf-8');
      return res.json({ success: true, savedAt: new Date().toISOString(), sanitized: true });
    }
    const tempFile = `${STORE_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, STORE_FILE);
    return res.json({ success: true, savedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error writing store file:', err);
    return res.status(500).json({ error: 'Failed to write data store' });
  }
});

// POST reset persistent store
app.post('/api/data/reset', (req, res) => {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(CLEAN_EMPTY_STORE, null, 2), 'utf-8');
    return res.json({ success: true });
  } catch (err) {
    console.error('Error resetting store file:', err);
    return res.status(500).json({ error: 'Failed to reset data store' });
  }
});

// POST AI Parse Task from raw natural language
app.post('/api/ai/parse-task', async (req, res) => {
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
app.post('/api/ai/breakdown-project', async (req, res) => {
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

// POST AI Smart Priorities & Daily Executive Briefing
app.post('/api/ai/smart-priorities', async (req, res) => {
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
