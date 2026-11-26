import { useEffect, useState } from 'react';
import { bankAction } from '../../../lib/bankStore';
import { errorMessage } from '../../../lib/workspaces';

const previewOrigin = 'https://fluxo-git-feat-fluxo-casal-open-finance-gustadev7s-projects.vercel.app';
const metadataUrl = 'https://kwhbkkvoahxztzzscdnm.supabase.co/functions/v1/open-finance/belvo-client.json';
const redirectUri = previewOrigin + '/?belvo=1';
const requestKey = 'fluxo-belvo-oauth';
type Pending = { userId: string; state: string; verifier: string; expires: number };

function base64Url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

export function BelvoPilot({ userId }: { userId: string }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

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
    setBusy(true);
    bankAction<{ verified: boolean }>('belvo-check', { code, verifier: pending.verifier })
      .then(result => setMessage(result.verified ? 'Conexão com o Belvo validada para este titular.' : 'Não foi possível validar a conexão.'))
      .catch(error => setMessage(errorMessage(error, 'Não foi possível validar a conexão.')))
      .finally(() => setBusy(false));
  }, [userId]);

  async function connect() {
    setBusy(true);
    setMessage('');
    try {
      const verifier = base64Url(crypto.getRandomValues(new Uint8Array(32)));
      const state = crypto.randomUUID();
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
      sessionStorage.setItem(requestKey, JSON.stringify({ userId, state, verifier, expires: Date.now() + 600000 }));
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
      <h2 className="font-black">Belvo MCP</h2>
      <p className="mt-1 text-sm text-neutral-400">Valide a autorização do seu Belvo no Fluxo. Nesta prévia, o teste verifica a conexão sem consultar saldos ou transações.</p>
      <button className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50" disabled={busy} onClick={() => void connect()}>
        {busy ? 'Verificando…' : 'Testar conexão com Belvo'}
      </button>
      {message && <p role="status" className="mt-3 text-sm text-neutral-300">{message}</p>}
    </div>
  );
}
