import { useEffect, useState } from 'react';
import { bankAction } from '../../../lib/bankStore';
import { errorMessage } from '../../../lib/workspaces';

const previewOrigin = 'https://fluxo-git-feat-fluxo-casal-open-finance-gustadev7s-projects.vercel.app';
const metadataUrl = 'https://kwhbkkvoahxztzzscdnm.supabase.co/functions/v1/open-finance/belvo-client.json';
const redirectUri = previewOrigin + '/?belvo=1';
const requestKey = 'fluxo-belvo-oauth';
type Pending = { userId: string; state: string; verifier: string; expires: number; month: string };
type BelvoData = {
  month: string;
  accounts: { name: string; currency: string; balance: number | null }[];
  transactions: { description: string; date: string; amount: number; currency: string; direction: string }[];
  partial: boolean;
  skipped: number;
};

function money(amount: number, currency: string) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(amount);
}

function base64Url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

export function BelvoPilot({ userId, month, onMonth }: { userId: string; month: string; onMonth: (month: string) => void }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<BelvoData>();

  useEffect(() => { setData(undefined); setMessage(''); }, [userId]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('belvo') !== '1') return;
    const state = url.searchParams.get('state');
    const code = url.searchParams.get('code');
    const raw = sessionStorage.getItem(requestKey);
    sessionStorage.removeItem(requestKey);
    for (const name of ['belvo', 'state', 'code', 'error', 'error_description', 'iss']) url.searchParams.delete(name);
    window.history.replaceState(null, '', url);
    let pending: Pending | null = null;
    try { if (raw) pending = JSON.parse(raw); } catch { /* A stale request must be restarted. */ }
    if (!pending || !code || pending.state !== state || pending.userId !== userId || pending.expires < Date.now()) {
      setMessage('A autorização foi interrompida ou expirou. Inicie outra conexão com o mesmo login.');
      return;
    }
    onMonth(pending.month);
    setBusy(true);
    bankAction<{ bankData: BelvoData }>('belvo-read', { code, verifier: pending.verifier, month: pending.month })
      .then(({ bankData }) => {
        if (!bankData) throw new Error('O Belvo não retornou os dados bancários.');
        setData(bankData);
      })
      .catch(error => setMessage(errorMessage(error, 'Não foi possível validar a conexão.')))
      .finally(() => setBusy(false));
  }, [userId, onMonth]);

  async function connect() {
    setBusy(true);
    setMessage('');
    try {
      const verifier = base64Url(crypto.getRandomValues(new Uint8Array(32)));
      const state = crypto.randomUUID();
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
      sessionStorage.setItem(requestKey, JSON.stringify({ userId, state, verifier, month, expires: Date.now() + 600000 }));
      const params = new URLSearchParams({
        client_id: metadataUrl, redirect_uri: redirectUri, response_type: 'code',
        code_challenge_method: 'S256', code_challenge: base64Url(new Uint8Array(digest)), state,
        resource: 'https://panorama-mcp.belvo.com/mcp', scope: 'openid profile email',
      });
      window.location.assign('https://auth.panorama.belvo.com/oauth2/authorize?' + params);
    } catch {
      setMessage('Não foi possível abrir a autorização do Belvo.');
      setBusy(false);
    }
  }

  if (window.location.origin !== previewOrigin) return null;
  return (
    <div className="rounded-3xl border border-violet-950 bg-[#151021] p-5">
      <h2 className="font-black">Belvo · Open Finance</h2>
      <p className="mt-1 text-sm text-neutral-400">Consulte suas contas e os lançamentos do mês selecionado.</p>
      <button className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50" disabled={busy} onClick={() => void connect()}>
        {busy ? 'Consultando Belvo…' : 'Consultar dados no Belvo'}
      </button>
      {message && <p role="alert" className="mt-3 text-sm text-neutral-300">{message}</p>}
      {data && month !== data.month && <p className="mt-3 text-sm text-neutral-400">Consulte novamente para carregar o mês selecionado.</p>}
      {data && month === data.month && <div className="mt-5 space-y-5">
        {data.partial && <p role="status" className="text-sm text-amber-300">{data.skipped
          ? 'Algumas consultas do Belvo não foram concluídas. Os resultados abaixo são parciais.'
          : 'Mostrando uma parte dos resultados disponibilizados pelo Belvo.'}</p>}
        <section>
          <h3 className="text-sm font-bold">Contas e saldos</h3>
          {data.accounts.length ? <ul className="mt-2 divide-y divide-violet-900/40">{data.accounts.map((account, index) => (
            <li key={index} className="flex justify-between gap-4 py-2 text-sm">
              <span>{account.name}</span>
              <strong>{account.balance === null ? 'Saldo indisponível' : money(account.balance, account.currency)}</strong>
            </li>
          ))}</ul> : <p className="mt-1 text-sm text-neutral-400">{data.skipped ? 'Nenhuma conta pôde ser carregada.' : 'Nenhuma conta foi retornada pelo Belvo.'}</p>}
        </section>
        <section>
          <h3 className="text-sm font-bold">Lançamentos do mês</h3>
          {data.transactions.length ? <ul className="mt-2 divide-y divide-violet-900/40">{data.transactions.map((transaction, index) => (
            <li key={index} className="grid grid-cols-[1fr_auto] gap-4 py-2 text-sm">
              <div><p>{transaction.description}</p><time dateTime={transaction.date} className="text-xs text-neutral-400">{transaction.date.split('-').reverse().join('/')}</time></div>
              <strong className={transaction.direction === 'out' ? 'text-rose-300' : transaction.direction === 'in' ? 'text-emerald-300' : ''}>
                {money(transaction.direction === 'out' ? -transaction.amount : transaction.amount, transaction.currency)}
              </strong>
            </li>
          ))}</ul> : <p className="mt-1 text-sm text-neutral-400">{data.partial ? 'Nenhum lançamento foi carregado nesta consulta.' : 'Nenhum lançamento retornado para o mês.'}</p>}
        </section>
      </div>}
    </div>
  );
}
