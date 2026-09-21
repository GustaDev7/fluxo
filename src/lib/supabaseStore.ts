import { supabase } from './supabase';

type Row = Record<string, any>;
export class FinanceConflictError extends Error {
  constructor() {
    super('Os dados foram alterados em outra sessão. Recarregue antes de sincronizar novamente.');
    this.name = 'FinanceConflictError';
  }
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
  const legacyBudget = preferences.budget;
  const loadedBudgets = [...budgetRows]
    .sort((a, b) => String(b.month).localeCompare(String(a.month)))
    .map((budgetRow) => {
      const month = String(budgetRow.month).slice(0, 7);
      const legacyForMonth = legacyBudget?.month === month ? legacyBudget : undefined;
      const incomeSources = incomeSourceRows.filter((r) => r.budget_id === budgetRow.id).sort((a,b) => a.sort_order-b.sort_order).map((r) => ({ id:r.id,name:r.name,type:r.source_type,plannedAmount:Number(r.planned_amount),receivedAmount:Number(r.received_amount),recurring:r.recurring }));
      const categories = budgetCategoryRows.filter((r) => r.budget_id === budgetRow.id).sort((a,b) => a.priority-b.priority).map((r) => ({ id:r.id,parentId:r.parent_id||undefined,masterCategory:r.master_category||undefined,name:r.name,description:r.description||undefined,color:r.color,icon:r.icon||undefined,allocationMode:r.allocation_mode,percentage:String(r.percentage),fixedAmount:Number(r.fixed_amount),plannedAmount:Number(r.planned_amount),spendingLimit:r.spending_limit===null?undefined:Number(r.spending_limit),priority:r.priority,archived:r.archived }));
      const allocations: Row = {
        custos_fixos: 0, conforto: 0, metas: 0, prazeres: 0, liberdade_financeira: 0, conhecimento: 0,
        ...(legacyForMonth?.allocations || {}),
      };
      categories.filter((category) => category.masterCategory && !category.parentId).forEach((category) => { allocations[category.masterCategory] = category.plannedAmount; });
      return {
        id: budgetRow.id, month, plannedIncome: incomeSources.length ? incomeSources.reduce((sum, source) => sum + source.plannedAmount, 0) : Number(legacyForMonth?.plannedIncome || 0),
        allocations, notes: budgetRow.notes || '', viewMode: budgetRow.view_mode, advancedMode: budgetRow.advanced_mode,
        incomeSources: incomeSources.length ? incomeSources : legacyForMonth?.incomeSources || [], categories: categories.length ? categories : legacyForMonth?.categories || [],
      };
    });
  const loadedBudget = loadedBudgets.find((budget) => budget.month === currentMonth) || loadedBudgets[0] || legacyBudget;
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
    budgets: loadedBudgets.length ? loadedBudgets : legacyBudget ? [legacyBudget] : [],
    closings: preferences.closing_history || [],
    diagnosis: preferences.diagnosis,
    serverRevision: preferences.updated_at || null,
  };
}

export async function saveFinanceData(userId: string, data: any, expectedRevision: string | null = null): Promise<string> {
  const { data: serverPreference, error: revisionError } = await supabase
    .from('finance_preferences')
    .select('updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (revisionError) throw revisionError;
  if (expectedRevision && serverPreference?.updated_at && serverPreference.updated_at !== expectedRevision) {
    throw new FinanceConflictError();
  }
  const nextRevision = new Date().toISOString();

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
  const { error: emergencyError } = await supabase.from('emergency_funds').upsert({ user_id: userId, target_amount: data.emergencyFund.targetAmount, current_amount: data.emergencyFund.currentAmount, monthly_contribution: data.emergencyFund.monthlyContribution, target_months: data.emergencyFund.targetMonths, updated_at: nextRevision });
  if (emergencyError) throw emergencyError;

  const monthlyBudgets = data.budgets?.length ? data.budgets : data.budget ? [data.budget] : [];
  for (const monthlyBudget of monthlyBudgets) {
    if (!monthlyBudget?.month) continue;
    const monthDate = `${monthlyBudget.month}-01`;
    const budgetPayload: Row = {
      user_id: userId, month: monthDate, notes: monthlyBudget.notes || null,
      view_mode: monthlyBudget.viewMode || 'cards', advanced_mode: Boolean(monthlyBudget.advancedMode), updated_at: nextRevision,
    };
    const { data: budgetRow, error: budgetError } = await supabase.from('monthly_budgets').upsert(budgetPayload, { onConflict: 'user_id,month' }).select('id').single();
    if (budgetError) throw budgetError;
    const persistedBudgetId = budgetRow.id;
    const incomeRows = (monthlyBudget.incomeSources || []).map((item: any, index: number) => ({ id:item.id,user_id:userId,budget_id:persistedBudgetId,name:item.name,source_type:item.type,planned_amount:item.plannedAmount,received_amount:item.receivedAmount,recurring:item.recurring,sort_order:index }));
    const { data: currentIncome, error: currentIncomeError } = await supabase.from('budget_income_sources').select('id').eq('user_id', userId).eq('budget_id', persistedBudgetId);
    if (currentIncomeError) throw currentIncomeError;
    if (incomeRows.length) {
      const { error } = await supabase.from('budget_income_sources').upsert(incomeRows);
      if (error) throw error;
    }
    const incomeIds = new Set(incomeRows.map((item: Row) => item.id));
    const removedIncomeIds = (currentIncome || []).map((item: Row) => item.id).filter((id: string) => !incomeIds.has(id));
    if (removedIncomeIds.length) {
      const { error } = await supabase.from('budget_income_sources').delete().eq('user_id', userId).eq('budget_id', persistedBudgetId).in('id', removedIncomeIds);
      if (error) throw error;
    }

    const categoryRows = (monthlyBudget.categories || []).map((item: any) => ({ id:item.id,user_id:userId,budget_id:persistedBudgetId,parent_id:item.parentId||null,master_category:item.masterCategory||null,name:item.name,description:item.description||null,color:item.color,icon:item.icon||null,allocation_mode:item.allocationMode,percentage:item.percentage,fixed_amount:item.fixedAmount,planned_amount:item.plannedAmount,spending_limit:item.spendingLimit??null,priority:item.priority,archived:item.archived }));
    const { data: currentCategories, error: currentCategoriesError } = await supabase.from('budget_categories').select('id').eq('user_id', userId).eq('budget_id', persistedBudgetId);
    if (currentCategoriesError) throw currentCategoriesError;
    if (categoryRows.length) {
      const { error } = await supabase.from('budget_categories').upsert(categoryRows);
      if (error) throw error;
    }
    const categoryIds = new Set(categoryRows.map((item: Row) => item.id));
    const removedCategoryIds = (currentCategories || []).map((item: Row) => item.id).filter((id: string) => !categoryIds.has(id));
    if (removedCategoryIds.length) {
      const { error } = await supabase.from('budget_categories').delete().eq('user_id', userId).eq('budget_id', persistedBudgetId).in('id', removedCategoryIds);
      if (error) throw error;
    }
  }

  // The preference row acts as the synchronization revision and is updated last.
  const { data: savedPreference, error: preferencesError } = await supabase.from('finance_preferences').upsert({ user_id: userId, installments: data.installments, budget: data.budget, closing_history: data.closings, diagnosis: data.diagnosis, updated_at: nextRevision }).select('updated_at').single();
  if (preferencesError) throw preferencesError;
  return savedPreference.updated_at;
}
