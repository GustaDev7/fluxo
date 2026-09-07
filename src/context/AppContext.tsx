import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Task,
  Project,
  ProjectRoutine,
  ProjectLink,
  ProjectWorkLog,
  CalendarEvent,
  Goal,
  Habit,
  NotePage,
  MonthlyPlan,
  AppNotification,
  UserProfile,
  KanbanColumn,
  TimeEntry,
  ActiveNavTab,
  TaskStatus,
  Priority,
  NoteBlock,
  AIChatMessage,
  AIExecutedAction,
  AppToast,
} from '../types';
import { EnrichedProjectRoutine, getAllEnrichedProjectRoutines } from '../utils/routineUtils';
import {
  DEFAULT_USER,
  DEFAULT_COLUMNS,
  DEFAULT_MONTHLY_PLAN,
} from '../data/initialData';
import { getTodayDateString, formatDateToYYYYMMDD, calculateNextRecurrenceDate, getTomorrowDateString } from '../utils/date';
import { parseQuickTask } from '../utils/smartParser';
import { useAuth } from './AuthContext';
import { loadProductivityData, saveProductivityData } from '../lib/supabaseStore';
import { authenticatedFetch } from '../lib/api';

interface ActiveTimer {
  taskId?: string;
  projectId?: string;
  taskTitle: string;
  projectTitle?: string;
  secondsRemaining: number;
  isRunning: boolean;
  totalSeconds: number;
  mode: 'focus' | 'shortBreak' | 'longBreak';
}

interface AppContextType {
  // Navigation & UI state
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  isQuickCaptureOpen: boolean;
  setIsQuickCaptureOpen: (open: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTagFilter: string | null;
  setSelectedTagFilter: (tag: string | null) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  isShortcutsOpen: boolean;
  setIsShortcutsOpen: (open: boolean) => void;

  // Immediate Feedback & Undo (Princípios #15 e #16)
  toast: AppToast | null;
  showToast: (
    message: string,
    options?: {
      type?: 'success' | 'info' | 'warning';
      undoAction?: () => void;
      undoLabel?: string;
      durationMs?: number;
    }
  ) => void;
  dismissToast: () => void;

  // Data
  user: UserProfile;
  columns: KanbanColumn[];
  tasks: Task[];
  projects: Project[];
  events: CalendarEvent[];
  goals: Goal[];
  habits: Habit[];
  notes: NotePage[];
  monthlyPlan: MonthlyPlan;
  notifications: AppNotification[];
  timeEntries: TimeEntry[];
  activeTimer: ActiveTimer | null;
  isAiLoading: boolean;
  allProjectRoutines: EnrichedProjectRoutine[];

  // Actions - Tasks
  addTask: (task: Partial<Task>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  toggleChecklistItem: (taskId: string, checklistId: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addCommentToTask: (taskId: string, text: string) => void;
  convertInboxTask: (taskId: string, updates: Partial<Task>) => void;

  // Actions - Projects
  addProject: (project: Partial<Project>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addProjectRoutine: (
    projectId: string,
    title: string,
    frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly',
    preferredTime?: string,
    syncToCalendar?: boolean,
    syncToHabits?: boolean,
    dayOfWeek?: number,
    dayOfMonth?: number
  ) => void;
  toggleProjectRoutine: (projectId: string, routineId: string, dateStr?: string) => void;
  resetProjectRoutines: (projectId: string) => void;
  deleteProjectRoutine: (projectId: string, routineId: string) => void;
  addProjectLink: (projectId: string, title: string, url: string) => void;
  deleteProjectLink: (projectId: string, linkId: string) => void;
  addProjectWorkLog: (projectId: string, content: string, durationMinutes?: number) => void;
  deleteProjectWorkLog: (projectId: string, logId: string) => void;
  startProjectFocusTimer: (projectId: string, durationMinutes?: number) => void;

  // Actions - Calendar Events
  addEvent: (event: Partial<CalendarEvent>) => CalendarEvent;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;

  // Actions - Goals
  addGoal: (goal: Partial<Goal>) => Goal;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  incrementGoalProgress: (id: string, delta: number) => void;

  // Actions - Habits
  toggleHabitDay: (habitId: string, dateStr?: string) => void;
  addHabit: (habit: Partial<Habit>) => Habit;
  deleteHabit: (id: string) => void;

  // Actions - Notes
  addNote: (note: Partial<NotePage>) => NotePage;
  updateNote: (id: string, updates: Partial<NotePage>) => void;
  deleteNote: (id: string) => void;
  addNoteBlock: (noteId: string, type?: NoteBlock['type']) => void;
  updateNoteBlock: (noteId: string, blockId: string, updates: Partial<NoteBlock>) => void;
  deleteNoteBlock: (noteId: string, blockId: string) => void;

  // Actions - Monthly Plan
  updateMonthlyObjective: (id: string, updates: any) => void;
  addMonthlyObjective: (obj: any) => void;
  deleteMonthlyObjective: (id: string) => void;
  toggleFinanceStatus: (id: string) => void;
  addFinanceCommitment: (item: any) => void;
  deleteFinanceCommitment: (id: string) => void;
  updateFocusNotes: (text: string) => void;

  // Actions - Notifications
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;

  // Actions - Focus & Timer
  startFocusTimer: (taskId?: string, taskTitle?: string, durationMinutes?: number) => void;
  pauseFocusTimer: () => void;
  resumeFocusTimer: () => void;
  stopFocusTimer: () => void;

  // Actions - Profile & Settings
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  toggleWidgetVisibility: (widgetKey: keyof UserProfile['visibleWidgets']) => void;
  exportBackupJson: () => string;
  importBackupJson: (jsonString: string) => boolean;
  resetToSampleData: () => void;
  clearToCleanSlate: () => void;

  // Actions - AI Assistant & Voice Chat
  aiParseAndCreateTask: (rawText: string) => Promise<Task>;
  aiBreakdownProjectTasks: (projectId: string) => Promise<Task[]>;
  aiGetSmartPriorities: () => Promise<{ topTaskIds: string[]; briefing: string; suggestions: string[] }>;
  chatMessages: AIChatMessage[];
  isAssistantOpen: boolean;
  setIsAssistantOpen: (open: boolean) => void;
  sendAssistantMessage: (text: string, isVoice?: boolean) => Promise<AIChatMessage>;
  clearChatHistory: () => void;
  executeAiAction: (action: { type: string; data: any }) => Promise<{ success: boolean; summary: string }>;

  // Database status & Real-time Sync
  isDbConnected: boolean;
  isDbSaving: boolean;
  lastDbSyncedAt: string | null;
  forceDbSync: () => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser } = useAuth();
  // Database status
  const [isDbConnected, setIsDbConnected] = useState(true);
  const [isDbSaving, setIsDbSaving] = useState(false);
  const [lastDbSyncedAt, setLastDbSyncedAt] = useState<string | null>(null);
  const [isHydratedFromDb, setIsHydratedFromDb] = useState(false);

  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Toast & Undo feedback state
  const [toast, setToast] = useState<AppToast | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(null);
  }, []);

  const showToast = useCallback(
    (
      message: string,
      options?: {
        type?: 'success' | 'info' | 'warning';
        undoAction?: () => void;
        undoLabel?: string;
        durationMs?: number;
      }
    ) => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      const newToast: AppToast = {
        id: 'toast_' + Date.now(),
        message,
        type: options?.type || 'success',
        undoAction: options?.undoAction,
        undoLabel: options?.undoLabel || 'Desfazer',
      };
      setToast(newToast);
      toastTimerRef.current = setTimeout(() => {
        setToast(null);
      }, options?.durationMs || (options?.undoAction ? 6000 : 3500));
    },
    []
  );

  // Entities state with strict sanitization (no sample data)
  const [user, setUser] = useState<UserProfile>(() => ({
    ...DEFAULT_USER,
    id: authUser?.id || DEFAULT_USER.id,
    email: authUser?.email || '',
    name: authUser?.user_metadata?.full_name || DEFAULT_USER.name,
    theme: (localStorage.getItem('fluxo_theme') as UserProfile['theme']) || DEFAULT_USER.theme,
  }));

  const [columns] = useState<KanbanColumn[]>(DEFAULT_COLUMNS);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [notes, setNotes] = useState<NotePage[]>([]);
  const [monthlyPlan, setMonthlyPlan] = useState<MonthlyPlan>(DEFAULT_MONTHLY_PLAN);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);

  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);

  // Derived: All project routines with project tags & metadata
  const allProjectRoutines = useMemo(() => getAllEnrichedProjectRoutines(projects), [projects]);

  // AI Conversational Assistant & Voice state
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<AIChatMessage[]>([
      {
        id: 'msg_welcome',
        sender: 'assistant',
        text: 'Olá! Sou seu Copiloto de Produtividade com IA Gemini. Você pode falar comigo por voz ou escrever aqui para criar tarefas, agendar reuniões, estruturar projetos ou tirar dúvidas sobre sua rotina.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        suggestedPrompts: [
          'Crie uma tarefa urgente para hoje',
          'Agende uma reunião com a equipe amanhã às 10h',
          'O que eu tenho pendente para hoje?',
          'Crie um projeto chamado Lançamento Beta',
        ],
      },
    ]);

  const isDarkMode =
    user.theme === 'dark' ||
    (user.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const setIsDarkMode = useCallback((dark: boolean) => {
    setUser((prev) => {
      const updated = { ...prev, theme: dark ? ('dark' as const) : ('light' as const) };
      localStorage.setItem('fluxo_theme', updated.theme);
      return updated;
    });
  }, []);

  // Apply theme class to document element
  useEffect(() => {
    const root = document.documentElement;
    if (user.theme === 'dark') {
      root.classList.add('dark');
    } else if (user.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // system
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [user.theme]);

  // Load the authenticated user's data from Supabase.
  useEffect(() => {
    if (!authUser) return;
    loadProductivityData()
      .then((data) => {
        setUser((current) => ({
          ...current,
          ...(data.user || {}),
          id: authUser.id,
          email: authUser.email || '',
          name: data.user?.name || authUser.user_metadata?.full_name || current.name,
        }));
        setTasks(data.tasks as Task[]);
        setProjects(data.projects as Project[]);
        setEvents(data.events as CalendarEvent[]);
        setGoals(data.goals as Goal[]);
        setHabits(data.habits as Habit[]);
        setNotes(data.notes as NotePage[]);
        if (data.monthlyPlan) setMonthlyPlan(data.monthlyPlan as MonthlyPlan);
        setNotifications(data.notifications as AppNotification[]);
        setTimeEntries(data.timeEntries as TimeEntry[]);
        if (data.chatMessages.length) setChatMessages(data.chatMessages as AIChatMessage[]);
        setIsDbConnected(true);
        setLastDbSyncedAt(new Date().toLocaleTimeString('pt-BR'));
      })
      .catch((err) => {
        console.error('Supabase data load failed:', err);
        setIsDbConnected(false);
      })
      .finally(() => {
        setIsHydratedFromDb(true);
      });
  }, [authUser]);

  // Persist authenticated data in Supabase. Browser storage is not a data source.
  useEffect(() => {
    if (!isHydratedFromDb || !authUser) return;

    setIsDbSaving(true);
    const timer = setTimeout(() => {
      saveProductivityData(authUser.id, { user, tasks, projects, events, goals, habits, notes, monthlyPlan, notifications, timeEntries, chatMessages: chatMessages.slice(-50) })
        .then(() => {
          setIsDbConnected(true);
          setLastDbSyncedAt(new Date().toLocaleTimeString('pt-BR'));
        })
        .catch((e) => {
          console.error('Supabase data save failed:', e);
          setIsDbConnected(false);
        })
        .finally(() => {
          setIsDbSaving(false);
        });
    }, 700);

    return () => clearTimeout(timer);
  }, [authUser, isHydratedFromDb, user, tasks, projects, events, goals, habits, notes, monthlyPlan, notifications, timeEntries, chatMessages]);

  // Pomodoro countdown timer tick
  useEffect(() => {
    if (!activeTimer || !activeTimer.isRunning) return;

    const interval = setInterval(() => {
      setActiveTimer((prev) => {
        if (!prev) return null;
        if (prev.secondsRemaining <= 1) {
          // Timer finished
          if (prev.taskId || prev.projectId) {
            const minutesElapsed = Math.round(prev.totalSeconds / 60);
            // Log time entry
            const newEntry: TimeEntry = {
              id: crypto.randomUUID(),
              taskId: prev.taskId,
              projectId: prev.projectId,
              taskTitle: prev.taskTitle,
              projectTitle: prev.projectTitle,
              startTime: new Date(Date.now() - prev.totalSeconds * 1000).toISOString(),
              endTime: new Date().toISOString(),
              durationMinutes: minutesElapsed,
              date: getTodayDateString(),
            };
            setTimeEntries((entries) => [newEntry, ...entries]);

            // Add timeSpent to task if task exists
            if (prev.taskId) {
              setTasks((curr) =>
                curr.map((t) => (t.id === prev.taskId ? { ...t, timeSpent: (t.timeSpent || 0) + minutesElapsed } : t))
              );
            }

            // If project is set, record work log on project
            if (prev.projectId) {
              const projectLog: ProjectWorkLog = {
                id: `log_${Date.now()}`,
                date: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
                content: `Sessão de foco concluída (${minutesElapsed} min).`,
                durationMinutes: minutesElapsed,
              };
              setProjects((curr) =>
                curr.map((p) => (p.id === prev.projectId ? { ...p, workLogs: [projectLog, ...(p.workLogs || [])] } : p))
              );
            }
          }

          // Add notification
          const notif: AppNotification = {
            id: `notif_${Date.now()}`,
            title: 'Sessão de Foco Concluída',
            message: `Você completou o bloco de foco para "${prev.taskTitle}". Que tal uma pausa revigorante?`,
            type: 'system',
            timestamp: 'Agora',
            read: false,
            linkView: 'focus',
          };
          setNotifications((n) => [notif, ...n]);

          return { ...prev, secondsRemaining: 0, isRunning: false };
        }
        return { ...prev, secondsRemaining: prev.secondsRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  // Global Keyboard shortcuts (Ctrl+K / Cmd+K for Command Palette)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update project progress dynamically when tasks change
  useEffect(() => {
    setProjects((prevProjects) =>
      prevProjects.map((p) => {
        const projectTasks = tasks.filter((t) => t.projectId === p.id && !t.isInbox);
        if (projectTasks.length === 0) return p;
        const doneCount = projectTasks.filter((t) => t.status === 'done').length;
        const calcProgress = Math.round((doneCount / projectTasks.length) * 100);
        return { ...p, progress: calcProgress };
      })
    );
  }, [tasks]);

  // ================= TASK ACTIONS =================

  const addTask = useCallback((taskData: Partial<Task>): Task => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: taskData.title || 'Nova Tarefa',
      description: taskData.description || '',
      status: taskData.status || 'todo',
      priority: taskData.priority || 'none',
      createdAt: getTodayDateString(),
      dueDate: taskData.dueDate,
      dueTime: taskData.dueTime,
      estimatedDuration: taskData.estimatedDuration || 30,
      timeSpent: taskData.timeSpent || 0,
      projectId: taskData.projectId,
      assigneeName: taskData.assigneeName || user.name,
      tags: taskData.tags || [],
      checklist: taskData.checklist || [],
      subtasks: taskData.subtasks || [],
      dependencies: taskData.dependencies || [],
      reminders: taskData.reminders || [],
      recurrence: taskData.recurrence || { type: 'none' },
      comments: taskData.comments || [],
      attachments: taskData.attachments || [],
      isInbox: taskData.isInbox ?? false,
    };

    setTasks((prev) => [newTask, ...prev]);

    showToast('Tarefa adicionada', {
      undoAction: () => deleteTask(newTask.id),
      undoLabel: 'Desfazer',
    });

    // Create notification if high or urgent priority
    if (newTask.priority === 'urgent') {
      const notif: AppNotification = {
        id: `notif_${Date.now()}`,
        title: 'Tarefa Urgente Criada',
        message: `A tarefa "${newTask.title}" foi marcada com prioridade máxima.`,
        type: 'task_due',
        timestamp: 'Agora',
        read: false,
        linkView: 'tasks',
      };
      setNotifications((n) => [notif, ...n]);
    }

    return newTask;
  }, [user.name]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) => {
      let taskToRecur: Task | null = null;

      const newTasks = prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, ...updates };
          if (updates.status === 'done' && t.status !== 'done') {
            updated.completedAt = getTodayDateString();
            if (t.recurrence && t.recurrence.type && t.recurrence.type !== 'none') {
              taskToRecur = t;
            }
          }
          return updated;
        }
        return t;
      });

      if (taskToRecur) {
        const cur: Task = taskToRecur;
        const nextDueDate = calculateNextRecurrenceDate(
          cur.dueDate || getTodayDateString(),
          cur.recurrence!.type as 'daily' | 'weekdays' | 'weekly' | 'biweekly' | 'monthly' | 'yearly',
          cur.recurrence!.interval
        );

        setTimeout(() => {
          addTask({
            title: cur.title,
            description: cur.description,
            status: 'todo',
            priority: cur.priority,
            dueDate: nextDueDate,
            dueTime: cur.dueTime,
            estimatedDuration: cur.estimatedDuration,
            projectId: cur.projectId,
            assigneeName: cur.assigneeName,
            tags: cur.tags,
            checklist: (cur.checklist || []).map((c) => ({
              ...c,
              id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              completed: false,
            })),
            subtasks: (cur.subtasks || []).map((s) => ({
              ...s,
              id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              completed: false,
            })),
            recurrence: cur.recurrence,
            isInbox: false,
          });

          setNotifications((n) => [
            {
              id: `notif_${Date.now()}`,
              title: 'Rotina Renovada',
              message: `Próxima ocorrência de "${cur.title}" agendada para ${nextDueDate}.`,
              type: 'task_due',
              timestamp: 'Agora',
              read: false,
              linkView: 'tasks',
            },
            ...n,
          ]);
        }, 100);
      }

      return newTasks;
    });
  }, [addTask]);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => {
      const taskToDelete = prev.find((t) => t.id === id);
      if (taskToDelete) {
        showToast('Tarefa excluída', {
          undoAction: () => setTasks((current) => [taskToDelete, ...current]),
          undoLabel: 'Desfazer',
        });
      }
      return prev.filter((t) => t.id !== id);
    });
    if (selectedTaskId === id) setSelectedTaskId(null);
  }, [selectedTaskId, showToast]);

  const moveTaskStatus = useCallback((taskId: string, newStatus: TaskStatus) => {
    updateTask(taskId, { status: newStatus });
    if (newStatus === 'done') {
      showToast('Tarefa concluída');
    }
  }, [updateTask, showToast]);

  const toggleChecklistItem = useCallback((taskId: string, checklistId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            checklist: t.checklist.map((c) => (c.id === checklistId ? { ...c, completed: !c.completed } : c)),
          };
        }
        return t;
      })
    );
  }, []);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            subtasks: t.subtasks.map((s) => (s.id === subtaskId ? { ...s, completed: !s.completed } : s)),
          };
        }
        return t;
      })
    );
  }, []);

  const addCommentToTask = useCallback((taskId: string, text: string) => {
    const comment = {
      id: `com_${Date.now()}`,
      author: user.name,
      text,
      createdAt: getTodayDateString(),
    };
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, comments: [...t.comments, comment] } : t))
    );
  }, [user.name]);

  const convertInboxTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates, isInbox: false, status: updates.status || 'todo' } : t))
    );
  }, []);

  // ================= PROJECT ACTIONS =================

  const addProject = useCallback((projData: Partial<Project>): Project => {
    const newProj: Project = {
      id: crypto.randomUUID(),
      name: projData.name || 'Novo Projeto',
      description: projData.description || '',
      color: projData.color || '#3b82f6',
      icon: projData.icon || 'Folder',
      status: projData.status || 'active',
      priority: projData.priority || 'medium',
      startDate: projData.startDate || getTodayDateString(),
      dueDate: projData.dueDate,
      progress: 0,
      members: projData.members || [user.name],
      viewPreference: projData.viewPreference || 'workspace',
      isRecurring: projData.isRecurring ?? false,
      recurrenceFrequency: projData.recurrenceFrequency || (projData.isRecurring ? 'weekly' : undefined),
      routines: projData.routines || [],
      links: projData.links || [],
      workLogs: projData.workLogs || [],
    };
    setProjects((prev) => [newProj, ...prev]);
    return newProj;
  }, [user.name]);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (selectedProjectId === id) setSelectedProjectId(null);
  }, [selectedProjectId]);

  const addProjectRoutine = useCallback(
    (
      projectId: string,
      title: string,
      frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' = 'daily',
      preferredTime = '09:00',
      syncToCalendar = true,
      syncToHabits = true,
      dayOfWeek?: number,
      dayOfMonth?: number
    ) => {
      if (!title.trim()) return;
      const newRoutine: ProjectRoutine = {
        id: `rout_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        title: title.trim(),
        frequency,
        completed: false,
        preferredTime,
        syncToCalendar,
        syncToHabits,
        completedDates: [],
        dayOfWeek,
        dayOfMonth,
      };
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, routines: [...(p.routines || []), newRoutine] } : p))
      );
    },
    []
  );

  const toggleProjectRoutine = useCallback((projectId: string, routineId: string, dateStr = getTodayDateString()) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const updated = (p.routines || []).map((r) => {
          if (r.id === routineId) {
            const currentCompletedDates = r.completedDates || [];
            const isDoneOnDate = currentCompletedDates.includes(dateStr);
            const nextCompletedDates = isDoneOnDate
              ? currentCompletedDates.filter((d) => d !== dateStr)
              : [...currentCompletedDates, dateStr];

            const isToday = dateStr === getTodayDateString();
            const nextCompleted = isToday ? !isDoneOnDate : r.completed;

            return {
              ...r,
              completed: nextCompleted,
              lastCompletedDate: !isDoneOnDate ? dateStr : r.lastCompletedDate,
              completedDates: nextCompletedDates,
            };
          }
          return r;
        });
        return { ...p, routines: updated };
      })
    );
  }, []);

  const resetProjectRoutines = useCallback((projectId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const resetList = (p.routines || []).map((r) => ({ ...r, completed: false }));
        return { ...p, routines: resetList };
      })
    );
  }, []);

  const deleteProjectRoutine = useCallback((projectId: string, routineId: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, routines: (p.routines || []).filter((r) => r.id !== routineId) } : p))
    );
  }, []);

  const addProjectLink = useCallback((projectId: string, title: string, url: string) => {
    if (!title.trim() || !url.trim()) return;
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }
    const newLink: ProjectLink = {
      id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: title.trim(),
      url: formattedUrl,
    };
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, links: [...(p.links || []), newLink] } : p))
    );
  }, []);

  const deleteProjectLink = useCallback((projectId: string, linkId: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, links: (p.links || []).filter((l) => l.id !== linkId) } : p))
    );
  }, []);

  const addProjectWorkLog = useCallback((projectId: string, content: string, durationMinutes?: number) => {
    if (!content.trim()) return;
    const newLog: ProjectWorkLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      date: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
      content: content.trim(),
      durationMinutes,
    };
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, workLogs: [newLog, ...(p.workLogs || [])] } : p))
    );
  }, []);

  const deleteProjectWorkLog = useCallback((projectId: string, logId: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, workLogs: (p.workLogs || []).filter((l) => l.id !== logId) } : p))
    );
  }, []);

  const startProjectFocusTimer = useCallback(
    (projectId: string, durationMinutes = 25) => {
      const proj = projects.find((p) => p.id === projectId);
      const title = proj ? proj.name : 'Projeto';
      const seconds = durationMinutes * 60;
      setActiveTimer({
        projectId,
        taskTitle: `Projeto: ${title}`,
        projectTitle: title,
        secondsRemaining: seconds,
        isRunning: true,
        totalSeconds: seconds,
        mode: 'focus',
      });
      setActiveTab('focus');
    },
    [projects]
  );

  // ================= EVENT ACTIONS =================

  const addEvent = useCallback((eventData: Partial<CalendarEvent>): CalendarEvent => {
    const newEvt: CalendarEvent = {
      id: crypto.randomUUID(),
      title: eventData.title || 'Novo Evento',
      description: eventData.description || '',
      startDate: eventData.startDate || getTodayDateString(),
      startTime: eventData.startTime || '09:00',
      endDate: eventData.endDate || eventData.startDate || getTodayDateString(),
      endTime: eventData.endTime || '10:00',
      isAllDay: eventData.isAllDay ?? false,
      color: eventData.color || '#3b82f6',
      location: eventData.location,
      participants: eventData.participants || [],
      recurrence: eventData.recurrence,
      projectId: eventData.projectId,
      taskId: eventData.taskId,
      isFocusBlock: eventData.isFocusBlock ?? false,
    };
    setEvents((prev) => [...prev, newEvt]);
    return newEvt;
  }, []);

  const updateEvent = useCallback((id: string, updates: Partial<CalendarEvent>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // ================= GOAL ACTIONS =================

  const addGoal = useCallback((goalData: Partial<Goal>): Goal => {
    const newGoal: Goal = {
      id: crypto.randomUUID(),
      title: goalData.title || 'Nova Meta',
      description: goalData.description || '',
      period: goalData.period || 'monthly',
      category: goalData.category || 'Geral',
      targetValue: goalData.targetValue || 10,
      currentValue: goalData.currentValue || 0,
      unit: goalData.unit || 'unidades',
      deadline: goalData.deadline || getTodayDateString(),
      linkedTaskIds: goalData.linkedTaskIds || [],
      status: 'active',
    };
    setGoals((prev) => [...prev, newGoal]);
    return newGoal;
  }, []);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const updated = { ...g, ...updates };
          if (updated.currentValue >= updated.targetValue) {
            updated.status = 'completed';
          }
          return updated;
        }
        return g;
      })
    );
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const incrementGoalProgress = useCallback((id: string, delta: number) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const nextVal = Math.max(0, g.currentValue + delta);
          return {
            ...g,
            currentValue: nextVal,
            status: nextVal >= g.targetValue ? 'completed' : 'active',
          };
        }
        return g;
      })
    );
  }, []);

  // ================= HABIT ACTIONS =================

  const toggleHabitDay = useCallback((habitId: string, dateStr = getTodayDateString()) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === habitId) {
          const exists = h.completedDates.includes(dateStr);
          const newDates = exists
            ? h.completedDates.filter((d) => d !== dateStr)
            : [...h.completedDates, dateStr];

          // Recalculate streak
          let streak = 0;
          let checkDate = new Date();
          if (exists && dateStr === getTodayDateString()) {
            checkDate.setDate(checkDate.getDate() - 1);
          }

          while (true) {
            const formatted = formatDateToYYYYMMDD(checkDate);
            if (newDates.includes(formatted)) {
              streak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              break;
            }
          }

          return {
            ...h,
            completedDates: newDates,
            currentStreak: streak,
            longestStreak: Math.max(h.longestStreak, streak),
          };
        }
        return h;
      })
    );
  }, []);

  const addHabit = useCallback((habitData: Partial<Habit>): Habit => {
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      name: habitData.name || 'Novo Hábito',
      category: habitData.category || 'Saúde',
      icon: habitData.icon || 'Sparkles',
      color: habitData.color || '#3b82f6',
      frequency: habitData.frequency || 'daily',
      targetDaysPerWeek: habitData.targetDaysPerWeek || 7,
      timeOfDay: habitData.timeOfDay || 'anytime',
      completedDates: [],
      currentStreak: 0,
      longestStreak: 0,
    };
    setHabits((prev) => [...prev, newHabit]);
    return newHabit;
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }, []);

  // ================= NOTE ACTIONS =================

  const addNote = useCallback((noteData: Partial<NotePage>): NotePage => {
    const newNote: NotePage = {
      id: crypto.randomUUID(),
      title: noteData.title || 'Sem título',
      icon: noteData.icon || '',
      projectId: noteData.projectId,
      taskId: noteData.taskId,
      goalId: noteData.goalId,
      tags: noteData.tags || [],
      blocks: noteData.blocks || [
        { id: `b_${Date.now()}_1`, type: 'h1', content: noteData.title || 'Título do Documento' },
        { id: `b_${Date.now()}_2`, type: 'p', content: 'Comece a escrever sua nota ou documentação aqui...' },
      ],
      updatedAt: getTodayDateString(),
      createdAt: getTodayDateString(),
    };
    setNotes((prev) => [newNote, ...prev]);
    return newNote;
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<NotePage>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: getTodayDateString() } : n))
    );
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNoteBlock = useCallback((noteId: string, type: NoteBlock['type'] = 'p') => {
    const newBlock: NoteBlock = {
      id: `b_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type,
      content: '',
      checked: false,
      isOpen: true,
    };
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === noteId) {
          return {
            ...n,
            blocks: [...n.blocks, newBlock],
            updatedAt: getTodayDateString(),
          };
        }
        return n;
      })
    );
  }, []);

  const updateNoteBlock = useCallback((noteId: string, blockId: string, updates: Partial<NoteBlock>) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === noteId) {
          return {
            ...n,
            blocks: n.blocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b)),
            updatedAt: getTodayDateString(),
          };
        }
        return n;
      })
    );
  }, []);

  const deleteNoteBlock = useCallback((noteId: string, blockId: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === noteId) {
          return {
            ...n,
            blocks: n.blocks.filter((b) => b.id !== blockId),
            updatedAt: getTodayDateString(),
          };
        }
        return n;
      })
    );
  }, []);

  // ================= MONTHLY PLAN ACTIONS =================

  const updateMonthlyObjective = useCallback((id: string, updates: any) => {
    setMonthlyPlan((prev) => ({
      ...prev,
      objectives: prev.objectives.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    }));
  }, []);

  const addMonthlyObjective = useCallback((obj: any) => {
    setMonthlyPlan((prev) => ({
      ...prev,
      objectives: [
        ...prev.objectives,
        { ...obj, id: `m_obj_${Date.now()}`, completed: false },
      ],
    }));
  }, []);

  const deleteMonthlyObjective = useCallback((id: string) => {
    setMonthlyPlan((prev) => ({
      ...prev,
      objectives: prev.objectives.filter((o) => o.id !== id),
    }));
  }, []);

  const toggleFinanceStatus = useCallback((id: string) => {
    setMonthlyPlan((prev) => ({
      ...prev,
      finances: prev.finances.map((f) =>
        f.id === id ? { ...f, status: f.status === 'paid' ? 'pending' : 'paid' } : f
      ),
    }));
  }, []);

  const addFinanceCommitment = useCallback((item: any) => {
    setMonthlyPlan((prev) => ({
      ...prev,
      finances: [
        ...prev.finances,
        { ...item, id: `fin_${Date.now()}`, status: 'pending' },
      ],
    }));
  }, []);

  const deleteFinanceCommitment = useCallback((id: string) => {
    setMonthlyPlan((prev) => ({
      ...prev,
      finances: prev.finances.filter((f) => f.id !== id),
    }));
  }, []);

  const updateFocusNotes = useCallback((text: string) => {
    setMonthlyPlan((prev) => ({ ...prev, focusNotes: text }));
  }, []);

  // ================= NOTIFICATION ACTIONS =================

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // ================= FOCUS / TIMER ACTIONS =================

  const startFocusTimer = useCallback(
    (taskId?: string, taskTitle = 'Bloco de Foco', durationMinutes = 25) => {
      const seconds = durationMinutes * 60;
      setActiveTimer({
        taskId,
        taskTitle,
        secondsRemaining: seconds,
        isRunning: true,
        totalSeconds: seconds,
        mode: 'focus',
      });
      setActiveTab('focus');
    },
    []
  );

  const pauseFocusTimer = useCallback(() => {
    setActiveTimer((prev) => (prev ? { ...prev, isRunning: false } : null));
  }, []);

  const resumeFocusTimer = useCallback(() => {
    setActiveTimer((prev) => (prev ? { ...prev, isRunning: true } : null));
  }, []);

  const stopFocusTimer = useCallback(() => {
    setActiveTimer(null);
  }, []);

  // ================= USER PROFILE & SETTINGS =================

  const updateUserProfile = useCallback((updates: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updates }));
  }, []);

  const toggleWidgetVisibility = useCallback((widgetKey: keyof UserProfile['visibleWidgets']) => {
    setUser((prev) => ({
      ...prev,
      visibleWidgets: {
        ...prev.visibleWidgets,
        [widgetKey]: !prev.visibleWidgets[widgetKey],
      },
    }));
  }, []);

  const exportBackupJson = useCallback(() => {
    const backup = {
      exportedAt: new Date().toISOString(),
      user,
      tasks,
      projects,
      events,
      goals,
      habits,
      notes,
      monthlyPlan,
      notifications,
      timeEntries,
    };
    return JSON.stringify(backup, null, 2);
  }, [user, tasks, projects, events, goals, habits, notes, monthlyPlan, notifications, timeEntries]);

  const importBackupJson = useCallback((jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.tasks) setTasks(data.tasks);
      if (data.projects) setProjects(data.projects);
      if (data.events) setEvents(data.events);
      if (data.goals) setGoals(data.goals);
      if (data.habits) setHabits(data.habits);
      if (data.notes) setNotes(data.notes);
      if (data.monthlyPlan) setMonthlyPlan(data.monthlyPlan);
      if (data.user) setUser(data.user);
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }, []);

  const forceDbSync = useCallback(async (): Promise<boolean> => {
    if (!authUser) return false;
    setIsDbSaving(true);
    try {
      await saveProductivityData(authUser.id, { user, tasks, projects, events, goals, habits, notes, monthlyPlan, notifications, timeEntries, chatMessages: chatMessages.slice(-50) });
      setIsDbConnected(true);
      setLastDbSyncedAt(new Date().toLocaleTimeString('pt-BR'));
      return true;
    } catch {
      setIsDbConnected(false);
      return false;
    } finally {
      setIsDbSaving(false);
    }
  }, [authUser, user, tasks, projects, events, goals, habits, notes, monthlyPlan, notifications, timeEntries, chatMessages]);

  const resetToSampleData = useCallback(() => {
    showToast('Dados de demonstração foram desativados. O Fluxo utiliza apenas dados reais.', { type: 'info' });
  }, [showToast]);

  const clearToCleanSlate = useCallback(() => {
    setTasks([]);
    setProjects([]);
    setEvents([]);
    setGoals([]);
    setHabits([]);
    setNotes([]);
    setMonthlyPlan({
      month: getTodayDateString().slice(0, 7),
      objectives: [],
      finances: [],
      focusNotes: '',
    });
    setNotifications([
      {
        id: `notif_${Date.now()}`,
        title: 'Espaço Limpo Ativado',
        message: 'Seu ambiente foi limpo! Você já pode cadastrar suas tarefas, rotinas e metas reais com sincronização contínua ao banco.',
        type: 'system',
        timestamp: 'Agora',
        read: false,
        linkView: 'dashboard',
      },
    ]);
    setTimeEntries([]);
  }, []);

  // ================= AI ASSISTANT ACTIONS =================

  const aiParseAndCreateTask = useCallback(
    async (rawText: string): Promise<Task> => {
      setIsAiLoading(true);
      try {
        const res = await authenticatedFetch('/api/ai/parse-task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: rawText, referenceDate: getTodayDateString() }),
        });

        if (res.ok) {
          const aiData = await res.json();
          const task = addTask({
            title: aiData.title || rawText,
            description: aiData.description,
            dueDate: aiData.dueDate || undefined,
            dueTime: aiData.dueTime || undefined,
            priority: aiData.priority || 'none',
            estimatedDuration: aiData.estimatedDuration || 30,
            tags: aiData.tags || [],
            isInbox: false,
          });
          return task;
        }
      } catch (e) {
        console.warn('AI API parse failed, falling back to smart local parser:', e);
      } finally {
        setIsAiLoading(false);
      }

      // Local heuristic smart parser fallback
      const parsed = parseQuickTask(rawText);
      return addTask({
        title: parsed.title,
        dueDate: parsed.dueDate,
        dueTime: parsed.dueTime,
        priority: parsed.priority,
        tags: parsed.tags,
        isInbox: false,
      });
    },
    [addTask]
  );

  const aiBreakdownProjectTasks = useCallback(
    async (projectId: string): Promise<Task[]> => {
      const proj = projects.find((p) => p.id === projectId);
      if (!proj) return [];

      setIsAiLoading(true);
      try {
        const res = await authenticatedFetch('/api/ai/breakdown-project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectName: proj.name,
            projectDescription: proj.description,
            targetDueDate: proj.dueDate,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.tasks)) {
            const createdTasks: Task[] = [];
            data.tasks.forEach((t: any) => {
              const newTask = addTask({
                title: t.title,
                description: t.description,
                priority: t.priority || 'medium',
                estimatedDuration: t.estimatedDuration || 60,
                projectId,
                tags: t.tags || ['ia-gerada'],
                checklist: (t.checklist || []).map((step: string, idx: number) => ({
                  id: `chk_${Date.now()}_${idx}`,
                  title: step,
                  completed: false,
                })),
                status: 'todo',
              });
              createdTasks.push(newTask);
            });
            return createdTasks;
          }
        }
      } catch (e) {
        console.error('AI breakdown failed:', e);
      } finally {
        setIsAiLoading(false);
      }
      return [];
    },
    [projects, addTask]
  );

  const aiGetSmartPriorities = useCallback(async () => {
    setIsAiLoading(true);
    try {
      const res = await authenticatedFetch('/api/ai/smart-priorities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks, currentDate: getTodayDateString() }),
      });

      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('AI smart priorities API error, using algorithmic fallback:', e);
    } finally {
      setIsAiLoading(false);
    }

    // Algorithmic fallback
    const pending = tasks.filter((t) => t.status !== 'done' && !t.isInbox);
    const sorted = [...pending].sort((a, b) => {
      const priorityOrder: Record<Priority, number> = { urgent: 4, high: 3, medium: 2, low: 1, none: 0 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    return {
      topTaskIds: sorted.slice(0, 3).map((t) => t.id),
      briefing: 'Foque nas demandas de maior impacto e urgência logo nas primeiras horas da manhã.',
      suggestions: [
        'Conclua a tarefa mais urgente antes da pausa do almoço.',
        'Reserve um bloco de 50 minutos sem notificações para deep work.',
      ],
    };
  }, [tasks]);

  const executeAiAction = useCallback(
    async (action: { type: string; data: any }): Promise<{ success: boolean; summary: string }> => {
      try {
        switch (action.type) {
          case 'create_task': {
            const data = action.data || {};
            // If project specified by name, find or link it
            let targetProjectId = data.projectId;
            if (!targetProjectId && data.projectName) {
              const matchedProj = projects.find(
                (p) => p.name.toLowerCase() === String(data.projectName).toLowerCase()
              );
              if (matchedProj) targetProjectId = matchedProj.id;
            }

            const t = addTask({
              title: data.title || 'Nova Tarefa',
              description: data.description,
              dueDate: data.dueDate,
              dueTime: data.dueTime,
              priority: data.priority || 'medium',
              tags: Array.isArray(data.tags) ? data.tags : [],
              projectId: targetProjectId,
              isInbox: false,
            });

            return {
              success: true,
              summary: `Tarefa "${t.title}" criada com sucesso!${t.dueDate ? ` Vence em ${t.dueDate}` : ''}${
                t.dueTime ? ` às ${t.dueTime}` : ''
              }.`,
            };
          }

          case 'complete_task': {
            const target = String(action.data?.taskTitleOrId || '').toLowerCase().trim();
            const found = tasks.find(
              (t) => t.id === target || t.title.toLowerCase().includes(target)
            );
            if (found) {
              updateTask(found.id, { status: 'done' });
              return { success: true, summary: `Tarefa "${found.title}" concluída!` };
            }
            return {
              success: false,
              summary: `Não localizei a tarefa "${action.data?.taskTitleOrId}" para concluir.`,
            };
          }

          case 'delete_task': {
            const target = String(action.data?.taskTitleOrId || '').toLowerCase().trim();
            const found = tasks.find(
              (t) => t.id === target || t.title.toLowerCase().includes(target)
            );
            if (found) {
              deleteTask(found.id);
              return { success: true, summary: `Tarefa "${found.title}" foi excluída.` };
            }
            return {
              success: false,
              summary: `Não localizei a tarefa "${action.data?.taskTitleOrId}" para excluir.`,
            };
          }

          case 'create_event': {
            const data = action.data || {};
            const ev = addEvent({
              title: data.title || 'Novo Compromisso',
              startDate: data.startDate || getTodayDateString(),
              startTime: data.startTime || '09:00',
              endDate: data.endDate || data.startDate || getTodayDateString(),
              endTime: data.endTime || '10:00',
              location: data.location,
              description: data.description,
            });
            return {
              success: true,
              summary: `Compromisso "${ev.title}" agendado para ${ev.startDate} às ${ev.startTime}.`,
            };
          }

          case 'create_project': {
            const data = action.data || {};
            const p = addProject({
              name: data.name || 'Novo Projeto',
              description: data.description,
              color: data.color || '#3b82f6',
              priority: data.priority || 'medium',
            });
            return {
              success: true,
              summary: `Projeto "${p.name}" criado com sucesso!`,
            };
          }

          case 'navigate': {
            const tab = action.data?.tab;
            if (tab) {
              setActiveTab(tab as ActiveNavTab);
              return { success: true, summary: `Navegando para ${tab}.` };
            }
            return { success: false, summary: 'Destino não fornecido.' };
          }

          default:
            return { success: false, summary: `Ação desconhecida: ${action.type}` };
        }
      } catch (err: any) {
        return { success: false, summary: `Erro na execução: ${err.message}` };
      }
    },
    [addTask, updateTask, deleteTask, addEvent, addProject, setActiveTab, tasks, projects]
  );

  const sendAssistantMessage = useCallback(
    async (text: string, isVoice = false): Promise<AIChatMessage> => {
      const userMsg: AIChatMessage = {
        id: `msg_${Date.now()}`,
        sender: 'user',
        text,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        isVoice,
      };

      setChatMessages((prev) => [...prev, userMsg]);
      setIsAiLoading(true);

      try {
        const payload = {
          message: text,
          history: chatMessages.slice(-8).map((m) => ({ sender: m.sender, content: m.text })),
          systemContext: {
            currentDate: getTodayDateString(),
            currentTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            userName: user.name,
            tasks: tasks.slice(0, 30),
            projects: projects.slice(0, 15),
            events: events.slice(0, 15),
          },
        };

        const res = await authenticatedFetch('/api/ai/assistant-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        const executedActions: AIExecutedAction[] = [];

        if (Array.isArray(data.actions) && data.actions.length > 0) {
          for (const act of data.actions) {
            const result = await executeAiAction(act);
            executedActions.push({
              id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              type: act.type,
              status: result.success ? 'executed' : 'failed',
              summary: result.summary,
              data: act.data,
            });
          }
        }

        const assistantMsg: AIChatMessage = {
          id: `msg_${Date.now() + 1}`,
          sender: 'assistant',
          text: data.reply || 'Comando processado com sucesso.',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          actions: executedActions,
          suggestedPrompts: data.suggestedPrompts || [],
        };

        setChatMessages((prev) => [...prev, assistantMsg]);
        return assistantMsg;
      } catch (err: any) {
        const errorMsg: AIChatMessage = {
          id: `msg_${Date.now() + 1}`,
          sender: 'assistant',
          text: 'Desculpe, ocorreu uma instabilidade na conexão com o Gemini. Você pode tentar novamente.',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        };
        setChatMessages((prev) => [...prev, errorMsg]);
        return errorMsg;
      } finally {
        setIsAiLoading(false);
      }
    },
    [chatMessages, user.name, tasks, projects, events, executeAiAction]
  );

  const clearChatHistory = useCallback(() => {
    const welcomeMsg: AIChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'assistant',
      text: 'Histórico limpo. Como posso ajudar com sua produtividade hoje?',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      suggestedPrompts: [
        'Crie uma tarefa urgente para hoje',
        'Agende uma reunião para amanhã',
        'O que eu tenho pendente para hoje?',
      ],
    };
    setChatMessages([welcomeMsg]);
    try {
    } catch {}
  }, []);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedProjectId,
        setSelectedProjectId,
        selectedTaskId,
        setSelectedTaskId,
        isQuickCaptureOpen,
        setIsQuickCaptureOpen,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        searchQuery,
        setSearchQuery,
        selectedTagFilter,
        setSelectedTagFilter,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        isDarkMode,
        setIsDarkMode,
        isShortcutsOpen,
        setIsShortcutsOpen,

        toast,
        showToast,
        dismissToast,

        user,
        columns,
        tasks,
        projects,
        events,
        goals,
        habits,
        notes,
        monthlyPlan,
        notifications,
        timeEntries,
        activeTimer,
        isAiLoading,
        allProjectRoutines,

        addTask,
        updateTask,
        deleteTask,
        moveTaskStatus,
        toggleChecklistItem,
        toggleSubtask,
        addCommentToTask,
        convertInboxTask,

        addProject,
        updateProject,
        deleteProject,
        addProjectRoutine,
        toggleProjectRoutine,
        resetProjectRoutines,
        deleteProjectRoutine,
        addProjectLink,
        deleteProjectLink,
        addProjectWorkLog,
        deleteProjectWorkLog,
        startProjectFocusTimer,

        addEvent,
        updateEvent,
        deleteEvent,

        addGoal,
        updateGoal,
        deleteGoal,
        incrementGoalProgress,

        toggleHabitDay,
        addHabit,
        deleteHabit,

        addNote,
        updateNote,
        deleteNote,
        addNoteBlock,
        updateNoteBlock,
        deleteNoteBlock,

        updateMonthlyObjective,
        addMonthlyObjective,
        deleteMonthlyObjective,
        toggleFinanceStatus,
        addFinanceCommitment,
        deleteFinanceCommitment,
        updateFocusNotes,

        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,

        startFocusTimer,
        pauseFocusTimer,
        resumeFocusTimer,
        stopFocusTimer,

        updateUserProfile,
        toggleWidgetVisibility,
        exportBackupJson,
        importBackupJson,
        resetToSampleData,
        clearToCleanSlate,

        // Database status & Real-time Sync
        isDbConnected,
        isDbSaving,
        lastDbSyncedAt,
        forceDbSync,

        aiParseAndCreateTask,
        aiBreakdownProjectTasks,
        aiGetSmartPriorities,
        chatMessages,
        isAssistantOpen,
        setIsAssistantOpen,
        sendAssistantMessage,
        clearChatHistory,
        executeAiAction,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
