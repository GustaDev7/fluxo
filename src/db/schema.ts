import { relations } from 'drizzle-orm';
import {
  pgTable,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  serial,
  index,
} from 'drizzle-orm/pg-core';

// ==========================================
// 1. Users
// ==========================================
export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    uid: text('uid').notNull().unique(), // Firebase Auth UID
    name: text('name'),
    email: text('email').notNull(),
    avatar: text('avatar'),
    timezone: text('timezone').default('America/Sao_Paulo'),
    locale: text('locale').default('pt-BR'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    uidIdx: index('users_uid_idx').on(table.uid),
    emailIdx: index('users_email_idx').on(table.email),
  })
);

// ==========================================
// 2. Projects
// ==========================================
export const projects = pgTable(
  'projects',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    color: text('color').default('#6366f1'),
    icon: text('icon').default('FolderKanban'),
    status: text('status').notNull().default('active'),
    priority: text('priority').notNull().default('medium'),
    startDate: text('start_date'),
    dueDate: text('due_date'),
    progress: integer('progress').default(0),
    members: jsonb('members').default([]),
    viewPreference: text('view_preference').default('workspace'),
    isRecurring: boolean('is_recurring').default(false),
    recurrenceFrequency: text('recurrence_frequency'),
    routines: jsonb('routines').default([]),
    links: jsonb('links').default([]),
    workLogs: jsonb('work_logs').default([]),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('projects_user_id_idx').on(table.userId),
    statusIdx: index('projects_status_idx').on(table.status),
  })
);

// ==========================================
// 3. Tasks
// ==========================================
export const tasks = pgTable(
  'tasks',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    projectId: text('project_id').references(() => projects.id, {
      onDelete: 'set null',
    }),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status').notNull().default('todo'),
    priority: text('priority').notNull().default('medium'),
    dueDate: text('due_date'),
    dueTime: text('due_time'),
    estimatedDuration: integer('estimated_duration').default(0),
    timeSpent: integer('time_spent').default(0),
    listId: text('list_id'),
    assigneeName: text('assignee_name'),
    tags: jsonb('tags').default([]),
    checklist: jsonb('checklist').default([]),
    subtasks: jsonb('subtasks').default([]),
    dependencies: jsonb('dependencies').default([]),
    reminders: jsonb('reminders').default([]),
    recurrence: jsonb('recurrence').default({ type: 'none' }),
    completedAt: text('completed_at'),
    comments: jsonb('comments').default([]),
    attachments: jsonb('attachments').default([]),
    isInbox: boolean('is_inbox').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('tasks_user_id_idx').on(table.userId),
    projectIdIdx: index('tasks_project_id_idx').on(table.projectId),
    statusIdx: index('tasks_status_idx').on(table.status),
    dueDateIdx: index('tasks_due_date_idx').on(table.dueDate),
  })
);

// ==========================================
// 4. Calendar Events
// ==========================================
export const calendarEvents = pgTable(
  'calendar_events',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    projectId: text('project_id').references(() => projects.id, {
      onDelete: 'set null',
    }),
    taskId: text('task_id').references(() => tasks.id, {
      onDelete: 'set null',
    }),
    title: text('title').notNull(),
    description: text('description'),
    startDate: text('start_date').notNull(),
    startTime: text('start_time'),
    endDate: text('end_date').notNull(),
    endTime: text('end_time'),
    isAllDay: boolean('is_all_day').default(false),
    color: text('color').default('#6366f1'),
    location: text('location'),
    participants: jsonb('participants').default([]),
    recurrence: text('recurrence'),
    reminder: text('reminder'),
    isFocusBlock: boolean('is_focus_block').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('calendar_events_user_id_idx').on(table.userId),
    startDateIdx: index('calendar_events_start_date_idx').on(table.startDate),
  })
);

// ==========================================
// 5. Notes
// ==========================================
export const notes = pgTable(
  'notes',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    projectId: text('project_id').references(() => projects.id, {
      onDelete: 'set null',
    }),
    taskId: text('task_id').references(() => tasks.id, {
      onDelete: 'set null',
    }),
    goalId: text('goal_id'),
    title: text('title').notNull().default('Nota sem título'),
    icon: text('icon').default('FileText'),
    tags: jsonb('tags').default([]),
    blocks: jsonb('blocks').default([]),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('notes_user_id_idx').on(table.userId),
    projectIdIdx: index('notes_project_id_idx').on(table.projectId),
  })
);

// ==========================================
// 6. Goals
// ==========================================
export const goals = pgTable(
  'goals',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    period: text('period').notNull().default('monthly'),
    category: text('category').default('Geral'),
    targetValue: numeric('target_value', { precision: 12, scale: 2 }).notNull().default('100.00'),
    currentValue: numeric('current_value', { precision: 12, scale: 2 }).notNull().default('0.00'),
    unit: text('unit').default('%'),
    deadline: text('deadline'),
    linkedTaskIds: jsonb('linked_task_ids').default([]),
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('goals_user_id_idx').on(table.userId),
  })
);

// ==========================================
// 7. Habits
// ==========================================
export const habits = pgTable(
  'habits',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    category: text('category').default('Saúde & Energia'),
    icon: text('icon').default('Sparkles'),
    color: text('color').default('#6366f1'),
    frequency: text('frequency').default('daily'),
    targetDaysPerWeek: integer('target_days_per_week').default(7),
    timeOfDay: text('time_of_day').default('anytime'),
    completedDates: jsonb('completed_dates').default([]),
    currentStreak: integer('current_streak').default(0),
    longestStreak: integer('longest_streak').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('habits_user_id_idx').on(table.userId),
  })
);

// ==========================================
// 8. Time Entries (Focus / Pomodoro)
// ==========================================
export const timeEntries = pgTable(
  'time_entries',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    taskId: text('task_id').references(() => tasks.id, {
      onDelete: 'set null',
    }),
    projectId: text('project_id').references(() => projects.id, {
      onDelete: 'set null',
    }),
    taskTitle: text('task_title').notNull(),
    projectTitle: text('project_title'),
    startTime: text('start_time').notNull(),
    endTime: text('end_time').notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    note: text('note'),
    date: text('date').notNull(), // YYYY-MM-DD
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('time_entries_user_id_idx').on(table.userId),
    dateIdx: index('time_entries_date_idx').on(table.date),
  })
);

// ==========================================
// 9. Finance Accounts
// ==========================================
export const financeAccounts = pgTable(
  'finance_accounts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    bank: text('bank').notNull(),
    type: text('type').notNull(), // 'checking', 'digital', 'savings', 'wallet', 'brokerage', 'international'
    balance: numeric('balance', { precision: 12, scale: 2 }).notNull().default('0.00'),
    color: text('color').default('#6366f1'),
    icon: text('icon'),
    initialBalance: numeric('initial_balance', { precision: 12, scale: 2 }).default('0.00'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('finance_accounts_user_id_idx').on(table.userId),
  })
);

// ==========================================
// 10. Finance Cards
// ==========================================
export const financeCards = pgTable(
  'finance_cards',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    bank: text('bank').notNull(),
    limit: numeric('limit', { precision: 12, scale: 2 }).notNull().default('0.00'),
    availableLimit: numeric('available_limit', { precision: 12, scale: 2 }).notNull().default('0.00'),
    closingDay: integer('closing_day').notNull().default(1),
    dueDay: integer('due_day').notNull().default(10),
    color: text('color').default('#6366f1'),
    linkedAccountId: text('linked_account_id').references(() => financeAccounts.id, {
      onDelete: 'set null',
    }),
    currentInvoice: numeric('current_invoice', { precision: 12, scale: 2 }).default('0.00'),
    nextInvoice: numeric('next_invoice', { precision: 12, scale: 2 }).default('0.00'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('finance_cards_user_id_idx').on(table.userId),
  })
);

// ==========================================
// 11. Finance Transactions
// ==========================================
export const financeTransactions = pgTable(
  'finance_transactions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    type: text('type').notNull(), // 'income' | 'expense' | 'transfer' | 'investment' | 'redemption' | 'debt_payment'
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    date: text('date').notNull(), // YYYY-MM-DD
    description: text('description').notNull(),
    masterCategory: text('master_category').notNull().default('custos_fixos'),
    subcategory: text('subcategory'),
    accountId: text('account_id').references(() => financeAccounts.id, {
      onDelete: 'set null',
    }),
    destinationAccountId: text('destination_account_id').references(() => financeAccounts.id, {
      onDelete: 'set null',
    }),
    cardId: text('card_id').references(() => financeCards.id, {
      onDelete: 'set null',
    }),
    projectId: text('project_id').references(() => projects.id, {
      onDelete: 'set null',
    }),
    goalId: text('goal_id'),
    tags: jsonb('tags').default([]),
    recurrence: text('recurrence').default('none'),
    isRecurringInstance: boolean('is_recurring_instance').default(false),
    notes: text('notes'),
    installments: jsonb('installments'),
    linkedBillId: text('linked_bill_id'),
    linkedTaskId: text('linked_task_id').references(() => tasks.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('finance_transactions_user_id_idx').on(table.userId),
    dateIdx: index('finance_transactions_date_idx').on(table.date),
    typeIdx: index('finance_transactions_type_idx').on(table.type),
  })
);

// ==========================================
// 12. Finance Bills (Contas / Boletos)
// ==========================================
export const financeBills = pgTable(
  'finance_bills',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    dueDate: text('due_date').notNull(), // YYYY-MM-DD
    type: text('type').notNull().default('expense'), // 'expense' | 'income'
    status: text('status').notNull().default('pending'), // 'pending' | 'paid' | 'overdue'
    masterCategory: text('master_category').notNull().default('custos_fixos'),
    subcategory: text('subcategory'),
    accountId: text('account_id').references(() => financeAccounts.id, {
      onDelete: 'set null',
    }),
    cardId: text('card_id').references(() => financeCards.id, {
      onDelete: 'set null',
    }),
    recurrence: text('recurrence').default('monthly'),
    reminderDays: integer('reminder_days').default(3),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('finance_bills_user_id_idx').on(table.userId),
    dueDateIdx: index('finance_bills_due_date_idx').on(table.dueDate),
    statusIdx: index('finance_bills_status_idx').on(table.status),
  })
);

// ==========================================
// 13. Finance Debts
// ==========================================
export const financeDebts = pgTable(
  'finance_debts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    creditor: text('creditor').notNull(),
    totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
    remainingAmount: numeric('remaining_amount', { precision: 12, scale: 2 }).notNull(),
    installmentAmount: numeric('installment_amount', { precision: 12, scale: 2 }).default('0.00'),
    totalInstallments: integer('total_installments').default(1),
    paidInstallments: integer('paid_installments').default(0),
    dueDate: text('due_date').notNull(),
    interestRate: numeric('interest_rate', { precision: 5, scale: 2 }).default('0.00'),
    notes: text('notes'),
    status: text('status').default('active'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('finance_debts_user_id_idx').on(table.userId),
  })
);

// ==========================================
// 14. Finance Investments
// ==========================================
export const financeInvestments = pgTable(
  'finance_investments',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    institution: text('institution').notNull(),
    type: text('type').notNull(), // 'cdi' | 'ipca' | 'stock' | 'fii' | 'crypto' | 'treasury' | 'other'
    investedAmount: numeric('invested_amount', { precision: 12, scale: 2 }).notNull(),
    currentValue: numeric('current_value', { precision: 12, scale: 2 }).notNull(),
    returnPercent: numeric('return_percent', { precision: 8, scale: 2 }).default('0.00'),
    history: jsonb('history').default([]),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('finance_investments_user_id_idx').on(table.userId),
  })
);

// ==========================================
// 15. Finance Goals
// ==========================================
export const financeGoals = pgTable(
  'finance_goals',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    targetAmount: numeric('target_amount', { precision: 12, scale: 2 }).notNull(),
    currentAmount: numeric('current_amount', { precision: 12, scale: 2 }).default('0.00'),
    deadline: text('deadline').notNull(),
    category: text('category').default('Reserva de Emergência'),
    color: text('color').default('#10b981'),
    linkedAccountId: text('linked_account_id').references(() => financeAccounts.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('finance_goals_user_id_idx').on(table.userId),
  })
);

// ==========================================
// 16. Audit Logs
// ==========================================
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    entityType: text('entity_type').notNull(), // 'task', 'project', 'transaction', etc.
    entityId: text('entity_id').notNull(),
    action: text('action').notNull(), // 'create', 'update', 'delete'
    details: jsonb('details').default({}),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
    entityIdx: index('audit_logs_entity_idx').on(table.entityType, table.entityId),
  })
);

// ==========================================
// Relations
// ==========================================
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  tasks: many(tasks),
  calendarEvents: many(calendarEvents),
  notes: many(notes),
  goals: many(goals),
  habits: many(habits),
  timeEntries: many(timeEntries),
  financeAccounts: many(financeAccounts),
  financeCards: many(financeCards),
  financeTransactions: many(financeTransactions),
  financeBills: many(financeBills),
  financeDebts: many(financeDebts),
  financeInvestments: many(financeInvestments),
  financeGoals: many(financeGoals),
  auditLogs: many(auditLogs),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.uid],
  }),
  tasks: many(tasks),
  calendarEvents: many(calendarEvents),
  notes: many(notes),
  financeTransactions: many(financeTransactions),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.uid],
  }),
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  calendarEvents: many(calendarEvents),
  timeEntries: many(timeEntries),
  notes: many(notes),
  financeTransactions: many(financeTransactions),
}));

export const financeAccountsRelations = relations(financeAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [financeAccounts.userId],
    references: [users.uid],
  }),
  cards: many(financeCards),
  transactions: many(financeTransactions),
  bills: many(financeBills),
  goals: many(financeGoals),
}));

export const financeCardsRelations = relations(financeCards, ({ one, many }) => ({
  user: one(users, {
    fields: [financeCards.userId],
    references: [users.uid],
  }),
  linkedAccount: one(financeAccounts, {
    fields: [financeCards.linkedAccountId],
    references: [financeAccounts.id],
  }),
  transactions: many(financeTransactions),
  bills: many(financeBills),
}));

export const financeTransactionsRelations = relations(financeTransactions, ({ one }) => ({
  user: one(users, {
    fields: [financeTransactions.userId],
    references: [users.uid],
  }),
  account: one(financeAccounts, {
    fields: [financeTransactions.accountId],
    references: [financeAccounts.id],
  }),
  destinationAccount: one(financeAccounts, {
    fields: [financeTransactions.destinationAccountId],
    references: [financeAccounts.id],
  }),
  card: one(financeCards, {
    fields: [financeTransactions.cardId],
    references: [financeCards.id],
  }),
  project: one(projects, {
    fields: [financeTransactions.projectId],
    references: [projects.id],
  }),
  linkedTask: one(tasks, {
    fields: [financeTransactions.linkedTaskId],
    references: [tasks.id],
  }),
}));
