import { useState, type FormEvent } from 'react';
import { ArrowDownLeft, ArrowUpRight, CalendarDays, CircleHelp, CreditCard, Landmark, LayoutGrid, LineChart, LogOut, Plus, Target, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { formatBelvoMoney as money, type BelvoData } from '../lib/belvoData';
import { useBelvoDashboard } from '../lib/useBelvoDashboard';
import type { FinancialGoalItem } from '../types/finance';
import './openFinanceDashboard.css';

const navigation = [
  { id: 'overview', label: 'Visão geral', icon: LayoutGrid },
  { id: 'balances', label: 'Saldos', icon: Wallet },
  { id: 'expenses', label: 'Despesas', icon: ArrowUpRight },
  { id: 'debts', label: 'Dívidas', icon: CreditCard },
  { id: 'goals', label: 'Metas', icon: Target },
  { id: 'investments', label: 'Investimentos', icon: LineChart },
] as const;
type Panel = typeof navigation[number]['id'];
type MoneyRow = { name: string; detail?: string; amount: number | null; currency: string };

function totals<T extends { currency: string }>(rows: T[], value: (row: T) => number | null) {
  const result = new Map<string, number>();
  for (const row of rows) {
    const amount = value(row);
    if (amount === null) continue;
    result.set(row.currency, (result.get(row.currency) ?? 0) + Math.round(amount * 100));
  }
  return [...result].map(([currency, cents]) => money(cents / 100, currency)).join(' · ') || '—';
}

function Ledger({ rows, empty }: { rows: MoneyRow[]; empty: string }) {
  if (!rows.length) return <p className="of-muted">{empty}</p>;
  return <ul className="of-ledger">
    {rows.map((row, index) => <li key={index}>
      <div><p>{row.name}</p>{row.detail && <span>{row.detail}</span>}</div>
      <strong>{row.amount === null ? 'Indisponível' : money(row.amount, row.currency)}</strong>
    </li>)}
  </ul>;
}

const shortDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.split('-').reverse().join('/') : '';

function providerDate(value?: string) {
  if (!value) return '';
  const day = shortDate(value);
  if (day) return day;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

function accountRows(data?: BelvoData, group?: string): MoneyRow[] {
  return (data?.accounts ?? []).filter(row => row.group === group).map(row => ({
    name: row.name, detail: [row.institution, row.lastFour && 'Final ' + row.lastFour, row.balanceLabel].filter(Boolean).join(' · '),
    amount: row.balance, currency: row.currency,
  }));
}

function Goals() {
  const { goals, addFinancialGoal, updateFinancialGoal, deleteFinancialGoal, isFinanceHydrated, lastFinanceDbError } = useFinance();
  const [edit, setEdit] = useState<FinancialGoalItem | 'new' | null>(null);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get('title')).trim();
    const targetAmount = Number(data.get('target'));
    const currentAmount = Number(data.get('current'));
    if (!title || !Number.isFinite(targetAmount) || targetAmount <= 0 || !Number.isFinite(currentAmount) || currentAmount < 0) return;
    if (edit && edit !== 'new') updateFinancialGoal(edit.id, { title, targetAmount, currentAmount });
    else addFinancialGoal({ title, targetAmount, currentAmount, deadline: '', monthlyContribution: 0, masterCategory: 'metas', color: '#6ee7b7' });
    setEdit(null);
  }
  const goal = edit && edit !== 'new' ? edit : undefined;
  return <section className="of-panel">
    <div className="of-section-heading"><h2>Minhas metas</h2><button className="of-primary" disabled={!isFinanceHydrated} onClick={() => setEdit('new')}><Plus size={17} /> Nova meta</button></div>
    {lastFinanceDbError && <p role="alert" className="of-alert">{lastFinanceDbError}</p>}
    {edit && <form className="of-goal-form" key={goal?.id ?? 'new'} onSubmit={submit}>
      <label>Nome da meta<input name="title" maxLength={100} defaultValue={goal?.title} required /></label>
      <label>Valor-alvo<input name="target" type="number" min="0.01" step="0.01" defaultValue={goal?.targetAmount} required /></label>
      <label>Valor separado<input name="current" type="number" min="0" step="0.01" defaultValue={goal?.currentAmount ?? 0} required /></label>
      <div><button type="submit" className="of-primary">Salvar meta</button><button type="button" className="of-link" onClick={() => setEdit(null)}>Cancelar</button></div>
    </form>}
    {!goals.length && <p className="of-muted">Crie uma meta e acompanhe quanto já separou.</p>}
    <div className="of-goal-grid">
      {goals.map(goal => <article key={goal.id}>
        <h3>{goal.title}</h3>
        <p>{money(goal.currentAmount, 'BRL')} <span>de {money(goal.targetAmount, 'BRL')}</span></p>
        <progress max={Math.max(goal.targetAmount, 1)} value={Math.min(goal.currentAmount, Math.max(goal.targetAmount, 1))} aria-label={'Progresso de ' + goal.title} />
        <div><button className="of-link" onClick={() => setEdit(goal)}>Editar</button><button className="of-link of-remove" onClick={() => { if (window.confirm('Excluir a meta ' + goal.title + '?')) deleteFinancialGoal(goal.id); }}>Excluir</button></div>
      </article>)}
    </div>
  </section>;
}

export function OpenFinanceDashboard() {
  const { user, signOut } = useAuth();
  const { goals, forceFinanceDbSync, isFinanceHydrated } = useFinance();
  const session = useBelvoDashboard(user!.id);
  const [panel, setPanel] = useState<Panel>('overview');
  const [settings, setSettings] = useState(false);
  const data: BelvoData | undefined = session.snapshot?.data;
  const accounts = accountRows(data, 'cash');
  const cards = accountRows(data, 'card');
  const loans = accountRows(data, 'debt');
  const investments = (data?.investments ?? []).map(row => ({
    name: row.name, amount: row.balance, currency: row.currency,
    detail: [row.institution, row.balanceLabel, shortDate(row.date)].filter(Boolean).join(' · '),
  }));
  const reserves = (data?.accounts ?? []).flatMap(account => (account.reserves ?? []).map(reserve => {
    const balanceAt = providerDate(reserve.balanceAt);
    const collectedAt = providerDate(reserve.collectedAt);
    const date = balanceAt ? 'Saldo de ' + balanceAt : collectedAt ? 'Coletado pela Belvo em ' + collectedAt : 'Data do saldo indisponível';
    return {
      name: reserve.name, amount: reserve.balance, currency: reserve.currency,
      detail: [account.institution, date].filter(Boolean).join(' · '),
    };
  }));
  const missingMercadoPagoReserves = data?.accounts.some(account =>
    account.institution === 'Mercado Pago' && account.group !== 'card' && account.group !== 'debt') &&
    !data.accounts.some(account => account.institution === 'Mercado Pago' &&
      account.reserves?.some(reserve => reserve.balance !== null));
  const expenses = (data?.transactions ?? []).filter(row => row.direction === 'out');
  const expenseRows = expenses.map(row => ({
    name: row.description, detail: shortDate(row.date), amount: -row.amount, currency: row.currency,
  }));
  const bills = (data?.bills ?? []).map(row => ({
    name: row.name, amount: row.amount, currency: row.currency,
    detail: [row.institution, shortDate(row.dueDate) && 'Vencimento ' + shortDate(row.dueDate)].filter(Boolean).join(' · '),
  }));
  const cashTotal = totals((data?.accounts ?? []).filter(row => row.group === 'cash' && row.balanceLabel === 'Saldo disponível'), row => row.balance);
  const expenseTotal = totals(expenses, row => row.amount);
  const investmentTotal = totals(data?.investments ?? [], row => row.balanceLabel === 'Valor líquido' ? row.balance : null);
  const status = session.busy ? 'Atualizando' : session.connected ? 'Belvo conectado' : session.manual ? 'Consulta avulsa' : 'Belvo desconectado';
  const update = session.snapshot?.updatedAt
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(session.snapshot.updatedAt))
    : '';
  const active = navigation.find(item => item.id === panel)!;
  const tiles = [
    { id: 'balances', label: 'Saldo disponível', value: cashTotal, icon: Wallet },
    { id: 'expenses', label: 'Saídas no extrato', value: expenseTotal, icon: ArrowDownLeft },
    { id: 'investments', label: 'Investimentos recebidos · valor líquido', value: investmentTotal, icon: LineChart },
    { id: 'goals', label: 'Metas ativas', value: String(goals.length), icon: Target },
  ] as const;

  return <div className="of-shell">
    <aside className="of-sidebar">
      <a className="of-brand" href="/" aria-label="Fluxo"><span><LineChart size={23} /></span><div>Fluxo<small>Open Finance</small></div></a>
      <nav aria-label="Seções do Open Finance">
        {navigation.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setPanel(id)} aria-current={panel === id ? 'page' : undefined}><Icon size={19} /><span>{label}</span></button>)}
      </nav>
      <button className="of-sidebar-help" onClick={() => setSettings(value => !value)}><CircleHelp size={18} /><span>Gerenciar conexão</span></button>
    </aside>
    <main className="of-main">
      <div className="of-top">
        <span><Landmark size={16} /> Meu espaço</span>
        <div><span className="of-status" data-active={session.connected || !!data}>{status}</span>
          <button className="of-icon-button" title="Sair" aria-label="Sair do Fluxo" onClick={async () => { if (!isFinanceHydrated || await forceFinanceDbSync() || window.confirm('Sair com alterações aguardando sincronização?')) await signOut(); }}><LogOut size={19} /></button>
        </div>
      </div>
      <header className="of-heading">
        <div><h1>{active.label}</h1><p>{update ? 'Última consulta à Belvo em ' + update : panel === 'goals' ? 'Planeje o que quer alcançar.' : 'Acompanhe suas finanças conectadas.'}</p></div>
        {panel !== 'goals' && <label className="of-month"><CalendarDays size={18} /><input aria-label="Mês do extrato" type="month" value={session.month} onChange={event => session.chooseMonth(event.target.value)} /></label>}
      </header>

      {session.error && <p className="of-alert" role="alert">{session.error}</p>}
      {(!session.connected || settings) && <section className="of-connect">
        <div><h2>{session.connected ? 'Conexão Belvo' : 'Conecte suas contas'}</h2>
          <p>{session.demo ? 'Este login de demonstração permite uma consulta avulsa. Use seu login particular para ativar a atualização automática.' :
            session.manual ? 'A Belvo autorizou somente a leitura desta sessão. Reconecte para tentar habilitar a atualização automática.' :
            session.connected ? 'O painel atualiza os dados enquanto você o usa.' : 'Autorize uma vez na Belvo para carregar o painel nas próximas visitas.'}</p></div>
        {session.connected ? <button className="of-secondary" onClick={() => { if (window.confirm('Remover a conexão Belvo e os dados salvos no Fluxo?')) void session.disconnect(); }}>Desconectar do Fluxo</button>
          : <button className="of-primary" disabled={session.busy} onClick={() => void session.connect()}>{session.busy ? 'Carregando…' : session.demo ? 'Consultar com Belvo' : 'Conectar Belvo'}</button>}
      </section>}
      {data?.partial && <p className="of-alert" role="status">Consulta parcial. Alguns produtos ou movimentações podem não estar incluídos.</p>}

      {panel === 'overview' && <>
        <div className="of-tiles">{tiles.map(({ id, label, value, icon: Icon }) => <button className="of-tile" key={id} onClick={() => setPanel(id)}><span><Icon size={19} /> {label}</span><strong>{value}</strong></button>)}</div>
        <div className="of-overview-grid">
          <section className="of-panel"><div className="of-section-heading"><h2>Últimas saídas</h2><button className="of-link" onClick={() => setPanel('expenses')}>Ver despesas</button></div>
            <Ledger rows={expenseRows.slice(0, 6)} empty="Sem saídas retornadas para o mês." />
          </section>
          <section className="of-panel"><div className="of-section-heading"><h2>Investimentos</h2><button className="of-link" onClick={() => setPanel('investments')}>Ver posições</button></div>
            <Ledger rows={[...reserves, ...investments].slice(0, 4)} empty="Sem reservas ou posições retornadas pela Belvo." />
          </section>
        </div>
      </>}
      {panel === 'balances' && <div className="of-overview-grid">
        <section className="of-panel"><h2>Contas bancárias</h2><Ledger rows={accounts} empty="Sem contas bancárias retornadas." /></section>
        <section className="of-panel"><h2>Cartões de crédito</h2><Ledger rows={cards} empty="Sem cartões retornados." /></section>
        {!!accountRows(data, 'other').length && <section className="of-panel"><h2>Outros produtos</h2><Ledger rows={accountRows(data, 'other')} empty="Sem outros produtos." /></section>}
      </div>}
      {panel === 'expenses' && <section className="of-panel"><div className="of-section-heading"><h2>Saídas no extrato</h2><strong>{expenseTotal}</strong></div>
        <p className="of-muted">Pode incluir transferências e pagamentos de faturas.</p><Ledger rows={expenseRows} empty="Sem saídas retornadas para o mês." />
      </section>}
      {panel === 'debts' && <div className="of-overview-grid">
        <section className="of-panel"><h2>Empréstimos e financiamentos</h2><Ledger rows={loans} empty="Sem contratos retornados." /></section>
        <section className="of-panel"><h2>Faturas</h2><Ledger rows={bills} empty="Sem faturas retornadas para o mês." />
          {!!data?.billFailures && <p className="of-muted">Algumas instituições não retornaram faturas.</p>}
        </section>
      </div>}
      {panel === 'goals' && <Goals />}
      {panel === 'investments' && <div className="of-overview-grid">
        <section className="of-panel">
          <div className="of-section-heading"><h2>Caixinhas e Cofrinhos</h2><strong>{totals(reserves, row => row.amount)}</strong></div>
          {!!reserves.length && <p className="of-muted">Total das reservas recebidas. A data do saldo depende do que o banco compartilha pelo Open Finance.</p>}
          <Ledger rows={reserves} empty={missingMercadoPagoReserves ? 'O saldo dos Cofrinhos do Mercado Pago não veio nesta consulta.' : 'Nenhuma reserva informada pela Belvo nesta consulta.'} />
          {!!reserves.length && missingMercadoPagoReserves && <p className="of-muted">O saldo dos Cofrinhos do Mercado Pago não veio nesta consulta.</p>}
        </section>
        <section className="of-panel">
          <div className="of-section-heading"><h2>Investimentos recebidos</h2><strong>{investmentTotal}</strong></div>
          <p className="of-muted">Total pelo valor líquido informado. Caixinhas aplicadas pelo banco podem aparecer como RDB ou fundo.</p>
          <Ledger rows={investments} empty="Sem posições retornadas pela Belvo." />
          {!!data?.investmentFailures && <p className="of-muted">Algumas instituições não retornaram posições de investimento.</p>}
        </section>
      </div>}
    </main>
  </div>;
}
