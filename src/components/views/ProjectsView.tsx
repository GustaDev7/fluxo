import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FolderKanban,
  Plus,
  ArrowLeft,
  Sparkles,
  Calendar,
  CheckCircle2,
  Kanban as KanbanIcon,
  List,
  GitCommit,
  Clock,
  Trash2,
  Users,
  Loader2,
} from 'lucide-react';
import { Project, TaskStatus } from '../../types';
import { formatDatePT } from '../../utils/date';

export const ProjectsView: React.FC = () => {
  const {
    projects,
    tasks,
    selectedProjectId,
    setSelectedProjectId,
    addProject,
    updateProject,
    deleteProject,
    moveTaskStatus,
    updateTask,
    setSelectedTaskId,
    setIsQuickCaptureOpen,
    aiBreakdownProjectTasks,
    isAiLoading,
  } = useApp();

  const [projectSubTab, setProjectSubTab] = useState<'tasks' | 'kanban' | 'timeline'>('tasks');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [newDueDate, setNewDueDate] = useState('');

  const currentProject = projects.find((p) => p.id === selectedProjectId);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const created = addProject({
      name: newName.trim(),
      description: newDesc.trim(),
      color: newColor,
      dueDate: newDueDate || undefined,
      status: 'active',
    });

    setNewName('');
    setNewDesc('');
    setIsNewProjectModalOpen(false);
    setSelectedProjectId(created.id);
  };

  const handleAiBreakdown = async () => {
    if (!currentProject) return;
    await aiBreakdownProjectTasks(currentProject.id);
  };

  // If no project selected, show all projects dashboard
  if (!currentProject) {
    return (
      <div className="space-y-6 p-4 sm:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FolderKanban className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
                Projetos & Demandas
              </h1>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Estruture seus objetivos de grande porte com divisão de tarefas, cronogramas e IA.
            </p>
          </div>

          <button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Novo Projeto</span>
          </button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const projectTasks = tasks.filter((t) => t.projectId === project.id && !t.isInbox);
            const doneTasks = projectTasks.filter((t) => t.status === 'done');
            const progress =
              projectTasks.length > 0 ? Math.round((doneTasks.length / projectTasks.length) * 100) : 0;

            return (
              <div
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className="group flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md cursor-pointer dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-indigo-900"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3.5 w-3.5 rounded-lg shadow-xs"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-600 uppercase dark:bg-neutral-800 dark:text-neutral-300">
                        {project.status === 'active' ? 'Em Andamento' : project.status}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProject(project.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-rose-600 p-1"
                      title="Excluir projeto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {project.name}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                    {project.description || 'Sem descrição cadastrada.'}
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-neutral-500">Progresso</span>
                      <span className="text-neutral-900 dark:text-neutral-100">{progress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%`, backgroundColor: project.color }}
                      />
                    </div>
                  </div>

                  {/* Footer Meta */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-[11px] text-neutral-400">
                    <span>
                      {doneTasks.length}/{projectTasks.length} tarefas
                    </span>
                    {project.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDatePT(project.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal New Project */}
        {isNewProjectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Criar Novo Projeto
              </h3>
              <p className="mt-1 text-xs text-neutral-500">
                Defina o objetivo, cor de identificação e prazo final.
              </p>

              <form onSubmit={handleCreateProject} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Nome do Projeto
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: Lançamento do Produto, Reforma..."
                    className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 outline-none focus:border-indigo-500 focus:bg-white dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Descrição
                  </label>
                  <textarea
                    rows={2}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Descreva o escopo e o resultado esperado..."
                    className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 outline-none focus:border-indigo-500 focus:bg-white dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Cor de Identificação
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="color"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        className="h-8 w-12 rounded cursor-pointer border border-neutral-200"
                      />
                      <span className="text-xs font-mono text-neutral-500">{newColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Data Limite
                    </label>
                    <input
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-900 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewProjectModalOpen(false)}
                    className="rounded-xl px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                  >
                    Criar Projeto
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Project Detail View
  const projectTasks = tasks.filter((t) => t.projectId === currentProject.id && !t.isInbox);
  const doneTasks = projectTasks.filter((t) => t.status === 'done');
  const progress =
    projectTasks.length > 0 ? Math.round((doneTasks.length / projectTasks.length) * 100) : 0;

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Back button & Project Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSelectedProjectId(null)}
          className="flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para todos os projetos</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className="h-4 w-4 rounded-lg"
              style={{ backgroundColor: currentProject.color }}
            />
            <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
              {currentProject.name}
            </h1>
          </div>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 max-w-2xl">
            {currentProject.description || 'Sem descrição cadastrada.'}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
            {currentProject.dueDate && (
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                Entrega: {formatDatePT(currentProject.dueDate)}
              </span>
            )}
            <span className="flex items-center gap-1 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              {doneTasks.length} de {projectTasks.length} concluídas ({progress}%)
            </span>
          </div>
        </div>

        {/* Actions: AI Breakdown & New Task */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAiBreakdown}
            disabled={isAiLoading}
            className="flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2 text-xs font-bold text-violet-700 shadow-sm hover:bg-violet-100 disabled:opacity-50 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300"
            title="A IA analisa o projeto e gera todas as tarefas necessárias"
          >
            {isAiLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Planejando tarefas...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                <span>Quebrar em Tarefas com IA</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsQuickCaptureOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Adicionar Tarefa</span>
          </button>
        </div>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex items-center rounded-xl border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-800 dark:bg-neutral-800 text-xs w-fit">
        <button
          onClick={() => setProjectSubTab('tasks')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all ${
            projectSubTab === 'tasks'
              ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-100'
              : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          <List className="h-3.5 w-3.5" />
          <span>Lista de Tarefas</span>
        </button>

        <button
          onClick={() => setProjectSubTab('kanban')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all ${
            projectSubTab === 'kanban'
              ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-100'
              : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          <KanbanIcon className="h-3.5 w-3.5" />
          <span>Kanban do Projeto</span>
        </button>

        <button
          onClick={() => setProjectSubTab('timeline')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all ${
            projectSubTab === 'timeline'
              ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-100'
              : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          <GitCommit className="h-3.5 w-3.5" />
          <span>Cronograma / Gantt</span>
        </button>
      </div>

      {/* SUB-VIEW 1: Tasks List */}
      {projectSubTab === 'tasks' && (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {projectTasks.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400">
                Nenhuma tarefa vinculada a este projeto ainda. Clique em "Quebrar em Tarefas com IA" ou crie manualmente.
              </div>
            ) : (
              projectTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' })
                      }
                      className="text-neutral-400 hover:text-emerald-500"
                    >
                      {task.status === 'done' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border border-neutral-300 dark:border-neutral-700" />
                      )}
                    </button>

                    <div>
                      <h4
                        onClick={() => setSelectedTaskId(task.id)}
                        className={`text-xs font-bold cursor-pointer hover:text-indigo-600 ${
                          task.status === 'done' ? 'line-through text-neutral-400' : 'text-neutral-900 dark:text-neutral-100'
                        }`}
                      >
                        {task.title}
                      </h4>
                      {task.checklist.length > 0 && (
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          {task.checklist.filter((c) => c.completed).length}/{task.checklist.length} itens do checklist concluídos
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                      {task.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: Project Kanban */}
      {projectSubTab === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
          {(['backlog', 'todo', 'in_progress', 'done'] as TaskStatus[]).map((statusKey) => {
            const colTasks = projectTasks.filter((t) => t.status === statusKey);
            const titles: Record<string, string> = {
              backlog: 'Backlog',
              todo: 'A Fazer',
              in_progress: 'Em Andamento',
              done: 'Concluído',
            };

            return (
              <div
                key={statusKey}
                className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60 min-w-[240px]"
              >
                <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    {titles[statusKey]}
                  </span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                    {colTasks.length}
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {colTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTaskId(t.id)}
                      className="rounded-xl border border-neutral-200 bg-white p-3 text-xs shadow-xs cursor-pointer hover:border-indigo-300 dark:border-neutral-800 dark:bg-neutral-900"
                    >
                      <p className="font-bold text-neutral-900 dark:text-neutral-100">{t.title}</p>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-neutral-400">
                        <span>{t.priority !== 'none' ? t.priority : ''}</span>
                        <select
                          value={t.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => moveTaskStatus(t.id, e.target.value as TaskStatus)}
                          className="bg-transparent text-[10px] text-neutral-500 outline-none"
                        >
                          <option value="backlog">Backlog</option>
                          <option value="todo">A Fazer</option>
                          <option value="in_progress">Andamento</option>
                          <option value="done">Concluído</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUB-VIEW 3: Project Timeline / Gantt */}
      {projectSubTab === 'timeline' && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Linha do Tempo e Dependências
          </h3>
          <p className="text-xs text-neutral-500">
            Sequenciamento de entregas ao longo do tempo para o projeto "{currentProject.name}":
          </p>

          <div className="space-y-3 pt-2">
            {projectTasks.map((task, idx) => (
              <div
                key={task.id}
                className="flex items-center gap-4 rounded-xl border border-neutral-100 bg-neutral-50/50 p-3 text-xs dark:border-neutral-800 dark:bg-neutral-800/40"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {idx + 1}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-neutral-900 dark:text-neutral-100 truncate">{task.title}</p>
                  <p className="text-[11px] text-neutral-400">
                    Prazo: {task.dueDate ? formatDatePT(task.dueDate) : 'A definir'} • Duração estimada: {task.estimatedDuration}m
                  </p>
                </div>

                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                    task.status === 'done'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                  }`}
                >
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
