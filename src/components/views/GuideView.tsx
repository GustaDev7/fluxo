import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FluxoIcon } from '../FluxoLogo';
import {
  BookOpen,
  Sparkles,
  Zap,
  CheckSquare,
  Clock,
  Calendar,
  FolderKanban,
  Flame,
  Target,
  FileText,
  Timer,
  BarChart3,
  Keyboard,
  Inbox,
  ArrowRight,
  Lightbulb,
  Shield,
  HelpCircle,
  Play,
  RotateCcw,
  CheckCircle2,
  CalendarRange,
  ChevronDown,
  ChevronUp,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import { ActiveNavTab } from '../../types';

export const GuideView: React.FC = () => {
  const {
    setActiveTab,
    setIsQuickCaptureOpen,
    setIsCommandPaletteOpen,
    setIsShortcutsOpen,
    clearToCleanSlate,
    resetToSampleData,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<'start' | 'modules' | 'workflows' | 'shortcuts' | 'faq'>('start');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const startCards = [
    {
      step: 'Passo 1',
      title: 'Descarrego Mental Imediato',
      badge: 'Inbox & Atalho Q',
      desc: 'Sua mente serve para gerar ideias, não para guardá-las. Sempre que surgir um pensamento, demanda ou lembrete, aperte a tecla Q ou C para capturar instantaneamente.',
      icon: Inbox,
      color: 'from-blue-500 to-indigo-600',
      actionLabel: 'Testar Captura Rápida',
      action: () => setIsQuickCaptureOpen(true),
    },
    {
      step: 'Passo 2',
      title: 'Planejamento Visual & Kanban',
      badge: 'Tarefas & Prioridades',
      desc: 'Organize suas tarefas em colunas: Backlog, A Fazer, Em Andamento e Concluído. Defina prioridades (Urgente, Alta, Média) e quebre em subtarefas ou checklists.',
      icon: CheckSquare,
      color: 'from-indigo-500 to-violet-600',
      actionLabel: 'Ver Quadro de Tarefas',
      action: () => setActiveTab('tasks'),
    },
    {
      step: 'Passo 3',
      title: 'Time Blocking na Agenda',
      badge: 'Agenda das 07h às 21h',
      desc: 'Uma lista de tarefas sem horário vira ansiedade. Alavanque o método Time Blocking reservando blocos na sua linha do tempo diária para tarefas específicas e Deep Work.',
      icon: Clock,
      color: 'from-amber-500 to-orange-600',
      actionLabel: 'Abrir Linha do Tempo',
      action: () => setActiveTab('agenda'),
    },
    {
      step: 'Passo 4',
      title: 'Superpoder da IA (Gemini)',
      badge: 'Quebra Automática',
      desc: 'Tem um projeto complexo? Abra a aba Projetos e clique em "Quebrar em Tarefas com IA". O Google Gemini analisa o escopo e cria automaticamente todo o plano operacional.',
      icon: Sparkles,
      color: 'from-emerald-500 to-teal-600',
      actionLabel: 'Explorar Projetos com IA',
      action: () => setActiveTab('projects'),
    },
    {
      step: 'Passo 5',
      title: 'Imersão em Deep Work',
      badge: 'Modo Foco & Áudios',
      desc: 'Ligue o cronômetro Pomodoro de 25m ou 50m vinculado à tarefa ativa e ative os sons ambientes sintetizados (Ruído Branco, Chuva ou Frequência Binaural 432Hz).',
      icon: Timer,
      color: 'from-rose-500 to-pink-600',
      actionLabel: 'Entrar no Modo Foco',
      action: () => setActiveTab('focus'),
    },
    {
      step: 'Passo 6',
      title: 'Rituais & Hábitos Diários',
      badge: 'Streaks',
      desc: 'Construa consistência marcando seus hábitos matinais, diurnos e noturnos. Mantenha sua contagem de ofensivas (streaks) viva semana após semana sem quebrar a corrente.',
      icon: Flame,
      color: 'from-orange-500 to-amber-600',
      actionLabel: 'Acessar Hábitos',
      action: () => setActiveTab('habits'),
    },
  ];

  const modules = [
    {
      id: 'dashboard',
      name: 'Painel Geral (Dashboard)',
      icon: Zap,
      tab: 'dashboard' as ActiveNavTab,
      summary: 'Central de comando que consolida métricas do dia, prazos críticos, agenda e hábitos.',
      features: [
        'Métricas instantâneas: tarefas pendentes para hoje, hábitos feitos, horas em foco e prazos vencidos.',
        'Widget de Prioridades Inteligentes com IA: sugere em tempo real qual tarefa merece sua atenção imediata.',
        'Atalho rápido para iniciar timer de foco diretamente em qualquer demanda.',
      ],
    },
    {
      id: 'finance',
      name: 'Gestão Financeira AUVP',
      icon: DollarSign,
      tab: 'finance' as ActiveNavTab,
      summary: 'Metodologia AUVP integrada para blindagem patrimonial, orçamento base zero e liberdade financeira.',
      features: [
        'Reserva de Emergência com termômetro de cobertura (3 a 12 meses de custo essencial).',
        'Orçamento Base Zero com distribuição inteligente (50% Necessidades, 30% Conforto, 20% Liberdade).',
        'Controle de Contas a Pagar & Boletos com alertas preventivos de vencimento.',
        'Diagnóstico 360° com cálculo de Score de Saúde Financeira de 0 a 100.',
      ],
    },
    {
      id: 'inbox',
      name: 'Caixa de Entrada (Inbox Zero)',
      icon: Inbox,
      tab: 'inbox' as ActiveNavTab,
      summary: 'Área de depósito sem filtros para esvaziar a mente rapidamente antes de triar.',
      features: [
        'Acessível pelo atalho global Q ou C de qualquer tela.',
        'Suporte a linguagem natural: escreva "Reunião amanhã às 15h #urgente" e a IA preenche data, hora e prioridade.',
        'Botões de triagem em 1 clique: Mover para Hoje, Amanhã, Associar a Projeto ou Concluir.',
      ],
    },
    {
      id: 'tasks',
      name: 'Tarefas & Quadro Kanban',
      icon: CheckSquare,
      tab: 'tasks' as ActiveNavTab,
      summary: 'Gerenciamento operacional completo inspirado no Trello e Todoist.',
      features: [
        'Alterne entre visualização em Lista compacta e Quadro Kanban interativo.',
        'Filtros por projeto, tags personalizadas, prioridade e status.',
        'Tarefas Recorrentes: ao marcar uma tarefa recorrente como concluída, o sistema agenda a próxima ocorrência automaticamente.',
        'Exportação direta para planilha (CSV) para relatórios externos.',
      ],
    },
    {
      id: 'agenda',
      name: 'Agenda & Time Blocking',
      icon: Clock,
      tab: 'agenda' as ActiveNavTab,
      summary: 'Linha do tempo horária (07:00 às 21:00) para estruturar o dia em blocos protegidos.',
      features: [
        'Diferenciação visual de Reuniões, Tarefas com horário e Blocos de Foco (Deep Work).',
        'Indicador da hora atual em tempo real atravessando o dia.',
        'Botão de início de Pomodoro sincronizado com a tarefa do bloco.',
      ],
    },
    {
      id: 'calendar',
      name: 'Calendário Mensal & Integração',
      icon: Calendar,
      tab: 'calendar' as ActiveNavTab,
      summary: 'Visão macro do mês com eventos, datas limites de tarefas e exportação .ics.',
      features: [
        'Grade mensal completa com badges coloridas por tipo de compromisso.',
        'Alternância entre visão em Grade e visão em Lista Cronológica.',
        'Exportação de calendário (.ics): compatível com Google Calendar, Apple Calendar e Outlook.',
      ],
    },
    {
      id: 'projects',
      name: 'Projetos & Quebra com IA',
      icon: FolderKanban,
      tab: 'projects' as ActiveNavTab,
      summary: 'Portfólio de iniciativas com cálculo automático de progresso, Gantt e assistência de IA.',
      features: [
        'Botão "Quebrar em Tarefas com IA": o Gemini lê a descrição do projeto e cria de 5 a 10 tarefas práticas prontas.',
        'Sub-visualizações por projeto: Lista de Tarefas, Kanban individual e Cronograma Linear (Gantt).',
        'Controle de membros, prazos, datas de início e cor personalizada.',
      ],
    },
    {
      id: 'monthly',
      name: 'Planejamento Mensal & Finanças',
      icon: CalendarRange,
      tab: 'monthly' as ActiveNavTab,
      summary: 'Alinhamento estratégico do mês com acompanhamento de metas e contas a pagar.',
      features: [
        'Grandes objetivos mensais com percentual de avanço.',
        'Compromissos Financeiros: controle de contas a pagar, dia de vencimento, valores e status de pagamento.',
        'Bloco livre para anotações e reflexões estratégicas do mês.',
      ],
    },
    {
      id: 'habits',
      name: 'Rastreador de Hábitos (Habit Tracker)',
      icon: Flame,
      tab: 'habits' as ActiveNavTab,
      summary: 'Matriz dos últimos 7 dias para consolidação de rotinas e acompanhamento de streaks.',
      features: [
        'Marcação em 1 clique para dias passados ou presentes.',
        'Cálculo automático de ofensiva atual (Streak) e maior recorde histórico.',
        'Filtros por período: Manhã, Tarde, Noite ou Qualquer hora.',
      ],
    },
    {
      id: 'notes',
      name: 'Notas & Documentação Notion-like',
      icon: FileText,
      tab: 'notes' as ActiveNavTab,
      summary: 'Editor modular em blocos para documentar reuniões, ideias e conhecimento.',
      features: [
        'Blocos flexíveis: Título H1, Subtítulo H2, Parágrafo, Checklists, Callouts e Blocos de Código.',
        'Vínculo direto a qualquer um dos seus projetos.',
        'Adição e reordenação instantânea de blocos.',
      ],
    },
    {
      id: 'focus',
      name: 'Modo Foco & Timer Pomodoro',
      icon: Timer,
      tab: 'focus' as ActiveNavTab,
      summary: 'Ambiente imersivo livre de distrações para concentração máxima.',
      features: [
        'Presets rápidos: 25 min (Pomodoro clássico), 50 min (Deep Work), 5 min (Pausa curta) e 15 min (Pausa longa).',
        'Áudios de concentração sintetizados via Web Audio API (Ruído Branco, Chuva e Onda Binaural 432Hz).',
        'Vínculo à tarefa ativa: registra automaticamente o tempo gasto na demanda.',
      ],
    },
    {
      id: 'analytics',
      name: 'Relatórios & Produtividade',
      icon: BarChart3,
      tab: 'analytics' as ActiveNavTab,
      summary: 'Indicadores quantitativos de performance e consistência ao longo do tempo.',
      features: [
        'Score de Produtividade (0 a 100) baseado em conclusões, pontualidade e hábitos.',
        'Distribuição percentual de tempo e tarefas por projeto.',
        'Histórico diário de conclusões e tempo em Deep Work.',
      ],
    },
  ];

  const workflows = [
    {
      title: 'Rotina Matinal de 5 Minutos (Kickoff do Dia)',
      time: '08:00 - 08:05',
      steps: [
        'Abra o Dashboard para conferir suas métricas e o widget de Prioridades Inteligentes da IA.',
        'Acesse a Caixa de Entrada (Inbox) e faça uma triagem rápida de 2 minutos para esvaziá-la.',
        'Vá na Agenda e posicione suas 2 a 3 tarefas cruciais do dia em blocos horários (Time Blocking).',
      ],
    },
    {
      title: 'Ciclo de Execução Durante o Dia (Deep Work)',
      time: '09:00 - 18:00',
      steps: [
        'Ao iniciar uma tarefa, abra o Modo Foco (ou clique no botão de timer no Header).',
        'Ligue o som binaural ou ruído branco e foque exclusivamente na demanda por 25 ou 50 minutos.',
        'Se surgir uma distração ou nova demanda externa, tecle Q, capture em 3 segundos e continue no foco.',
        'Ao concluir a sessão de foco, aproveite a pausa curta de 5 minutos longe da tela.',
      ],
    },
    {
      title: 'Fechamento do Dia (Shutdown Ritual)',
      time: '18:00 - 18:10',
      steps: [
        'Abra a tela de Hábitos e marque os rituais que você realizou para manter sua ofensiva.',
        'Marque as tarefas concluídas no Kanban (se tiver repetição, a próxima é agendada automaticamente).',
        'Dê uma rápida olhada no Calendário de amanhã para dormir com a mente leve e preparada.',
      ],
    },
    {
      title: 'Revisão Estratégica Semanal ou Mensal',
      time: 'Sexta-feira ou Início do Mês',
      steps: [
        'Verifique seu Score no Analytics para entender onde o seu tempo foi investido.',
        'Abra a aba Plano Mensal para checar o avanço das metas e atualizar as contas a pagar.',
        'Crie novos projetos e use o botão "Quebrar em Tarefas com IA" para alimentar o backlog.',
      ],
    },
  ];

  const shortcutsList = [
    { key: '⌘K / Ctrl+K', desc: 'Abre a Paleta de Comandos com busca instantânea em todo o app.' },
    { key: 'Q / C', desc: 'Abre o modal de Captura Rápida com IA para anotar qualquer tarefa sem sair de onde está.' },
    { key: '?', desc: 'Abre a janela flutuante com a colinha rápida de todos os atalhos de teclado.' },
    { key: '1', desc: 'Navega instantaneamente para o Painel Geral (Dashboard).' },
    { key: '2', desc: 'Navega para a Caixa de Entrada (Inbox).' },
    { key: '3', desc: 'Navega para Tarefas & Quadro Kanban.' },
    { key: '4', desc: 'Navega para a Agenda & Time Blocking.' },
    { key: '5', desc: 'Navega para o Calendário Mensal.' },
    { key: '6', desc: 'Navega para o painel de Projetos.' },
    { key: '7', desc: 'Navega para o Planejamento Mensal & Finanças.' },
    { key: '8', desc: 'Navega para o Rastreador de Hábitos.' },
    { key: '9', desc: 'Navega para o Modo Foco (Pomodoro).' },
    { key: 'Esc', desc: 'Fecha qualquer modal, gaveta ou formulário aberto imediatamente.' },
  ];

  const faqs = [
    {
      q: 'Meus dados ficam salvos se eu fechar a aba ou desligar o computador?',
      a: 'Sim, 100%! O sistema utiliza persistência local no seu navegador combinada com sincronização via servidor. Seus dados persistem mesmo após recarregar a página ou reabrir o navegador.',
    },
    {
      q: 'Posso usar a ferramenta com meus dados reais e apagar os exemplos?',
      a: 'Com certeza! Você pode clicar no botão "Iniciar Meu Espaço Limpo" disponível em Configurações (ou no rodapé desta página de ajuda). Isso deixa o ambiente limpo e pronto para suas metas pessoais.',
    },
    {
      q: 'Como funciona a Inteligência Artificial (Google Gemini) no app?',
      a: 'A IA está integrada em 3 pontos cruciais: (1) Na Captura Rápida, interpretando frases do dia a dia (ex: "Enviar proposta amanhã às 14h com alta prioridade"); (2) No Dashboard, analisando prazos para indicar as maiores urgências do dia; e (3) Nos Projetos, quebrando metas complexas em listas ordenadas de tarefas acionáveis.',
    },
    {
      q: 'Como sincronizo os compromissos com meu Google Calendar ou Apple Calendar?',
      a: 'Na aba Calendário ou em Configurações, clique no botão "Exportar (.ics)". O arquivo gerado é o padrão universal da indústria (iCalendar) e pode ser importado com 1 clique no Google Agenda, iPhone ou Outlook.',
    },
    {
      q: 'Como instalar como aplicativo nativo no meu celular ou computador?',
      a: 'No Chrome ou Edge do computador, clique no ícone de computador/instalação na barra de endereços para abrir como app de desktop. No iPhone, abra no Safari, toque em Compartilhar e selecione "Adicionar à Tela de Início". No Android, toque no menu do Chrome e selecione "Instalar aplicativo".',
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 p-6 text-white shadow-xl sm:p-10 dark:border-indigo-950">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-200 backdrop-blur-md">
              <BookOpen className="h-3.5 w-3.5" />
              <span>Guia Oficial do Fluxo</span>
            </div>
            <span className="text-xs font-bold tracking-widest text-indigo-300 uppercase hidden sm:inline">
              Planeje • Organize • Conquiste
            </span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <FluxoIcon size={44} />
            <h1 className="text-2xl font-black tracking-tight sm:text-4xl">
              Como Tirar 100% de Proveito do Fluxo
            </h1>
          </div>

          <p className="text-sm leading-relaxed text-indigo-100/90 sm:text-base">
            O <strong>Fluxo</strong> foi desenhado para unir o melhor de <strong>Todoist</strong> (agilidade de captura),{' '}
            <strong>Trello</strong> (clareza visual Kanban), <strong>Google Calendar</strong> (compromisso de tempo),{' '}
            <strong>Notion</strong> (documentação flexível) e <strong>Inteligência Artificial (Gemini)</strong>.
          </p>

          {/* Quick Action Pills in Header */}
          <div className="flex flex-wrap items-center gap-2 pt-3">
            <button
              onClick={() => setIsQuickCaptureOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-indigo-900 shadow-md transition-transform hover:scale-105"
            >
              <Zap className="h-3.5 w-3.5 text-indigo-600" />
              <span>Testar Captura Rápida (Q)</span>
            </button>

            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-400/40 bg-indigo-800/40 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-sm hover:bg-indigo-700/50"
            >
              <Keyboard className="h-3.5 w-3.5" />
              <span>Busca Global (⌘K)</span>
            </button>

            <button
              onClick={() => setIsShortcutsOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-400/40 bg-indigo-800/40 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-sm hover:bg-indigo-700/50"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Mapa de Atalhos (?)</span>
            </button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="pointer-events-none absolute -right-12 -bottom-12 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute top-0 right-10 h-48 w-48 rounded-full bg-violet-400/10 blur-2xl" />
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-neutral-200 pb-2 dark:border-neutral-800">
        <button
          onClick={() => setActiveCategory('start')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-colors ${
            activeCategory === 'start'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
          }`}
        >
          <Play className="h-3.5 w-3.5" />
          <span>Comece Aqui (Passo a Passo)</span>
        </button>

        <button
          onClick={() => setActiveCategory('modules')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-colors ${
            activeCategory === 'modules'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
          }`}
        >
          <FolderKanban className="h-3.5 w-3.5" />
          <span>Módulos & Recursos</span>
        </button>

        <button
          onClick={() => setActiveCategory('workflows')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-colors ${
            activeCategory === 'workflows'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Rotinas & Fluxos Sugeridos</span>
        </button>

        <button
          onClick={() => setActiveCategory('shortcuts')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-colors ${
            activeCategory === 'shortcuts'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
          }`}
        >
          <Keyboard className="h-3.5 w-3.5" />
          <span>Atalhos de Teclado</span>
        </button>

        <button
          onClick={() => setActiveCategory('faq')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-colors ${
            activeCategory === 'faq'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
          }`}
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Perguntas Frequentes (FAQ)</span>
        </button>
      </div>

      {/* SECTION 1: START HERE */}
      {activeCategory === 'start' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-5 dark:border-neutral-800 dark:bg-neutral-900/40">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  O Segredo de um Dia Altamente Produtivo
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                  Não tente fazer tudo ao mesmo tempo. A Central foi desenhada em um ciclo simples: 
                  <strong> 1. Descarregue a mente na Inbox</strong> → <strong> 2. Faça Time Blocking na Agenda para proteger seu horário</strong> → 
                  <strong> 3. Entre em Modo Foco sem distrações</strong> → <strong> 4. Consolide hábitos e revise no fim do dia</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {startCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-indigo-800"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold tracking-wider uppercase text-neutral-400">
                        {card.step}
                      </span>
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                        {card.badge}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr ${card.color} text-white shadow-sm`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        {card.title}
                      </h4>
                    </div>

                    <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                      {card.desc}
                    </p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-neutral-100 dark:border-neutral-800/80">
                    <button
                      onClick={card.action}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-300"
                    >
                      <span>{card.actionLabel}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: ALL MODULES */}
      {activeCategory === 'modules' && (
        <div className="space-y-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Conheça a finalidade de cada aba e clique em "Abrir Módulo" para ir direto até ela.
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {modules.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.id}
                  className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                          <Icon className="h-4 w-4" />
                        </div>
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                          {m.name}
                        </h3>
                      </div>

                      <button
                        onClick={() => setActiveTab(m.tab)}
                        className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                      >
                        <span>Abrir</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>

                    <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                      {m.summary}
                    </p>

                    <ul className="space-y-1.5 pt-1">
                      {m.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3: WORKFLOWS */}
      {activeCategory === 'workflows' && (
        <div className="space-y-6">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Recomendações práticas de rotina testadas para manter clareza e alto rendimento sem sobrecarga mental.
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {workflows.map((wf, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5 dark:border-neutral-800">
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    {wf.title}
                  </h3>
                  <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-mono font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                    {wf.time}
                  </span>
                </div>

                <div className="space-y-2">
                  {wf.steps.map((st, sIdx) => (
                    <div key={sIdx} className="flex items-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-300">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
                        {sIdx + 1}
                      </div>
                      <p className="leading-relaxed">{st}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: KEYBOARD SHORTCUTS */}
      {activeCategory === 'shortcuts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Controle o ecossistema na velocidade do pensamento.
            </p>
            <button
              onClick={() => setIsShortcutsOpen(true)}
              className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Abrir Janela Flutuante de Atalhos (?)
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {shortcutsList.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                >
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    {item.desc}
                  </span>
                  <kbd className="rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-mono font-bold text-neutral-800 shadow-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                    {item.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: FAQ */}
      {activeCategory === 'faq' && (
        <div className="space-y-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Tire suas dúvidas sobre salvamento, exportação, inteligência artificial e instalação no celular.
          </p>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div
                  key={idx}
                  className="overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-colors dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="flex w-full items-center justify-between p-4 text-left font-semibold text-neutral-900 transition-colors hover:bg-neutral-50 dark:text-neutral-100 dark:hover:bg-neutral-800/40"
                  >
                    <span className="text-xs sm:text-sm">{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-neutral-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-neutral-400" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="border-t border-neutral-100 bg-neutral-50/50 p-4 text-xs leading-relaxed text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-300">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Clean Slate vs Sample Data helper block in Guide */}
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900/60 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Pronto para colocar suas tarefas reais em prática?
          </h3>
        </div>
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          Você pode iniciar com o espaço 100% limpo ou alternar de volta para os dados de exemplo quando desejar.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              if (window.confirm('Deseja iniciar seu espaço de trabalho pessoal do zero?')) {
                clearToCleanSlate();
                setActiveTab('dashboard');
              }
            }}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
          >
            Iniciar Meu Espaço Limpo (Começar do Zero)
          </button>

          <button
            onClick={() => {
              if (window.confirm('Deseja recarregar os dados de exemplo para demonstração?')) {
                resetToSampleData();
              }
            }}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Recarregar Exemplos</span>
          </button>
        </div>
      </div>
    </div>
  );
};
