import { lazy, Suspense, useEffect, useRef, useState, type FormEvent } from 'react';
import { Banknote, ChevronLeft, ChevronRight, Landmark, Link2, LockKeyhole, Upload } from 'lucide-react';
import { bankAction, importStatement, loadBankOverview, removeStatement, shareBank, type BankConnection, type BankOverview, type WidgetConfig } from '../../../lib/bankStore';
import { errorMessage, type Workspace } from '../../../lib/workspaces';
import { useFinance } from '../../../context/FinanceContext';
import { useAuth } from '../../../context/AuthContext';
import { BelvoPilot } from './BelvoPilot';

const PluggyConnect = lazy(() => import('react-pluggy-connect').then(module => ({ default: module.PluggyConnect })));
const control = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-violet-900 px-3 text-sm font-bold text-violet-200 hover:bg-violet-500/15 disabled:opacity-50';
const primary = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50';
const statusText: Record<BankConnection['status'], string> = {
  pending: 'Aguardando o banco', ready: 'Disponível', action_required: 'Ação no banco necessária',
  error: 'Falha na última atualização', disconnecting: 'Desconexão pendente',
};

function currencyValue(value: number, currency: string) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
}

export function BankTab({ workspace, couple }: { workspace: Workspace; couple?: Workspace }) {
  const { selectedMonth, setSelectedMonth } = useFinance();
  const { user } = useAuth();
  const [pagination, setPagination] = useState({ month: selectedMonth, page: 0 });
  const page = pagination.month === selectedMonth ? pagination.page : 0;
  const [data, setData] = useState<BankOverview>();
  const [loadKey, setLoadKey] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<{ configured: boolean; sandbox: boolean; personal?: boolean }>();
  const [providerError, setProviderError] = useState('');
  const [providerCheck, setProviderCheck] = useState(0);
  const [widget, setWidget] = useState<WidgetConfig & { connectionId?: string }>();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [problem, setProblem] = useState('');
  const refreshedConnections = useRef(new Set<string>());
  const personal = workspace.kind === 'personal';

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(false);
    void loadBankOverview(workspace.id, selectedMonth, page).then(next => {
      if (active) setData(next);
    }).catch(() => { if (active) setLoadError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [workspace.id, selectedMonth, page, loadKey]);

  useEffect(() => {
    if (!personal) return;
    let active = true;
    setProvider(undefined);
    setProviderError('');
    void bankAction<{ configured: boolean; sandbox: boolean; personal?: boolean }>('status').then(next => {
      if (active) setProvider(next);
    }).catch(error => {
      if (active) setProviderError(errorMessage(error, 'Não foi possível consultar o Open Finance.'));
    });
    return () => { active = false; };
  }, [personal, providerCheck, user?.id]);

  useEffect(() => {
    if (!personal || !provider?.configured || !provider.personal || loading || busy || loadError) return;
    const stale = data?.connections.filter(connection =>
      connection.owned && connection.source === 'pluggy' && connection.status === 'ready' &&
      connection.syncedAt && Date.now() - Date.parse(connection.syncedAt) >= 12 * 60 * 60 * 1000
      && !refreshedConnections.current.has(connection.id)
    );
    if (!stale?.length) return;
    let active = true;
    for (const connection of stale) refreshedConnections.current.add(connection.id);
    void (async () => {
      for (const connection of stale) {
        if (!active) break;
        await bankAction('sync', { connectionId: connection.id }).catch(() => undefined);
      }
      if (active) setLoadKey(key => key + 1);
    })();
    return () => { active = false; };
  }, [personal, provider, data, loading, busy, loadError]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setNotice('');
    setProblem('');
    try { await action(); }
    catch (error) { setProblem(errorMessage(error, 'Não foi possível concluir a operação.')); }
    finally { setBusy(false); setLoadKey(key => key + 1); }
  }

  function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const file = fields.get('ofx');
    if (!(file instanceof File) || !file.size) return;
    void run(async () => {
      const count = await importStatement(file, String(fields.get('institution')), String(fields.get('account')));
      setNotice(count ? `${count} lançamento(s) importado(s). Selecione o mês do extrato para conferir.` : 'Esses lançamentos já estão no Fluxo.');
      form.reset();
    });
  }

  function openWidget(connectionId?: string) {
    void run(async () => {
      const token = await bankAction<WidgetConfig>(connectionId ? 'reconnect' : 'connect', connectionId ? { connectionId } : {});
      setWidget({ ...token, connectionId });
    });
  }

  async function sync(connectionId: string) {
    const { outcome } = await bankAction<{ outcome: string }>('sync', { connectionId });
    setNotice(outcome === 'ready' ? 'Extrato atualizado.' : outcome === 'pending' ? 'O banco ainda está preparando o extrato.' : 'A conexão precisa de uma nova autorização.');
  }

  const connectLabel = provider?.sandbox ? 'Conectar banco de teste' :
    provider?.configured && !provider.personal ? 'Conectar meu banco' : 'Conectar Meu Pluggy';
  let providerMessage = 'Verificando a configuração da conexão bancária…';
  if (providerError) providerMessage = providerError;
  else if (provider?.configured) {
    providerMessage = provider.sandbox ? 'Use uma conta de demonstração do provedor.' :
      provider.personal ? 'Autorize os bancos já vinculados ao seu Meu Pluggy. As contas começam privadas.' :
        'Cada titular autoriza suas próprias conexões.';
  } else if (provider?.personal) {
    providerMessage = 'Este login ainda não está vinculado às chaves do Meu Pluggy. Use o login particular cujo UID está no secret do Supabase.';
  } else if (provider) providerMessage = 'A conexão bancária aguarda a configuração do provedor.';

  return <section className="space-y-5">
    {personal && user && <BelvoPilot userId={user.id} month={selectedMonth} onMonth={setSelectedMonth} />}
    {personal ? <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
      <form onSubmit={handleImport} className="rounded-3xl border border-violet-950 bg-[#151021] p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-violet-500/15 p-2.5 text-violet-300"><Upload className="size-5" /></div>
          <div><h2 className="font-black">Importar extrato OFX</h2><p className="mt-1 text-sm text-neutral-400">Baixe o OFX no seu banco. Os extratos começam privados e você escolhe quais compartilhar.</p></div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold text-neutral-300">Instituição<input className="field-input mt-1" name="institution" required maxLength={80} placeholder="Ex. Nubank" /></label>
          <label className="text-xs font-bold text-neutral-300">Nome da conta ou cartão<input className="field-input mt-1" name="account" required maxLength={80} placeholder="Ex. Conta corrente" /></label>
        </div>
        <label className="mt-3 block text-xs font-bold text-neutral-300">Arquivo OFX<input className="mt-1 block w-full rounded-xl border border-violet-900 p-2 text-sm" name="ofx" type="file" accept=".ofx" required /></label>
        <button className={primary + ' mt-4'} disabled={busy}>Importar extrato</button>
      </form>
      <div className="rounded-3xl border border-violet-950 bg-[#151021] p-5">
        <div className="flex items-start gap-3"><div className="rounded-xl bg-fuchsia-500/15 p-2.5 text-fuchsia-300"><Link2 className="size-5" /></div>
          <div><h2 className="font-black">Open Finance</h2><p role="status" className="mt-1 text-sm text-neutral-400">{providerMessage}</p></div></div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className={control} disabled={busy || !provider?.configured} onClick={() => openWidget()}>{connectLabel}</button>
          {(!provider?.configured && (provider || providerError)) && <button className={control} onClick={() => setProviderCheck(check => check + 1)}>Verificar novamente</button>}
        </div>
        {provider?.personal && !provider.configured && user && (
          <dl className="mt-4 space-y-1 text-xs text-neutral-400">
            <div className="flex flex-wrap gap-x-2"><dt>Login atual</dt><dd className="break-all text-neutral-200">{user.email}</dd></div>
            <div className="flex flex-wrap gap-x-2"><dt>UID para conferir no Supabase</dt><dd className="select-all break-all font-mono text-neutral-200">{user.id}</dd></div>
          </dl>
        )}
      </div>
    </div> : <div className="rounded-3xl border border-violet-950 bg-[#151021] p-5">
      <div className="flex items-center gap-2"><LockKeyhole className="size-5 text-violet-300" /><h2 className="font-black">Extratos compartilhados</h2></div>
      <p className="mt-2 text-sm text-neutral-400">Aqui aparecem as contas que cada pessoa compartilhou a partir do próprio espaço.</p>
    </div>}

    {notice && <p role="status" className="text-sm text-emerald-300">{notice}</p>}
    {problem && <p role="alert" className="text-sm text-rose-300">{problem}</p>}
    {loadError ? <p role="alert" className="text-sm text-rose-300">Não foi possível carregar os extratos. <button className="underline" onClick={() => setLoadKey(key => key + 1)}>Tentar novamente</button></p> : null}
    {loading && <p role="status" className="text-sm text-neutral-400">Carregando extratos…</p>}

    {data && !loadError && <>
      <div className="grid gap-3 lg:grid-cols-2">
        {data.connections.map(connection => <article key={connection.id} className="min-w-0 rounded-2xl border border-violet-950 bg-[#151021] p-4">
          <div className="flex items-start gap-3"><Landmark className="mt-0.5 size-5 shrink-0 text-violet-300" /><div><h3 className="font-bold">{connection.institution}</h3>
            <p className="text-xs text-neutral-400">{connection.source === 'ofx' ? 'Extrato OFX' : statusText[connection.status]} · {personal ? connection.shared ? 'Compartilhado' : 'Privado' : connection.owned ? 'Sua conta' : 'Conta da outra pessoa'}</p></div></div>
          {connection.accounts.map((account, index) => <div key={index} className="mt-3 flex items-center justify-between gap-3 border-t border-violet-950 pt-2 text-sm">
            <span>{account.name}</span><span className="text-right font-semibold">{account.balance !== null ? currencyValue(account.balance, account.currency) : 'Saldo indisponível'}</span></div>)}
          {personal && <div className="mt-4 flex flex-wrap gap-2">
            {connection.source === 'pluggy' && connection.status !== 'disconnecting' && <button className={control} disabled={busy} onClick={() => void run(() => sync(connection.id))}>Atualizar</button>}
            {connection.source === 'pluggy' && connection.status === 'action_required' && <button className={control} disabled={busy} onClick={() => openWidget(connection.id)}>Autorizar novamente</button>}
            {(connection.shared || (couple && !couple.archived)) && connection.status !== 'disconnecting' && <button className={control} disabled={busy} onClick={() => {
              if (!connection.shared && !window.confirm('Compartilhar saldos e lançamentos desta origem com a outra pessoa no espaço do casal?')) return;
              void run(() => shareBank(connection.id, connection.shared ? null : couple?.id ?? null));
            }}>{connection.shared ? 'Tornar privado' : 'Compartilhar com o casal'}</button>}
            <button className={control} disabled={busy} onClick={() => {
              if (!window.confirm('Remover esta origem e os lançamentos importados dela?')) return;
              void run(async () => {
                if (connection.source === 'ofx') await removeStatement(connection.id);
                else await bankAction('disconnect', { connectionId: connection.id });
                setNotice('Origem removida.');
              });
            }}>{connection.source === 'ofx' ? 'Remover extrato' : 'Desconectar'}</button>
          </div>}
        </article>)}
      </div>
      <div className="overflow-hidden rounded-3xl border border-violet-950 bg-[#151021]">
        <div className="flex items-center gap-3 px-4 py-4"><Banknote className="size-5 text-violet-300" /><h2 className="font-black">Lançamentos do extrato</h2></div>
        {!data.transactions.length ? <p className="border-t border-violet-950 px-4 py-5 text-sm text-neutral-400">Nenhum lançamento neste mês.</p> : <ul className="divide-y divide-violet-950 border-t border-violet-950">
          {data.transactions.map(transaction => <li key={transaction.connectionId + transaction.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 text-sm">
            <div className="min-w-0"><p className="truncate font-semibold">{transaction.description}</p><p className="truncate text-xs text-neutral-400">{transaction.date.split('-').reverse().join('/')} · {transaction.account}</p></div>
            <span className={transaction.direction === 'DEBIT' ? 'font-bold text-rose-300' : 'font-bold text-emerald-300'}>{currencyValue(transaction.direction === 'DEBIT' ? -transaction.amount : transaction.amount, transaction.currency)}</span>
          </li>)}
        </ul>}
        {(data.count > 50 || page > 0) && <div className="flex items-center justify-end gap-2 border-t border-violet-950 px-4 py-3">
          <button aria-label="Página anterior" className={control} disabled={loading || page === 0} onClick={() => setPagination({ month: selectedMonth, page: page - 1 })}><ChevronLeft className="size-4" /></button>
          <button aria-label="Próxima página" className={control} disabled={loading || (page + 1) * 50 >= data.count} onClick={() => setPagination({ month: selectedMonth, page: page + 1 })}><ChevronRight className="size-4" /></button>
        </div>}
      </div>
    </>}

    {widget && <Suspense fallback={<p role="status" className="text-sm text-neutral-400">Abrindo a conexão bancária…</p>}>
      <PluggyConnect connectToken={widget.connectToken} connectorIds={widget.connectorIds} includeSandbox={widget.sandbox}
        products={widget.personal ? undefined : ['ACCOUNTS', 'CREDIT_CARDS', 'TRANSACTIONS']} updateItem={widget.updateItem} theme="dark"
        onClose={() => setWidget(undefined)} onError={() => { setWidget(undefined); setProblem('A janela do provedor encontrou um erro.'); }}
        onSuccess={({ item }) => {
          setWidget(undefined);
          void run(async () => {
            const connectionId = widget.connectionId ?? (await bankAction<{ connectionId: string }>('register', { itemId: item.id })).connectionId;
            await sync(connectionId);
          });
        }} />
    </Suspense>}
  </section>;
}
