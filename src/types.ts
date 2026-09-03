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
export type ProjectView = 'kanban' | 'list' | 'calendar' | 'timeline';

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
