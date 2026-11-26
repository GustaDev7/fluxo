import React, { lazy, Suspense, useState } from 'react';
import { Database, LogOut, Plus, RefreshCw, Sparkles, WalletCards } from 'lucide-react';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { AuthScreen } from './components/AuthScreen';
import { FluxoLogo } from './components/FluxoLogo';
import { FinanceView } from './components/views/FinanceView';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import './financeLayout.css';

const FinanceAssistant = lazy(() => import('./components/FinanceAssistant').then((module) => ({ default: module.FinanceAssistant })));

const FinanceApp: React.FC = () => {
  const { user, signOut } = useAuth();
  const { isFinanceDbConnected, isFinanceDbSaving, isFinanceHydrated, isFinanceOffline, lastFinanceDbError, lastFinanceDbSyncedAt, forceFinanceDbSync, openTransactionModal } = useFinance();
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');

  async function leave() {
    setIsSigningOut(true);
    setSignOutError('');
    try {
      if (isFinanceHydrated && !(await forceFinanceDbSync()) &&
        !window.confirm('Há alterações que ainda não foram salvas. Quer sair mesmo assim?')) return;
      await signOut();
    } catch {
      setSignOutError('Não foi possível sair da conta. Tente novamente.');
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="fx-shell">
      <header className="fx-topbar">
        <div className="fx-brand"><FluxoLogo showSubtitle={false} /><span>Finanças pessoais</span></div>
        <div className="fx-topbar-actions">
          <button onClick={() => void forceFinanceDbSync()} disabled={isFinanceDbSaving || !isFinanceHydrated} data-connected={isFinanceDbConnected && !isFinanceOffline}
            title={isFinanceDbConnected ? `Sincronizado${lastFinanceDbSyncedAt ? ` às ${lastFinanceDbSyncedAt}` : ''}` : 'Dados não sincronizados'}
            className="fx-top-button fx-sync" aria-label="Sincronizar dados financeiros">
            {isFinanceDbSaving ? <RefreshCw size={17} className="animate-spin" /> : <Database size={17} />}
          </button>
          <button onClick={() => setIsAssistantOpen(true)} disabled={!isFinanceHydrated || isSigningOut} className="fx-top-button fx-ai" aria-label="Abrir Fluxo IA">
            <Sparkles size={17} /><span>Fluxo IA</span>
          </button>
          <button onClick={() => openTransactionModal('expense')} disabled={!isFinanceHydrated || isSigningOut} className="fx-top-button fx-new" aria-label="Novo lançamento">
            <Plus size={19} /><span>Novo lançamento</span>
          </button>
          <button onClick={() => void leave()} disabled={isSigningOut} className="fx-top-button fx-signout" aria-label={`Sair da conta ${user?.email || ''}`}>
            <LogOut size={17} />
          </button>
        </div>
      </header>
      {signOutError && <p role="alert" className="shrink-0 bg-rose-950 px-4 py-2 text-center text-xs text-rose-200">{signOutError}</p>}

      {!isFinanceHydrated ? (
        <main className="grid min-h-0 flex-1 place-items-center p-6">
          <div className="max-w-sm text-center">
            <WalletCards className="mx-auto h-9 w-9 text-indigo-500" />
            <h1 className="mt-4 text-lg font-black">Carregando sua vida financeira</h1>
            <p className="mt-2 text-sm text-neutral-500">{isFinanceDbConnected ? 'Buscando suas contas, lançamentos e orçamento.' : 'Não foi possível acessar o banco. Seus dados não serão sobrescritos.'}</p>
            {!isFinanceDbConnected && <button onClick={() => window.location.reload()} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white">Tentar novamente</button>}
          </div>
        </main>
      ) : (
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden" inert={isSigningOut}>
          {(!isFinanceDbConnected || isFinanceOffline) && <div role="alert" className="flex flex-wrap items-center justify-center gap-2 bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-900 dark:bg-amber-950/50 dark:text-amber-200"><span>{isFinanceOffline ? 'Você está offline. As alterações ficam nesta tela até a conexão voltar.' : (lastFinanceDbError || 'Alterações pendentes de sincronização.')}</span>{!isFinanceOffline && <button onClick={() => lastFinanceDbError?.includes('outra sessão') ? window.location.reload() : forceFinanceDbSync()} disabled={isFinanceDbSaving} className="rounded-lg border border-amber-300 px-2 py-1 font-black disabled:opacity-50">{lastFinanceDbError?.includes('outra sessão') ? 'Recarregar dados' : 'Tentar novamente'}</button>}</div>}
          <FinanceView />
        </main>
      )}

      <Suspense fallback={null}>
        {isAssistantOpen ? <FinanceAssistant isOpen onClose={() => setIsAssistantOpen(false)} /> : null}
      </Suspense>
    </div>
  );
};

const AuthenticatedApp: React.FC = () => {
  const { user, isLoading, isRecoveringPassword } = useAuth();
  if (isLoading) return <div className="grid min-h-[100dvh] place-items-center bg-neutral-950 text-sm font-semibold text-neutral-400">Preparando seu Fluxo Financeiro...</div>;
  if (!user || isRecoveringPassword) return <AuthScreen key={isRecoveringPassword ? 'recovery' : 'signin'} />;
  return <FinanceProvider key={user.id}><FinanceApp /></FinanceProvider>;
};

export default function App() {
  return <AppErrorBoundary><AuthProvider><AuthenticatedApp /></AuthProvider></AppErrorBoundary>;
}
