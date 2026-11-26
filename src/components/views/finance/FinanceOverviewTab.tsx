import type { ReactNode } from 'react';
import { ArrowDownLeft, ArrowRight, ArrowUpRight, CalendarClock, ChartNoAxesCombined, ChevronRight, CircleCheck, Flag, ReceiptText, ShieldCheck, Target, Wallet } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useFinance } from '../../../context/FinanceContext';
import { recentClosings } from '../../../domain/financeLedger';
import type { MasterCategory, TransactionType } from '../../../types/finance';
import { formatDatePT } from '../../../utils/date';
import { formatBRL, MASTER_CATEGORY_CONFIG } from '../../../utils/financeUtils';

const percentage = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1, style: 'percent' });
const monthFormat = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' });
const transactionLabels: Record<TransactionType, string> = {
  income: 'Receita', expense: 'Despesa', transfer: 'Transferência',
  investment: 'Investimento', redemption: 'Resgate', debt_payment: 'Pagamento de dívida',
};

function PanelHeading({ title, action, onClick }: { title: string; action?: string; onClick?: () => void }) {
  return <div className="fx-panel-heading">
    <h2>{title}</h2>
    {action && <button className="fx-text-button" onClick={onClick}>{action}<ChevronRight size={15} aria-hidden="true" /></button>}
  </div>;
}

function Empty({ icon, text }: { icon: ReactNode; text: string }) {
  return <div className="fx-empty">{icon}<p>{text}</p></div>;
}

function GoalProgress({ title, amount, target, icon }: { title: string; amount: number; target: number; icon: ReactNode }) {
  const progress = target > 0 ? Math.max(0, Math.min(100, (amount / target) * 100)) : 0;
  return <div className="fx-goal">
    <div className="fx-goal-label"><span className="fx-tile-icon" data-tone="violet">{icon}</span><div><strong>{title}</strong>
      <small>{formatBRL(amount)}{target > 0 && ' de ' + formatBRL(target)}</small></div>
      {target > 0 && <b>{percentage.format(progress / 100)}</b>}
    </div>
    {target > 0 && <progress max={100} value={progress} aria-label={title} />}
  </div>;
}

export function FinanceOverviewTab() {
  const { user } = useAuth();
  const {
    accounts, bills, debts, goals, emergencyFund, budget, selectedMonth, selectedMonthTransactions,
    availableCash, monthIncome, monthExpenses, monthInvestments, monthDebtsPaid,
    netWorthSummary, monthlyClosingHistory, overdueBills, setSubTab,
  } = useFinance();
  const name = String(user?.user_metadata?.full_name || user?.email?.split('@')[0] || '').trim().split(/\s+/)[0];
  const balance = monthIncome - monthExpenses - monthInvestments - monthDebtsPaid;
  const pending = bills.filter((bill) => bill.type !== 'income' && bill.status !== 'paid' && bill.dueDate.startsWith(selectedMonth));
  const pendingTotal = pending.reduce((sum, bill) => sum + bill.amount, 0);
  const overdue = overdueBills.filter((bill) => bill.type !== 'income').length;
  const closingHistory = recentClosings(monthlyClosingHistory.filter((entry) => Number.isFinite(entry.netWorth)), selectedMonth, 12);
  const maxNetWorth = Math.max(1, ...closingHistory.map((entry) => Math.abs(entry.netWorth!)));
  const activeDebts = debts.filter((item) => item.status !== 'paid' && item.status !== 'cancelled');
  const recent = [...selectedMonthTransactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const totals = new Map<MasterCategory, number>();
  for (const transaction of selectedMonthTransactions) {
    if (transaction.type !== 'expense') continue;
    totals.set(transaction.masterCategory, (totals.get(transaction.masterCategory) ?? 0) + transaction.amount);
  }
  const categories = [...totals].filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1]);
  const activeAccounts = accounts.filter((account) => account.isActive).length;
  const usage = monthIncome > 0 ? monthExpenses / monthIncome : null;
  const metrics = [
    { label: 'Receitas recebidas', amount: monthIncome, detail: 'Previsto: ' + formatBRL(budget.plannedIncome), icon: ArrowDownLeft, tone: 'mint' },
    { label: 'Despesas do mês', amount: monthExpenses, detail: usage !== null ? percentage.format(usage) + ' da receita' : 'Sem receita registrada', icon: ArrowUpRight, tone: 'coral' },
    { label: 'Saldo disponível hoje', amount: availableCash, detail: activeAccounts === 1 ? '1 conta ativa' : activeAccounts + ' contas ativas', icon: Wallet, tone: 'violet' },
  ] as const;

  return <div className="fx-overview">
    <header className="fx-overview-title">
      <h1>Visão geral</h1>
      {name && <p>Olá, {name}.</p>}
    </header>

    <div className="fx-summary-grid">
      <section className="fx-balance" aria-labelledby="balance-title">
        <div className="fx-balance-content">
          <h2 id="balance-title"><Wallet size={17} aria-hidden="true" /> Saldo do mês</h2>
          <strong className="fx-balance-number">{formatBRL(balance)}</strong>
          <p>Receitas menos despesas, aportes e dívidas pagas.</p>
          <div className="fx-balance-footer">
            <span>Livre após compromissos</span>
            <b>{formatBRL(balance - pendingTotal)}</b>
          </div>
        </div>
      </section>
      <section className="fx-panel fx-commitments">
        <span className="fx-tile-icon" data-tone={overdue ? 'coral' : 'violet'}><CalendarClock size={19} aria-hidden="true" /></span>
        <div>
          <h2>Compromissos pendentes</h2>
          <strong className="fx-commitments-value">{formatBRL(pendingTotal)}</strong>
          <p>{!pending.length ? 'Nenhuma conta pendente neste mês.' : pending.length === 1 ? '1 conta a pagar neste mês.' : pending.length + ' contas a pagar neste mês.'}</p>
          {overdue > 0 && <p className="fx-overdue">{overdue === 1 ? '1 conta em atraso' : overdue + ' contas em atraso'}</p>}
        </div>
        <button className="fx-text-button" onClick={() => setSubTab('bills')}>Abrir agenda <ArrowRight size={16} aria-hidden="true" /></button>
      </section>
    </div>

    <div className="fx-metrics">
      {metrics.map(({ label, amount, detail, icon: Icon, tone }) => <section className="fx-panel fx-metric" key={label}>
        <span className="fx-tile-icon" data-tone={tone}><Icon size={19} aria-hidden="true" /></span>
        <div><h2>{label}</h2><strong>{formatBRL(amount)}</strong><small>{detail}</small></div>
      </section>)}
    </div>

    <div className="fx-detail-grid">
      <section className="fx-panel">
        <PanelHeading title="Despesas por categoria" action="Orçamento" onClick={() => setSubTab('budget')} />
        {categories.length > 0 ? <ul className="fx-categories">
          {categories.map(([key, amount]) => {
            const category = MASTER_CATEGORY_CONFIG[key];
            const share = monthExpenses > 0 ? Math.min(1, amount / monthExpenses) : 0;
            return <li key={key}>
              <div><span>{category?.name ?? key}</span><b>{formatBRL(amount)}</b></div>
              <div className="fx-ratio-track" title={percentage.format(share)}>
                <span style={{ width: `${share * 100}%`, background: category?.color ?? '#a99bff' }} />
              </div>
            </li>;
          })}
        </ul> : <Empty icon={<ChartNoAxesCombined size={22} aria-hidden="true" />} text="Nenhuma despesa registrada neste mês." />}
      </section>

      <section className="fx-panel">
        <PanelHeading title="Últimos lançamentos" />
        {recent.length > 0 ? <ul className="fx-ledger">
          {recent.map((entry) => {
            const income = entry.type === 'income' || entry.type === 'redemption';
            const transfer = entry.type === 'transfer';
            const Icon = transfer ? ArrowRight : income ? ArrowDownLeft : ArrowUpRight;
            return <li key={entry.id}>
              <span className="fx-tile-icon" data-tone={transfer ? 'violet' : income ? 'mint' : 'coral'}><Icon size={16} aria-hidden="true" /></span>
              <div><strong>{entry.description}</strong><small>{transactionLabels[entry.type]} · {formatDatePT(entry.date)}</small></div>
              <b>{transfer ? '' : income ? '+' : '−'}{formatBRL(entry.amount)}</b>
            </li>;
          })}
        </ul> : <Empty icon={<ReceiptText size={22} aria-hidden="true" />} text="Nenhum lançamento neste mês." />}
      </section>

      <section className="fx-panel">
        <PanelHeading title="Evolução do patrimônio" />
        <p className="fx-current-worth">Patrimônio atual <b>{formatBRL(netWorthSummary.netWorth)}</b></p>
        {closingHistory.length ? <div className="fx-history" aria-label="Patrimônio nos fechamentos mensais">
          {closingHistory.map(({ month, netWorth }) => {
            const label = monthFormat.format(new Date(`${month}-01T00:00:00Z`)).replace(' de ', '/');
            const value = netWorth!;
            return <div key={month} className="fx-history-slot">
              <div className="fx-history-track"><span role="img" aria-label={label + ': ' + formatBRL(value)} title={formatBRL(value)}
                className={value < 0 ? 'fx-history-negative' : ''} style={{ height: `${Math.max(3, Math.abs(value) / maxNetWorth * 100)}%` }} /></div>
              <small>{label}</small>
            </div>;
          })}
        </div> : <Empty icon={<ChartNoAxesCombined size={22} aria-hidden="true" />} text="Feche um mês para começar a acompanhar o histórico." />}
      </section>

      <section className="fx-panel">
        <PanelHeading title="Metas e reserva" action="Ver metas" onClick={() => setSubTab('goals')} />
        <div className="fx-goals">
          <GoalProgress title="Reserva de emergência" amount={emergencyFund.currentAmount} target={emergencyFund.targetAmount} icon={<ShieldCheck size={16} aria-hidden="true" />} />
          {goals.filter((goal) => goal.currentAmount < goal.targetAmount).slice(0, 3).map((goal) =>
            <div key={goal.id}><GoalProgress title={goal.title} amount={goal.currentAmount} target={goal.targetAmount} icon={<Target size={16} aria-hidden="true" />} /></div>)}
        </div>
      </section>

      <section className="fx-panel">
        <PanelHeading title="Dívidas ativas" action="Ver dívidas" onClick={() => setSubTab('debts')} />
        {activeDebts.length ? <ul className="fx-ledger">
          {activeDebts.slice(0, 4).map((debt) => <li key={debt.id}>
            <span className="fx-tile-icon" data-tone="coral"><Flag size={16} aria-hidden="true" /></span>
            <div><strong>{debt.name || debt.creditor}</strong><small>{debt.remainingInstallments} {debt.remainingInstallments === 1 ? 'parcela' : 'parcelas'}</small></div>
            <b>{formatBRL(debt.currentBalance)}</b>
          </li>)}
        </ul> : <Empty icon={<CircleCheck size={22} aria-hidden="true" />} text="Nenhuma dívida ativa." />}
      </section>
    </div>
  </div>;
}
