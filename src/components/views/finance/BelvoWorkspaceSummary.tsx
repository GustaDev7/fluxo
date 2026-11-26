import { useFinance } from '../../../context/FinanceContext';
import { formatBelvoMoney as money } from '../../../lib/belvoData';
import type { FinanceSubTab } from '../../../types/finance';

type Row = { name: string; detail?: string; amount: number | null; currency: string };

export function BelvoWorkspaceSummary({ tab }: { tab: FinanceSubTab }) {
  const { belvoData, selectedMonth, setSubTab } = useFinance();
  const titles: Partial<Record<FinanceSubTab, string>> = {
    overview: 'Seu panorama via Open Finance',
    budget: 'Movimentações bancárias do mês',
    bills: 'Faturas via Open Finance',
    debts: 'Créditos via Open Finance',
    investments: 'Dinheiro guardado e investimentos via Open Finance',
  };
  const title = titles[tab];
  if (!title) return null;
  const goToBank = () => setSubTab('banks');
  if (!belvoData || belvoData.month !== selectedMonth) {
    return <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-950 bg-[#151021] px-4 py-3">
      <p className="text-sm text-neutral-300">Consulte o Belvo para ver seus dados bancários neste mês.</p>
      <button className="text-sm font-bold text-violet-300 hover:underline" onClick={goToBank}>Bancos e extratos</button>
    </div>;
  }

  const rows: Row[] = [];
  let notice = '';
  if (tab === 'overview') {
    const counts = [
      ['cash', 'Contas bancárias'],
      ['card', 'Cartões de crédito'],
      ['debt', 'Empréstimos e financiamentos'],
    ] as const;
    for (const [group, name] of counts) {
      const products = belvoData.accounts.filter(account => account.group === group);
      if (group === 'cash') {
        for (const currency of new Set(products.map(account => account.currency))) {
          const list = products.filter(account => account.currency === currency && account.balanceLabel === 'Saldo disponível' && account.balance !== null);
          if (list.length) rows.push({ name: 'Saldo disponível em contas', detail: currency, currency,
            amount: list.reduce((sum, account) => sum + Math.round(account.balance! * 100), 0) / 100 });
        }
      } else rows.push({ name, detail: products.length + ' vinculados', amount: null, currency: 'BRL' });
    }
    rows.push({ name: 'Posições de investimento', detail: (belvoData.investments?.length ?? 0) + ' retornadas', amount: null, currency: 'BRL' });
  } else if (tab === 'budget') {
    const currencies = new Set(belvoData.transactions.map(transaction => transaction.currency));
    for (const currency of currencies) {
      for (const [direction, name] of [['in', 'Entradas no extrato'], ['out', 'Saídas no extrato']] as const) {
        const matching = belvoData.transactions.filter(row => row.currency === currency && row.direction === direction);
        if (matching.length) rows.push({ name, currency, amount: matching.reduce((sum, row) => sum + Math.round(row.amount * 100), 0) / 100 });
      }
    }
    notice = 'As movimentações podem incluir transferências e pagamentos de faturas. Veja o extrato para conferir os valores do orçamento.';
  } else if (tab === 'bills') {
    for (const bill of belvoData.bills ?? []) rows.push({ name: bill.name, currency: bill.currency, amount: bill.amount,
      detail: [bill.institution, bill.dueDate && 'Vence ' + bill.dueDate.split('-').reverse().join('/')].filter(Boolean).join(' · ') });
    if (belvoData.billFailures) notice = 'A consulta de faturas não foi concluída para todas as instituições.';
  } else if (tab === 'debts') {
    for (const loan of belvoData.accounts.filter(account => account.group === 'debt')) rows.push({
      name: loan.name, detail: [loan.institution, 'Valor informado'].filter(Boolean).join(' · '), amount: loan.balance, currency: loan.currency,
    });
  } else if (tab === 'investments') {
    for (const investment of belvoData.investments ?? []) rows.push({
      name: investment.name, detail: [investment.institution, investment.balanceLabel,
        investment.date && investment.date.split('-').reverse().join('/')].filter(Boolean).join(' · '),
      amount: investment.balance, currency: investment.currency,
    });
    notice = belvoData.investmentFailures
      ? 'A consulta de investimentos não foi concluída para todas as instituições.'
      : 'Caixinhas podem vir pelo nome do RDB ou do fundo informado pelo banco.';
  }

  return <section className="mt-4 rounded-2xl border border-violet-950 bg-[#151021] p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-bold">{title}</h2>
      <button className="text-sm font-bold text-violet-300 hover:underline" onClick={goToBank}>Ver extratos</button>
    </div>
    {rows.length ? <ul className="mt-2 divide-y divide-violet-950">{rows.map((row, index) => (
      <li key={index} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
        <div><p>{row.name}</p>{row.detail && <p className="text-xs text-neutral-400">{row.detail}</p>}</div>
        {row.amount !== null && <strong>{money(row.amount, row.currency)}</strong>}
      </li>
    ))}</ul> : <p className="mt-2 text-sm text-neutral-400">Nenhum dado retornado para esta área.</p>}
    {notice && <p className="mt-2 text-xs text-neutral-400">{notice}</p>}
    {belvoData.partial && <p className="mt-2 text-xs text-amber-300">Consulta parcial. Os valores podem estar incompletos.</p>}
  </section>;
}
