import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useFinance } from '../../context/FinanceContext';
import { WhatsAppMessage } from '../../types';
import {
  Send,
  Sparkles,
  Smartphone,
  QrCode,
  CheckCheck,
  Zap,
  RotateCcw,
  Check,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Copy,
  Info,
  ChevronRight,
  Terminal,
} from 'lucide-react';

export const WhatsAppView: React.FC = () => {
  const {
    tasks,
    projects,
    events,
    goals,
    habits,
    addTask,
    setActiveTab,
  } = useApp();

  const {
    addTransaction,
    zeroBasedBudget,
    bills,
    accounts,
  } = useFinance();

  const [messages, setMessages] = useState<WhatsAppMessage[]>([
    {
      id: 'wa_1',
      sender: 'bot',
      text: 'Olá! Sou o assistente do *Fluxo* no seu WhatsApp. 🤖✨\n\nVocê pode me mandar mensagens de texto ou áudio a qualquer momento:\n• Registrar gastos ("Gastei 42 reais no Uber")\n• Agendar tarefas ("Cria uma tarefa para terminar o site sexta")\n• Consultar finanças ("Quanto posso gastar esse mês?")\n• Ver seu dia ("O que eu preciso fazer hoje?")\n• Ou perguntar *"Como está minha vida?"*\n\nComo posso te ajudar agora?',
      timestamp: '08:00',
      status: 'read',
      quickReplies: [
        'O que eu preciso fazer hoje?',
        'Gastei 42 reais no Uber',
        'Quanto posso gastar esse mês?',
        'Cria uma tarefa para terminar o site sexta',
        'Como está minha vida?',
      ],
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    setInputText('');

    const userMsgTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const userMsg: WhatsAppMessage = {
      id: `wa_usr_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: userMsgTime,
      status: 'read',
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/integrations/whatsapp/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          systemContext: {
            tasks,
            projects,
            events,
            bills,
            goals,
            habits,
            budget: zeroBasedBudget,
          },
        }),
      });

      const data = await response.json();
      const botMsgTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      // Execute returned actions into the app state
      if (Array.isArray(data.actions)) {
        for (const act of data.actions) {
          if (act.type === 'create_task' && act.data) {
            addTask({
              title: act.data.title || 'Nova tarefa via WhatsApp',
              dueDate: act.data.dueDate,
              priority: act.data.priority || 'medium',
              tags: act.data.tags || ['whatsapp'],
            });
          } else if (act.type === 'create_transaction' && act.data && addTransaction) {
            addTransaction({
              amount: act.data.amount || 0,
              type: act.data.type || 'expense',
              description: act.data.description || 'Transação WhatsApp',
              masterCategory: act.data.masterCategory || 'conforto',
              subcategory: act.data.subcategory || 'Outros',
              date: new Date().toISOString().slice(0, 10),
            });
          }
        }
      }

      const botMsg: WhatsAppMessage = {
        id: `wa_bot_${Date.now()}`,
        sender: 'bot',
        text: data.reply || 'Comando registrado com sucesso no Fluxo.',
        timestamp: botMsgTime,
        status: 'read',
        actionsExecuted: data.actions || [],
        quickReplies: data.quickReplies || ['O que eu preciso fazer hoje?', 'Como estão minhas finanças?'],
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('WhatsApp send error:', err);
      const botMsg: WhatsAppMessage = {
        id: `wa_bot_${Date.now()}`,
        sender: 'bot',
        text: 'Desculpe, ocorreu uma oscilação na conexão com a inteligência do Fluxo. Tente novamente.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status: 'read',
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(
      'https://ais-dev-psixgtqv5cysy2wf5vcrfv-191371251739.us-east1.run.app/api/integrations/whatsapp/webhook'
    );
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const sampleQuickPrompts = [
    'Gastei 42 reais no Uber',
    'Cria uma tarefa para terminar o site sexta',
    'O que eu preciso fazer hoje?',
    'Quanto posso gastar esse mês?',
    'Quais contas vencem essa semana?',
    'Quanto falta para minha meta do carro?',
    'Como está minha vida?',
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-950">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white font-bold shadow-md">
              💬
            </span>
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-neutral-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                WhatsApp • Interface de Comando do Fluxo
              </h2>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Online (+55 11 98765-4321)
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Conectado ao seu Sistema Operacional • Envie comandos e áudios naturalmente
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
          >
            <Smartphone className="h-3.5 w-3.5 text-emerald-600" />
            {showConfig ? 'Ocultar Detalhes da Conexão' : 'Configurações do Webhook'}
          </button>
        </div>
      </div>

      {/* Integration details drawer */}
      {showConfig && (
        <div className="border-b border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-800/50">
              <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <QrCode className="h-4 w-4 text-emerald-600" /> Pareamento WhatsApp Business
              </span>
              <p className="mt-1 text-[11px] text-neutral-500">
                Instância conectada via Meta Cloud API / WhatsApp Bridge. Mensagens enviadas para o número virtual são interpretadas pelo Fluxo AI.
              </p>
              <div className="mt-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                Status: Pareado & Ativo
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-800/50">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <Terminal className="h-4 w-4 text-indigo-600" /> Webhook URL (Meta)
                </span>
                <button
                  onClick={handleCopyWebhook}
                  className="flex items-center gap-1 text-[11px] text-indigo-600 hover:underline"
                >
                  {copiedWebhook ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedWebhook ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <p className="mt-1 font-mono text-[10px] break-all text-neutral-500">
                /api/integrations/whatsapp/webhook
              </p>
              <span className="mt-1 inline-block text-[10px] text-neutral-400">
                Token de Verificação: <code>fluxo_webhook_token</code>
              </span>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-800/50">
              <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-purple-600" /> Princípio de Uma Única Informação
              </span>
              <p className="mt-1 text-[11px] text-neutral-500">
                Qualquer dado enviado por WhatsApp desdobra automaticamente em Tarefas, Finanças AUVP, Agenda e Metas sem necessidade de recadastros.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Chat Canvas */}
      <div className="flex flex-1 flex-col overflow-hidden bg-[#e5ddd5]/30 dark:bg-[#0b141a]/60">
        {/* Messages Stream */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto my-2 max-w-xs rounded-lg bg-neutral-200/80 px-3 py-1 text-center text-[11px] text-neutral-600 backdrop-blur-sm dark:bg-neutral-800/80 dark:text-neutral-400">
            🔒 As mensagens enviadas aqui alimentam diretamente o banco de dados do seu Fluxo.
          </div>

          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`relative max-w-lg rounded-2xl p-4 shadow-sm ${
                    isUser
                      ? 'rounded-tr-none bg-emerald-600 text-white'
                      : 'rounded-tl-none border border-neutral-200 bg-white text-neutral-900 dark:border-neutral-800 dark:bg-[#202c33] dark:text-neutral-100'
                  }`}
                >
                  {/* Message body with basic bold formatter */}
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {msg.text.split('\n').map((line, lIdx) => (
                      <p key={lIdx} className={line.startsWith('•') ? 'ml-2' : ''}>
                        {line}
                      </p>
                    ))}
                  </div>

                  {/* Actions executed badges */}
                  {msg.actionsExecuted && msg.actionsExecuted.length > 0 && (
                    <div className="mt-3 space-y-1.5 border-t border-neutral-100 pt-2 dark:border-neutral-700/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        ⚡ Ações Executadas no Sistema:
                      </span>
                      {msg.actionsExecuted.map((act, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{act.summary}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Time & Ticks */}
                  <div
                    className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                      isUser ? 'text-emerald-200' : 'text-neutral-400'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {isUser && <CheckCheck className="h-3.5 w-3.5 text-emerald-200" />}
                  </div>
                </div>

                {/* Quick Reply Pills */}
                {!isUser && msg.quickReplies && msg.quickReplies.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {msg.quickReplies.map((reply, rIdx) => (
                      <button
                        key={rIdx}
                        onClick={() => handleSendMessage(reply)}
                        className="rounded-full border border-emerald-300 bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-sm transition-all hover:bg-emerald-50 dark:border-emerald-800 dark:bg-neutral-900/90 dark:text-emerald-300 dark:hover:bg-neutral-800"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-start">
              <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-none border border-neutral-200 bg-white px-4 py-3 shadow-sm dark:border-neutral-800 dark:bg-[#202c33]">
                <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-600" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-600 [animation-delay:0.2s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-600 [animation-delay:0.4s]" />
                <span className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">
                  Fluxo AI está digitando...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Carousel */}
        <div className="border-t border-neutral-200 bg-white/70 px-4 py-2 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/70">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs whitespace-nowrap">
            <span className="text-[11px] font-bold text-neutral-400">Atalhos rápidos:</span>
            {sampleQuickPrompts.map((prompt, pIdx) => (
              <button
                key={pIdx}
                onClick={() => handleSendMessage(prompt)}
                className="rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="border-t border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-800 dark:bg-[#202c33]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Digite uma mensagem como se estivesse no WhatsApp..."
              className="flex-1 rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-neutral-700 dark:bg-[#2a3942] dark:text-white dark:placeholder-neutral-400"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
