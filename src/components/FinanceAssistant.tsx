import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  Check,
  ChevronRight,
  Loader2,
  MessageCircleMore,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { answerFinanceQuestion, assistantFormatting, buildFinanceAssistantWelcome } from '../domain/financeAssistant';
import {
  clearFinanceAssistantMessages,
  loadFinanceAssistantMessages,
  saveFinanceAssistantMessage,
  updateFinanceAssistantMessageMetadata,
} from '../lib/financeAssistantStore';
import type { FinanceAssistantMessage, FinanceAssistantSnapshot } from '../types/assistant';
import { getTodayDateString } from '../utils/date';

interface FinanceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const nowIso = () => new Date().toISOString();

const createMessage = (
  role: FinanceAssistantMessage['role'],
  content: string,
  metadata?: FinanceAssistantMessage['metadata'],
): FinanceAssistantMessage => ({
  id: crypto.randomUUID(),
  role,
  content,
  metadata,
  createdAt: nowIso(),
});

const RichText = ({ text }: { text: string }) => (
  <div className="whitespace-pre-wrap leading-relaxed">
    {text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => part.startsWith('**') && part.endsWith('**')
      ? <strong key={`${part}-${index}`} className="font-black">{part.slice(2, -2)}</strong>
      : <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>)}
  </div>
);

export const FinanceAssistant: React.FC<FinanceAssistantProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const finance = useFinance();
  const [messages, setMessages] = useState<FinanceAssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [historyConnected, setHistoryConnected] = useState(true);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [processingActionId, setProcessingActionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentMonth = getTodayDateString().slice(0, 7);
  const currentBudget = finance.monthlyBudgets.find((item) => item.month === currentMonth)
    || finance.budget;

  const snapshot = useMemo<FinanceAssistantSnapshot>(() => ({
    currentMonth,
    accounts: finance.accounts,
    transactions: finance.transactions,
    bills: finance.bills,
    debts: finance.debts,
    goals: finance.goals,
    investments: finance.investments,
    budgets: finance.monthlyBudgets,
    currentBudget,
    emergencyFund: finance.emergencyFund,
    monthIncome: finance.monthIncome,
    monthExpenses: finance.monthExpenses,
    monthInvestments: finance.monthInvestments,
    monthDebtsPaid: finance.monthDebtsPaid,
    availableCash: finance.availableCash,
    monthlyEssentialCosts: finance.monthlyEssentialCosts,
    savingsRate: finance.savingsRate,
    netWorth: finance.netWorthSummary.netWorth,
  }), [
    currentMonth,
    currentBudget,
    finance.accounts,
    finance.availableCash,
    finance.bills,
    finance.debts,
    finance.emergencyFund,
    finance.goals,
    finance.investments,
    finance.monthDebtsPaid,
    finance.monthExpenses,
    finance.monthIncome,
    finance.monthInvestments,
    finance.monthlyBudgets,
    finance.monthlyEssentialCosts,
    finance.netWorthSummary.netWorth,
    finance.savingsRate,
    finance.transactions,
  ]);

  const firstName = String(user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'você').split(' ')[0];

  const welcomeMessage = useMemo(() => {
    const reply = buildFinanceAssistantWelcome(snapshot, firstName);
    return createMessage('assistant', reply.content, reply.metadata);
  }, [firstName, snapshot]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 150);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
      window.clearTimeout(focusTimer);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !user || loadedUserId === user.id) return;
    let cancelled = false;
    setIsLoadingHistory(true);
    loadFinanceAssistantMessages(user.id)
      .then((storedMessages) => {
        if (cancelled) return;
        setMessages(storedMessages.length ? storedMessages : [welcomeMessage]);
        setHistoryConnected(true);
        setLoadedUserId(user.id);
      })
      .catch((error) => {
        console.error('Could not load Fluxo IA history:', error);
        if (cancelled) return;
        setMessages([welcomeMessage]);
        setHistoryConnected(false);
        setLoadedUserId(user.id);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingHistory(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, loadedUserId, user, welcomeMessage]);

  useEffect(() => {
    if (!isOpen) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [isOpen, messages, isResponding]);

  const persistMessage = async (message: FinanceAssistantMessage) => {
    if (!user) return;
    try {
      await saveFinanceAssistantMessage(user.id, message);
      setHistoryConnected(true);
    } catch (error) {
      console.error('Could not save Fluxo IA message:', error);
      setHistoryConnected(false);
    }
  };

  const sendQuestion = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isResponding) return;

    const userMessage = createMessage('user', trimmed);
    setMessages((current) => [...current, userMessage]);
    setInput('');
    setIsResponding(true);
    await persistMessage(userMessage);

    const reply = answerFinanceQuestion(trimmed, snapshot);
    const assistantMessage = createMessage('assistant', reply.content, reply.metadata);
    setMessages((current) => [...current, assistantMessage]);
    await persistMessage(assistantMessage);
    setIsResponding(false);
  };

  const appendAssistantMessage = async (content: string, suggestions?: string[]) => {
    const message = createMessage('assistant', content, suggestions ? { suggestions } : undefined);
    setMessages((current) => [...current, message]);
    await persistMessage(message);
  };

  const updateActionStatus = async (
    message: FinanceAssistantMessage,
    status: 'confirmed' | 'cancelled',
  ) => {
    if (!message.metadata?.action || !user) return;
    const metadata = {
      ...message.metadata,
      action: { ...message.metadata.action, status },
    };
    setMessages((current) => current.map((item) => item.id === message.id ? { ...item, metadata } : item));
    try {
      await updateFinanceAssistantMessageMetadata(user.id, message.id, metadata);
      setHistoryConnected(true);
    } catch (error) {
      console.error('Could not update Fluxo IA action:', error);
      setHistoryConnected(false);
    }
  };

  const confirmTransaction = async (message: FinanceAssistantMessage) => {
    const action = message.metadata?.action;
    if (!action || action.status !== 'pending') return;
    if (!action.transaction.accountId) {
      await appendAssistantMessage('Cadastre uma conta ativa antes de confirmar o lançamento. Abri a área de contas para você.');
      openFinanceArea('accounts');
      return;
    }

    setProcessingActionId(message.id);
    try {
      finance.addTransaction({
        ...action.transaction,
        date: getTodayDateString(),
        tags: ['fluxo-ia'],
      });
      await updateActionStatus(message, 'confirmed');
      await appendAssistantMessage(`Pronto. Registrei **${action.transaction.description}** no valor de **${assistantFormatting.currency.format(action.transaction.amount)}**.`, ['Quanto ainda posso gastar?', 'Ver meus lançamentos']);
    } catch (error) {
      console.error('Could not confirm Fluxo IA transaction:', error);
      await appendAssistantMessage('Não consegui registrar esse lançamento. Revise a conta selecionada e tente novamente.');
    } finally {
      setProcessingActionId(null);
    }
  };

  const cancelTransaction = async (message: FinanceAssistantMessage) => {
    await updateActionStatus(message, 'cancelled');
    await appendAssistantMessage('Tudo bem. O lançamento foi cancelado e nenhum valor foi alterado.');
  };

  const openFinanceArea = (route: NonNullable<FinanceAssistantMessage['metadata']>['route']) => {
    if (!route) return;
    finance.setSubTab(route);
    onClose();
  };

  const clearHistory = async () => {
    if (!user || !window.confirm('Limpar todo o histórico do Fluxo IA?')) return;
    try {
      await clearFinanceAssistantMessages(user.id);
      setMessages([welcomeMessage]);
      setHistoryConnected(true);
    } catch (error) {
      console.error('Could not clear Fluxo IA history:', error);
      setHistoryConnected(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-neutral-950/55 backdrop-blur-sm" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="fluxo-assistant-title"
        className="flex h-[100dvh] w-full flex-col overflow-hidden bg-neutral-50 shadow-2xl md:max-w-[500px] md:border-l md:border-neutral-200 dark:bg-neutral-950 dark:md:border-neutral-800"
      >
        <header className="relative overflow-hidden border-b border-indigo-400/20 bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] text-white sm:px-5">
          <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/15 shadow-inner">
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 id="fluxo-assistant-title" className="text-lg font-black">Fluxo IA</h2>
                  <span className="rounded-full bg-emerald-300/20 px-2 py-0.5 text-[11px] font-bold text-emerald-100">Seus dados</span>
                </div>
                <p className="mt-0.5 text-sm text-indigo-100">Converse com sua vida financeira.</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button onClick={clearHistory} className="rounded-xl p-2 text-indigo-100 hover:bg-white/10 hover:text-white" aria-label="Limpar histórico do Fluxo IA" title="Limpar histórico">
                <Trash2 className="h-4 w-4" />
              </button>
              <button onClick={onClose} className="rounded-xl p-2 text-indigo-100 hover:bg-white/10 hover:text-white" aria-label="Fechar Fluxo IA">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="relative mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-xs text-indigo-100">
            <span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${historyConnected ? 'bg-emerald-300' : 'bg-amber-300'}`} />{historyConnected ? 'Histórico protegido e sincronizado' : 'Conversa disponível; histórico pendente'}</span>
            <span className="font-semibold">Leitura segura</span>
          </div>
        </header>

        <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:px-5" aria-live="polite">
          {isLoadingHistory ? (
            <div className="grid min-h-56 place-items-center text-sm font-semibold text-neutral-500">
              <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Carregando sua conversa...</span>
            </div>
          ) : messages.map((message) => {
            const isAssistant = message.role === 'assistant';
            const action = message.metadata?.action;
            return (
              <article key={message.id} className={`flex gap-2.5 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
                {isAssistant ? <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white"><Bot className="h-4 w-4" /></span> : null}
                <div className={`max-w-[86%] space-y-3 rounded-2xl px-4 py-3 text-sm shadow-sm ${isAssistant ? 'rounded-tl-md border border-neutral-200 bg-white text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100' : 'rounded-tr-md bg-indigo-600 text-white'}`}>
                  <RichText text={message.content} />

                  {action ? (
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/70">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wide text-neutral-500">Confirmação necessária</span>
                          <strong className="mt-1 block text-base">{assistantFormatting.currency.format(action.transaction.amount)}</strong>
                          <span className="text-xs text-neutral-500">{action.transaction.type === 'income' ? 'Entrada' : assistantFormatting.categoryNames[action.transaction.masterCategory]}</span>
                        </div>
                        {action.status !== 'pending' ? <span className={`rounded-full px-2 py-1 text-xs font-bold ${action.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-700'}`}>{action.status === 'confirmed' ? 'Registrado' : 'Cancelado'}</span> : null}
                      </div>
                      {action.status === 'pending' ? (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button onClick={() => cancelTransaction(message)} className="min-h-11 rounded-xl border border-neutral-300 px-3 text-sm font-bold hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-700">Cancelar</button>
                          <button onClick={() => confirmTransaction(message)} disabled={processingActionId === message.id} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-60">
                            {processingActionId === message.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Confirmar
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {message.metadata?.route ? (
                    <button onClick={() => openFinanceArea(message.metadata?.route)} className="flex min-h-10 w-full items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-sm font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300">
                      {message.metadata.routeLabel || 'Abrir no Fluxo'}<ChevronRight className="h-4 w-4" />
                    </button>
                  ) : null}

                  {isAssistant && message.metadata?.suggestions?.length ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {message.metadata.suggestions.slice(0, 4).map((suggestion) => (
                        <button key={suggestion} onClick={() => sendQuestion(suggestion)} disabled={isResponding} className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-2 text-left text-xs font-bold text-indigo-700 hover:border-indigo-400 hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300">
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}

          {isResponding ? (
            <div className="flex items-center gap-2.5 text-sm text-neutral-500">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-600 text-white"><Bot className="h-4 w-4" /></span>
              <span className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900"><Loader2 className="h-4 w-4 animate-spin" />Analisando seus números...</span>
            </div>
          ) : null}
        </div>

        <footer className="border-t border-neutral-200 bg-white p-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] dark:border-neutral-800 dark:bg-neutral-900 sm:p-4">
          <form onSubmit={(event) => { event.preventDefault(); sendQuestion(input); }} className="flex items-end gap-2 rounded-2xl border border-neutral-300 bg-neutral-50 p-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/15 dark:border-neutral-700 dark:bg-neutral-950">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  sendQuestion(input);
                }
              }}
              maxLength={600}
              rows={1}
              placeholder="Pergunte sobre seu dinheiro..."
              aria-label="Mensagem para o Fluxo IA"
              className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-base outline-none placeholder:text-neutral-400"
            />
            <button type="submit" disabled={!input.trim() || isResponding} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Enviar mensagem">
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-neutral-500"><MessageCircleMore className="h-3.5 w-3.5" />Respostas baseadas nos dados registrados. Revise decisões importantes.</p>
        </footer>
      </section>
    </div>
  );
};
