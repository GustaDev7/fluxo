import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFinance } from '../../../context/FinanceContext';
import { formatBRL, formatPercent } from '../../../utils/financeUtils';
import { InvestmentCategory, InvestmentAssetItem } from '../../../types/finance';
import {
  TrendingUp,
  PieChart,
  Plus,
  Sparkles,
  ShieldCheck,
  Coins,
  X,
  BarChart3,
  BriefcaseBusiness,
  Pencil,
  Search,
  Trash2,
  ChevronDown,
  MoreHorizontal,
  ReceiptText,
  WalletCards,
} from 'lucide-react';

type AssetFormMode = 'patrimony' | 'investment';

export const FinanceInvestmentsTab: React.FC = () => {
  const {
    investments,
    accounts,
    netWorthSummary,
    budget,
    monthInvestments,
    addInvestmentAsset,
    updateInvestmentAsset,
    deleteInvestmentAsset,
    recordAporte,
    setSubTab,
  } = useFinance();

  const [assetFormMode, setAssetFormMode] = useState<AssetFormMode | null>(null);
  const [ticker, setTicker] = useState('');
  const [category, setCategory] = useState<InvestmentCategory>('renda_fixa');
  const [quantity, setQuantity] = useState('1');
  const [avgPrice, setAvgPrice] = useState('');
  const [institution, setInstitution] = useState('');
  const [targetAlloc, setTargetAlloc] = useState('15');
  const [search, setSearch] = useState('');
  const [editingAsset, setEditingAsset] = useState<InvestmentAssetItem | null>(null);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Aporte modal
  const [isAporteOpen, setIsAporteOpen] = useState(false);
  const [aporteAssetId, setAporteAssetId] = useState('');
  const [aporteAmount, setAporteAmount] = useState('300');
  const [aporteQuantity, setAporteQuantity] = useState('');
  const [selectedAccId, setSelectedAccId] = useState(accounts[0]?.id || '');

  useEffect(() => {
    if (!accounts.some((account) => account.id === selectedAccId)) {
      setSelectedAccId(accounts.find((account) => account.isActive)?.id || accounts[0]?.id || '');
    }
  }, [accounts, selectedAccId]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(''), 4000);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const openAssetForm = (mode: AssetFormMode) => {
    setAssetFormMode(mode);
    setTicker('');
    setCategory(mode === 'patrimony' ? 'outros' : 'renda_fixa');
    setQuantity(mode === 'patrimony' ? '1' : '0');
    setAvgPrice('');
    setInstitution('');
    setTargetAlloc(mode === 'patrimony' ? '0' : '15');
  };

  const openAporteForm = (assetId?: string) => {
    setAporteAssetId(assetId || investments[0]?.id || '');
    setSelectedAccId((current) => accounts.some((account) => account.id === current)
      ? current
      : accounts.find((account) => account.isActive)?.id || accounts[0]?.id || '');
    setAporteAmount('300');
    setAporteQuantity('');
    setIsAporteOpen(true);
  };

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseFloat(quantity.replace(',', '.')) || 0;
    const priceNum = parseFloat(avgPrice.replace(',', '.')) || 0;
    const targetNum = parseFloat(targetAlloc.replace(',', '.')) || 0;

    if (!ticker.trim()) return;
    if (assetFormMode === 'patrimony' && (!qtyNum || !priceNum)) return;

    const totalVal = qtyNum * priceNum;

    addInvestmentAsset({
      tickerOrName: ticker.trim().toUpperCase(),
      category,
      quantity: qtyNum,
      averagePrice: priceNum,
      currentPrice: priceNum,
      totalInvested: totalVal,
      currentValue: totalVal,
      institution: institution.trim() || (assetFormMode === 'patrimony' ? 'Patrimônio pessoal' : 'Não informada'),
      targetAllocationPercent: targetNum,
    });

    setAssetFormMode(null);
    setFeedback(assetFormMode === 'patrimony' ? 'Patrimônio adicionado com sucesso.' : 'Investimento criado com sucesso.');
  };

  const handleConfirmAporte = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(aporteAmount.replace(',', '.')) || 0;
    const quantityVal = parseFloat(aporteQuantity.replace(',', '.')) || undefined;
    if (!aporteAssetId || !selectedAccId || !amountVal) return;

    const registered = recordAporte(aporteAssetId, amountVal, selectedAccId, quantityVal);
    if (!registered) return;
    setIsAporteOpen(false);
    setFeedback('Aporte registrado e conta de origem atualizada.');
  };

  const totalInvestedPortfolio = investments.reduce((acc, i) => acc + i.currentValue, 0);
  const totalCost = investments.reduce((acc, i) => acc + i.totalInvested, 0);
  const portfolioProfit = totalInvestedPortfolio - totalCost;
  const portfolioProfitPct = totalCost > 0 ? portfolioProfit / totalCost * 100 : 0;

  // Group portfolio by category
  const categoryAllocations: Record<string, { name: string; currentVal: number; color: string }> = {
    renda_fixa: { name: 'Renda Fixa', currentVal: 0, color: '#3B82F6' },
    fiis: { name: 'Fundos Imobiliários', currentVal: 0, color: '#10B981' },
    acoes_br: { name: 'Ações Brasil', currentVal: 0, color: '#F59E0B' },
    acoes_int: { name: 'Internacional / REITs', currentVal: 0, color: '#8B5CF6' },
    crypto: { name: 'Criptoativos', currentVal: 0, color: '#EC4899' },
    outros: { name: 'Outros', currentVal: 0, color: '#6B7280' },
  };

  investments.forEach((inv) => {
    const key =
      inv.category === 'renda_fixa'
        ? 'renda_fixa'
        : inv.category === 'fiis'
        ? 'fiis'
        : inv.category === 'acoes_br'
        ? 'acoes_br'
        : inv.category === 'acoes_int' || inv.category === 'reits' || inv.category === 'etfs'
        ? 'acoes_int'
        : inv.category === 'crypto'
        ? 'crypto'
        : 'outros';

    if (categoryAllocations[key]) {
      categoryAllocations[key].currentVal += inv.currentValue;
    }
  });

  const targetAporte = budget.allocations.liberdade_financeira || 0;
  const aporteProgress = targetAporte > 0 ? Math.min(100, Math.round((monthInvestments / targetAporte) * 100)) : 0;
  const monthLabel = new Date(`${budget.month || new Date().toISOString().slice(0, 7)}-01T00:00:00Z`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const recommendedAsset = useMemo(() => investments.filter((asset) => asset.targetAllocationPercent > 0).map((asset) => ({ asset, current: totalInvestedPortfolio > 0 ? asset.currentValue / totalInvestedPortfolio * 100 : 0 })).sort((a, b) => (b.asset.targetAllocationPercent - b.current) - (a.asset.targetAllocationPercent - a.current))[0], [investments, totalInvestedPortfolio]);
  const filteredInvestments = investments.filter((asset) => [asset.tickerOrName, asset.institution, asset.category].some((value) => value.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-neutral-400"><span>Finanças</span><span>›</span><span className="text-neutral-600 dark:text-neutral-300">Investimentos</span></div><h2 className="text-2xl font-black">Investimentos</h2><p className="mt-1 text-sm text-neutral-500">Acompanhe sua carteira, rentabilidade, alocação e aportes em um só lugar.</p></div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button onClick={() => openAssetForm('patrimony')} className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"><BriefcaseBusiness className="h-4 w-4"/>Adicionar patrimônio</button>
          <button onClick={() => openAssetForm('investment')} className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"><Plus className="h-4 w-4"/>Novo investimento</button>
          <button onClick={() => openAporteForm()} className="flex items-center justify-center gap-2 rounded-xl border border-indigo-500/40 px-3.5 py-2.5 text-xs font-bold text-indigo-500 hover:bg-indigo-500/5"><TrendingUp className="h-4 w-4"/>Registrar aporte</button>
          <div className="relative">
            <button onClick={() => setIsMoreOpen((open) => !open)} aria-expanded={isMoreOpen} className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"><MoreHorizontal className="h-4 w-4"/><span>Mais</span><ChevronDown className="h-3.5 w-3.5"/></button>
            {isMoreOpen && <div className="absolute right-0 top-12 z-30 w-56 rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
              <button onClick={() => { setSubTab('transactions'); setIsMoreOpen(false); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"><ReceiptText className="h-4 w-4"/>Ver movimentações</button>
              <button onClick={() => { setSubTab('accounts'); setIsMoreOpen(false); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"><WalletCards className="h-4 w-4"/>Gerenciar contas</button>
              <button onClick={() => { setIsMoreOpen(false); searchInputRef.current?.focus(); searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"><Search className="h-4 w-4"/>Buscar na carteira</button>
            </div>}
          </div>
        </div>
      </div>

      {feedback && <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">{feedback}</div>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ['Patrimônio investido', totalInvestedPortfolio, `${investments.length} ativos`, BriefcaseBusiness, 'text-indigo-500 bg-indigo-500/10'],
          ['Total aportado', totalCost, 'Custo de aquisição', Coins, 'text-blue-500 bg-blue-500/10'],
          ['Resultado da carteira', portfolioProfit, formatPercent(portfolioProfitPct), TrendingUp, portfolioProfit >= 0 ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'],
          ['Aportes no mês', monthInvestments, targetAporte > 0 ? `Meta: ${formatBRL(targetAporte)}` : 'Sem meta definida', BarChart3, 'text-emerald-500 bg-emerald-500/10'],
          ['Patrimônio líquido', netWorthSummary.netWorth, 'Ativos menos passivos', ShieldCheck, 'text-amber-500 bg-amber-500/10'],
        ].map(([label, value, detail, Icon, color]) => { const MetricIcon = Icon as typeof TrendingUp; return <div key={String(label)} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"><div className="flex items-start gap-3"><span className={`rounded-xl p-2.5 ${color}`}><MetricIcon className="h-5 w-5"/></span><div className="min-w-0"><span className="text-[11px] text-neutral-500">{String(label)}</span><b className="mt-1 block truncate text-lg">{formatBRL(Number(value))}</b><span className="text-[10px] text-neutral-500">{String(detail)}</span></div></div></div>; })}
      </div>

      <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Resumo patrimonial</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Contas, carteira, dívidas e faturas consolidadas.
            </p>
          </div>
        </div>

        {/* Assets vs Liabilities Balance */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800/40">
            <span className="text-xs text-neutral-400 block">Total de Ativos (Bens + Investimentos)</span>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {formatBRL(netWorthSummary.totalAssets)}
            </div>
            <span className="text-[10px] text-neutral-400">Contas ({formatBRL(netWorthSummary.accountsTotal)}) + Carteira</span>
          </div>

          <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800/40">
            <span className="text-xs text-neutral-400 block">Total de Passivos (Dívidas + Faturas)</span>
            <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
              {formatBRL(netWorthSummary.totalLiabilities)}
            </div>
            <span className="text-[10px] text-neutral-400">Dívidas ({formatBRL(netWorthSummary.debtsTotal)}) + Faturas</span>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold block">
              Patrimônio Líquido Real
            </span>
            <div className="text-2xl font-black text-emerald-900 dark:text-emerald-100 mt-0.5">
              {formatBRL(netWorthSummary.netWorth)}
            </div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400">Ativos menos Passivos</span>
          </div>
        </div>
      </div>

      {/* Monthly contribution status */}
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Central de aportes · <span className="capitalize">{monthLabel}</span>
            </h4>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              {targetAporte > 0 ? `Meta do orçamento: ${formatBRL(targetAporte)}` : 'Defina a meta de investimentos no orçamento'}
            </p>
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
              {formatBRL(monthInvestments)} / {formatBRL(targetAporte)}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-neutral-500">
            <span>Aporte Realizado</span>
            <span className="font-bold text-neutral-800 dark:text-neutral-200">{aporteProgress}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-500"
              style={{ width: `${aporteProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Portfolio Allocation & Rebalancing Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Allocation breakdown */}
        <div className="lg:col-span-2 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-indigo-600" />
              <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Alocação por Classe de Ativos
              </h4>
            </div>
            <span className="text-xs font-semibold text-neutral-400">
              Total: {formatBRL(totalInvestedPortfolio)}
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(categoryAllocations).map(([key, data]) => {
              if (data.currentVal <= 0) return null;
              const pct = totalInvestedPortfolio > 0 ? Math.round((data.currentVal / totalInvestedPortfolio) * 100) : 0;

              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {data.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">
                        {formatBRL(data.currentVal)}
                      </span>
                      <span className="text-neutral-400 font-medium w-9 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: data.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AUVP Smart Rebalance Box */}
        <div className="rounded-3xl border border-indigo-100 bg-indigo-50/70 p-6 dark:border-indigo-900/40 dark:bg-indigo-950/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 mb-2">
              <Sparkles className="h-4 w-4" />
              <h4 className="text-xs font-bold">Rebalanceamento Inteligente</h4>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">
              No método AUVP, você nunca vende ativos para rebalancear: você aporta no que está para trás da sua meta.
            </p>

            <div className="rounded-2xl bg-white p-3.5 shadow-sm dark:bg-neutral-800/80 space-y-1 mb-4">
              <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">
                Sugestão do Próximo Aporte
              </span>
              <div className="text-xs font-black text-indigo-700 dark:text-indigo-300">{recommendedAsset?.asset.tickerOrName || 'Cadastre metas por ativo'}</div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {recommendedAsset ? `Alocação atual de ${recommendedAsset.current.toFixed(1).replace('.', ',')}% para uma meta de ${recommendedAsset.asset.targetAllocationPercent.toFixed(1).replace('.', ',')}%.` : 'A sugestão aparecerá quando houver ativos com alocação desejada.'}
              </p>
            </div>
          </div>

          <button
            disabled={!recommendedAsset}
            onClick={() => recommendedAsset && openAporteForm(recommendedAsset.asset.id)}
            className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-colors disabled:opacity-40"
          >
            Aportar no Ativo Recomendado
          </button>
        </div>
      </div>

      {/* 4. Assets Table */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Carteira de ativos ({investments.length})</h4><p className="text-xs text-neutral-500">Posição, rentabilidade, instituição e meta de alocação.</p></div><label className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 dark:border-neutral-800 dark:bg-neutral-900"><Search className="h-4 w-4 text-neutral-400"/><input ref={searchInputRef} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar ativo..." className="w-full bg-transparent py-2.5 text-sm outline-none sm:w-52"/></label></div>

        <div className="rounded-3xl border border-neutral-200 bg-white overflow-hidden shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {filteredInvestments.map((asset) => {
              const profit = asset.currentValue - asset.totalInvested;
              const profitPct = asset.totalInvested > 0 ? (profit / asset.totalInvested) * 100 : 0;

              return (
                <div
                  key={asset.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-bold text-xs">
                      {asset.tickerOrName.slice(0, 4)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                          {asset.tickerOrName}
                        </span>
                        <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 capitalize">
                          {asset.category.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        {asset.institution} • {asset.quantity} cotas • PM: {formatBRL(asset.averagePrice)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5">
                    <div className="text-right">
                      <div className="text-xs font-black text-neutral-900 dark:text-neutral-100">
                        {formatBRL(asset.currentValue)}
                      </div>
                      <div
                        className={`text-[10px] font-bold ${
                          profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {profit >= 0 ? '+' : ''}
                        {formatBRL(profit)} ({formatPercent(profitPct)})
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        openAporteForm(asset.id);
                      }}
                      className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-bold text-neutral-800 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                    >
                      Aportar
                    </button>
                    <button onClick={() => setEditingAsset({ ...asset })} aria-label={`Editar ${asset.tickerOrName}`} className="rounded-xl border border-neutral-200 p-2 text-neutral-500 hover:text-indigo-500 dark:border-neutral-700"><Pencil className="h-4 w-4"/></button>
                    <button onClick={() => window.confirm(`Excluir ${asset.tickerOrName} da carteira?`) && deleteInvestmentAsset(asset.id)} aria-label={`Excluir ${asset.tickerOrName}`} className="rounded-xl border border-neutral-200 p-2 text-neutral-500 hover:text-rose-500 dark:border-neutral-700"><Trash2 className="h-4 w-4"/></button>
                  </div>
                </div>
              );
            })}
            {!filteredInvestments.length && <div className="p-10 text-center"><BriefcaseBusiness className="mx-auto h-6 w-6 text-neutral-400"/><p className="mt-2 text-sm font-bold">Nenhum ativo encontrado</p><p className="text-xs text-neutral-500">Cadastre seu primeiro investimento ou ajuste a busca.</p>{!investments.length && <button onClick={() => openAssetForm('investment')} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white">Criar primeiro investimento</button>}</div>}
          </div>
        </div>
      </div>

      {editingAsset && <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"><form onSubmit={(event) => { event.preventDefault(); updateInvestmentAsset(editingAsset.id, editingAsset); setEditingAsset(null); }} className="w-full max-w-lg space-y-4 rounded-3xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"><div className="flex items-center justify-between"><div><h3 className="text-base font-black">Editar ativo</h3><p className="text-xs text-neutral-500">Atualize os valores reais da sua posição.</p></div><button type="button" onClick={() => setEditingAsset(null)}><X className="h-5 w-5"/></button></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold">Nome ou ticker<input required value={editingAsset.tickerOrName} onChange={(e) => setEditingAsset({ ...editingAsset, tickerOrName: e.target.value.toUpperCase() })} className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 dark:border-neutral-700 dark:bg-neutral-800"/></label><label className="text-xs font-bold">Instituição<input required value={editingAsset.institution} onChange={(e) => setEditingAsset({ ...editingAsset, institution: e.target.value })} className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 dark:border-neutral-700 dark:bg-neutral-800"/></label><label className="text-xs font-bold">Quantidade<input type="number" min="0" step="0.000001" value={editingAsset.quantity} onChange={(e) => setEditingAsset({ ...editingAsset, quantity: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 dark:border-neutral-700 dark:bg-neutral-800"/></label><label className="text-xs font-bold">Preço atual<input type="number" min="0" step="0.01" value={editingAsset.currentPrice} onChange={(e) => setEditingAsset({ ...editingAsset, currentPrice: Number(e.target.value), currentValue: editingAsset.quantity * Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 dark:border-neutral-700 dark:bg-neutral-800"/></label><label className="text-xs font-bold">Valor atual<input type="number" min="0" step="0.01" value={editingAsset.currentValue} onChange={(e) => setEditingAsset({ ...editingAsset, currentValue: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 dark:border-neutral-700 dark:bg-neutral-800"/></label><label className="text-xs font-bold">Meta de alocação (%)<input type="number" min="0" max="100" step="0.1" value={editingAsset.targetAllocationPercent} onChange={(e) => setEditingAsset({ ...editingAsset, targetAllocationPercent: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 dark:border-neutral-700 dark:bg-neutral-800"/></label></div><div className="flex justify-end gap-2"><button type="button" onClick={() => setEditingAsset(null)} className="rounded-xl border border-neutral-200 px-4 py-2 text-xs font-bold dark:border-neutral-700">Cancelar</button><button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white">Salvar alterações</button></div></form></div>}

      {/* Aporte Modal */}
      {isAporteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleConfirmAporte}
            className="w-full max-w-sm rounded-3xl border border-neutral-200 bg-white p-5 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 space-y-4 animate-in fade-in"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                Registrar Aporte em Ativo
              </span>
              <button
                type="button"
                onClick={() => setIsAporteOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
                aria-label="Fechar registro de aporte"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!investments.length ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                <b className="block">Cadastre um investimento primeiro</b>
                <span className="mt-1 block text-xs">O aporte precisa ser vinculado a um ativo da carteira.</span>
                <button type="button" onClick={() => { setIsAporteOpen(false); openAssetForm('investment'); }} className="mt-3 rounded-xl bg-amber-900 px-3 py-2 text-xs font-bold text-white dark:bg-amber-200 dark:text-amber-950">Criar investimento</button>
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                  Investimento
                </label>
                <select
                  required
                  value={aporteAssetId}
                  onChange={(e) => setAporteAssetId(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                >
                  <option value="">Selecione um investimento</option>
                  {investments.map((asset) => <option key={asset.id} value={asset.id}>{asset.tickerOrName} · {asset.institution}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                Valor do Aporte (R$)
              </label>
              <input
                type="text"
                required
                value={aporteAmount}
                onChange={(e) => setAporteAmount(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-base font-bold text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                Quantidade adquirida <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input
                type="text"
                value={aporteQuantity}
                onChange={(e) => setAporteQuantity(e.target.value)}
                placeholder="Ex: 2 ou 0,015"
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                Conta de Origem
              </label>
              <select
                required
                value={selectedAccId}
                onChange={(e) => setSelectedAccId(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              >
                <option value="">Selecione uma conta</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} (R$ {a.balance.toFixed(2)})
                  </option>
                ))}
              </select>
              {!accounts.length && <div className="mt-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">Você ainda não tem uma conta de origem. <button type="button" onClick={() => { setIsAporteOpen(false); setSubTab('accounts'); }} className="font-bold underline">Cadastrar conta</button></div>}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAporteOpen(false)}
                className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!investments.length || !accounts.length || !aporteAssetId || !selectedAccId}
                className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Confirmar Aporte
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Asset Modal */}
      {assetFormMode && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleAddAsset}
            className="w-full max-w-2xl space-y-5 rounded-3xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex items-start justify-between border-b border-neutral-100 pb-4 dark:border-neutral-800">
              <div>
                <h3 className="text-base font-black text-neutral-900 dark:text-neutral-100">{assetFormMode === 'patrimony' ? 'Adicionar patrimônio' : 'Novo investimento'}</h3>
                <p className="mt-1 text-xs text-neutral-500">{assetFormMode === 'patrimony' ? 'Registre uma posição ou um bem que você já possui, sem criar uma despesa.' : 'Crie o investimento agora e registre os aportes separadamente.'}</p>
              </div>
              <button type="button" onClick={() => setAssetFormMode(null)} aria-label="Fechar cadastro" className="text-neutral-400 hover:text-neutral-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Nome ou ticker
                <input autoFocus type="text" required value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder={assetFormMode === 'patrimony' ? 'Ex: Imóvel, veículo, CDB...' : 'Ex: HGLG11, IVVB11...'} className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-sm font-normal text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100" />
              </label>

              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Classe do ativo
                <select value={category} onChange={(e) => setCategory(e.target.value as InvestmentCategory)} className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-sm font-normal text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100">
                  <option value="renda_fixa">Renda Fixa / Tesouro</option>
                  <option value="fiis">Fundos Imobiliários (FIIs)</option>
                  <option value="acoes_br">Ações Brasil</option>
                  <option value="acoes_int">Ações Internacionais</option>
                  <option value="etfs">ETFs</option>
                  <option value="fundos">Fundos</option>
                  <option value="crypto">Criptomoedas</option>
                  <option value="outros">Outros patrimônios</option>
                </select>
              </label>

              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Instituição ou localização
                <input type="text" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder={assetFormMode === 'patrimony' ? 'Ex: Patrimônio pessoal' : 'Ex: XP, BTG, NuInvest'} className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-sm font-normal text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100" />
              </label>

              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Meta de alocação (%)
                <input type="number" min="0" max="100" step="0.1" value={targetAlloc} onChange={(e) => setTargetAlloc(e.target.value)} className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-sm font-normal text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100" />
              </label>

              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Quantidade {assetFormMode === 'investment' && <span className="font-normal text-neutral-400">(opcional)</span>}
                <input type="number" min="0" step="0.000001" required={assetFormMode === 'patrimony'} value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-sm font-normal text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100" />
              </label>

              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Preço médio unitário (R$) {assetFormMode === 'investment' && <span className="font-normal text-neutral-400">(opcional)</span>}
                <input type="number" min="0" step="0.01" required={assetFormMode === 'patrimony'} value={avgPrice} onChange={(e) => setAvgPrice(e.target.value)} placeholder="0,00" className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-sm font-normal text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100" />
              </label>
            </div>

            {assetFormMode === 'investment' && <p className="rounded-xl bg-blue-50 p-3 text-xs text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">Se este investimento ainda não tem saldo, deixe quantidade e preço zerados. Depois use “Registrar aporte” para movimentar o dinheiro da conta de origem.</p>}

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAssetFormMode(null)} className="rounded-xl border border-neutral-200 px-4 py-2.5 text-xs font-bold text-neutral-600 dark:border-neutral-700 dark:text-neutral-300">Cancelar</button>
              <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700">{assetFormMode === 'patrimony' ? 'Adicionar patrimônio' : 'Criar investimento'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
