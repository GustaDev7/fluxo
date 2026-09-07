import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Inbox,
  Sparkles,
  Plus,
  Calendar,
  FolderKanban,
  Flag,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { getTodayDateString, getTomorrowDateString } from '../../utils/date';
import { Priority } from '../../types';

export const InboxView: React.FC = () => {
  const {
    tasks,
    projects,
    addTask,
    convertInboxTask,
    deleteTask,
    setSelectedTaskId,
    aiParseAndCreateTask,
    isAiLoading,
  } = useApp();

  const [inputText, setInputText] = useState('');

  const inboxTasks = tasks.filter((t) => t.isInbox && t.status !== 'done');

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    addTask({
      title: inputText.trim(),
      isInbox: true,
      status: 'todo',
    });
    setInputText('');
  };

  const handleAiCapture = async () => {
    if (!inputText.trim()) return;
    await aiParseAndCreateTask(inputText);
    setInputText('');
  };

  const handleQuickSchedule = (taskId: string, dateOption: 'today' | 'tomorrow' | 'nextWeek') => {
    let targetDate = getTodayDateString();
    if (dateOption === 'tomorrow') {
      targetDate = getTomorrowDateString();
    } else if (dateOption === 'nextWeek') {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      targetDate = d.toISOString().split('T')[0];
    }

    convertInboxTask(taskId, {
      dueDate: targetDate,
      isInbox: false,
      status: 'todo',
    });
  };

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Inbox className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
              Inbox / Caixa de Entrada
            </h1>
          </div>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Descarregue pensamentos, ideias e demandas brutas rapidamente para processar e planejar depois.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300">
            {inboxTasks.length} {inboxTasks.length === 1 ? 'item pendente' : 'itens pendentes'}
          </span>
        </div>
      </div>

      {/* Quick Input Bar */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <form onSubmit={handleQuickAdd} className="space-y-3">
          <textarea
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="O que está na sua cabeça agora? Digite uma ideia, demanda ou lembrete..."
            className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50/60 p-3 text-sm text-neutral-900 placeholder-neutral-400 focus:border-indigo-500 focus:outline-none dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-neutral-100"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleQuickAdd(e);
              }
            }}
          />

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleAiCapture}
              disabled={!inputText.trim() || isAiLoading}
              className="flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-50 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300"
              title="Organizar automaticamente com IA Gemini"
            >
              <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
              <span>{isAiLoading ? 'Processando...' : 'Organizar com IA'}</span>
            </button>

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              <span>Salvar na Inbox</span>
            </button>
          </div>
        </form>
      </div>

      {/* Inbox List */}
      <div className="space-y-3">
        {inboxTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 p-12 text-center dark:border-neutral-800">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-neutral-900 dark:text-neutral-100">Inbox Zero!</h3>
            <p className="mt-1 text-xs text-neutral-500 max-w-sm mx-auto">
              Todas as demandas da sua caixa de entrada já foram triadas, organizadas ou concluídas.
            </p>
          </div>
        ) : (
          inboxTasks.map((task) => (
            <div
              key={task.id}
              className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3
                    onClick={() => setSelectedTaskId(task.id)}
                    className="text-sm font-bold text-neutral-900 hover:text-indigo-600 cursor-pointer dark:text-neutral-100 dark:hover:text-indigo-400"
                  >
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="mt-1 text-xs text-neutral-500 line-clamp-2">{task.description}</p>
                  )}
                  <span className="mt-1.5 inline-block text-[10px] text-neutral-400">
                    Capturado em {task.createdAt}
                  </span>
                </div>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="rounded-lg p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                  title="Descartar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Quick Action Tools to triage/process the inbox item */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Assign Project */}
                  <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-800">
                    <FolderKanban className="h-3 w-3 text-neutral-400" />
                    <select
                      value={task.projectId || ''}
                      onChange={(e) =>
                        convertInboxTask(task.id, {
                          projectId: e.target.value || undefined,
                          isInbox: false,
                        })
                      }
                      className="bg-transparent text-xs text-neutral-700 outline-none dark:text-neutral-300"
                    >
                      <option value="">Atribuir Projeto...</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Assign Priority */}
                  <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-800">
                    <Flag className="h-3 w-3 text-neutral-400" />
                    <select
                      value={task.priority}
                      onChange={(e) =>
                        convertInboxTask(task.id, {
                          priority: e.target.value as Priority,
                        })
                      }
                      className="bg-transparent text-xs text-neutral-700 outline-none dark:text-neutral-300"
                    >
                      <option value="none">Prioridade...</option>
                      <option value="urgent">Urgente</option>
                      <option value="high">Alta</option>
                      <option value="medium">Média</option>
                      <option value="low">Baixa</option>
                    </select>
                  </div>
                </div>

                {/* Quick Schedule buttons */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold uppercase text-neutral-400">Agendar:</span>
                  <button
                    onClick={() => handleQuickSchedule(task.id, 'today')}
                    className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300"
                  >
                    Hoje
                  </button>
                  <button
                    onClick={() => handleQuickSchedule(task.id, 'tomorrow')}
                    className="rounded-lg bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
                  >
                    Amanhã
                  </button>
                  <button
                    onClick={() => handleQuickSchedule(task.id, 'nextWeek')}
                    className="rounded-lg bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
                  >
                    +7 dias
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
