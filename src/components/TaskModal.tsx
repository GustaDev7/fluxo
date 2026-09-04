import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Calendar,
  Clock,
  Flag,
  FolderKanban,
  Tag,
  CheckSquare,
  ListTodo,
  Link2,
  Bell,
  Repeat,
  MessageSquare,
  Paperclip,
  Trash2,
  Play,
  CheckCircle2,
  Circle,
  Plus,
  User,
} from 'lucide-react';
import { Priority, TaskStatus, TaskReminder, TaskRecurrence } from '../types';

export const TaskModal: React.FC = () => {
  const {
    selectedTaskId,
    setSelectedTaskId,
    tasks,
    updateTask,
    deleteTask,
    projects,
    toggleChecklistItem,
    toggleSubtask,
    addCommentToTask,
    startFocusTimer,
  } = useApp();

  const task = tasks.find((t) => t.id === selectedTaskId);

  const [newChecklistText, setNewChecklistText] = useState('');
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [newTagInput, setNewTagInput] = useState('');

  if (!selectedTaskId || !task) return null;

  const handleStatusChange = (status: TaskStatus) => {
    updateTask(task.id, { status });
  };

  const handlePriorityChange = (priority: Priority) => {
    updateTask(task.id, { priority });
  };

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    const newItem = {
      id: `chk_${Date.now()}`,
      title: newChecklistText.trim(),
      completed: false,
    };
    updateTask(task.id, { checklist: [...task.checklist, newItem] });
    setNewChecklistText('');
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;
    const newSub = {
      id: `sub_${Date.now()}`,
      title: newSubtaskText.trim(),
      completed: false,
    };
    updateTask(task.id, { subtasks: [...task.subtasks, newSub] });
    setNewSubtaskText('');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    addCommentToTask(task.id, newCommentText.trim());
    setNewCommentText('');
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      const cleanTag = newTagInput.trim().replace(/^#/, '').toLowerCase();
      if (!task.tags.includes(cleanTag)) {
        updateTask(task.id, { tags: [...task.tags, cleanTag] });
      }
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updateTask(task.id, { tags: task.tags.filter((t) => t !== tagToRemove) });
  };

  const handleAddReminder = (type: TaskReminder['type']) => {
    const newRem: TaskReminder = { id: `rem_${Date.now()}`, type };
    updateTask(task.id, { reminders: [...task.reminders, newRem] });
  };

  const handleRemoveReminder = (id: string) => {
    updateTask(task.id, { reminders: task.reminders.filter((r) => r.id !== id) });
  };

  const reminderLabels: Record<TaskReminder['type'], string> = {
    on_time: 'No horário exato',
    '5m': '5 minutos antes',
    '15m': '15 minutos antes',
    '30m': '30 minutos antes',
    '1h': '1 hora antes',
    '1d': '1 dia antes',
    custom: 'Personalizado',
  };

  const priorityOptions: { value: Priority; label: string; color: string }[] = [
    { value: 'urgent', label: 'Urgente', color: 'text-rose-600 dark:text-rose-400' },
    { value: 'high', label: 'Alta', color: 'text-orange-600 dark:text-orange-400' },
    { value: 'medium', label: 'Média', color: 'text-amber-600 dark:text-amber-400' },
    { value: 'low', label: 'Baixa', color: 'text-blue-600 dark:text-blue-400' },
    { value: 'none', label: 'Sem prioridade', color: 'text-neutral-500' },
  ];

  const statusOptions: { value: TaskStatus; label: string }[] = [
    { value: 'backlog', label: 'Backlog' },
    { value: 'todo', label: 'A Fazer' },
    { value: 'in_progress', label: 'Em Andamento' },
    { value: 'in_review', label: 'Em Revisão' },
    { value: 'done', label: 'Concluído' },
  ];

  const recurrenceOptions: { value: TaskRecurrence['type']; label: string }[] = [
    { value: 'none', label: 'Sem recorrência' },
    { value: 'daily', label: 'Todos os dias' },
    { value: 'weekdays', label: 'Segunda a Sexta' },
    { value: 'weekly', label: 'Semanalmente' },
    { value: 'biweekly', label: 'A cada 15 dias' },
    { value: 'monthly', label: 'Mensalmente' },
    { value: 'yearly', label: 'Anualmente' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-3 sm:p-6 backdrop-blur-sm overflow-y-auto">
      <div className="relative my-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleStatusChange(task.status === 'done' ? 'todo' : 'done')}
              className="text-neutral-400 hover:text-emerald-600 transition-colors"
              title={task.status === 'done' ? 'Marcar como pendente' : 'Concluir tarefa'}
            >
              {task.status === 'done' ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              ) : (
                <Circle className="h-6 w-6" />
              )}
            </button>

            <select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
              className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-semibold text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => startFocusTimer(task.id, task.title, 25)}
              className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300"
              title="Iniciar Pomodoro para esta tarefa"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>Iniciar Foco</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => deleteTask(task.id)}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
              title="Excluir tarefa"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSelectedTaskId(null)}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-6">
          {/* Title and Description */}
          <div className="space-y-3">
            <input
              type="text"
              value={task.title}
              onChange={(e) => updateTask(task.id, { title: e.target.value })}
              className="w-full bg-transparent text-xl font-bold text-neutral-900 focus:outline-none dark:text-neutral-100"
              placeholder="Título da tarefa..."
            />
            <textarea
              rows={3}
              value={task.description || ''}
              onChange={(e) => updateTask(task.id, { description: e.target.value })}
              className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50/50 p-3 text-xs text-neutral-800 placeholder-neutral-400 focus:border-indigo-500 focus:outline-none dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-neutral-200"
              placeholder="Adicione uma descrição detalhada, links ou notas de contexto..."
            />
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 rounded-xl border border-neutral-100 bg-neutral-50/60 dark:border-neutral-800 dark:bg-neutral-800/30 text-xs">
            {/* Priority */}
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                <Flag className="h-3.5 w-3.5" /> Prioridade
              </span>
              <select
                value={task.priority}
                onChange={(e) => handlePriorityChange(e.target.value as Priority)}
                className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs font-medium dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              >
                {priorityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className={opt.color}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Project */}
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                <FolderKanban className="h-3.5 w-3.5" /> Projeto
              </span>
              <select
                value={task.projectId || ''}
                onChange={(e) => updateTask(task.id, { projectId: e.target.value || undefined })}
                className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs font-medium dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              >
                <option value="">Nenhum projeto</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                <User className="h-3.5 w-3.5" /> Responsável
              </span>
              <input
                type="text"
                value={task.assigneeName || ''}
                onChange={(e) => updateTask(task.id, { assigneeName: e.target.value })}
                placeholder="Nome do responsável"
                className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              />
            </div>

            {/* Due Date */}
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                <Calendar className="h-3.5 w-3.5" /> Data de Vencimento
              </span>
              <input
                type="date"
                value={task.dueDate || ''}
                onChange={(e) => updateTask(task.id, { dueDate: e.target.value || undefined })}
                className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              />
            </div>

            {/* Due Time */}
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                <Clock className="h-3.5 w-3.5" /> Horário
              </span>
              <input
                type="time"
                value={task.dueTime || ''}
                onChange={(e) => updateTask(task.id, { dueTime: e.target.value || undefined })}
                className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              />
            </div>

            {/* Recurrence */}
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                <Repeat className="h-3.5 w-3.5" /> Recorrência
              </span>
              <select
                value={task.recurrence?.type || 'none'}
                onChange={(e) => updateTask(task.id, { recurrence: { type: e.target.value as any } })}
                className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs font-medium dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              >
                {recurrenceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration Estimativa & Real */}
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                <Clock className="h-3.5 w-3.5" /> Duração Estimada (min)
              </span>
              <input
                type="number"
                min="0"
                step="5"
                value={task.estimatedDuration || 0}
                onChange={(e) => updateTask(task.id, { estimatedDuration: parseInt(e.target.value, 10) || 0 })}
                className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                <Clock className="h-3.5 w-3.5" /> Tempo Gasto (min)
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={task.timeSpent || 0}
                  onChange={(e) => updateTask(task.id, { timeSpent: parseInt(e.target.value, 10) || 0 })}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                />
              </div>
            </div>

            {/* Dependencies */}
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                <Link2 className="h-3.5 w-3.5" /> Depende de
              </span>
              <select
                value={task.dependencies[0] || ''}
                onChange={(e) =>
                  updateTask(task.id, { dependencies: e.target.value ? [e.target.value] : [] })
                }
                className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 truncate"
              >
                <option value="">Sem dependência</option>
                {tasks
                  .filter((t) => t.id !== task.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200">
              <Tag className="h-3.5 w-3.5 text-neutral-500" />
              Etiquetas
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                >
                  #{tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-500 ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="+ Adicionar tag (Enter)"
                className="rounded-lg border border-dashed border-neutral-300 bg-transparent px-2.5 py-1 text-xs text-neutral-700 placeholder-neutral-400 focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:text-neutral-300"
              />
            </div>
          </div>

          {/* Reminders list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                <Bell className="h-3.5 w-3.5 text-neutral-500" />
                Lembretes Configurados
              </label>
              <div className="flex items-center gap-1">
                {(['on_time', '15m', '30m', '1h', '1d'] as TaskReminder['type'][]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleAddReminder(type)}
                    className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
                  >
                    +{reminderLabels[type]}
                  </button>
                ))}
              </div>
            </div>

            {task.reminders.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {task.reminders.map((r) => (
                  <span
                    key={r.id}
                    className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/60 px-2.5 py-1 text-xs text-indigo-800 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300"
                  >
                    <Bell className="h-3 w-3" />
                    {reminderLabels[r.type]}
                    <button
                      onClick={() => handleRemoveReminder(r.id)}
                      className="hover:text-rose-500 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 italic">Nenhum lembrete configurado ainda.</p>
            )}
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                <CheckSquare className="h-3.5 w-3.5 text-neutral-500" />
                Checklist (
                {task.checklist.filter((c) => c.completed).length}/{task.checklist.length})
              </label>
            </div>

            <div className="space-y-1.5">
              {task.checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2.5 rounded-lg border border-neutral-100 bg-neutral-50/50 px-3 py-1.5 text-xs dark:border-neutral-800 dark:bg-neutral-800/30"
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleChecklistItem(task.id, item.id)}
                    className="h-3.5 w-3.5 rounded text-indigo-600 focus:ring-0"
                  />
                  <span
                    className={`flex-1 ${
                      item.completed ? 'line-through text-neutral-400 dark:text-neutral-500' : 'text-neutral-800 dark:text-neutral-200'
                    }`}
                  >
                    {item.title}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddChecklist} className="flex gap-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                placeholder="+ Adicionar item ao checklist..."
                className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs outline-none focus:border-indigo-500 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-100"
              />
              <button
                type="submit"
                disabled={!newChecklistText.trim()}
                className="rounded-xl bg-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-300 disabled:opacity-40 dark:bg-neutral-800 dark:text-neutral-300"
              >
                Adicionar
              </button>
            </form>
          </div>

          {/* Subtasks */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200">
              <ListTodo className="h-3.5 w-3.5 text-neutral-500" />
              Subtarefas ({task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length})
            </label>

            <div className="space-y-1.5">
              {task.subtasks.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-2.5 rounded-lg border border-neutral-100 bg-neutral-50/50 px-3 py-1.5 text-xs dark:border-neutral-800 dark:bg-neutral-800/30"
                >
                  <input
                    type="checkbox"
                    checked={sub.completed}
                    onChange={() => toggleSubtask(task.id, sub.id)}
                    className="h-3.5 w-3.5 rounded text-indigo-600 focus:ring-0"
                  />
                  <span
                    className={`flex-1 ${
                      sub.completed ? 'line-through text-neutral-400 dark:text-neutral-500' : 'text-neutral-800 dark:text-neutral-200'
                    }`}
                  >
                    {sub.title}
                  </span>
                  {sub.dueDate && (
                    <span className="text-[10px] text-neutral-400">{sub.dueDate}</span>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleAddSubtask} className="flex gap-2">
              <input
                type="text"
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                placeholder="+ Adicionar subtarefa acionável..."
                className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs outline-none focus:border-indigo-500 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-100"
              />
              <button
                type="submit"
                disabled={!newSubtaskText.trim()}
                className="rounded-xl bg-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-300 disabled:opacity-40 dark:bg-neutral-800 dark:text-neutral-300"
              >
                Adicionar
              </button>
            </form>
          </div>

          {/* Comments Section */}
          <div className="space-y-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200">
              <MessageSquare className="h-3.5 w-3.5 text-neutral-500" />
              Comentários ({task.comments.length})
            </label>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {task.comments.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-3 text-xs dark:border-neutral-800 dark:bg-neutral-800/40"
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                    <span>{c.author}</span>
                    <span className="text-neutral-400 font-normal">{c.createdAt}</span>
                  </div>
                  <p className="mt-1 text-neutral-600 dark:text-neutral-300">{c.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Escreva um comentário ou atualização..."
                className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs outline-none focus:border-indigo-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
              />
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-40"
              >
                Comentar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
