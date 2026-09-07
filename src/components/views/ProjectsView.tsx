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
  Loader2,
  Repeat,
  RotateCw,
  Play,
  Square,
  ExternalLink,
  FileText,
  BookOpen,
  Check,
  Edit3,
  Timer,
  PlusCircle,
  Briefcase,
  ChevronRight,
  Flame,
  Layers,
  Link as LinkIcon,
  StickyNote,
  Zap,
} from 'lucide-react';
import { Project, TaskStatus, Priority, NotePage } from '../../types';
import { formatDatePT, getTodayDateString } from '../../utils/date';

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
    addTask,
    setSelectedTaskId,
    setIsQuickCaptureOpen,
    aiBreakdownProjectTasks,
    isAiLoading,
    addProjectRoutine,
    toggleProjectRoutine,
    resetProjectRoutines,
    deleteProjectRoutine,
    addProjectLink,
    deleteProjectLink,
    addProjectWorkLog,
    deleteProjectWorkLog,
    startProjectFocusTimer,
    timeEntries,
    activeTimer,
    pauseFocusTimer,
    resumeFocusTimer,
    stopFocusTimer,
    notes,
    addNote,
  } = useApp();

  // Navigation inside project
  const [projectSubTab, setProjectSubTab] = useState<'workspace' | 'tasks' | 'kanban' | 'notes' | 'timeline'>('workspace');
  const [mobileKanbanFilter, setMobileKanbanFilter] = useState<TaskStatus | 'all'>('all');

  // Main filter for projects list
  const [filterType, setFilterType] = useState<'all' | 'recurring' | 'fixed'>('all');

  // Modal for new project
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [newDueDate, setNewDueDate] = useState('');
  const [newIsRecurring, setNewIsRecurring] = useState(false);
  const [newRecurrenceFreq, setNewRecurrenceFreq] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly' | 'continuous'>('weekly');

  // Modal for editing existing project
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editColor, setEditColor] = useState('#6366f1');
  const [editDueDate, setEditDueDate] = useState('');
  const [editIsRecurring, setEditIsRecurring] = useState(false);
  const [editRecurrenceFreq, setEditRecurrenceFreq] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly' | 'continuous'>('weekly');

  // Workspace actions states
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskPriority, setQuickTaskPriority] = useState<Priority>('medium');
  const [quickTaskDueDate, setQuickTaskDueDate] = useState('');

  const [newRoutineTitle, setNewRoutineTitle] = useState('');
  const [newRoutineFreq, setNewRoutineFreq] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('daily');
  const [newRoutineTime, setNewRoutineTime] = useState('09:00');
  const [newRoutineSyncCalendar, setNewRoutineSyncCalendar] = useState(true);
  const [newRoutineSyncHabits, setNewRoutineSyncHabits] = useState(true);
  const [isAddingRoutine, setIsAddingRoutine] = useState(false);

  const [newWorkLogContent, setNewWorkLogContent] = useState('');
  const [newWorkLogMinutes, setNewWorkLogMinutes] = useState<number>(30);
  const [isAddingWorkLog, setIsAddingWorkLog] = useState(false);

  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);

  // Selected note inside project notes subtab
  const [selectedProjectNoteId, setSelectedProjectNoteId] = useState<string | null>(null);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [isCreatingNote, setIsCreatingNote] = useState(false);

  // AI routines suggestion
  const [isAiRoutinesLoading, setIsAiRoutinesLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);

  const currentProject = projects.find((p) => p.id === selectedProjectId);

  const handleOpenEditModal = () => {
    if (!currentProject) return;
    setEditName(currentProject.name);
    setEditDesc(currentProject.description || '');
    setEditColor(currentProject.color || '#6366f1');
    setEditDueDate(currentProject.dueDate || '');
    setEditIsRecurring(currentProject.isRecurring ?? false);
    setEditRecurrenceFreq(currentProject.recurrenceFrequency || 'weekly');
    setIsEditProjectModalOpen(true);
  };

  const handleSaveEditProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !editName.trim()) return;

    updateProject(currentProject.id, {
      name: editName.trim(),
      description: editDesc.trim(),
      color: editColor,
      dueDate: editDueDate || undefined,
      isRecurring: editIsRecurring,
      recurrenceFrequency: editIsRecurring ? editRecurrenceFreq : undefined,
    });

    setIsEditProjectModalOpen(false);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const created = addProject({
      name: newName.trim(),
      description: newDesc.trim(),
      color: newColor,
      dueDate: newDueDate || undefined,
      status: 'active',
      isRecurring: newIsRecurring,
      recurrenceFrequency: newIsRecurring ? newRecurrenceFreq : undefined,
      routines: [],
      links: [],
      workLogs: [],
    });

    setNewName('');
    setNewDesc('');
    setNewDueDate('');
    setNewIsRecurring(false);
    setIsNewProjectModalOpen(false);
    setSelectedProjectId(created.id);
  };

  const handleAiBreakdown = async () => {
    if (!currentProject) return;
    await aiBreakdownProjectTasks(currentProject.id);
  };

  const handleAiSuggestRoutines = async () => {
    if (!currentProject) return;
    setIsAiRoutinesLoading(true);
    try {
      const res = await fetch('/api/ai/project-routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: currentProject.name,
          projectDescription: currentProject.description,
          recurrenceFrequency: currentProject.recurrenceFrequency || 'weekly',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.routines)) {
          data.routines.forEach((r: { title: string; frequency?: any; preferredTime?: string }) => {
            addProjectRoutine(
              currentProject.id,
              r.title,
              r.frequency || 'daily',
              r.preferredTime || '09:00',
              true,
              true
            );
          });
        }
        if (data.advice) {
          setAiAdvice(data.advice);
        }
      }
    } catch (e) {
      console.error('Failed to suggest routines with AI:', e);
    } finally {
      setIsAiRoutinesLoading(false);
    }
  };

  const handleAddQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !quickTaskTitle.trim()) return;

    addTask({
      title: quickTaskTitle.trim(),
      projectId: currentProject.id,
      priority: quickTaskPriority,
      dueDate: quickTaskDueDate || undefined,
      status: 'todo',
    });

    setQuickTaskTitle('');
    setQuickTaskPriority('medium');
    setQuickTaskDueDate('');
  };

  const handleAddRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !newRoutineTitle.trim()) return;
    addProjectRoutine(
      currentProject.id,
      newRoutineTitle.trim(),
      newRoutineFreq,
      newRoutineTime,
      newRoutineSyncCalendar,
      newRoutineSyncHabits
    );
    setNewRoutineTitle('');
    setNewRoutineTime('09:00');
    setNewRoutineSyncCalendar(true);
    setNewRoutineSyncHabits(true);
    setIsAddingRoutine(false);
  };

  const handleAddWorkLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !newWorkLogContent.trim()) return;
    addProjectWorkLog(currentProject.id, newWorkLogContent.trim(), Number(newWorkLogMinutes) || undefined);
    setNewWorkLogContent('');
    setIsAddingWorkLog(false);
  };

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !newLinkTitle.trim() || !newLinkUrl.trim()) return;
    addProjectLink(currentProject.id, newLinkTitle.trim(), newLinkUrl.trim());
    setNewLinkTitle('');
    setNewLinkUrl('');
    setIsAddingLink(false);
  };

  const handleCreateProjectNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !newNoteTitle.trim()) return;
    const created = addNote({
      title: newNoteTitle.trim(),
      projectId: currentProject.id,
      blocks: [
        {
          id: `b_${Date.now()}`,
          type: 'p',
          content: `Anotações e documentação para o projeto ${currentProject.name}`,
        },
      ],
    });
    setNewNoteTitle('');
    setIsCreatingNote(false);
    setSelectedProjectNoteId(created.id);
  };

  // ================= RENDER: PROJECT LISTING (IF NO PROJECT SELECTED) =================
  if (!currentProject) {
    const filteredProjects = projects.filter((p) => {
      if (filterType === 'recurring') return p.isRecurring;
      if (filterType === 'fixed') return !p.isRecurring;
      return true;
    });

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
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Trabalhe dentro de projetos recorrentes e demandas de longo prazo com foco, rotinas, tarefas e IA integrada.
            </p>
          </div>

          <button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Novo Projeto</span>
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 border-b border-neutral-200 pb-3 dark:border-neutral-800">
          <button
            onClick={() => setFilterType('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filterType === 'all'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            Todos ({projects.length})
          </button>
          <button
            onClick={() => setFilterType('recurring')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filterType === 'recurring'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Repeat className="h-3.5 w-3.5" />
            <span>Recorrentes & Contínuos ({projects.filter((p) => p.isRecurring).length})</span>
          </button>
          <button
            onClick={() => setFilterType('fixed')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filterType === 'fixed'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            Pontuais com Prazo ({projects.filter((p) => !p.isRecurring).length})
          </button>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/50 p-12 text-center dark:border-neutral-800 dark:bg-neutral-900/30">
            <FolderKanban className="mx-auto h-10 w-10 text-neutral-400" />
            <h3 className="mt-3 text-sm font-bold text-neutral-800 dark:text-neutral-200">
              Nenhum projeto encontrado nesta categoria
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              Crie um novo projeto com objetivos pontuais ou demandas recorrentes para começar a trabalhar.
            </p>
            <button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Criar Primeiro Projeto</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => {
              const projectTasks = tasks.filter((t) => t.projectId === project.id && !t.isInbox);
              const doneTasks = projectTasks.filter((t) => t.status === 'done');
              const progress =
                projectTasks.length > 0 ? Math.round((doneTasks.length / projectTasks.length) * 100) : 0;
              const routinesCount = project.routines?.length || 0;
              const completedRoutinesCount = project.routines?.filter((r) => r.completed).length || 0;

              return (
                <div
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  className="group flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-400 hover:shadow-md cursor-pointer dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-indigo-700"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3.5 w-3.5 rounded-lg shadow-xs"
                          style={{ backgroundColor: project.color }}
                        />
                        {project.isRecurring ? (
                          <span className="flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                            <Repeat className="h-3 w-3" />
                            <span>
                              {project.recurrenceFrequency === 'daily'
                                ? 'Diário'
                                : project.recurrenceFrequency === 'weekly'
                                ? 'Semanal'
                                : project.recurrenceFrequency === 'biweekly'
                                ? 'Quinzenal'
                                : project.recurrenceFrequency === 'monthly'
                                ? 'Mensal'
                                : 'Contínuo'}
                            </span>
                          </span>
                        ) : (
                          <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-600 uppercase dark:bg-neutral-800 dark:text-neutral-300">
                            {project.status === 'active' ? 'Ativo' : project.status}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProject(project.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-rose-600 p-1 transition-opacity"
                        title="Excluir projeto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <h3 className="mt-3 text-base font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {project.name}
                    </h3>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                      {project.description || 'Sem descrição cadastrada.'}
                    </p>

                    {/* Recurrent Project extra indicators */}
                    {project.isRecurring && routinesCount > 0 && (
                      <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-neutral-50 px-2.5 py-1 text-[11px] text-neutral-600 dark:bg-neutral-800/60 dark:text-neutral-300">
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span>
                          {completedRoutinesCount}/{routinesCount} rotinas do ciclo concluídas
                        </span>
                      </div>
                    )}
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
                      {project.isRecurring ? (
                        <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                          <RotateCw className="h-3 w-3" />
                          <span>Mesa Ativa</span>
                        </span>
                      ) : project.dueDate ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDatePT(project.dueDate)}
                        </span>
                      ) : (
                        <span>Sem prazo final</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal New Project */}
        {isNewProjectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Criar Novo Projeto ou Demanda
              </h3>
              <p className="mt-1 text-xs text-neutral-500">
                Defina o tipo, objetivo, cor de identificação e rotinas de acompanhamento.
              </p>

              <form onSubmit={handleCreateProject} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Nome do Projeto / Demanda
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: Gestão de Clientes, Manutenção do App, Criação de Conteúdo..."
                    className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 outline-none focus:border-indigo-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Descrição & Escopo
                  </label>
                  <textarea
                    rows={2}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Descreva as responsabilidades, metas e escopo..."
                    className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 outline-none focus:border-indigo-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </div>

                {/* Recurrent Toggle */}
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5 dark:border-indigo-950 dark:bg-indigo-950/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Repeat className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      <div>
                        <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                          Projeto Recorrente / Operação Contínua
                        </p>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          Para demandas periódicas e de longo prazo que não são coisas rápidas.
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={newIsRecurring}
                      onChange={(e) => setNewIsRecurring(e.target.checked)}
                      className="h-4 w-4 rounded accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  {newIsRecurring && (
                    <div className="mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-950/60 flex items-center gap-3">
                      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        Ciclo de Recorrência:
                      </span>
                      <select
                        value={newRecurrenceFreq}
                        onChange={(e: any) => setNewRecurrenceFreq(e.target.value)}
                        className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs text-neutral-800 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                      >
                        <option value="continuous">Operação Contínua</option>
                        <option value="weekly">Ciclo Semanal</option>
                        <option value="daily">Ciclo Diário</option>
                        <option value="biweekly">Ciclo Quinzenal</option>
                        <option value="monthly">Ciclo Mensal</option>
                      </select>
                    </div>
                  )}
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
                      {newIsRecurring ? 'Data de Início / Marco' : 'Data Limite'}
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
                    Criar e Acessar Mesa
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================= RENDER: WORKING INSIDE A PROJECT (WORKSPACE) =================
  const projectTasks = tasks.filter((t) => t.projectId === currentProject.id && !t.isInbox);
  const doneTasks = projectTasks.filter((t) => t.status === 'done');
  const pendingTasks = projectTasks.filter((t) => t.status !== 'done');
  const progress =
    projectTasks.length > 0 ? Math.round((doneTasks.length / projectTasks.length) * 100) : 0;

  // Calculate total focus time spent on this project
  const projectTimeEntries = timeEntries.filter((t) => t.projectId === currentProject.id);
  const totalMinutesRecorded = projectTimeEntries.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  const totalHours = Math.floor(totalMinutesRecorded / 60);
  const remainingMinutes = totalMinutesRecorded % 60;

  const projectNotes = notes.filter((n) => n.projectId === currentProject.id);
  const activeNote = projectNotes.find((n) => n.id === selectedProjectNoteId) || projectNotes[0];

  const isTimerForThisProject = activeTimer && activeTimer.projectId === currentProject.id && activeTimer.isRunning;

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSelectedProjectId(null)}
          className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para todos os projetos</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenEditModal}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Editar Projeto</span>
          </button>
        </div>
      </div>

      {/* Project Header Banner */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className="h-4 w-4 rounded-md shadow-xs shrink-0"
                style={{ backgroundColor: currentProject.color }}
              />
              <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
                {currentProject.name}
              </h1>

              {currentProject.isRecurring && (
                <span className="flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                  <Repeat className="h-3.5 w-3.5" />
                  <span>
                    Projeto Recorrente (
                    {currentProject.recurrenceFrequency === 'daily'
                      ? 'Diário'
                      : currentProject.recurrenceFrequency === 'weekly'
                      ? 'Semanal'
                      : currentProject.recurrenceFrequency === 'biweekly'
                      ? 'Quinzenal'
                      : currentProject.recurrenceFrequency === 'monthly'
                      ? 'Mensal'
                      : 'Contínuo'}
                    )
                  </span>
                </span>
              )}
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-3xl leading-relaxed">
              {currentProject.description || 'Sem descrição cadastrada.'}
            </p>

            {/* Quick Metrics Strip */}
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {doneTasks.length} de {projectTasks.length} tarefas ({progress}%)
              </span>

              {totalMinutesRecorded > 0 && (
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="h-4 w-4 text-indigo-500" />
                  Tempo investido: {totalHours > 0 ? `${totalHours}h ` : ''}
                  {remainingMinutes}m
                </span>
              )}

              {currentProject.isRecurring && currentProject.routines && (
                <span className="flex items-center gap-1 font-medium">
                  <RotateCw className="h-4 w-4 text-indigo-500" />
                  {currentProject.routines.filter((r) => r.completed).length}/{currentProject.routines.length} rotinas
                  do ciclo
                </span>
              )}

              {currentProject.dueDate && (
                <span className="flex items-center gap-1 font-medium">
                  <Calendar className="h-4 w-4 text-neutral-400" />
                  Prazo: {formatDatePT(currentProject.dueDate)}
                </span>
              )}
            </div>
          </div>

          {/* Quick Execution Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Start Focus Timer on this project */}
            <button
              onClick={() => startProjectFocusTimer(currentProject.id, 25)}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 shadow-sm hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300 transition-colors"
              title="Iniciar bloco de foco de 25 minutos focado exclusivamente neste projeto"
            >
              {isTimerForThisProject ? (
                <>
                  <Square className="h-3.5 w-3.5 text-rose-600" />
                  <span>Foco Ativo ({Math.round((activeTimer?.secondsRemaining || 0) / 60)}m)</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Iniciar Foco no Projeto</span>
                </>
              )}
            </button>

            {/* AI Breakdown */}
            <button
              onClick={handleAiBreakdown}
              disabled={isAiLoading}
              className="flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2 text-xs font-bold text-violet-700 shadow-sm hover:bg-violet-100 disabled:opacity-50 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300 transition-colors"
              title="A IA analisa o projeto e gera tarefas práticas e acionáveis"
            >
              {isAiLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Gerando tarefas...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                  <span>Quebrar em Tarefas com IA</span>
                </>
              )}
            </button>

            {/* Manual New Task Modal Trigger */}
            <button
              onClick={() => setIsQuickCaptureOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nova Tarefa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-800 dark:bg-neutral-800/80 text-xs w-fit">
        <button
          onClick={() => setProjectSubTab('workspace')}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 font-semibold transition-all ${
            projectSubTab === 'workspace'
              ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-100'
              : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          <Briefcase className="h-3.5 w-3.5 text-indigo-500" />
          <span>Mesa de Trabalho (Workspace)</span>
        </button>

        <button
          onClick={() => setProjectSubTab('tasks')}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 font-semibold transition-all ${
            projectSubTab === 'tasks'
              ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-100'
              : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          <List className="h-3.5 w-3.5" />
          <span>Tarefas ({projectTasks.length})</span>
        </button>

        <button
          onClick={() => setProjectSubTab('kanban')}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 font-semibold transition-all ${
            projectSubTab === 'kanban'
              ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-100'
              : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          <KanbanIcon className="h-3.5 w-3.5" />
          <span>Kanban</span>
        </button>

        <button
          onClick={() => setProjectSubTab('notes')}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 font-semibold transition-all ${
            projectSubTab === 'notes'
              ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-100'
              : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Documentos & Notas ({projectNotes.length})</span>
        </button>

        <button
          onClick={() => setProjectSubTab('timeline')}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 font-semibold transition-all ${
            projectSubTab === 'timeline'
              ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-100'
              : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          <GitCommit className="h-3.5 w-3.5" />
          <span>Cronograma</span>
        </button>
      </div>

      {/* ================= SUB-TAB 1: WORKSPACE / MESA DE TRABALHO ================= */}
      {projectSubTab === 'workspace' && (
        <div className="space-y-6">
          {/* Quick Inline Task Capture */}
          <form
            onSubmit={handleAddQuickTask}
            className="flex flex-col sm:flex-row items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-2.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex-1 w-full flex items-center gap-2 px-2">
              <PlusCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <input
                type="text"
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                placeholder="O que precisa ser feito agora neste projeto? (Pressione Enter para adicionar)"
                className="w-full bg-transparent text-xs text-neutral-900 placeholder:text-neutral-400 outline-none dark:text-neutral-100"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <select
                value={quickTaskPriority}
                onChange={(e: any) => setQuickTaskPriority(e.target.value)}
                className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-[11px] font-medium text-neutral-700 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              >
                <option value="urgent">Urgente</option>
                <option value="high">Alta</option>
                <option value="medium">Média</option>
                <option value="low">Baixa</option>
                <option value="none">Sem prioridade</option>
              </select>

              <input
                type="date"
                value={quickTaskDueDate}
                onChange={(e) => setQuickTaskDueDate(e.target.value)}
                className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1 text-[11px] text-neutral-700 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              />

              <button
                type="submit"
                disabled={!quickTaskTitle.trim()}
                className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-40 transition-colors"
              >
                Adicionar
              </button>
            </div>
          </form>

          {/* Dual Column Layout: Left (Routines + Focus) & Right (Work Log + Links) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Routines & Focus Blocks (Span 7) */}
            <div className="lg:col-span-7 space-y-6">
              {/* SECTION: Rotinas & Processos Recorrentes do Projeto */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      Rotinas & Processos Periódicos
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAiSuggestRoutines}
                      disabled={isAiRoutinesLoading}
                      className="flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-50 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300"
                      title="O Gemini sugere procedimentos operacionais e rotinas periódicas para este projeto"
                    >
                      {isAiRoutinesLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3 text-violet-600 dark:text-violet-400" />
                      )}
                      <span>Sugerir com IA</span>
                    </button>

                    <button
                      onClick={() => resetProjectRoutines(currentProject.id)}
                      className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-semibold text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                      title="Desmarca todas as rotinas para iniciar um novo ciclo"
                    >
                      Reiniciar Ciclo
                    </button>

                    <button
                      onClick={() => setIsAddingRoutine(true)}
                      className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Nova Rotina</span>
                    </button>
                  </div>
                </div>

                {/* AI Advice Callout */}
                {aiAdvice && (
                  <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50/60 p-3 text-xs text-violet-900 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-200">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Recomendação Estratégica da IA:</p>
                        <p className="mt-0.5 text-[11px] leading-relaxed">{aiAdvice}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* New Routine Inline Form */}
                {isAddingRoutine && (
                  <form onSubmit={handleAddRoutine} className="mt-3 space-y-3 p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-800/60">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        required
                        value={newRoutineTitle}
                        onChange={(e) => setNewRoutineTitle(e.target.value)}
                        placeholder="Nome da rotina (ex: Checar campanhas meta e linkedin, Relatório semanal...)"
                        className="flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 outline-none focus:border-indigo-500"
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <select
                          value={newRoutineFreq}
                          onChange={(e: any) => setNewRoutineFreq(e.target.value)}
                          className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                        >
                          <option value="daily">Diária</option>
                          <option value="weekly">Semanal</option>
                          <option value="biweekly">Quinzenal</option>
                          <option value="monthly">Mensal</option>
                        </select>
                        <input
                          type="time"
                          value={newRoutineTime}
                          onChange={(e) => setNewRoutineTime(e.target.value)}
                          className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                          title="Horário sugerido para a agenda"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-neutral-200/60 dark:border-neutral-700/60 text-[11px]">
                      <div className="flex flex-wrap items-center gap-3 text-neutral-600 dark:text-neutral-400">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newRoutineSyncCalendar}
                            onChange={(e) => setNewRoutineSyncCalendar(e.target.checked)}
                            className="rounded accent-indigo-600 cursor-pointer"
                          />
                          <span>Enviar p/ Calendário & Agenda</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newRoutineSyncHabits}
                            onChange={(e) => setNewRoutineSyncHabits(e.target.checked)}
                            className="rounded accent-indigo-600 cursor-pointer"
                          />
                          <span>Enviar p/ Rotinas Centrais</span>
                        </label>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setIsAddingRoutine(false)}
                          className="px-2.5 py-1 text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                        >
                          Salvar Rotina
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Routines List */}
                <div className="mt-3 divide-y divide-neutral-100 dark:divide-neutral-800">
                  {(!currentProject.routines || currentProject.routines.length === 0) && !isAddingRoutine ? (
                    <div className="py-6 text-center text-xs text-neutral-400">
                      Nenhuma rotina recorrente configurada para este projeto. Clique em "Sugerir com IA" ou crie uma manualmente.
                    </div>
                  ) : (
                    currentProject.routines?.map((routine) => (
                      <div
                        key={routine.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 group hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 px-2.5 rounded-xl transition-colors gap-2"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() => toggleProjectRoutine(currentProject.id, routine.id)}
                            className="text-neutral-400 hover:text-emerald-500 transition-colors shrink-0"
                            title={routine.completed ? 'Marcar como pendente' : 'Marcar como concluída'}
                          >
                            {routine.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <div className="h-5 w-5 rounded-full border border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 transition-colors" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className="rounded-md px-1.5 py-0.5 text-[10px] font-bold border shrink-0"
                                style={{
                                  backgroundColor: `${currentProject.color}15`,
                                  borderColor: `${currentProject.color}40`,
                                  color: currentProject.color,
                                }}
                              >
                                {currentProject.name}
                              </span>

                              <p
                                className={`text-xs font-semibold truncate ${
                                  routine.completed
                                    ? 'line-through text-neutral-400 dark:text-neutral-500'
                                    : 'text-neutral-900 dark:text-neutral-100'
                                }`}
                              >
                                {routine.title}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10px] text-neutral-400">
                              {routine.preferredTime && (
                                <span className="flex items-center gap-0.5 font-mono">
                                  <Clock className="h-2.5 w-2.5" />
                                  {routine.preferredTime}
                                </span>
                              )}
                              {routine.lastCompletedDate && (
                                <span>
                                  Concluído em: {formatDatePT(routine.lastCompletedDate)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          {/* Sync Badges */}
                          {routine.syncToCalendar !== false && (
                            <span
                              className="flex items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50"
                              title="Sincronizado na Agenda diária e no Calendário"
                            >
                              <Calendar className="h-2.5 w-2.5" />
                              <span>Calendário & Agenda</span>
                            </span>
                          )}
                          {routine.syncToHabits !== false && (
                            <span
                              className="flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/50"
                              title="Sincronizado na Central de Rotinas & Hábitos"
                            >
                              <Zap className="h-2.5 w-2.5" />
                              <span>Rotinas Centrais</span>
                            </span>
                          )}

                          <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                            {routine.frequency === 'daily'
                              ? 'Diária'
                              : routine.frequency === 'weekly'
                              ? 'Semanal'
                              : routine.frequency === 'biweekly'
                              ? 'Quinzenal'
                              : 'Mensal'}
                          </span>

                          <button
                            onClick={() => deleteProjectRoutine(currentProject.id, routine.id)}
                            className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-rose-600 p-1 transition-opacity"
                            title="Remover rotina"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* SECTION: Foco e Timer Dedicado */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      Sessão de Foco no Projeto
                    </h3>
                  </div>
                  <span className="text-xs text-neutral-500">
                    Total: {totalHours > 0 ? `${totalHours}h ` : ''}
                    {remainingMinutes}m investidos
                  </span>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800/50">
                  <div>
                    <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      {isTimerForThisProject
                        ? `Cronômetro ativo: ${Math.floor((activeTimer?.secondsRemaining || 0) / 60)}:${String(
                            (activeTimer?.secondsRemaining || 0) % 60
                          ).padStart(2, '0')}`
                        : 'Pronto para trabalhar neste projeto?'}
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Todo tempo cronometrado é registrado automaticamente no histórico do projeto.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isTimerForThisProject ? (
                      <>
                        <button
                          onClick={pauseFocusTimer}
                          className="rounded-xl bg-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-200"
                        >
                          Pausar
                        </button>
                        <button
                          onClick={stopFocusTimer}
                          className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                        >
                          Encerrar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startProjectFocusTimer(currentProject.id, 15)}
                          className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                        >
                          15 min
                        </button>
                        <button
                          onClick={() => startProjectFocusTimer(currentProject.id, 25)}
                          className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                        >
                          25 min (Pomodoro)
                        </button>
                        <button
                          onClick={() => startProjectFocusTimer(currentProject.id, 50)}
                          className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                        >
                          50 min
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION: Próximas Tarefas Pendentes do Projeto */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <List className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      Tarefas em Aberto ({pendingTasks.length})
                    </h3>
                  </div>

                  <button
                    onClick={() => setProjectSubTab('tasks')}
                    className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400 flex items-center gap-1"
                  >
                    <span>Ver todas</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>

                <div className="mt-3 divide-y divide-neutral-100 dark:divide-neutral-800">
                  {pendingTasks.length === 0 ? (
                    <div className="py-6 text-center text-xs text-neutral-400">
                      Tudo em dia! Nenhuma tarefa pendente neste projeto no momento.
                    </div>
                  ) : (
                    pendingTasks.slice(0, 6).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between py-2.5 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 px-2 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateTask(task.id, { status: 'done' })}
                            className="text-neutral-400 hover:text-emerald-500 transition-colors"
                          >
                            <div className="h-4 w-4 rounded-full border border-neutral-300 dark:border-neutral-700 hover:border-emerald-500" />
                          </button>

                          <div>
                            <span
                              onClick={() => setSelectedTaskId(task.id)}
                              className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 hover:text-indigo-600 cursor-pointer"
                            >
                              {task.title}
                            </span>
                            {task.dueDate && (
                              <p className="text-[10px] text-neutral-400 mt-0.5">
                                Prazo: {formatDatePT(task.dueDate)}
                              </p>
                            )}
                          </div>
                        </div>

                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                            task.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : task.priority === 'high'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                          }`}
                        >
                          {task.priority !== 'none' ? task.priority : 'normal'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Work Log & Links & Resources (Span 5) */}
            <div className="lg:col-span-5 space-y-6">
              {/* SECTION: Diário de Bordo / Registro de Trabalho (Work Log) */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      Diário de Bordo do Projeto
                    </h3>
                  </div>

                  <button
                    onClick={() => setIsAddingWorkLog((prev) => !prev)}
                    className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Registrar</span>
                  </button>
                </div>

                {isAddingWorkLog && (
                  <form onSubmit={handleAddWorkLog} className="mt-3 space-y-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800">
                    <textarea
                      required
                      rows={2}
                      value={newWorkLogContent}
                      onChange={(e) => setNewWorkLogContent(e.target.value)}
                      placeholder="O que você realizou hoje neste projeto? (Decisões, entregas, alinhamentos...)"
                      className="w-full rounded-lg border border-neutral-200 bg-white p-2 text-xs text-neutral-900 outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                      autoFocus
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-neutral-500">Tempo gasto (min):</span>
                        <input
                          type="number"
                          min={0}
                          value={newWorkLogMinutes}
                          onChange={(e) => setNewWorkLogMinutes(Number(e.target.value))}
                          className="w-16 rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-xs text-neutral-800 outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingWorkLog(false)}
                          className="text-xs text-neutral-500 hover:text-neutral-800"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
                        >
                          Salvar Registro
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Feed of logs */}
                <div className="mt-3 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {(!currentProject.workLogs || currentProject.workLogs.length === 0) && !isAddingWorkLog ? (
                    <div className="py-6 text-center text-xs text-neutral-400">
                      Nenhum registro de trabalho adicionado ainda. Registre suas atualizações para documentar o avanço contínuo.
                    </div>
                  ) : (
                    currentProject.workLogs?.map((log) => (
                      <div
                        key={log.id}
                        className="group rounded-xl border border-neutral-100 bg-neutral-50/60 p-3 text-xs dark:border-neutral-800 dark:bg-neutral-800/40"
                      >
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                          <span>{log.date}</span>
                          <div className="flex items-center gap-2">
                            {log.durationMinutes && (
                              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                {log.durationMinutes} min
                              </span>
                            )}
                            <button
                              onClick={() => deleteProjectWorkLog(currentProject.id, log.id)}
                              className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-rose-600 transition-opacity"
                              title="Excluir registro"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap">
                          {log.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* SECTION: Links & Recursos Fixados do Projeto */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      Links & Recursos Fixados
                    </h3>
                  </div>

                  <button
                    onClick={() => setIsAddingLink((prev) => !prev)}
                    className="flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Adicionar Link</span>
                  </button>
                </div>

                {isAddingLink && (
                  <form onSubmit={handleAddLink} className="mt-3 space-y-2 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800">
                    <input
                      type="text"
                      required
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                      placeholder="Título (ex: Pasta no Drive, Figma, Portal do Cliente...)"
                      className="w-full rounded-lg border border-neutral-200 bg-white p-2 text-xs text-neutral-900 outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                      autoFocus
                    />
                    <input
                      type="text"
                      required
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      placeholder="URL (ex: drive.google.com/...) "
                      className="w-full rounded-lg border border-neutral-200 bg-white p-2 text-xs text-neutral-900 outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                    />
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingLink(false)}
                        className="text-xs text-neutral-500 hover:text-neutral-800"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
                      >
                        Salvar Link
                      </button>
                    </div>
                  </form>
                )}

                <div className="mt-3 space-y-2">
                  {(!currentProject.links || currentProject.links.length === 0) && !isAddingLink ? (
                    <div className="py-6 text-center text-xs text-neutral-400">
                      Nenhum recurso externo fixado. Adicione links de documentos, pastas no drive ou dashboards.
                    </div>
                  ) : (
                    currentProject.links?.map((link) => (
                      <div
                        key={link.id}
                        className="group flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/60 p-2.5 text-xs hover:border-indigo-200 dark:border-neutral-800 dark:bg-neutral-800/40 transition-colors"
                      >
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-neutral-800 hover:text-indigo-600 dark:text-neutral-200 dark:hover:text-indigo-400 font-medium truncate flex-1"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                          <span className="truncate">{link.title}</span>
                        </a>

                        <button
                          onClick={() => deleteProjectLink(currentProject.id, link.id)}
                          className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-rose-600 p-1 transition-opacity"
                          title="Remover link"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 2: TASKS LIST ================= */}
      {projectSubTab === 'tasks' && (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40">
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              {projectTasks.length} tarefas vinculadas a "{currentProject.name}"
            </span>
            <button
              onClick={() => setIsQuickCaptureOpen(true)}
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Adicionar Tarefa</span>
            </button>
          </div>

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
                      className="text-neutral-400 hover:text-emerald-500 transition-colors"
                    >
                      {task.status === 'done' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border border-neutral-300 dark:border-neutral-700 hover:border-emerald-500" />
                      )}
                    </button>

                    <div>
                      <h4
                        onClick={() => setSelectedTaskId(task.id)}
                        className={`text-xs font-bold cursor-pointer hover:text-indigo-600 transition-colors ${
                          task.status === 'done' ? 'line-through text-neutral-400' : 'text-neutral-900 dark:text-neutral-100'
                        }`}
                      >
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-3 text-[10px] text-neutral-400 mt-0.5">
                        {task.dueDate && <span>Prazo: {formatDatePT(task.dueDate)}</span>}
                        {task.checklist && task.checklist.length > 0 && (
                          <span>
                            {task.checklist.filter((c) => c.completed).length}/{task.checklist.length} checklist
                          </span>
                        )}
                        {task.estimatedDuration && <span>{task.estimatedDuration}m estimados</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                        task.status === 'done'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                      }`}
                    >
                      {task.status === 'done'
                        ? 'Concluído'
                        : task.status === 'in_progress'
                        ? 'Em Andamento'
                        : task.status === 'todo'
                        ? 'A Fazer'
                        : 'Backlog'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 3: KANBAN ================= */}
      {projectSubTab === 'kanban' && (
        <div className="space-y-3">
          {/* Mobile column switch pills */}
          <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
            <button
              onClick={() => setMobileKanbanFilter('all')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                mobileKanbanFilter === 'all'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
              }`}
            >
              Todas ({projectTasks.length})
            </button>
            {(['backlog', 'todo', 'in_progress', 'done'] as TaskStatus[]).map((st) => {
              const count = projectTasks.filter((t) => t.status === st).length;
              const names: Record<string, string> = {
                backlog: 'Backlog',
                todo: 'A Fazer',
                in_progress: 'Em Andamento',
                done: 'Concluído',
              };
              return (
                <button
                  key={st}
                  onClick={() => setMobileKanbanFilter(st)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                    mobileKanbanFilter === st
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                  }`}
                >
                  {names[st]} ({count})
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
            {(['backlog', 'todo', 'in_progress', 'done'] as TaskStatus[])
              .filter((st) => mobileKanbanFilter === 'all' || mobileKanbanFilter === st)
              .map((statusKey) => {
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
                    className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60 min-w-[240px]"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
                      <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        {titles[statusKey]}
                      </span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                        {colTasks.length}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2.5">
                      {colTasks.length === 0 ? (
                        <div className="py-6 text-center text-xs text-neutral-400">
                          Nenhuma tarefa nesta coluna
                        </div>
                      ) : (
                        colTasks.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => setSelectedTaskId(t.id)}
                            className="rounded-xl border border-neutral-200 bg-white p-3 text-xs shadow-xs cursor-pointer hover:border-indigo-300 dark:border-neutral-800 dark:bg-neutral-900 transition-all"
                          >
                            <p className="font-bold text-neutral-900 dark:text-neutral-100 leading-snug">{t.title}</p>
                            <div className="mt-2.5 flex items-center justify-between gap-2 text-[10px] text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
                              {t.priority !== 'none' ? (
                                <span className={`font-semibold capitalize ${
                                  t.priority === 'urgent'
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : t.priority === 'high'
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-neutral-500'
                                }`}>
                                  {t.priority === 'urgent' ? 'Urgente' : t.priority === 'high' ? 'Alta' : t.priority === 'medium' ? 'Média' : 'Baixa'}
                                </span>
                              ) : <span />}

                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-neutral-400">Mover:</span>
                                <select
                                  value={t.status}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => moveTaskStatus(t.id, e.target.value as TaskStatus)}
                                  className="rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-medium text-neutral-700 outline-none cursor-pointer dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                                >
                                  <option value="backlog">Backlog</option>
                                  <option value="todo">A Fazer</option>
                                  <option value="in_progress">Andamento</option>
                                  <option value="done">Concluído</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 4: NOTES & DOCUMENTATION ================= */}
      {projectSubTab === 'notes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Documentação & Caderno do Projeto
              </h3>
              <p className="text-xs text-neutral-500">
                Mantenha atas de reunião, especificações técnicas, briefings e procedimentos salvos dentro do projeto.
              </p>
            </div>

            <button
              onClick={() => setIsCreatingNote(true)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nova Nota</span>
            </button>
          </div>

          {/* New Note Modal */}
          {isCreatingNote && (
            <form onSubmit={handleCreateProjectNote} className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900 shadow-sm">
              <input
                type="text"
                required
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="Título do documento (ex: Procedimento Operacional Padrão, Ata de Reunião...)"
                className="flex-1 bg-transparent text-xs text-neutral-900 dark:text-neutral-100 outline-none px-2"
                autoFocus
              />
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                Criar Documento
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingNote(false)}
                className="text-xs text-neutral-500 hover:text-neutral-800 px-2"
              >
                Cancelar
              </button>
            </form>
          )}

          {/* Notes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projectNotes.length === 0 && !isCreatingNote ? (
              <div className="col-span-full rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-xs text-neutral-400 dark:border-neutral-800">
                Nenhuma nota criada para este projeto ainda. Clique em "Nova Nota" para começar a documentar.
              </div>
            ) : (
              projectNotes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-2 hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      {note.title}
                    </h4>
                    <span className="text-[10px] text-neutral-400">{note.updatedAt}</span>
                  </div>
                  <div className="space-y-1 pt-1">
                    {note.blocks.slice(0, 3).map((b) => (
                      <p key={b.id} className="text-[11px] text-neutral-600 dark:text-neutral-400 line-clamp-2">
                        {b.content || '(Bloco vazio)'}
                      </p>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 5: TIMELINE ================= */}
      {projectSubTab === 'timeline' && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Linha do Tempo e Sequenciamento de Entregas
          </h3>
          <p className="text-xs text-neutral-500">
            Cronograma e fluxo de execução das tarefas do projeto "{currentProject.name}":
          </p>

          <div className="space-y-3 pt-2">
            {projectTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                Nenhuma tarefa com prazo agendada.
              </div>
            ) : (
              projectTasks.map((task, idx) => (
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
                      Prazo: {task.dueDate ? formatDatePT(task.dueDate) : 'A definir'} • Duração estimada: {task.estimatedDuration || 30}m
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
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= EDIT PROJECT MODAL ================= */}
      {isEditProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Editar Configurações do Projeto
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              Atualize o título, escopo, periodicidade e cor deste projeto.
            </p>

            <form onSubmit={handleSaveEditProject} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Nome do Projeto
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 outline-none focus:border-indigo-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Descrição & Escopo
                </label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 outline-none focus:border-indigo-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>

              {/* Recurrent Toggle in Edit */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5 dark:border-indigo-950 dark:bg-indigo-950/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        Projeto Recorrente / Operação Contínua
                      </p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Para demandas periódicas contínuas que requerem rotinas e acompanhamento constante.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={editIsRecurring}
                    onChange={(e) => setEditIsRecurring(e.target.checked)}
                    className="h-4 w-4 rounded accent-indigo-600 cursor-pointer"
                  />
                </div>

                {editIsRecurring && (
                  <div className="mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-950/60 flex items-center gap-3">
                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Ciclo de Recorrência:
                    </span>
                    <select
                      value={editRecurrenceFreq}
                      onChange={(e: any) => setEditRecurrenceFreq(e.target.value)}
                      className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs text-neutral-800 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    >
                      <option value="continuous">Operação Contínua</option>
                      <option value="weekly">Ciclo Semanal</option>
                      <option value="daily">Ciclo Diário</option>
                      <option value="biweekly">Ciclo Quinzenal</option>
                      <option value="monthly">Ciclo Mensal</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Cor
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="h-8 w-12 rounded cursor-pointer border border-neutral-200"
                    />
                    <span className="text-xs font-mono text-neutral-500">{editColor}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {editIsRecurring ? 'Data de Início / Marco' : 'Data Limite'}
                  </label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-900 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditProjectModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
