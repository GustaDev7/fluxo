import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  List,
  Kanban as KanbanIcon,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  CheckCircle2,
  Calendar,
  Clock,
  Flag,
  Tag,
  FolderKanban,
  Play,
  CheckSquare,
  AlertCircle,
  MoreVertical,
  Download,
} from 'lucide-react';
import { Task, TaskStatus, Priority } from '../../types';
import { formatDatePT, isPastDate, isToday, getTodayDateString } from '../../utils/date';
import { downloadCSV } from '../../utils/exportUtils';

export const TasksView: React.FC = () => {
  const {
    tasks,
    projects,
    columns,
    updateTask,
    moveTaskStatus,
    setSelectedTaskId,
    setIsQuickCaptureOpen,
    startFocusTimer,
    selectedTagFilter,
    setSelectedTagFilter,
  } = useApp();

  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [mobileKanbanCol, setMobileKanbanCol] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'title' | 'createdAt'>('dueDate');
  const [groupBy, setGroupBy] = useState<'none' | 'project' | 'status' | 'priority'>('none');

  const todayStr = getTodayDateString();

  // Filter tasks (excluding inbox)
  const filteredTasks = tasks.filter((task) => {
    if (task.isInbox) return false;

    // Search query
    if (
      searchQuery &&
      !task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Status
    if (selectedStatus !== 'all' && task.status !== selectedStatus) return false;

    // Priority
    if (selectedPriority !== 'all' && task.priority !== selectedPriority) return false;

    // Project
    if (selectedProjectId !== 'all' && task.projectId !== selectedProjectId) return false;

    // Tag
    if (selectedTagFilter && !task.tags.includes(selectedTagFilter)) return false;

    // Date range
    if (selectedDateRange === 'today') {
      if (task.dueDate !== todayStr) return false;
    } else if (selectedDateRange === 'overdue') {
      if (!task.dueDate || !isPastDate(task.dueDate, task.dueTime) || task.status === 'done') return false;
    } else if (selectedDateRange === 'upcoming') {
      if (!task.dueDate || task.dueDate <= todayStr) return false;
    }

    return true;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'dueDate') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    }
    if (sortBy === 'priority') {
      const pWeights: Record<Priority, number> = { urgent: 4, high: 3, medium: 2, low: 1, none: 0 };
      return pWeights[b.priority] - pWeights[a.priority];
    }
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    return b.createdAt.localeCompare(a.createdAt);
  });

  const priorityBadge: Record<Priority, { label: string; class: string }> = {
    urgent: { label: 'Urgente', class: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' },
    high: { label: 'Alta', class: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300' },
    medium: { label: 'Média', class: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
    low: { label: 'Baixa', class: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' },
    none: { label: 'Sem prioridade', class: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400' },
  };

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
            Gerenciador de Tarefas
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Acompanhe, priorize e execute todas as suas demandas em visualização de Lista ou Kanban.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode switch */}
          <div className="flex items-center rounded-xl border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-800 dark:bg-neutral-800">
            <button
              id="view-mode-list-btn"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Lista</span>
            </button>
            <button
              id="view-mode-kanban-btn"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <KanbanIcon className="h-3.5 w-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          <button
            onClick={() => downloadCSV(filteredTasks, projects)}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
            title="Exportar tarefas filtradas para planilha (CSV)"
          >
            <Download className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            onClick={() => setIsQuickCaptureOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nova Tarefa</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 dark:border-neutral-700 dark:bg-neutral-800">
            <Search className="h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar tarefas..."
              className="bg-transparent text-xs text-neutral-800 outline-none placeholder-neutral-400 dark:text-neutral-200 w-36 sm:w-48"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-700 font-medium dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
          >
            <option value="all">Todos os Status</option>
            <option value="backlog">Backlog</option>
            <option value="todo">A Fazer</option>
            <option value="in_progress">Em Andamento</option>
            <option value="in_review">Em Revisão</option>
            <option value="done">Concluído</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-700 font-medium dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
          >
            <option value="all">Todas as Prioridades</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>

          {/* Project Filter */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-700 font-medium dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
          >
            <option value="all">Todos os Projetos</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Date Filter */}
          <select
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-700 font-medium dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
          >
            <option value="all">Todas as Datas</option>
            <option value="today">Vencem Hoje</option>
            <option value="overdue">Atrasadas</option>
            <option value="upcoming">Futuras</option>
          </select>
        </div>

        {/* Sort and Clear */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-neutral-500">
            <ArrowUpDown className="h-3.5 w-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-neutral-700 dark:text-neutral-300 outline-none"
            >
              <option value="dueDate">Ordenar: Prazo</option>
              <option value="priority">Ordenar: Prioridade</option>
              <option value="title">Ordenar: Nome (A-Z)</option>
              <option value="createdAt">Ordenar: Mais Recentes</option>
            </select>
          </div>

          {(selectedStatus !== 'all' ||
            selectedPriority !== 'all' ||
            selectedProjectId !== 'all' ||
            selectedDateRange !== 'all' ||
            searchQuery ||
            selectedTagFilter) && (
            <button
              onClick={() => {
                setSelectedStatus('all');
                setSelectedPriority('all');
                setSelectedProjectId('all');
                setSelectedDateRange('all');
                setSearchQuery('');
                setSelectedTagFilter(null);
              }}
              className="rounded-lg bg-neutral-100 px-2 py-1 text-[11px] font-semibold text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* View Mode: LIST */}
      {viewMode === 'list' && (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {sortedTasks.length === 0 ? (
              <div className="py-16 text-center text-xs text-neutral-400">
                Nenhuma tarefa encontrada com os filtros selecionados.
              </div>
            ) : (
              sortedTasks.map((task) => {
                const project = projects.find((p) => p.id === task.projectId);
                const isOverdue =
                  task.dueDate && isPastDate(task.dueDate, task.dueTime) && task.status !== 'done';
                const isDueToday = task.dueDate === todayStr;

                return (
                  <div
                    key={task.id}
                    className={`group flex items-center justify-between p-4 transition-colors hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 ${
                      task.status === 'done' ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      {/* Completion checkbox */}
                      <button
                        onClick={() =>
                          updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' })
                        }
                        className="text-neutral-400 hover:text-emerald-600 shrink-0"
                      >
                        {task.status === 'done' ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border border-neutral-300 dark:border-neutral-700" />
                        )}
                      </button>

                      {/* Title & Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            onClick={() => setSelectedTaskId(task.id)}
                            className={`cursor-pointer text-xs font-bold ${
                              task.status === 'done'
                                ? 'line-through text-neutral-400'
                                : 'text-neutral-900 hover:text-indigo-600 dark:text-neutral-100 dark:hover:text-indigo-400'
                            }`}
                          >
                            {task.title}
                          </h3>

                          {/* Priority badge */}
                          {task.priority !== 'none' && (
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                                priorityBadge[task.priority].class
                              }`}
                            >
                              {priorityBadge[task.priority].label}
                            </span>
                          )}

                          {/* Project badge */}
                          {project && (
                            <span
                              className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium text-neutral-600 dark:text-neutral-300"
                              style={{ backgroundColor: `${project.color}15` }}
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: project.color }}
                              />
                              {project.name}
                            </span>
                          )}
                        </div>

                        {/* Meta: Due date, tags, checklist */}
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-neutral-400">
                          {task.dueDate && (
                            <span
                              className={`flex items-center gap-1 font-medium ${
                                isOverdue
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : isDueToday
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-neutral-500'
                              }`}
                            >
                              <Calendar className="h-3 w-3" />
                              {isOverdue && <AlertCircle className="h-3 w-3" />}
                              {formatDatePT(task.dueDate, 'relative')}
                              {task.dueTime ? ` às ${task.dueTime}` : ''}
                            </span>
                          )}

                          {task.checklist.length > 0 && (
                            <span className="flex items-center gap-1">
                              <CheckSquare className="h-3 w-3" />
                              {task.checklist.filter((c) => c.completed).length}/{task.checklist.length}
                            </span>
                          )}

                          {task.estimatedDuration && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {task.timeSpent || 0}/{task.estimatedDuration}m
                            </span>
                          )}

                          {task.tags.map((tag) => (
                            <button
                              key={tag}
                              onClick={() => setSelectedTagFilter(tag)}
                              className="hover:text-indigo-600"
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-2">
                      {task.status !== 'done' && (
                        <button
                          onClick={() => startFocusTimer(task.id, task.title, 25)}
                          className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300"
                          title="Focar com Pomodoro"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span className="hidden sm:inline">Focar</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedTaskId(task.id)}
                        className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* View Mode: KANBAN */}
      {viewMode === 'kanban' && (
        <div className="space-y-3">
          {/* Mobile column switch pills */}
          <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
            <button
              onClick={() => setMobileKanbanCol('all')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                mobileKanbanCol === 'all'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
              }`}
            >
              Todas ({sortedTasks.length})
            </button>
            {columns.map((col) => {
              const count = sortedTasks.filter((t) => t.status === col.status).length;
              return (
                <button
                  key={col.id}
                  onClick={() => setMobileKanbanCol(col.status)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    mobileKanbanCol === col.status
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                  }`}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: mobileKanbanCol === col.status ? '#ffffff' : col.color }}
                  />
                  <span>{col.title} ({count})</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
            {columns
              .filter((col) => mobileKanbanCol === 'all' || mobileKanbanCol === col.status)
              .map((col) => {
                const colTasks = sortedTasks.filter((t) => t.status === col.status);
                const isOverLimit = col.limit && colTasks.length > col.limit;

                return (
                  <div
                    key={col.id}
                    className="flex flex-col rounded-2xl border border-neutral-200 bg-neutral-50/60 p-3.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60 min-w-[260px]"
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between border-b border-neutral-200/80 pb-2.5 dark:border-neutral-800">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: col.color }}
                        />
                        <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                          {col.title}
                        </h3>
                      </div>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isOverLimit
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-white text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                        }`}
                      >
                        {colTasks.length} {col.limit ? `/ ${col.limit}` : ''}
                      </span>
                    </div>

                    {/* Column Task Cards */}
                    <div className="mt-3 flex-1 space-y-2.5 overflow-y-auto max-h-[70vh]">
                      {colTasks.map((task) => {
                        const project = projects.find((p) => p.id === task.projectId);

                        return (
                          <div
                            key={task.id}
                            className="group rounded-xl border border-neutral-200 bg-white p-3 shadow-xs hover:border-indigo-300 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-indigo-900 transition-all space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4
                                onClick={() => setSelectedTaskId(task.id)}
                                className="text-xs font-bold text-neutral-900 hover:text-indigo-600 cursor-pointer dark:text-neutral-100 dark:hover:text-indigo-400 line-clamp-2"
                              >
                                {task.title}
                              </h4>

                              {task.priority !== 'none' && (
                                <span
                                  className={`shrink-0 rounded px-1 py-0.5 text-[9px] font-semibold uppercase ${
                                    priorityBadge[task.priority].class
                                  }`}
                                >
                                  {task.priority}
                                </span>
                              )}
                            </div>

                            {/* Project Pill */}
                            {project && (
                              <div className="flex items-center gap-1 text-[10px] font-medium text-neutral-500">
                                <span
                                  className="h-1.5 w-1.5 rounded-full"
                                  style={{ backgroundColor: project.color }}
                                />
                                <span className="truncate">{project.name}</span>
                              </div>
                            )}

                            {/* Card Footer: Due Date & Move Controls */}
                            <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-[10px] text-neutral-400">
                              <span>{task.dueDate ? formatDatePT(task.dueDate, 'relative') : 'Sem prazo'}</span>

                              <div className="flex items-center gap-1">
                                {col.status !== 'done' && (
                                  <button
                                    onClick={() => moveTaskStatus(task.id, 'done')}
                                    className="rounded p-1 text-neutral-400 hover:text-emerald-500"
                                    title="Mover para Concluído"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  </button>
                                )}

                                <select
                                  value={task.status}
                                  onChange={(e) => moveTaskStatus(task.id, e.target.value as TaskStatus)}
                                  className="rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-medium text-neutral-700 outline-none cursor-pointer dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                                >
                                  <option value="backlog">Backlog</option>
                                  <option value="todo">A Fazer</option>
                                  <option value="in_progress">Andamento</option>
                                  <option value="in_review">Revisão</option>
                                  <option value="done">Concluído</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {colTasks.length === 0 && (
                        <div className="py-6 text-center text-[11px] text-neutral-400 border border-dashed border-neutral-200 rounded-xl dark:border-neutral-800">
                          Vazio
                        </div>
                      )}
                    </div>

                    {/* Inline Add Task to Column */}
                    <button
                      onClick={() => setIsQuickCaptureOpen(true)}
                      className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-neutral-300 py-1.5 text-xs font-semibold text-neutral-500 hover:border-indigo-500 hover:text-indigo-600 dark:border-neutral-800 dark:hover:border-indigo-500"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
