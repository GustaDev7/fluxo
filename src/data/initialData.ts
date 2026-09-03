import {
  Task,
  Project,
  CalendarEvent,
  Goal,
  Habit,
  NotePage,
  MonthlyPlan,
  AppNotification,
  UserProfile,
  KanbanColumn,
} from '../types';
import { getTodayDateString } from '../utils/date';

export const DEFAULT_USER: UserProfile = {
  id: 'user_1',
  name: '',
  email: '',
  avatar: '',
  role: '',
  theme: 'light',
  workStartHour: 8,
  workEndHour: 18,
  pomodoroMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  visibleWidgets: {
    todayTasks: true,
    overdueTasks: true,
    upcomingEvents: true,
    smartPriorities: true,
    habits: true,
    goals: true,
    metrics: true,
  },
};

export const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: 'backlog', title: 'Backlog', order: 0, color: '#94a3b8' },
  { id: 'todo', title: 'A Fazer', order: 1, color: '#3b82f6', taskLimit: 10 },
  { id: 'in_progress', title: 'Em Andamento', order: 2, color: '#f59e0b', taskLimit: 5 },
  { id: 'in_review', title: 'Em Revisão', order: 3, color: '#8b5cf6', taskLimit: 4 },
  { id: 'done', title: 'Concluído', order: 4, color: '#10b981' },
];

export const DEFAULT_PROJECTS: Project[] = [];
export const DEFAULT_TASKS: Task[] = [];
export const DEFAULT_EVENTS: CalendarEvent[] = [];
export const DEFAULT_GOALS: Goal[] = [];
export const DEFAULT_HABITS: Habit[] = [];
export const DEFAULT_NOTES: NotePage[] = [];
export const DEFAULT_MONTHLY_PLAN: MonthlyPlan = {
  month: getTodayDateString().slice(0, 7),
  objectives: [],
  finances: [],
  focusNotes: '',
};
export const DEFAULT_NOTIFICATIONS: AppNotification[] = [];

// Sample data aliases point to empty collections to guarantee clean slate
export const SAMPLE_USER: UserProfile = DEFAULT_USER;
export const SAMPLE_PROJECTS: Project[] = [];
export const SAMPLE_TASKS: Task[] = [];
export const SAMPLE_EVENTS: CalendarEvent[] = [];
export const SAMPLE_GOALS: Goal[] = [];
export const SAMPLE_HABITS: Habit[] = [];
export const SAMPLE_NOTES: NotePage[] = [];
export const SAMPLE_MONTHLY_PLAN: MonthlyPlan = DEFAULT_MONTHLY_PLAN;
export const SAMPLE_NOTIFICATIONS: AppNotification[] = [];
