import { useEffect, useState } from 'react';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { AuthScreen } from './components/AuthScreen';
import { OpenFinanceDashboard } from './components/OpenFinanceDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { listWorkspaces } from './lib/workspaces';

function PersonalWorkspace() {
  const [workspaceId, setWorkspaceId] = useState<string>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    listWorkspaces().then(rows => {
      if (!active) return;
      const personal = rows.find(row => row.kind === 'personal');
      if (personal) setWorkspaceId(personal.id);
      else setFailed(true);
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);

  if (failed) return <main className="grid min-h-[100dvh] place-items-center bg-neutral-950 p-6 text-neutral-200"><div className="text-center"><p role="alert">Não foi possível abrir seu espaço pessoal.</p><button className="mt-3 rounded-lg bg-emerald-300 px-3 py-2 font-bold text-neutral-950" onClick={() => location.reload()}>Tentar novamente</button></div></main>;
  if (!workspaceId) return <main className="grid min-h-[100dvh] place-items-center bg-neutral-950 text-sm text-neutral-400" role="status">Abrindo seu Open Finance…</main>;
  return <FinanceProvider workspaceId={workspaceId}><OpenFinanceDashboard /></FinanceProvider>;
}

function AuthenticatedApp() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <main className="grid min-h-[100dvh] place-items-center bg-neutral-950 text-sm text-neutral-400" role="status">Abrindo o Fluxo…</main>;
  if (!user) return <AuthScreen />;
  return <PersonalWorkspace key={user.id} />;
}

export default function App() {
  return <AppErrorBoundary><AuthProvider><AuthenticatedApp /></AuthProvider></AppErrorBoundary>;
}
