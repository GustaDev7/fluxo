import { supabase } from './supabase';

type Row = Record<string, any>;

async function rows(table: string) {
  const { data, error } = await supabase.from(table).select('*');
  if (error) throw error;
  return (data ?? []) as Row[];
}

async function replaceRows(table: string, userId: string, nextRows: Row[]) {
  const { data: current, error: readError } = await supabase.from(table).select('id').eq('user_id', userId);
  if (readError) throw readError;

  if (nextRows.length) {
    const { error } = await supabase.from(table).upsert(nextRows);
    if (error) throw error;
  }

  const nextIds = new Set(nextRows.map((row) => row.id));
  const removedIds = (current ?? []).map((row: any) => row.id).filter((id: string) => !nextIds.has(id));
  if (removedIds.length) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId).in('id', removedIds);
    if (error) throw error;
  }
}

const localDateTime = (date?: string, time?: string) =>
  date ? `${date}T${time || '00:00'}:00-03:00` : null;

const splitDateTime = (value?: string | null) => {
  if (!value) return { date: undefined, time: undefined };
  const formatted = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
  const [date, time] = formatted.split(' ');
  return { date, time };
};

export async function loadProductivityData() {
  const [profileRows, projectsRows, tasksRows, eventsRows, notesRows, goalsRows, habitsRows, timeRows, notificationRows, planRows, chatRows] =
    await Promise.all([
      rows('profiles'), rows('projects'), rows('tasks'), rows('calendar_events'), rows('notes'),
      rows('goals'), rows('habits'), rows('time_entries'), rows('notifications'), rows('monthly_plans'), rows('ai_chat_messages'),
    ]);

  const profile = profileRows[0];
  return {
    user: profile ? {
      id: profile.id,
      name: profile.full_name || '',
      email: '',
      avatar: profile.avatar_url || '',
      role: 'Pro',
      theme: 'system',
      workStartHour: 8,
      workEndHour: 18,
      pomodoroMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      visibleWidgets: { todayTasks: true, overdueTasks: true, upcomingEvents: true, smartPriorities: true, habits: true, goals: true, metrics: true },
    } : null,
    projects: projectsRows.map((row) => ({
      id: row.id, name: row.name, description: row.description || '', color: row.color, icon: row.icon,
      status: row.status, priority: row.priority, startDate: row.start_date || undefined, dueDate: row.due_date || undefined,
      progress: row.progress, ...(row.metadata || {}),
    })),
    tasks: tasksRows.map((row) => {
      const due = splitDateTime(row.due_at);
      return {
        id: row.id, projectId: row.project_id || undefined, title: row.title, description: row.description || '',
        status: row.status, priority: row.priority, dueDate: due.date, dueTime: due.time,
        estimatedDuration: row.estimated_duration, timeSpent: row.time_spent, tags: row.tags || [],
        checklist: row.checklist || [], subtasks: row.subtasks || [], reminders: row.reminders || [],
        recurrence: row.recurrence || { type: 'none' }, completedAt: row.completed_at || undefined,
        isInbox: row.is_inbox, createdAt: row.created_at,
      };
    }),
    events: eventsRows.map((row) => {
      const start = splitDateTime(row.starts_at);
      const end = splitDateTime(row.ends_at);
      return {
        id: row.id, projectId: row.project_id || undefined, taskId: row.task_id || undefined,
        title: row.title, description: row.description || '', startDate: start.date, startTime: start.time,
        endDate: end.date, endTime: end.time, isAllDay: row.is_all_day, location: row.location || '',
        recurrence: row.recurrence, reminder: row.reminder_minutes, isFocusBlock: row.is_focus_block,
      };
    }),
    notes: notesRows.map((row) => ({ id: row.id, projectId: row.project_id || undefined, taskId: row.task_id || undefined, title: row.title, tags: row.tags || [], blocks: row.blocks || [], createdAt: row.created_at, updatedAt: row.updated_at })),
    goals: goalsRows.map((row) => ({ id: row.id, projectId: row.project_id || undefined, title: row.title, description: row.description || '', period: 'monthly', category: row.category, targetValue: Number(row.target_value || 0), currentValue: Number(row.current_value || 0), unit: row.unit || '%', deadline: row.deadline || undefined, linkedTaskIds: [], status: row.status })),
    habits: habitsRows.map((row) => ({ id: row.id, name: row.name, category: row.category, icon: row.icon, color: row.color, ...(row.frequency || {}), targetDaysPerWeek: row.target_days_per_week, completedDates: row.completed_dates || [], currentStreak: row.current_streak, longestStreak: row.longest_streak })),
    timeEntries: timeRows.map((row) => ({ id: row.id, taskId: row.task_id || undefined, projectId: row.project_id || undefined, startTime: row.started_at, endTime: row.ended_at, durationMinutes: row.duration_minutes, note: row.note || '' })),
    notifications: notificationRows.map((row) => ({ id: row.id, title: row.title, message: row.message, type: row.type, read: row.is_read, timestamp: new Date(row.created_at).toLocaleString('pt-BR'), ...(row.action || {}) })),
    monthlyPlan: planRows[0] ? { month: planRows[0].month, objectives: planRows[0].objectives, finances: planRows[0].finances, focusNotes: planRows[0].focus_notes } : null,
    chatMessages: chatRows.map((row) => ({ id: row.id, sender: row.sender, text: row.text, timestamp: new Date(row.occurred_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), ...(row.metadata || {}) })),
  };
}

export async function saveProductivityData(userId: string, data: any) {
  const profile = {
    id: userId,
    full_name: data.user.name,
    avatar_url: data.user.avatar || null,
    timezone: 'America/Sao_Paulo',
    locale: 'pt-BR',
    updated_at: new Date().toISOString(),
  };
  const { error: profileError } = await supabase.from('profiles').upsert(profile);
  if (profileError) throw profileError;

  await replaceRows('projects', userId, data.projects.map((item: any) => ({
    id: item.id, user_id: userId, name: item.name, description: item.description || null, color: item.color,
    icon: item.icon, status: item.status, priority: item.priority, start_date: item.startDate || null,
    due_date: item.dueDate || null, progress: item.progress || 0,
    metadata: { members: item.members || [], viewPreference: item.viewPreference, isRecurring: item.isRecurring, recurrenceFrequency: item.recurrenceFrequency, routines: item.routines || [], links: item.links || [], workLogs: item.workLogs || [] },
  })));
  await replaceRows('tasks', userId, data.tasks.map((item: any) => ({
    id: item.id, user_id: userId, project_id: item.projectId || null, title: item.title,
    description: item.description || null, status: item.status, priority: item.priority,
    due_at: localDateTime(item.dueDate, item.dueTime), estimated_duration: item.estimatedDuration || 0,
    time_spent: item.timeSpent || 0, tags: item.tags || [], checklist: item.checklist || [],
    subtasks: item.subtasks || [], reminders: item.reminders || [], recurrence: item.recurrence || { type: 'none' },
    completed_at: item.completedAt || null, is_inbox: Boolean(item.isInbox),
  })));
  await replaceRows('calendar_events', userId, data.events.map((item: any) => ({
    id: item.id, user_id: userId, project_id: item.projectId || null, task_id: item.taskId || null,
    title: item.title, description: item.description || null,
    starts_at: localDateTime(item.startDate, item.startTime), ends_at: localDateTime(item.endDate || item.startDate, item.endTime || item.startTime),
    is_all_day: Boolean(item.isAllDay), location: item.location || null, recurrence: item.recurrence || null,
    reminder_minutes: typeof item.reminder === 'number' ? item.reminder : null, is_focus_block: Boolean(item.isFocusBlock),
  })));
  await replaceRows('notes', userId, data.notes.map((item: any) => ({ id: item.id, user_id: userId, project_id: item.projectId || null, task_id: item.taskId || null, title: item.title, tags: item.tags || [], blocks: item.blocks || [] })));
  await replaceRows('goals', userId, data.goals.map((item: any) => ({ id: item.id, user_id: userId, project_id: item.projectId || null, title: item.title, description: item.description || null, category: item.category || 'Geral', target_value: item.targetValue || null, current_value: item.currentValue || 0, unit: item.unit || null, deadline: item.deadline || null, status: item.status || 'active' })));
  await replaceRows('habits', userId, data.habits.map((item: any) => ({ id: item.id, user_id: userId, name: item.name, category: item.category || null, icon: item.icon || null, color: item.color || null, frequency: { frequency: item.frequency, timeOfDay: item.timeOfDay }, target_days_per_week: item.targetDaysPerWeek || null, completed_dates: item.completedDates || [], current_streak: item.currentStreak || 0, longest_streak: item.longestStreak || 0 })));
  await replaceRows('time_entries', userId, data.timeEntries.map((item: any) => ({ id: item.id, user_id: userId, task_id: item.taskId || null, project_id: item.projectId || null, started_at: item.startTime, ended_at: item.endTime || null, duration_minutes: item.durationMinutes || 0, note: item.note || null })));
  await replaceRows('notifications', userId, data.notifications.map((item: any) => ({ id: item.id, user_id: userId, title: item.title, message: item.message, type: item.type, is_read: Boolean(item.read), action: item.linkView ? { linkView: item.linkView } : null, created_at: new Date().toISOString() })));
  await replaceRows('ai_chat_messages', userId, data.chatMessages.map((item: any) => ({ id: item.id, user_id: userId, sender: item.sender, text: item.text, occurred_at: new Date().toISOString(), metadata: { suggestedPrompts: item.suggestedPrompts, executedActions: item.executedActions, isVoice: item.isVoice } })));
  const { error: planError } = await supabase.from('monthly_plans').upsert({ user_id: userId, month: data.monthlyPlan.month, objectives: data.monthlyPlan.objectives || [], finances: data.monthlyPlan.finances || [], focus_notes: data.monthlyPlan.focusNotes || '', updated_at: new Date().toISOString() });
  if (planError) throw planError;
}

export async function loadFinanceData(userId: string) {
  const ownedRows = async (table: string) => {
    const { data, error } = await supabase.from(table).select('*').eq('user_id', userId);
    if (error) throw error;
    return (data ?? []) as Row[];
  };
  const [accountRows, cardRows, transactionRows, billRows, debtRows, investmentRows, goalRows, emergencyRows, preferenceRows, termRows, installmentRows, paymentRows, budgetRows, incomeSourceRows, budgetCategoryRows] =
    await Promise.all([ownedRows('finance_accounts'), ownedRows('finance_cards'), ownedRows('finance_transactions'), ownedRows('finance_bills'), ownedRows('finance_debts'), ownedRows('finance_investments'), ownedRows('financial_goals'), ownedRows('emergency_funds'), ownedRows('finance_preferences'), ownedRows('debt_terms'), ownedRows('debt_installments'), ownedRows('debt_payments'), ownedRows('monthly_budgets'), ownedRows('budget_income_sources'), ownedRows('budget_categories')]);
  const preferences = preferenceRows[0] || {};
  const currentMonth = new Date().toISOString().slice(0, 7);
  const normalizedBudget = [...budgetRows].sort((a, b) => String(b.month).localeCompare(String(a.month))).find((row) => String(row.month).slice(0, 7) === currentMonth) || budgetRows[0];
  const legacyBudget = preferences.budget;
  const loadedBudget = normalizedBudget ? {
    ...(legacyBudget || {}), id: normalizedBudget.id, month: String(normalizedBudget.month).slice(0, 7),
    notes: normalizedBudget.notes || '', viewMode: normalizedBudget.view_mode, advancedMode: normalizedBudget.advanced_mode,
    incomeSources: incomeSourceRows.filter((r) => r.budget_id === normalizedBudget.id).sort((a,b) => a.sort_order-b.sort_order).map((r) => ({ id:r.id,name:r.name,type:r.source_type,plannedAmount:Number(r.planned_amount),receivedAmount:Number(r.received_amount),recurring:r.recurring })),
    categories: budgetCategoryRows.filter((r) => r.budget_id === normalizedBudget.id).sort((a,b) => a.priority-b.priority).map((r) => ({ id:r.id,parentId:r.parent_id||undefined,masterCategory:r.master_category||undefined,name:r.name,description:r.description||undefined,color:r.color,icon:r.icon||undefined,allocationMode:r.allocation_mode,percentage:String(r.percentage),fixedAmount:Number(r.fixed_amount),plannedAmount:Number(r.planned_amount),spendingLimit:r.spending_limit===null?undefined:Number(r.spending_limit),priority:r.priority,archived:r.archived })),
  } : legacyBudget;
  return {
    accounts: accountRows.map((r) => ({ id: r.id, name: r.name, bank: r.institution || '', type: r.type, balance: Number(r.balance), initialBalance: Number(r.initial_balance), color: r.color || '#3b82f6', icon: r.icon, isActive: r.is_active })),
    creditCards: cardRows.map((r) => ({ id: r.id, name: r.name, bank: r.institution || '', limit: Number(r.credit_limit), availableLimit: Number(r.available_limit), closingDay: r.closing_day, dueDay: r.due_day, color: r.color || '#6366f1', linkedAccountId: r.linked_account_id || undefined, currentInvoice: Number(r.current_invoice), nextInvoice: Number(r.next_invoice) })),
    transactions: transactionRows.map((r) => ({ id: r.id, type: r.type, amount: Number(r.amount), date: r.occurred_on, description: r.description, masterCategory: r.master_category, subcategory: r.subcategory, accountId: r.account_id || undefined, destinationAccountId: r.destination_account_id || undefined, cardId: r.card_id || undefined, projectId: r.project_id || undefined, goalId: r.goal_id || undefined, linkedBillId: r.linked_bill_id || undefined, linkedTaskId: r.linked_task_id || undefined, tags: r.tags || [], recurrence: r.recurrence?.type || 'none', isRecurringInstance: Boolean(r.is_recurring_instance), installments: r.installments || undefined, notes: r.notes })),
    bills: billRows.map((r) => ({ id: r.id, title: r.title, amount: Number(r.amount), dueDate: r.due_date, type: r.type, status: r.status, masterCategory: r.master_category, subcategory: r.subcategory, accountId: r.account_id || undefined, cardId: r.card_id || undefined, linkedTaskId: r.linked_task_id || undefined, recurrence: r.recurrence?.type || 'none', reminderDays: r.reminder_days, notes: r.notes })),
    debts: debtRows.map((r) => { const term=termRows.find((t:any)=>t.debt_id===r.id&&t.active); return ({ id: r.id, creditor: r.creditor, name:r.name, description:r.description, type: r.debt_type, originalAmount: Number(r.original_amount), financedPrincipal:Number(r.financed_principal), incorporatedCosts:Number(r.incorporated_costs), totalContracted:Number(r.total_contracted), currentBalance: Number(r.current_balance), interestRateMonthly: Number(r.interest_rate_monthly), totalInstallments: r.total_installments, remainingInstallments: r.remaining_installments, installmentAmount: Number(r.installment_amount), dueDay: r.due_day, firstDueDate:r.first_due_date, status: r.status, notes: r.notes, priority: r.priority || 'medium', calculationVersion:r.calculation_version, termId:term?.id, ratePeriod:term?.rate_period||'monthly', rateKind:term?.rate_kind||'effective', interestRegime:term?.interest_regime||'compound', amortizationSystem:term?.amortization_system||'price', schedule: installmentRows.filter((i:any)=>i.debt_id===r.id).map((i:any)=>({id:i.id,number:i.installment_number,dueDate:i.due_date,openingBalance:Number(i.opening_balance),principalDue:Number(i.principal_due),interestDue:Number(i.interest_due),fineDue:Number(i.fine_due),chargesDue:Number(i.charges_due),scheduledAmount:Number(i.scheduled_amount),paidAmount:Number(i.paid_amount),closingBalance:Number(i.closing_balance),status:i.status,paidAt:i.paid_at,transactionId:i.transaction_id})), payments:paymentRows.filter((p:any)=>p.debt_id===r.id).map((p:any)=>({id:p.id,installmentId:p.installment_id,accountId:p.account_id,transactionId:p.transaction_id,amount:Number(p.amount),principalAmount:Number(p.principal_amount),interestAmount:Number(p.interest_amount),fineAmount:Number(p.fine_amount),chargesAmount:Number(p.charges_amount),paidOn:p.paid_on,status:p.status,idempotencyKey:p.idempotency_key})) }); }),
    investments: investmentRows.map((r) => ({ id: r.id, tickerOrName: r.name, institution: r.institution || '', category: r.category, quantity: Number(r.quantity), averagePrice: Number(r.average_price), currentPrice: Number(r.current_price), totalInvested: Number(r.quantity) * Number(r.average_price), currentValue: Number(r.quantity) * Number(r.current_price), targetAllocationPercent: Number(r.target_allocation_percent), notes: r.notes })),
    goals: goalRows.map((r) => ({ id: r.id, title: r.title, targetAmount: Number(r.target_amount), currentAmount: Number(r.current_amount), monthlyContribution: Number(r.monthly_contribution), deadline: r.deadline, masterCategory: 'metas', color: r.color || '#10b981', notes: r.notes })),
    emergencyFund: emergencyRows[0] ? { targetAmount: Number(emergencyRows[0].target_amount), currentAmount: Number(emergencyRows[0].current_amount), monthlyContribution: Number(emergencyRows[0].monthly_contribution), targetMonths: emergencyRows[0].target_months } : null,
    installments: preferences.installments || [],
    budget: loadedBudget,
    closings: preferences.closing_history || [],
    diagnosis: preferences.diagnosis,
  };
}

export async function saveFinanceData(userId: string, data: any) {
  await replaceRows('finance_accounts', userId, data.accounts.map((r: any) => ({ id: r.id, user_id: userId, name: r.name, institution: r.bank || null, type: r.type, balance: r.balance, initial_balance: r.initialBalance || 0, color: r.color, icon: r.icon || null, is_active: r.isActive })));
  await replaceRows('finance_cards', userId, data.creditCards.map((r: any) => ({ id: r.id, user_id: userId, linked_account_id: r.linkedAccountId || null, name: r.name, institution: r.bank || null, credit_limit: r.limit, available_limit: r.availableLimit, closing_day: r.closingDay, due_day: r.dueDay, color: r.color, current_invoice: r.currentInvoice, next_invoice: r.nextInvoice })));
  await replaceRows('finance_transactions', userId, data.transactions.map((r: any) => ({ id: r.id, user_id: userId, account_id: r.accountId || null, destination_account_id: r.destinationAccountId || null, card_id: r.cardId || null, project_id: r.projectId || null, goal_id: r.goalId || null, linked_bill_id: r.linkedBillId || null, linked_task_id: r.linkedTaskId || null, type: r.type, amount: r.amount, occurred_on: r.date, description: r.description, master_category: r.masterCategory || null, subcategory: r.subcategory || null, tags: r.tags || [], recurrence: { type: r.recurrence || 'none' }, is_recurring_instance: Boolean(r.isRecurringInstance), installments: r.installments || null, notes: r.notes || null })));
  await replaceRows('finance_bills', userId, data.bills.map((r: any) => ({ id: r.id, user_id: userId, account_id: r.accountId || null, card_id: r.cardId || null, linked_task_id: r.linkedTaskId || null, title: r.title, amount: r.amount, due_date: r.dueDate, type: r.type, status: r.status, master_category: r.masterCategory || null, subcategory: r.subcategory || null, recurrence: { type: r.recurrence || 'none' }, reminder_days: r.reminderDays || 3, notes: r.notes || null })));
  await replaceRows('finance_debts', userId, data.debts.map((r: any) => ({ id: r.id, user_id: userId, creditor: r.creditor, name:r.name||r.creditor, description:r.description||null, debt_type: r.type, original_amount: r.originalAmount, financed_principal:r.financedPrincipal||r.originalAmount, incorporated_costs:r.incorporatedCosts||0, total_contracted:r.totalContracted||r.originalAmount, current_balance: r.currentBalance, interest_rate_monthly: r.interestRateMonthly || 0, total_installments: r.totalInstallments, remaining_installments: r.remainingInstallments, installment_amount: r.installmentAmount, due_day: r.dueDay || null, first_due_date:r.firstDueDate||null, priority:r.priority||'medium', calculation_version:r.calculationVersion||'debt-engine-v1', status: r.status, notes: r.notes || null })));
  await replaceRows('debt_terms', userId, data.debts.filter((r:any)=>r.termId).map((r:any)=>({id:r.termId,user_id:userId,debt_id:r.id,version:1,rate_percent:r.interestRateMonthly||0,rate_period:r.ratePeriod||'monthly',rate_kind:r.rateKind||'effective',interest_regime:r.interestRegime||'compound',amortization_system:r.amortizationSystem||'price',active:true})));
  await replaceRows('debt_installments', userId, data.debts.flatMap((r:any)=>(r.schedule||[]).map((i:any)=>({id:i.id,user_id:userId,debt_id:r.id,term_id:null,installment_number:i.number,due_date:i.dueDate,opening_balance:i.openingBalance,principal_due:i.principalDue,interest_due:i.interestDue,fine_due:i.fineDue||0,charges_due:i.chargesDue||0,scheduled_amount:i.scheduledAmount,paid_amount:i.paidAmount||0,closing_balance:i.closingBalance,status:i.status,paid_at:i.paidAt||null,transaction_id:i.transactionId||null}))));
  await replaceRows('debt_payments', userId, data.debts.flatMap((r:any)=>(r.payments||[]).map((p:any)=>({id:p.id,user_id:userId,debt_id:r.id,installment_id:p.installmentId||null,account_id:p.accountId||null,transaction_id:p.transactionId||null,amount:p.amount,principal_amount:p.principalAmount,interest_amount:p.interestAmount,fine_amount:p.fineAmount||0,charges_amount:p.chargesAmount||0,paid_on:p.paidOn,status:p.status,idempotency_key:p.idempotencyKey}))));
  await replaceRows('finance_investments', userId, data.investments.map((r: any) => ({ id: r.id, user_id: userId, name: r.tickerOrName, institution: r.institution || null, category: r.category, quantity: r.quantity, average_price: r.averagePrice, current_price: r.currentPrice, target_allocation_percent: r.targetAllocationPercent || 0, notes: r.notes || null })));
  await replaceRows('financial_goals', userId, data.goals.map((r: any) => ({ id: r.id, user_id: userId, title: r.title, target_amount: r.targetAmount, current_amount: r.currentAmount, monthly_contribution: r.monthlyContribution || 0, deadline: r.deadline || null, category: 'metas', color: r.color, notes: r.notes || null })));
  const { error: emergencyError } = await supabase.from('emergency_funds').upsert({ user_id: userId, target_amount: data.emergencyFund.targetAmount, current_amount: data.emergencyFund.currentAmount, monthly_contribution: data.emergencyFund.monthlyContribution, target_months: data.emergencyFund.targetMonths, updated_at: new Date().toISOString() });
  if (emergencyError) throw emergencyError;
  const { error: preferencesError } = await supabase.from('finance_preferences').upsert({ user_id: userId, installments: data.installments, budget: data.budget, closing_history: data.closings, diagnosis: data.diagnosis, updated_at: new Date().toISOString() });
  if (preferencesError) throw preferencesError;

  if (data.budget?.categories) {
    const monthDate = `${data.budget.month}-01`;
    const budgetPayload: Row = {
      user_id: userId, month: monthDate, notes: data.budget.notes || null,
      view_mode: data.budget.viewMode || 'cards', advanced_mode: Boolean(data.budget.advancedMode), updated_at: new Date().toISOString(),
    };
    if (data.budget.id) budgetPayload.id = data.budget.id;
    const { data: budgetRow, error: budgetError } = await supabase.from('monthly_budgets').upsert(budgetPayload, { onConflict: 'user_id,month' }).select('id').single();
    if (budgetError) throw budgetError;
    const persistedBudgetId = budgetRow.id;
    const { error: clearIncomeError } = await supabase.from('budget_income_sources').delete().eq('user_id', userId).eq('budget_id', persistedBudgetId);
    if (clearIncomeError) throw clearIncomeError;
    if (data.budget.incomeSources?.length) {
      const { error } = await supabase.from('budget_income_sources').insert(data.budget.incomeSources.map((item: any, index: number) => ({ id:item.id,user_id:userId,budget_id:persistedBudgetId,name:item.name,source_type:item.type,planned_amount:item.plannedAmount,received_amount:item.receivedAmount,recurring:item.recurring,sort_order:index })));
      if (error) throw error;
    }
    const { error: clearCategoryError } = await supabase.from('budget_categories').delete().eq('user_id', userId).eq('budget_id', persistedBudgetId);
    if (clearCategoryError) throw clearCategoryError;
    if (data.budget.categories.length) {
      const { error } = await supabase.from('budget_categories').insert(data.budget.categories.map((item: any) => ({ id:item.id,user_id:userId,budget_id:persistedBudgetId,parent_id:item.parentId||null,master_category:item.masterCategory||null,name:item.name,description:item.description||null,color:item.color,icon:item.icon||null,allocation_mode:item.allocationMode,percentage:item.percentage,fixed_amount:item.fixedAmount,planned_amount:item.plannedAmount,spending_limit:item.spendingLimit??null,priority:item.priority,archived:item.archived })));
      if (error) throw error;
    }
  }
}
