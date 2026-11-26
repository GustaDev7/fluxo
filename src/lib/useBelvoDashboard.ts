import { useEffect, useState } from 'react';
import { bankAction } from './bankStore';
import type { BelvoData } from './belvoData';
import { errorMessage } from './workspaces';
import { supabase } from './supabase';
import { getTodayDateString } from '../utils/date';

const origin = 'https://fluxo-git-feat-fluxo-casal-open-finance-gustadev7s-projects.vercel.app';
const clientId = 'https://kwhbkkvoahxztzzscdnm.supabase.co/functions/v1/open-finance/belvo-client.json';
const callbackUrl = origin + '/?belvo=1';
const storageKey = 'fluxo-belvo-oauth';
const demoIds = new Set(['dbd41ec9-a27c-4f29-a0c9-87a5756d9323', '6270b4e0-99ec-457a-87ed-83d5cddd25c8']);
const currentMonth = () => getTodayDateString().slice(0, 7);

type Pending = { userId: string; state: string; verifier: string; expires: number; month: string };
type BelvoResult = { bankData?: BelvoData; updatedAt?: string; connected: boolean; pending?: boolean; manual?: boolean };
type Snapshot = { data: BelvoData; updatedAt?: string };

function encode(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function takeCallback(userId: string) {
  const url = new URL(window.location.href);
  if (url.searchParams.get('belvo') !== '1') return null;
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const raw = sessionStorage.getItem(storageKey);
  sessionStorage.removeItem(storageKey);
  for (const field of ['belvo', 'code', 'state', 'error', 'error_description', 'iss']) url.searchParams.delete(field);
  window.history.replaceState(null, '', url);
  let pending: Pending | undefined;
  try { if (raw) pending = JSON.parse(raw); } catch { /* An invalid or previous request must be restarted. */ }
  if (!code || !pending || pending.userId !== userId || pending.state !== state || pending.expires <= Date.now()) {
    return { error: 'A autorização foi interrompida ou expirou. Conecte a sua conta novamente.' } as const;
  }
  return { code, pending } as const;
}

export function useBelvoDashboard(userId: string) {
  const demo = demoIds.has(userId);
  const [callback, setCallback] = useState<ReturnType<typeof takeCallback>>(null);
  const [month, setMonth] = useState(currentMonth);
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [connected, setConnected] = useState<boolean>();
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [manual, setManual] = useState(false);
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const result = takeCallback(userId);
    if (!result) return;
    if ('pending' in result && result.pending) setMonth(result.pending.month);
    setCallback(result);
  }, [userId]);

  useEffect(() => {
    let active = true;
    let retry: number | undefined;
    async function refresh() {
      if (paused || window.location.origin !== origin) { setBusy(false); return; }
      if (new URLSearchParams(window.location.search).get('belvo') === '1') return;
      setBusy(true);
      setError('');
      try {
        if (callback) {
          if ('error' in callback && callback.error) throw new Error(callback.error);
          if (!callback.pending || !callback.code) return;
          const result = await bankAction<BelvoResult>(demo ? 'belvo-read' : 'belvo-connect', {
            code: callback.code, verifier: callback.pending.verifier, month: callback.pending.month,
          });
          if (!active) return;
          if (result.bankData) setSnapshot({ data: result.bankData, updatedAt: result.updatedAt });
          setConnected(result.connected);
          setManual(demo || !!result.manual);
          return;
        }
        if (demo) { setConnected(false); return; }
        const cached = await supabase.from('fluxo_belvo_snapshots').select('payload,updated_at')
          .eq('owner_id', userId).eq('month', month).maybeSingle();
        if (!active) return;
        if (cached.data) setSnapshot({ data: cached.data.payload, updatedAt: cached.data.updated_at });
        const result = await bankAction<BelvoResult>('belvo-sync', { month });
        if (!active) return;
        setConnected(result.connected);
        if (result.bankData) setSnapshot({ data: result.bankData, updatedAt: result.updatedAt });
        if (result.pending) retry = window.setTimeout(() => setTick(value => value + 1), 2500);
      } catch (problem) {
        if (active) setError(errorMessage(problem, 'Não foi possível atualizar o Open Finance.'));
      } finally {
        if (active) setBusy(false);
      }
    }
    // The authorization response is consumed only after effects settle, including development StrictMode.
    const start = window.setTimeout(() => void refresh(), 0);
    return () => { active = false; window.clearTimeout(start); window.clearTimeout(retry); };
  }, [callback, userId, month, tick, demo, paused]);

  useEffect(() => {
    if (!connected || paused) return;
    const sync = () => {
      if (document.visibilityState === 'visible') {
        setCallback(null);
        setTick(value => value + 1);
      }
    };
    document.addEventListener('visibilitychange', sync);
    const timer = window.setInterval(sync, 120000);
    return () => { document.removeEventListener('visibilitychange', sync); window.clearInterval(timer); };
  }, [connected, paused]);

  async function connect() {
    if (window.location.origin !== origin) { setError('Abra a prévia do Fluxo para conectar a Belvo.'); return; }
    setBusy(true);
    setError('');
    try {
      const verifier = encode(crypto.getRandomValues(new Uint8Array(32)));
      const state = crypto.randomUUID();
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
      sessionStorage.setItem(storageKey, JSON.stringify({ userId, state, verifier, month, expires: Date.now() + 600000 }));
      const authorization = new URL('https://auth.panorama.belvo.com/oauth2/authorize');
      authorization.search = new URLSearchParams({
        client_id: clientId, redirect_uri: callbackUrl, response_type: 'code', state,
        code_challenge_method: 'S256', code_challenge: encode(new Uint8Array(digest)),
        resource: 'https://panorama-mcp.belvo.com/mcp', scope: demo ? 'openid profile email' : 'openid profile email offline_access',
      }).toString();
      window.location.assign(authorization);
    } catch {
      setError('Não foi possível abrir a autorização da Belvo.');
      setBusy(false);
    }
  }

  async function disconnect() {
    setPaused(true);
    try {
      await bankAction('belvo-disconnect');
      setSnapshot(undefined);
      setCallback(null);
      setConnected(false);
      setManual(false);
      setError('');
    } catch (problem) {
      setError(errorMessage(problem, 'Não foi possível desconectar a Belvo.'));
    } finally {
      setPaused(false);
    }
  }

  function chooseMonth(value: string) {
    if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(value)) return;
    setCallback(null);
    setMonth(value);
  }

  return {
    demo, month, chooseMonth, connected, busy, error, manual, connect, disconnect,
    snapshot: snapshot?.data.month === month ? snapshot : undefined,
  };
}
