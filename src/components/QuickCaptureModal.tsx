import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useFinance } from '../context/FinanceContext';
import { parseQuickTask } from '../utils/smartParser';
import { interpretLifeInput } from '../utils/lifeOSUtils';
import { formatDatePT } from '../utils/date';
import { formatBRL } from '../utils/financeUtils';
import {
  Sparkles,
  Calendar,
  Clock,
  Flag,
  Tag,
  FolderKanban,
  X,
  Plus,
  Inbox,
  Check,
  Loader2,
  DollarSign,
  Target,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { Priority } from '../types';

export const QuickCaptureModal: React.FC = () => {
  const {
    isQuickCaptureOpen,
    setIsQuickCaptureOpen,
    activeTab,
    addTask,
    addGoal,
    addEvent,
    aiParseAndCreateTask,
    projects,
    isAiLoading,
    showToast,
  } = useApp();

  const {
    addTransaction,
    addBill,
  } = useFinance();

  type CaptureType = 'auto' | 'task' | 'finance' | 'event' | 'goal';
  const [captureType, setCaptureType] = useState<CaptureType>('auto');
  const [input, setInput] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [saveToInbox, setSaveToInbox] = useState(false);
  const [useAi, setUseAi] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isQuickCaptureOpen) {
      setInput('');
      setSelectedProjectId('');
      setSaveToInbox(false);
      if (activeTab === 'finance') setCaptureType('finance');
      else if (activeTab === 'agenda' || activeTab === 'calendar') setCaptureType('event');
      else if (activeTab === 'goals') setCaptureType('goal');
      else if (activeTab === 'tasks') setCaptureType('task');
      else setCaptureType('auto');
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isQuickCaptureOpen, activeTab]);

  if (!isQuickCaptureOpen) return null;

  // Live heuristic multi-entity parser
  const liveParsed = parseQuickTask(input);
  const lifeParsed = interpretLifeInput(input);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Check if input is specialized finance / goal / bill
    if (captureType === 'event' && addEvent) {
      addEvent({
        title: liveParsed.title || input.trim(),
        startDate: liveParsed.dueDate || new Date().toISOString().slice(0, 10),
        startTime: liveParsed.dueTime || '09:00',
        endTime: '10:00',
        type: 'event',
      });
      showToast('Evento agendado');
    } else if (lifeParsed.type === 'finance' && lifeParsed.transaction && addTransaction) {
      addTransaction({
        amount: lifeParsed.transaction.amount || 0,
        type: lifeParsed.transaction.type || 'expense',
        description: lifeParsed.transaction.description || 'Despesa rápida',
        masterCategory: (lifeParsed.transaction.masterCategory as any) || 'conforto',
        subcategory: lifeParsed.transaction.subcategory || 'Geral',
        date: new Date().toISOString().slice(0, 10),
      });
      showToast(`Transação registrada: ${formatBRL(lifeParsed.transaction.amount || 0)}`);
    } else if (captureType === 'finance' && addTransaction && (!lifeParsed.transaction && !lifeParsed.bill)) {
      const numMatch = input.match(/\d+(?:[.,]\d+)?/);
      const amount = numMatch ? parseFloat(numMatch[0].replace(',', '.')) : 0;
      addTransaction({
        amount: amount || 0,
        type: 'expense',
        description: input.trim(),
        masterCategory: 'conforto',
        subcategory: 'Geral',
        date: new Date().toISOString().slice(0, 10),
      });
      showToast(`Despesa registrada: ${formatBRL(amount || 0)}`);
    } else if (lifeParsed.type === 'bill' && lifeParsed.bill && addBill) {
      const billTitle = lifeParsed.bill.title || 'Conta a pagar';
      const billAmount = lifeParsed.bill.amount || 0;
      const billDue = lifeParsed.bill.dueDate || new Date().toISOString().slice(0, 10);

      addBill({
        title: billTitle,
        amount: billAmount,
        dueDate: billDue,
        masterCategory: lifeParsed.bill.masterCategory || 'custos_fixos',
        status: 'pending',
        type: 'expense',
      });
      // Also add a task so it shows in today's or target day's tasks
      addTask({
        title: `Pagar ${billTitle} (${formatBRL(billAmount)})`,
        dueDate: billDue,
        priority: 'high',
        tags: ['finanças', 'contas'],
      });
      showToast(`Conta a pagar adicionada: ${billTitle}`);
    } else if (lifeParsed.type === 'goal' && lifeParsed.goal && addGoal) {
      addGoal({
        title: lifeParsed.goal.title || 'Nova Meta',
        targetValue: lifeParsed.goal.targetValue || 1000,
        currentValue: 0,
        deadline: lifeParsed.goal.deadline || '2027-12-31',
        period: 'yearly',
        category: 'financeira',
        unit: 'R$',
        linkedTaskIds: [],
        status: 'active',
      });
      showToast('Meta adicionada');
    } else if (captureType === 'goal' && addGoal) {
      addGoal({
        title: input.trim(),
        targetValue: 100,
        currentValue: 0,
        deadline: '2027-12-31',
        period: 'yearly',
        category: 'pessoal',
        unit: 'unidades',
        linkedTaskIds: [],
        status: 'active',
      });
      showToast('Meta criada');
    } else if (useAi && captureType === 'auto') {
      await aiParseAndCreateTask(input);
    } else {
      addTask({
        title: liveParsed.title,
        dueDate: liveParsed.dueDate,
        dueTime: liveParsed.dueTime,
        priority: liveParsed.priority,
        tags: liveParsed.tags,
        projectId: selectedProjectId || undefined,
        isInbox: saveToInbox,
      });
    }

    setIsQuickCaptureOpen(false);
  };

  const priorityColors: Record<Priority, string> = {
    urgent: 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900',
    high: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:border-orange-900',
    medium: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900',
    low: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900',
    none: 'text-neutral-500 bg-neutral-50 border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700',
  };

  const priorityLabels: Record<Priority, string> = {
    urgent: 'Urgente',
    high: 'Alta',
    medium: 'Média',
    low: 'Baixa',
    none: 'Sem prioridade',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-neutral-900/50 p-4 pt-20 backdrop-blur-sm sm:pt-28">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3.5 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Zap className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Captura Universal da Vida (Fluxo Life Ingest)
              </h2>
            </div>
          </div>
          <button
            onClick={() => setIsQuickCaptureOpen(false)}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5">
          {/* Quick Context Switcher (Princípio #9: Botão Universal de Criação) */}
          <div className="flex items-center gap-1.5 pb-3 overflow-x-auto">
            {[
              { id: 'auto', label: 'Inteligente', icon: Zap },
              { id: 'task', label: 'Tarefa', icon: Check },
              { id: 'finance', label: 'Finanças', icon: DollarSign },
              { id: 'event', label: 'Evento', icon: Calendar },
              { id: 'goal', label: 'Meta', icon: Target },
            ].map((pill) => {
              const IconComp = pill.icon;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setCaptureType(pill.id as CaptureType)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors ${
                    captureType === pill.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
                  }`}
                >
                  <IconComp className="h-3 w-3" />
                  <span>{pill.label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative">
            <textarea
              ref={textareaRef}
              rows={3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                captureType === 'finance'
                  ? 'Ex: "Gastei 45 no almoço", "Pagar internet 120 dia 15", "Recebi 1500 freelance"...'
                  : captureType === 'task'
                  ? 'Ex: "Revisar apresentação amanhã às 14h #trabalho !urgente"...'
                  : captureType === 'event'
                  ? 'Ex: "Reunião de alinhamento amanhã às 15h"...'
                  : captureType === 'goal'
                  ? 'Ex: "Juntar 10000 para reserva até dezembro"...'
                  : 'Digite qualquer coisa: "Gastei 42 no Uber", "Pagar luz dia 10", "Terminar relatório amanhã"...'
              }
              className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50/70 p-3.5 text-sm text-neutral-900 placeholder-neutral-400 focus:border-indigo-500 focus:outline-none dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-neutral-100 dark:focus:border-indigo-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSubmit(e);
                }
              }}
            />
          </div>

          {/* Smart preview badges */}
          {input.trim() && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-neutral-100 bg-neutral-50/80 p-3 text-xs dark:border-neutral-800 dark:bg-neutral-800/30">
              <span className="text-[11px] font-semibold text-neutral-400">Interpretação:</span>

              {lifeParsed.type === 'finance' && lifeParsed.transaction && (
                <span className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <DollarSign className="h-3 w-3 text-emerald-600" />
                  Transação: {formatBRL(lifeParsed.transaction.amount || 0)} ({lifeParsed.transaction.description})
                </span>
              )}

              {lifeParsed.type === 'bill' && lifeParsed.bill && (
                <span className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  <DollarSign className="h-3 w-3 text-amber-600" />
                  Conta a Pagar: {formatBRL(lifeParsed.bill.amount || 0)} (Venc. {formatDatePT(lifeParsed.bill.dueDate || '', 'relative')})
                </span>
              )}

              {lifeParsed.type === 'goal' && lifeParsed.goal && (
                <span className="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2 py-1 font-semibold text-purple-800 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                  <Target className="h-3 w-3 text-purple-600" />
                  Meta de Longo Prazo: {lifeParsed.goal.title} ({formatBRL(lifeParsed.goal.targetValue || 0)})
                </span>
              )}

              {liveParsed.dueDate && (
                <span className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2 py-1 font-medium text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                  <Calendar className="h-3 w-3 text-indigo-500" />
                  {formatDatePT(liveParsed.dueDate, 'relative')}
                </span>
              )}

              {liveParsed.dueTime && (
                <span className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2 py-1 font-medium text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                  <Clock className="h-3 w-3 text-indigo-500" />
                  {liveParsed.dueTime}
                </span>
              )}

              {liveParsed.priority !== 'none' && (
                <span
                  className={`flex items-center gap-1 rounded-lg border px-2 py-1 font-medium ${
                    priorityColors[liveParsed.priority]
                  }`}
                >
                  <Flag className="h-3 w-3" />
                  {priorityLabels[liveParsed.priority]}
                </span>
              )}
            </div>
          )}

          {/* Options Bar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex flex-wrap items-center gap-2">
              {/* Project selector */}
              <div className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs dark:border-neutral-800 dark:bg-neutral-800">
                <FolderKanban className="h-3.5 w-3.5 text-neutral-400" />
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="bg-transparent text-xs text-neutral-700 outline-none dark:text-neutral-300"
                >
                  <option value="">Sem projeto</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Inbox toggle */}
              <button
                type="button"
                onClick={() => setSaveToInbox(!saveToInbox)}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                  saveToInbox
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-400'
                }`}
              >
                <Inbox className="h-3.5 w-3.5" />
                <span>Inbox</span>
                {saveToInbox && <Check className="h-3 w-3" />}
              </button>

              {/* AI Parser Switch */}
              <button
                type="button"
                onClick={() => setUseAi(!useAi)}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                  useAi
                    ? 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300'
                    : 'border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-400'
                }`}
                title="Processar detalhes com IA Gemini"
              >
                <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                <span>IA Gemini</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsQuickCaptureOpen(false)}
                className="rounded-xl px-3.5 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!input.trim() || isAiLoading}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/25 transition-all hover:bg-indigo-700 disabled:opacity-50"
              >
                {isAiLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    <span>Processar & Ingerir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

