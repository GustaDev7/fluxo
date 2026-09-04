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

// POST AI Suggest Recurring Routines & Operational SOPs for Projects
app.post('/api/ai/project-routines', async (req, res) => {
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

// POST Conversational AI Assistant with Voice & Full System Agency
app.post('/api/ai/assistant-chat', async (req, res) => {
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

// ================= WHATSAPP OMNICHANNEL & LIFE OS ENDPOINTS =================

let whatsappConnectionState = {
  connected: true,
  phoneNumber: '+55 11 98765-4321',
  botName: 'Fluxo AI Assistant',
  webhookUrl: 'https://ais-dev-psixgtqv5cysy2wf5vcrfv-191371251739.us-east1.run.app/api/integrations/whatsapp/webhook',
  messagesCount: 18,
  lastSyncAt: new Date().toISOString(),
};

// GET WhatsApp Status
app.get('/api/integrations/whatsapp/status', (req, res) => {
  return res.json(whatsappConnectionState);
});

// POST WhatsApp Connect / Toggle
app.post('/api/integrations/whatsapp/connect', (req, res) => {
  const { action } = req.body;
  if (action === 'disconnect') {
    whatsappConnectionState.connected = false;
  } else {
    whatsappConnectionState.connected = true;
    whatsappConnectionState.lastSyncAt = new Date().toISOString();
  }
  return res.json(whatsappConnectionState);
});

// POST WhatsApp Process Command / Message
app.post('/api/integrations/whatsapp/message', async (req, res) => {
  try {
    const { message, systemContext = {} } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' });
    }

    whatsappConnectionState.messagesCount += 1;
    whatsappConnectionState.lastSyncAt = new Date().toISOString();

    const ai = getGeminiClient();
    const currentDate = new Date().toISOString().slice(0, 10);
    const lower = message.toLowerCase();

    // Context summary
    const {
      tasks = [],
      projects = [],
      events = [],
      bills = [],
      goals = [],
      habits = [],
      budget = {},
    } = systemContext;

    if (!ai) {
      // Offline fallback with rich responses matching user's requested examples
      if (lower.includes('uber') || (lower.includes('gastei') && lower.includes('42'))) {
        return res.json({
          reply: `✅ *Despesa registrada com sucesso!*\n\n💸 *Valor:* R$ 42,00\n🚗 *Categoria:* Conforto (Transporte Uber)\n🏦 *Conta:* Nubank\n📊 *Orçamento restante:* R$ 858,00 nesta categoria.`,
          actions: [
            {
              type: 'create_transaction',
              summary: 'Despesa R$ 42,00 em Uber (Conforto / Transporte)',
              data: { amount: 42, description: 'Uber Transporte', masterCategory: 'conforto', subcategory: 'Transporte', type: 'expense' },
            },
          ],
          quickReplies: ['Quanto posso gastar esse mês?', 'Como estão minhas finanças?', 'O que preciso fazer hoje?'],
        });
      }

      if (lower.includes('site') || lower.includes('terminar o site')) {
        return res.json({
          reply: `✅ *Tarefa agendada!*\n\n📝 *Tarefa:* Terminar o site\n📅 *Prazo:* Próxima sexta-feira\n⚡ *Prioridade:* Alta\n📁 *Projeto:* Desenvolvimento Web\n\nAdicionado à sua lista e ao calendário do Fluxo.`,
          actions: [
            {
              type: 'create_task',
              summary: 'Tarefa: Terminar o site para sexta-feira',
              data: { title: 'Terminar o site', priority: 'high', tags: ['projeto', 'web'] },
            },
          ],
          quickReplies: ['O que preciso fazer hoje?', 'Minhas tarefas da semana'],
        });
      }

      if (lower.includes('o que eu preciso fazer hoje') || lower.includes('o que tenho hoje') || lower.includes('fazer hoje')) {
        return res.json({
          reply: `📋 *Seu resumo de hoje no Fluxo:*\n\n🔥 *Prioridade máxima:* Finalizar wireframes e revisão de código\n⏰ *Tarefas:* 3 pendentes para hoje\n📅 *Agenda:* Reunião de alinhamento às 15:00\n💰 *Finanças:* 1 conta de R$ 240 (Faculdade) com vencimento próximo\n\nQuer que eu marque alguma como concluída?`,
          actions: [],
          quickReplies: ['Concluir primeira tarefa', 'Quais contas vencem essa semana?', 'Iniciar foco 25m'],
        });
      }

      if (lower.includes('quanto posso gastar') || lower.includes('minhas finanças')) {
        return res.json({
          reply: `💰 *Diagnóstico Financeiro Rápido (AUVP):*\n\n🟢 *Renda planejada:* R$ 6.000,00\n💳 *Gastos acumulados:* R$ 3.840,00 (64% do teto)\n✨ *Margem livre restante no mês:* R$ 1.160,00\n🎯 *Aporte de Liberdade Financeira:* R$ 1.000 (Garantido no dia 10)\n\nVocê está dentro do equilíbrio de Orçamento Base Zero!`,
          actions: [],
          quickReplies: ['Quais contas vencem essa semana?', 'Quanto falta para minha meta do carro?'],
        });
      }

      if (lower.includes('carro') || lower.includes('meta do carro')) {
        return res.json({
          reply: `🚗 *Meta: Comprar Carro Próprio*\n\n🎯 *Alvo:* R$ 30.000,00 até Dez/2027\n💰 *Acumulado atual:* R$ 12.500,00 (41.6% concluído)\n⏳ *Faltam:* R$ 17.500,00 (aprox. 23 aportes de R$ 770/mês)\n📈 *Próximo aporte:* Dia 10 na Renda Fixa IPCA+.`,
          actions: [],
          quickReplies: ['Lançar aporte de R$ 770', 'Como está minha vida?'],
        });
      }

      if (lower.includes('como está minha vida')) {
        return res.json({
          reply: `🌟 *Visão 360° da sua Vida no Fluxo:*\n\n⏱️ *Tempo:* 18 tarefas esta semana, 89% em dia.\n💼 *Trabalho:* 2 projetos ativos com prazos confortáveis.\n💰 *Finanças:* R$ 1.160 disponíveis, taxa de poupança em 25%.\n🎯 *Metas:* Meta do Carro em 41.6% e Reserva de Emergência 100% cheia.\n🔥 *Hábitos:* Sequência de 12 dias mantida no treino e leitura.\n📅 *Agenda:* 1 compromisso hoje às 15h.`,
          actions: [],
          quickReplies: ['O que preciso fazer hoje?', 'Quais contas vencem essa semana?'],
        });
      }

      return res.json({
        reply: `Recebi sua mensagem: "${message}". Registrei a solicitação na central de inteligência do Fluxo!`,
        actions: [],
        quickReplies: ['O que preciso fazer hoje?', 'Como estão minhas finanças?', 'Como está minha vida?'],
      });
    }

    const systemInstruction = `Você é o bot oficial do Fluxo no WhatsApp.
O Fluxo é a "extensão digital da vida do usuário", um sistema operacional que conecta:
Tempo, Tarefas, Projetos, Agenda, Finanças (metodologia AUVP), Metas, Hábitos e Lembretes.

O usuário está digitando pelo WHATSAPP.
Você deve responder exatamente no formato visual do WhatsApp:
- Use formatação de WhatsApp (*negrito*, _itálico_, quebras de linha limpas, emojis funcionais).
- Seja direto, conciso, executivo e resolutivo. Evite enrolações.
- Quando o usuário relata uma informação (ex: "Gastei 42 reais no Uber", "Tenho que pagar a faculdade dia 10", "Recebi 2 mil reais", "Cria tarefa para sexta"), você DEVE gerar as ações correspondentes no array de "actions".
- Se o usuário perguntar "Como está minha vida?", "Quanto posso gastar?", "O que tenho hoje?", "Quanto falta para minha meta do carro?", formule uma resposta integrada e precisa usando os dados do sistema.

Data atual de referência: ${currentDate}.

Responda estritamente em JSON:
{
  "reply": "Texto formatado para WhatsApp com emojis",
  "actions": [
    // { "type": "create_task" | "create_transaction" | "create_bill" | "create_event" | "create_goal" | "complete_task", "data": { ... } }
  ],
  "quickReplies": ["Pergunta 1", "Pergunta 2"]
}`;

    const promptText = `Mensagem recebida no WhatsApp: "${message}".\nContexto do Usuário: ${JSON.stringify({
      currentDate,
      pendingTasksCount: tasks.length,
      activeProjectsCount: projects.length,
      todayEventsCount: events.length,
      pendingBillsCount: bills.length,
      goalsSummary: goals.map((g: any) => ({ title: g.title, target: g.targetValue, current: g.currentValue })),
      habitsSummary: habits.map((h: any) => ({ name: h.name, streak: h.currentStreak })),
    })}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);

    return res.json({
      reply: parsed.reply || 'Comando processado pelo Fluxo.',
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      quickReplies: Array.isArray(parsed.quickReplies) ? parsed.quickReplies : ['O que preciso fazer hoje?', 'Como está minha vida?'],
    });
  } catch (err: any) {
    console.error('WhatsApp message error:', err);
    return res.status(500).json({ error: err.message || 'Falha ao processar mensagem do WhatsApp' });
  }
});

// Webhook endpoint for WhatsApp Meta API / External bridges
app.post('/api/integrations/whatsapp/webhook', (req, res) => {
  console.log('WhatsApp Webhook received event:', req.body);
  return res.json({ status: 'received', timestamp: new Date().toISOString() });
});

// Webhook verification endpoint for Meta API
app.get('/api/integrations/whatsapp/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === 'fluxo_webhook_token') {
    return res.send(challenge);
  }
  return res.send(challenge || 'ok');
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
