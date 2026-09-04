export type Priority = 'urgent' | 'high' | 'medium' | 'low' | 'none';

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface TaskReminder {
  id: string;
  type: 'on_time' | '5m' | '15m' | '30m' | '1h' | '1d' | 'custom';
  customDate?: string;
}

export interface TaskRecurrence {
  type: 'none' | 'daily' | 'weekdays' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  interval?: number;
}

export interface TaskComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  size: string;
  url: string;
  type: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  createdAt: string;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  estimatedDuration?: number; // minutes
  timeSpent?: number; // minutes
  projectId?: string;
  listId?: string;
  assigneeName?: string;
  tags: string[];
  checklist: ChecklistItem[];
  subtasks: Subtask[];
  dependencies: string[]; // task IDs
  reminders: TaskReminder[];
  recurrence: TaskRecurrence;
  completedAt?: string;
  comments: TaskComment[];
  attachments: TaskAttachment[];
  isInbox?: boolean;
}

export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  order: number;
  taskLimit?: number;
  color?: string;
}

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed';
export type ProjectView = 'workspace' | 'tasks' | 'kanban' | 'notes' | 'timeline';

export interface ProjectRoutine {
  id: string;
  title: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  completed: boolean;
  lastCompletedDate?: string;
  preferredTime?: string; // e.g. "09:00"
  syncToCalendar?: boolean; // defaults to true
  syncToHabits?: boolean; // defaults to true
  completedDates?: string[]; // array of YYYY-MM-DD
  dayOfWeek?: number; // 0=Dom, 1=Seg, etc.
  dayOfMonth?: number; // 1-31
}

export interface ProjectLink {
  id: string;
  title: string;
  url: string;
}

export interface ProjectWorkLog {
  id: string;
  date: string;
  content: string;
  durationMinutes?: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  status: ProjectStatus;
  priority: 'high' | 'medium' | 'low';
  startDate?: string;
  dueDate?: string;
  progress: number; // 0-100 calculated or manual
  members: string[];
  viewPreference?: ProjectView;
  isRecurring?: boolean;
  recurrenceFrequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'continuous';
  routines?: ProjectRoutine[];
  links?: ProjectLink[];
  workLogs?: ProjectWorkLog[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endDate: string; // YYYY-MM-DD
  endTime?: string; // HH:mm
  isAllDay: boolean;
  color: string;
  location?: string;
  participants?: string[];
  recurrence?: string;
  reminder?: string;
  projectId?: string;
  taskId?: string;
  isFocusBlock?: boolean;
}

export type GoalPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'yearly';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  period: GoalPeriod;
  category: string;
  targetValue: number;
  currentValue: number;
  unit: string; // e.g. "horas", "clientes", "R$", "livros"
  deadline: string;
  linkedTaskIds: string[];
  status: 'active' | 'completed' | 'paused';
}

export interface MonthlyObjective {
  id: string;
  title: string;
  target: string;
  current: string;
  deadline: string;
  completed: boolean;
  linkedTaskId?: string;
}

export interface FinancialCommitment {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  dueDay: number;
  status: 'paid' | 'pending';
}

export interface MonthlyPlan {
  month: string; // YYYY-MM
  objectives: MonthlyObjective[];
  finances: FinancialCommitment[];
  focusNotes: string;
}

export interface Habit {
  id: string;
  name: string;
  category: string;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekdays' | 'weekly';
  targetDaysPerWeek: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | 'anytime';
  completedDates: string[]; // array of YYYY-MM-DD
  currentStreak: number;
  longestStreak: number;
}

export type NoteBlockType = 'h1' | 'h2' | 'h3' | 'p' | 'todo' | 'bullet' | 'toggle' | 'code' | 'callout';

export interface NoteBlock {
  id: string;
  type: NoteBlockType;
  content: string;
  checked?: boolean;
  isOpen?: boolean;
  language?: string;
}

export interface NotePage {
  id: string;
  title: string;
  icon?: string;
  projectId?: string;
  taskId?: string;
  goalId?: string;
  tags: string[];
  blocks: NoteBlock[];
  updatedAt: string;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  taskId?: string;
  projectId?: string;
  taskTitle: string;
  projectTitle?: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  durationMinutes: number;
  note?: string;
  date: string; // YYYY-MM-DD
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'task_due' | 'task_overdue' | 'reminder' | 'goal' | 'habit' | 'system';
  timestamp: string;
  read: boolean;
  linkView?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  theme: 'light' | 'dark' | 'system';
  workStartHour: number; // e.g. 8
  workEndHour: number; // e.g. 19
  pomodoroMinutes: number; // e.g. 25
  shortBreakMinutes: number; // e.g. 5
  longBreakMinutes: number; // e.g. 15
  proactivityLevel?: 'subtle' | 'balanced' | 'high';
  aiMemoryEnabled?: boolean;
  visibleWidgets: {
    todayTasks: boolean;
    overdueTasks: boolean;
    upcomingEvents: boolean;
    smartPriorities: boolean;
    habits: boolean;
    goals: boolean;
    metrics: boolean;
  };
}

export type ActiveNavTab =
  | 'dashboard'
  | 'finance'
  | 'whatsapp'
  | 'lifegraph'
  | 'assistant'
  | 'inbox'
  | 'tasks'
  | 'agenda'
  | 'calendar'
  | 'projects'
  | 'monthly'
  | 'goals'
  | 'habits'
  | 'notes'
  | 'analytics'
  | 'focus'
  | 'guide'
  | 'settings';

export interface AIExecutedAction {
  id: string;
  type:
    | 'create_task'
    | 'complete_task'
    | 'delete_task'
    | 'create_event'
    | 'create_project'
    | 'create_transaction'
    | 'create_bill'
    | 'create_goal'
    | 'create_habit'
    | 'update_memory'
    | 'navigate';
  status: 'executed' | 'failed';
  summary: string;
  data?: any;
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isVoice?: boolean;
  actions?: AIExecutedAction[];
  suggestedPrompts?: string[];
  isSpeaking?: boolean;
}

export type MemoryCategory = 'finance' | 'routine' | 'preference' | 'goal' | 'project' | 'general';

export interface UserMemoryItem {
  id: string;
  key: string;
  value: string;
  category: MemoryCategory;
  confidence: number;
  source: 'auto_inferred' | 'manual' | 'whatsapp';
  createdAt: string;
  lastUsedAt?: string;
  isActive: boolean;
}

export interface WhatsAppMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  actionsExecuted?: AIExecutedAction[];
  quickReplies?: string[];
}

export type LifeHorizon = 'today' | 'week' | 'month';

export interface LifeHealthOverview {
  score: number; // 0 - 100
  title: string;
  summary: string;
  time: {
    pendingTasksCount: number;
    completedTodayCount: number;
    plannedMinutes: number;
    executedMinutes: number;
    overdueCount: number;
    status: 'optimal' | 'warning' | 'critical';
  };
  work: {
    activeProjectsCount: number;
    upcomingDeadlinesCount: number;
    criticalProjectName?: string;
    status: 'optimal' | 'warning' | 'critical';
  };
  finance: {
    monthlyIncome: number;
    monthlyExpenses: number;
    savingsRatePercent: number;
    pendingBillsTodayCount: number;
    pendingBillsAmount: number;
    status: 'optimal' | 'warning' | 'critical';
  };
  goals: {
    primaryGoalTitle: string;
    progressPercent: number;
    activeGoalsCount: number;
    status: 'optimal' | 'warning' | 'critical';
  };
  habits: {
    currentStreak: number;
    completedTodayPercent: number;
    habitsCount: number;
    status: 'optimal' | 'warning' | 'critical';
  };
  agenda: {
    eventsTodayCount: number;
    nextEventTitle?: string;
    nextEventTime?: string;
    status: 'optimal' | 'warning' | 'critical';
  };
  priorities: {
    topItems: string[];
    actionAdvice: string;
  };
}

export interface LifeGraphNode {
  id: string;
  type: 'goal' | 'project' | 'budget' | 'task' | 'calendar' | 'finance' | 'networth';
  label: string;
  detail: string;
  status?: string;
  color: string;
  linkTab: ActiveNavTab;
  value?: string | number;
}

export interface LifeGraphEdge {
  id: string;
  fromId: string;
  toId: string;
  relationship: string;
}

