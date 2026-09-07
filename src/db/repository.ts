import { db } from './index.ts';
import {
  users,
  projects,
  tasks,
  calendarEvents,
  notes,
  goals,
  habits,
  timeEntries,
  financeAccounts,
  financeCards,
  financeTransactions,
  financeBills,
  financeDebts,
  financeInvestments,
  financeGoals,
  auditLogs,
} from './schema.ts';
import { eq, and, desc } from 'drizzle-orm';

// =========================================================================
// TASKS REPOSITORY
// =========================================================================
export async function getTasksByUserId(userId: string) {
  try {
    return await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt));
  } catch (error) {
    console.error('getTasksByUserId error:', error);
    throw new Error('Falha ao buscar tarefas no banco de dados', { cause: error });
  }
}

export async function getTaskById(userId: string, taskId: string) {
  try {
    const result = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.id, taskId)));
    return result[0] || null;
  } catch (error) {
    console.error('getTaskById error:', error);
    throw new Error('Falha ao buscar tarefa no banco de dados', { cause: error });
  }
}

export async function upsertTask(userId: string, taskData: any) {
  try {
    const taskId = taskData.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const result = await db
      .insert(tasks)
      .values({
        id: taskId,
        userId,
        projectId: taskData.projectId || null,
        title: taskData.title,
        description: taskData.description || null,
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        dueDate: taskData.dueDate || null,
        dueTime: taskData.dueTime || null,
        estimatedDuration: taskData.estimatedDuration || 0,
        timeSpent: taskData.timeSpent || 0,
        listId: taskData.listId || null,
        assigneeName: taskData.assigneeName || null,
        tags: taskData.tags || [],
        checklist: taskData.checklist || [],
        subtasks: taskData.subtasks || [],
        dependencies: taskData.dependencies || [],
        reminders: taskData.reminders || [],
        recurrence: taskData.recurrence || { type: 'none' },
        completedAt: taskData.completedAt || null,
        comments: taskData.comments || [],
        attachments: taskData.attachments || [],
        isInbox: !!taskData.isInbox,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: tasks.id,
        set: {
          projectId: taskData.projectId || null,
          title: taskData.title,
          description: taskData.description !== undefined ? taskData.description : null,
          status: taskData.status || 'todo',
          priority: taskData.priority || 'medium',
          dueDate: taskData.dueDate !== undefined ? taskData.dueDate : null,
          dueTime: taskData.dueTime !== undefined ? taskData.dueTime : null,
          estimatedDuration: taskData.estimatedDuration || 0,
          timeSpent: taskData.timeSpent || 0,
          tags: taskData.tags || [],
          checklist: taskData.checklist || [],
          subtasks: taskData.subtasks || [],
          dependencies: taskData.dependencies || [],
          reminders: taskData.reminders || [],
          recurrence: taskData.recurrence || { type: 'none' },
          completedAt: taskData.completedAt || null,
          comments: taskData.comments || [],
          attachments: taskData.attachments || [],
          isInbox: !!taskData.isInbox,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Log audit
    await logAction(userId, 'task', taskId, 'upsert', { title: taskData.title, status: taskData.status });
    return result[0];
  } catch (error) {
    console.error('upsertTask error:', error);
    throw new Error('Falha ao salvar tarefa no banco de dados', { cause: error });
  }
}

export async function deleteTask(userId: string, taskId: string) {
  try {
    const result = await db
      .delete(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.id, taskId)))
      .returning();
    if (result.length > 0) {
      await logAction(userId, 'task', taskId, 'delete', {});
    }
    return result.length > 0;
  } catch (error) {
    console.error('deleteTask error:', error);
    throw new Error('Falha ao excluir tarefa no banco de dados', { cause: error });
  }
}

// =========================================================================
// PROJECTS REPOSITORY
// =========================================================================
export async function getProjectsByUserId(userId: string) {
  try {
    return await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
  } catch (error) {
    console.error('getProjectsByUserId error:', error);
    throw new Error('Falha ao buscar projetos no banco de dados', { cause: error });
  }
}

export async function upsertProject(userId: string, projectData: any) {
  try {
    const projectId = projectData.id || `proj_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const result = await db
      .insert(projects)
      .values({
        id: projectId,
        userId,
        name: projectData.name,
        description: projectData.description || null,
        color: projectData.color || '#6366f1',
        icon: projectData.icon || 'FolderKanban',
        status: projectData.status || 'active',
        priority: projectData.priority || 'medium',
        startDate: projectData.startDate || null,
        dueDate: projectData.dueDate || null,
        progress: projectData.progress || 0,
        members: projectData.members || [],
        viewPreference: projectData.viewPreference || 'workspace',
        isRecurring: !!projectData.isRecurring,
        recurrenceFrequency: projectData.recurrenceFrequency || null,
        routines: projectData.routines || [],
        links: projectData.links || [],
        workLogs: projectData.workLogs || [],
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: projects.id,
        set: {
          name: projectData.name,
          description: projectData.description !== undefined ? projectData.description : null,
          color: projectData.color || '#6366f1',
          icon: projectData.icon || 'FolderKanban',
          status: projectData.status || 'active',
          priority: projectData.priority || 'medium',
          startDate: projectData.startDate !== undefined ? projectData.startDate : null,
          dueDate: projectData.dueDate !== undefined ? projectData.dueDate : null,
          progress: projectData.progress !== undefined ? projectData.progress : 0,
          members: projectData.members || [],
          viewPreference: projectData.viewPreference || 'workspace',
          isRecurring: !!projectData.isRecurring,
          recurrenceFrequency: projectData.recurrenceFrequency || null,
          routines: projectData.routines || [],
          links: projectData.links || [],
          workLogs: projectData.workLogs || [],
          updatedAt: new Date(),
        },
      })
      .returning();

    await logAction(userId, 'project', projectId, 'upsert', { name: projectData.name });
    return result[0];
  } catch (error) {
    console.error('upsertProject error:', error);
    throw new Error('Falha ao salvar projeto no banco de dados', { cause: error });
  }
}

export async function deleteProject(userId: string, projectId: string) {
  try {
    const result = await db
      .delete(projects)
      .where(and(eq(projects.userId, userId), eq(projects.id, projectId)))
      .returning();
    if (result.length > 0) {
      await logAction(userId, 'project', projectId, 'delete', {});
    }
    return result.length > 0;
  } catch (error) {
    console.error('deleteProject error:', error);
    throw new Error('Falha ao excluir projeto no banco de dados', { cause: error });
  }
}

// =========================================================================
// CALENDAR EVENTS REPOSITORY
// =========================================================================
export async function getEventsByUserId(userId: string) {
  try {
    return await db.select().from(calendarEvents).where(eq(calendarEvents.userId, userId));
  } catch (error) {
    console.error('getEventsByUserId error:', error);
    throw new Error('Falha ao buscar eventos no banco de dados', { cause: error });
  }
}

export async function upsertEvent(userId: string, eventData: any) {
  try {
    const eventId = eventData.id || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const result = await db
      .insert(calendarEvents)
      .values({
        id: eventId,
        userId,
        projectId: eventData.projectId || null,
        taskId: eventData.taskId || null,
        title: eventData.title,
        description: eventData.description || null,
        startDate: eventData.startDate || eventData.date,
        startTime: eventData.startTime || null,
        endDate: eventData.endDate || eventData.startDate || eventData.date,
        endTime: eventData.endTime || null,
        isAllDay: !!eventData.isAllDay,
        color: eventData.color || '#6366f1',
        location: eventData.location || null,
        participants: eventData.participants || [],
        recurrence: eventData.recurrence || null,
        reminder: eventData.reminder || null,
        isFocusBlock: !!eventData.isFocusBlock,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: calendarEvents.id,
        set: {
          projectId: eventData.projectId || null,
          taskId: eventData.taskId || null,
          title: eventData.title,
          description: eventData.description || null,
          startDate: eventData.startDate || eventData.date,
          startTime: eventData.startTime || null,
          endDate: eventData.endDate || eventData.startDate || eventData.date,
          endTime: eventData.endTime || null,
          isAllDay: !!eventData.isAllDay,
          color: eventData.color || '#6366f1',
          location: eventData.location || null,
          participants: eventData.participants || [],
          recurrence: eventData.recurrence || null,
          reminder: eventData.reminder || null,
          isFocusBlock: !!eventData.isFocusBlock,
          updatedAt: new Date(),
        },
      })
      .returning();

    await logAction(userId, 'calendar_event', eventId, 'upsert', { title: eventData.title });
    return result[0];
  } catch (error) {
    console.error('upsertEvent error:', error);
    throw new Error('Falha ao salvar evento no banco de dados', { cause: error });
  }
}

export async function deleteEvent(userId: string, eventId: string) {
  try {
    const result = await db
      .delete(calendarEvents)
      .where(and(eq(calendarEvents.userId, userId), eq(calendarEvents.id, eventId)))
      .returning();
    return result.length > 0;
  } catch (error) {
    console.error('deleteEvent error:', error);
    throw new Error('Falha ao excluir evento no banco de dados', { cause: error });
  }
}

// =========================================================================
// NOTES, GOALS, HABITS, TIME ENTRIES
// =========================================================================
export async function getNotesByUserId(userId: string) {
  return await db.select().from(notes).where(eq(notes.userId, userId));
}

export async function upsertNote(userId: string, noteData: any) {
  const noteId = noteData.id || `note_${Date.now()}`;
  const result = await db
    .insert(notes)
    .values({
      id: noteId,
      userId,
      projectId: noteData.projectId || null,
      taskId: noteData.taskId || null,
      goalId: noteData.goalId || null,
      title: noteData.title || 'Nota sem título',
      icon: noteData.icon || 'FileText',
      tags: noteData.tags || [],
      blocks: noteData.blocks || [],
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: notes.id,
      set: {
        projectId: noteData.projectId || null,
        title: noteData.title || 'Nota sem título',
        icon: noteData.icon || 'FileText',
        tags: noteData.tags || [],
        blocks: noteData.blocks || [],
        updatedAt: new Date(),
      },
    })
    .returning();
  return result[0];
}

export async function deleteNote(userId: string, noteId: string) {
  const res = await db.delete(notes).where(and(eq(notes.userId, userId), eq(notes.id, noteId))).returning();
  return res.length > 0;
}

export async function getGoalsByUserId(userId: string) {
  return await db.select().from(goals).where(eq(goals.userId, userId));
}

export async function upsertGoal(userId: string, goalData: any) {
  const goalId = goalData.id || `goal_${Date.now()}`;
  const result = await db
    .insert(goals)
    .values({
      id: goalId,
      userId,
      title: goalData.title,
      description: goalData.description || null,
      period: goalData.period || 'monthly',
      category: goalData.category || 'Geral',
      targetValue: String(goalData.targetValue || 100),
      currentValue: String(goalData.currentValue || 0),
      unit: goalData.unit || '%',
      deadline: goalData.deadline || null,
      linkedTaskIds: goalData.linkedTaskIds || [],
      status: goalData.status || 'active',
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: goals.id,
      set: {
        title: goalData.title,
        description: goalData.description || null,
        period: goalData.period || 'monthly',
        category: goalData.category || 'Geral',
        targetValue: String(goalData.targetValue || 100),
        currentValue: String(goalData.currentValue || 0),
        unit: goalData.unit || '%',
        deadline: goalData.deadline || null,
        linkedTaskIds: goalData.linkedTaskIds || [],
        status: goalData.status || 'active',
        updatedAt: new Date(),
      },
    })
    .returning();
  return result[0];
}

export async function deleteGoal(userId: string, goalId: string) {
  const res = await db.delete(goals).where(and(eq(goals.userId, userId), eq(goals.id, goalId))).returning();
  return res.length > 0;
}

export async function getHabitsByUserId(userId: string) {
  return await db.select().from(habits).where(eq(habits.userId, userId));
}

export async function upsertHabit(userId: string, habitData: any) {
  const habitId = habitData.id || `habit_${Date.now()}`;
  const result = await db
    .insert(habits)
    .values({
      id: habitId,
      userId,
      name: habitData.name,
      category: habitData.category || 'Saúde & Energia',
      icon: habitData.icon || 'Sparkles',
      color: habitData.color || '#6366f1',
      frequency: habitData.frequency || 'daily',
      targetDaysPerWeek: habitData.targetDaysPerWeek || 7,
      timeOfDay: habitData.timeOfDay || 'anytime',
      completedDates: habitData.completedDates || [],
      currentStreak: habitData.currentStreak || 0,
      longestStreak: habitData.longestStreak || 0,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: habits.id,
      set: {
        name: habitData.name,
        category: habitData.category || 'Saúde & Energia',
        icon: habitData.icon || 'Sparkles',
        color: habitData.color || '#6366f1',
        frequency: habitData.frequency || 'daily',
        targetDaysPerWeek: habitData.targetDaysPerWeek || 7,
        timeOfDay: habitData.timeOfDay || 'anytime',
        completedDates: habitData.completedDates || [],
        currentStreak: habitData.currentStreak || 0,
        longestStreak: habitData.longestStreak || 0,
        updatedAt: new Date(),
      },
    })
    .returning();
  return result[0];
}

export async function deleteHabit(userId: string, habitId: string) {
  const res = await db.delete(habits).where(and(eq(habits.userId, userId), eq(habits.id, habitId))).returning();
  return res.length > 0;
}

export async function getTimeEntriesByUserId(userId: string) {
  return await db.select().from(timeEntries).where(eq(timeEntries.userId, userId)).orderBy(desc(timeEntries.createdAt));
}

export async function createTimeEntry(userId: string, entryData: any) {
  const entryId = entryData.id || `te_${Date.now()}`;
  const result = await db
    .insert(timeEntries)
    .values({
      id: entryId,
      userId,
      taskId: entryData.taskId || null,
      projectId: entryData.projectId || null,
      taskTitle: entryData.taskTitle || 'Sessão de Foco',
      projectTitle: entryData.projectTitle || null,
      startTime: entryData.startTime || new Date().toISOString(),
      endTime: entryData.endTime || new Date().toISOString(),
      durationMinutes: entryData.durationMinutes || 25,
      note: entryData.note || null,
      date: entryData.date || new Date().toISOString().split('T')[0],
    })
    .returning();
  return result[0];
}

// =========================================================================
// FINANCE REPOSITORY
// =========================================================================
export async function getFinanceDataByUserId(userId: string) {
  try {
    const [accounts, cards, transactions, bills, debts, investments, fGoals] = await Promise.all([
      db.select().from(financeAccounts).where(eq(financeAccounts.userId, userId)),
      db.select().from(financeCards).where(eq(financeCards.userId, userId)),
      db.select().from(financeTransactions).where(eq(financeTransactions.userId, userId)).orderBy(desc(financeTransactions.date)),
      db.select().from(financeBills).where(eq(financeBills.userId, userId)),
      db.select().from(financeDebts).where(eq(financeDebts.userId, userId)),
      db.select().from(financeInvestments).where(eq(financeInvestments.userId, userId)),
      db.select().from(financeGoals).where(eq(financeGoals.userId, userId)),
    ]);

    return {
      accounts: accounts.map((a) => ({ ...a, balance: Number(a.balance), initialBalance: Number(a.initialBalance) })),
      cards: cards.map((c) => ({
        ...c,
        limit: Number(c.limit),
        availableLimit: Number(c.availableLimit),
        currentInvoice: Number(c.currentInvoice),
        nextInvoice: Number(c.nextInvoice),
      })),
      transactions: transactions.map((t) => ({ ...t, amount: Number(t.amount) })),
      bills: bills.map((b) => ({ ...b, amount: Number(b.amount) })),
      debts: debts.map((d) => {
        const totalAmount = Number(d.totalAmount);
        const remainingAmount = Number(d.remainingAmount);
        const installmentAmount = Number(d.installmentAmount);
        const interestRate = Number(d.interestRate);
        const totalInstallments = Number(d.totalInstallments || 1);
        const paidInstallments = Number(d.paidInstallments || 0);
        const remainingInstallments = Math.max(0, totalInstallments - paidInstallments);

        return {
          id: d.id,
          userId: d.userId,
          creditor: d.creditor || d.name,
          type: 'financing' as const,
          originalAmount: totalAmount,
          currentBalance: remainingAmount,
          installmentAmount,
          interestRateMonthly: interestRate,
          totalInstallments,
          remainingInstallments,
          dueDay: Number(d.dueDate) || 15,
          priority: 'high' as const,
          notes: d.notes || undefined,
          status: (d.status as 'active' | 'paid') || (remainingInstallments === 0 ? 'paid' : 'active'),
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        };
      }),
      investments: investments.map((i) => ({
        ...i,
        investedAmount: Number(i.investedAmount),
        currentValue: Number(i.currentValue),
        returnPercent: Number(i.returnPercent),
      })),
      goals: fGoals.map((g) => ({
        ...g,
        title: g.name,
        targetAmount: Number(g.targetAmount),
        currentAmount: Number(g.currentAmount),
      })),
    };
  } catch (error) {
    console.error('getFinanceDataByUserId error:', error);
    throw new Error('Falha ao carregar dados financeiros', { cause: error });
  }
}

export async function upsertFinanceAccount(userId: string, accData: any) {
  const accId = accData.id || `acc_${Date.now()}`;
  const result = await db
    .insert(financeAccounts)
    .values({
      id: accId,
      userId,
      name: accData.name,
      bank: accData.bank || accData.name,
      type: accData.type || 'checking',
      balance: String(accData.balance || 0),
      color: accData.color || '#6366f1',
      icon: accData.icon || null,
      initialBalance: String(accData.initialBalance || 0),
      isActive: accData.isActive !== undefined ? !!accData.isActive : true,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: financeAccounts.id,
      set: {
        name: accData.name,
        bank: accData.bank || accData.name,
        type: accData.type || 'checking',
        balance: String(accData.balance || 0),
        color: accData.color || '#6366f1',
        icon: accData.icon || null,
        initialBalance: String(accData.initialBalance || 0),
        isActive: accData.isActive !== undefined ? !!accData.isActive : true,
        updatedAt: new Date(),
      },
    })
    .returning();
  return result[0];
}

export async function upsertFinanceTransaction(userId: string, txData: any) {
  const txId = txData.id || `tx_${Date.now()}`;
  const result = await db
    .insert(financeTransactions)
    .values({
      id: txId,
      userId,
      type: txData.type || 'expense',
      amount: String(txData.amount || 0),
      date: txData.date || new Date().toISOString().split('T')[0],
      description: txData.description,
      masterCategory: txData.masterCategory || 'custos_fixos',
      subcategory: txData.subcategory || null,
      accountId: txData.accountId || null,
      destinationAccountId: txData.destinationAccountId || null,
      cardId: txData.cardId || null,
      projectId: txData.projectId || null,
      goalId: txData.goalId || null,
      tags: txData.tags || [],
      recurrence: txData.recurrence || 'none',
      isRecurringInstance: !!txData.isRecurringInstance,
      notes: txData.notes || null,
      installments: txData.installments || null,
      linkedBillId: txData.linkedBillId || null,
      linkedTaskId: txData.linkedTaskId || null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: financeTransactions.id,
      set: {
        type: txData.type || 'expense',
        amount: String(txData.amount || 0),
        date: txData.date || new Date().toISOString().split('T')[0],
        description: txData.description,
        masterCategory: txData.masterCategory || 'custos_fixos',
        subcategory: txData.subcategory || null,
        accountId: txData.accountId || null,
        destinationAccountId: txData.destinationAccountId || null,
        cardId: txData.cardId || null,
        projectId: txData.projectId || null,
        goalId: txData.goalId || null,
        tags: txData.tags || [],
        recurrence: txData.recurrence || 'none',
        isRecurringInstance: !!txData.isRecurringInstance,
        notes: txData.notes || null,
        installments: txData.installments || null,
        updatedAt: new Date(),
      },
    })
    .returning();

  await logAction(userId, 'finance_transaction', txId, 'upsert', {
    description: txData.description,
    amount: txData.amount,
  });
  return result[0];
}

export async function deleteFinanceTransaction(userId: string, txId: string) {
  const res = await db
    .delete(financeTransactions)
    .where(and(eq(financeTransactions.userId, userId), eq(financeTransactions.id, txId)))
    .returning();
  return res.length > 0;
}

export async function deleteFinanceAccount(userId: string, accId: string) {
  const res = await db
    .delete(financeAccounts)
    .where(and(eq(financeAccounts.userId, userId), eq(financeAccounts.id, accId)))
    .returning();
  return res.length > 0;
}

export async function upsertFinanceCard(userId: string, cardData: any) {
  const cardId = cardData.id || `card_${Date.now()}`;
  const result = await db
    .insert(financeCards)
    .values({
      id: cardId,
      userId,
      name: cardData.name,
      bank: cardData.bank || cardData.name,
      limit: String(cardData.limit || 0),
      availableLimit: String(cardData.availableLimit ?? cardData.limit ?? 0),
      closingDay: Number(cardData.closingDay || 1),
      dueDay: Number(cardData.dueDay || 10),
      color: cardData.color || '#6366f1',
      linkedAccountId: cardData.linkedAccountId || null,
      currentInvoice: String(cardData.currentInvoice || 0),
      nextInvoice: String(cardData.nextInvoice || 0),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: financeCards.id,
      set: {
        name: cardData.name,
        bank: cardData.bank || cardData.name,
        limit: String(cardData.limit || 0),
        availableLimit: String(cardData.availableLimit ?? cardData.limit ?? 0),
        closingDay: Number(cardData.closingDay || 1),
        dueDay: Number(cardData.dueDay || 10),
        color: cardData.color || '#6366f1',
        linkedAccountId: cardData.linkedAccountId || null,
        currentInvoice: String(cardData.currentInvoice || 0),
        nextInvoice: String(cardData.nextInvoice || 0),
        updatedAt: new Date(),
      },
    })
    .returning();
  return result[0];
}

export async function deleteFinanceCard(userId: string, cardId: string) {
  const res = await db
    .delete(financeCards)
    .where(and(eq(financeCards.userId, userId), eq(financeCards.id, cardId)))
    .returning();
  return res.length > 0;
}

export async function upsertFinanceBill(userId: string, billData: any) {
  const billId = billData.id || `bill_${Date.now()}`;
  const result = await db
    .insert(financeBills)
    .values({
      id: billId,
      userId,
      title: billData.title,
      amount: String(billData.amount || 0),
      dueDate: billData.dueDate || new Date().toISOString().split('T')[0],
      type: billData.type || 'expense',
      status: billData.status || 'pending',
      masterCategory: billData.masterCategory || 'custos_fixos',
      subcategory: billData.subcategory || null,
      accountId: billData.accountId || null,
      cardId: billData.cardId || null,
      recurrence: billData.recurrence || 'monthly',
      reminderDays: Number(billData.reminderDays || 3),
      notes: billData.notes || null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: financeBills.id,
      set: {
        title: billData.title,
        amount: String(billData.amount || 0),
        dueDate: billData.dueDate || new Date().toISOString().split('T')[0],
        type: billData.type || 'expense',
        status: billData.status || 'pending',
        masterCategory: billData.masterCategory || 'custos_fixos',
        subcategory: billData.subcategory || null,
        accountId: billData.accountId || null,
        cardId: billData.cardId || null,
        recurrence: billData.recurrence || 'monthly',
        reminderDays: Number(billData.reminderDays || 3),
        notes: billData.notes || null,
        updatedAt: new Date(),
      },
    })
    .returning();
  return result[0];
}

export async function deleteFinanceBill(userId: string, billId: string) {
  const res = await db
    .delete(financeBills)
    .where(and(eq(financeBills.userId, userId), eq(financeBills.id, billId)))
    .returning();
  return res.length > 0;
}

export async function upsertFinanceDebt(userId: string, debtData: any) {
  const debtId = debtData.id || `debt_${Date.now()}`;
  const creditorName = debtData.creditor || debtData.name || 'Dívida';
  const totalInst = Number(debtData.totalInstallments || 1);
  const remainingInst = Number(
    debtData.remainingInstallments !== undefined
      ? debtData.remainingInstallments
      : totalInst
  );
  const paidInst = Number(
    debtData.paidInstallments !== undefined
      ? debtData.paidInstallments
      : Math.max(0, totalInst - remainingInst)
  );
  const currentBal = String(
    debtData.currentBalance !== undefined
      ? debtData.currentBalance
      : debtData.remainingAmount !== undefined
      ? debtData.remainingAmount
      : 0
  );
  const totalAmt = String(
    debtData.originalAmount !== undefined
      ? debtData.originalAmount
      : debtData.totalAmount !== undefined
      ? debtData.totalAmount
      : currentBal
  );
  const interest = String(
    debtData.interestRateMonthly !== undefined
      ? debtData.interestRateMonthly
      : debtData.interestRate !== undefined
      ? debtData.interestRate
      : 0
  );

  const result = await db
    .insert(financeDebts)
    .values({
      id: debtId,
      userId,
      name: creditorName,
      creditor: creditorName,
      totalAmount: totalAmt,
      remainingAmount: currentBal,
      installmentAmount: String(debtData.installmentAmount || 0),
      totalInstallments: totalInst,
      paidInstallments: paidInst,
      dueDate: debtData.dueDate || `${debtData.dueDay || 15}`,
      interestRate: interest,
      notes: debtData.notes || null,
      status: debtData.status || (remainingInst === 0 ? 'paid' : 'active'),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: financeDebts.id,
      set: {
        name: creditorName,
        creditor: creditorName,
        totalAmount: totalAmt,
        remainingAmount: currentBal,
        installmentAmount: String(debtData.installmentAmount || 0),
        totalInstallments: totalInst,
        paidInstallments: paidInst,
        dueDate: debtData.dueDate || `${debtData.dueDay || 15}`,
        interestRate: interest,
        notes: debtData.notes || null,
        status: debtData.status || (remainingInst === 0 ? 'paid' : 'active'),
        updatedAt: new Date(),
      },
    })
    .returning();
  return result[0];
}

export async function deleteFinanceDebt(userId: string, debtId: string) {
  const res = await db
    .delete(financeDebts)
    .where(and(eq(financeDebts.userId, userId), eq(financeDebts.id, debtId)))
    .returning();
  return res.length > 0;
}

export async function upsertFinanceInvestment(userId: string, invData: any) {
  const invId = invData.id || `inv_${Date.now()}`;
  const result = await db
    .insert(financeInvestments)
    .values({
      id: invId,
      userId,
      name: invData.name,
      institution: invData.institution || 'Corretora',
      type: invData.type || 'other',
      investedAmount: String(invData.investedAmount || 0),
      currentValue: String(invData.currentValue || 0),
      returnPercent: String(invData.returnPercent || 0),
      history: invData.history || [],
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: financeInvestments.id,
      set: {
        name: invData.name,
        institution: invData.institution || 'Corretora',
        type: invData.type || 'other',
        investedAmount: String(invData.investedAmount || 0),
        currentValue: String(invData.currentValue || 0),
        returnPercent: String(invData.returnPercent || 0),
        history: invData.history || [],
        updatedAt: new Date(),
      },
    })
    .returning();
  return result[0];
}

export async function deleteFinanceInvestment(userId: string, invId: string) {
  const res = await db
    .delete(financeInvestments)
    .where(and(eq(financeInvestments.userId, userId), eq(financeInvestments.id, invId)))
    .returning();
  return res.length > 0;
}

export async function upsertFinanceGoal(userId: string, goalData: any) {
  const goalId = goalData.id || `fgoal_${Date.now()}`;
  const result = await db
    .insert(financeGoals)
    .values({
      id: goalId,
      userId,
      name: goalData.name,
      targetAmount: String(goalData.targetAmount || 0),
      currentAmount: String(goalData.currentAmount || 0),
      deadline: goalData.deadline || new Date().toISOString().split('T')[0],
      category: goalData.category || 'Reserva de Emergência',
      color: goalData.color || '#10b981',
      linkedAccountId: goalData.linkedAccountId || null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: financeGoals.id,
      set: {
        name: goalData.name,
        targetAmount: String(goalData.targetAmount || 0),
        currentAmount: String(goalData.currentAmount || 0),
        deadline: goalData.deadline || new Date().toISOString().split('T')[0],
        category: goalData.category || 'Reserva de Emergência',
        color: goalData.color || '#10b981',
        linkedAccountId: goalData.linkedAccountId || null,
        updatedAt: new Date(),
      },
    })
    .returning();
  return result[0];
}

export async function deleteFinanceGoal(userId: string, goalId: string) {
  const res = await db
    .delete(financeGoals)
    .where(and(eq(financeGoals.userId, userId), eq(financeGoals.id, goalId)))
    .returning();
  return res.length > 0;
}

// Full bulk sync helper for Finance Store
export async function syncFinanceStore(userId: string, data: any) {
  if (Array.isArray(data.accounts)) {
    for (const acc of data.accounts) {
      if (acc && acc.name) await upsertFinanceAccount(userId, acc);
    }
  }

  if (Array.isArray(data.creditCards)) {
    for (const card of data.creditCards) {
      if (card && card.name) await upsertFinanceCard(userId, card);
    }
  }

  if (Array.isArray(data.transactions)) {
    for (const tx of data.transactions) {
      if (tx && tx.description) await upsertFinanceTransaction(userId, tx);
    }
  }

  if (Array.isArray(data.bills)) {
    for (const bill of data.bills) {
      if (bill && bill.title) await upsertFinanceBill(userId, bill);
    }
  }

  if (Array.isArray(data.debts)) {
    for (const debt of data.debts) {
      if (debt && (debt.creditor || debt.name)) await upsertFinanceDebt(userId, debt);
    }
  }

  if (Array.isArray(data.investments)) {
    for (const inv of data.investments) {
      if (inv && (inv.name || inv.tickerOrName)) await upsertFinanceInvestment(userId, inv);
    }
  }

  if (Array.isArray(data.goals)) {
    for (const goal of data.goals) {
      if (goal && (goal.name || goal.title)) await upsertFinanceGoal(userId, goal);
    }
  }
}

// Helper for audit logs
async function logAction(userId: string, entityType: string, entityId: string, action: string, details: any) {
  try {
    await db.insert(auditLogs).values({
      userId,
      entityType,
      entityId,
      action,
      details: details || {},
    });
  } catch (err) {
    console.warn('Failed to record audit log:', err);
  }
}

// Bulk sync helper for central sync
export async function syncProductivityStore(userId: string, data: any) {
  // Sync tasks
  if (Array.isArray(data.tasks)) {
    for (const t of data.tasks) {
      if (t && t.id && !t.id.includes('sample')) {
        await upsertTask(userId, t);
      }
    }
  }
  // Sync projects
  if (Array.isArray(data.projects)) {
    for (const p of data.projects) {
      if (p && p.id && !p.id.includes('sample')) {
        await upsertProject(userId, p);
      }
    }
  }
  // Sync events
  if (Array.isArray(data.events)) {
    for (const e of data.events) {
      if (e && e.id && !e.id.includes('sample')) {
        await upsertEvent(userId, e);
      }
    }
  }
  // Sync goals
  if (Array.isArray(data.goals)) {
    for (const g of data.goals) {
      if (g && g.id) await upsertGoal(userId, g);
    }
  }
  // Sync habits
  if (Array.isArray(data.habits)) {
    for (const h of data.habits) {
      if (h && h.id) await upsertHabit(userId, h);
    }
  }
  // Sync notes
  if (Array.isArray(data.notes)) {
    for (const n of data.notes) {
      if (n && n.id) await upsertNote(userId, n);
    }
  }
  // Sync time entries
  if (Array.isArray(data.timeEntries)) {
    for (const te of data.timeEntries) {
      if (te && te.id) await createTimeEntry(userId, te);
    }
  }
}
