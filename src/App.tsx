import React, { lazy, Suspense, useState } from 'react';
import { Database, LogOut, RefreshCw, Sparkles, WalletCards } from 'lucide-react';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { AuthScreen } from './components/AuthScreen';
import { FluxoLogo } from './components/FluxoLogo';
import { FinanceView } from './components/views/FinanceView';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';

const FinanceAssistant = lazy(() => import('./components/FinanceAssistant').then((module) => ({ default: module.FinanceAssistant })));

const FinanceApp: React.FC = () => {
  const { user, signOut } = useAuth();
  const { isFinanceDbConnected, isFinanceDbSaving, isFinanceHydrated, isFinanceOffline, lastFinanceDbError, lastFinanceDbSyncedAt, forceFinanceDbSync, openTransactionModal } = useFinance();
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden bg-[#080610] text-neutral-100">
      <header className="z-30 flex h-16 shrink-0 items-center justify-between border-b border-violet-950/80 bg-[#100b1a]/95 px-3 backdrop-blur sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <FluxoLogo />
          <span className="hidden h-6 w-px bg-violet-900/60 sm:block" />
          <span className="hidden text-sm font-bold text-neutral-500 sm:block">Finanças pessoais</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button onClick={() => setIsAssistantOpen(true)} className="group flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-2.5 text-xs font-black text-white shadow-sm hover:from-indigo-500 hover:to-violet-500 sm:px-4" aria-label="Abrir Fluxo IA">
            <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
            <span className="hidden sm:inline">Fluxo IA</span>
          </button>
          <button onClick={() => openTransactionModal('expense')} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500 sm:px-4">
            <span className="sm:hidden">+ Lançar</span><span className="hidden sm:inline">+ Novo lançamento</span>
          </button>
          <button onClick={() => forceFinanceDbSync()} disabled={isFinanceDbSaving || !isFinanceHydrated} title={isFinanceDbConnected ? `Sincronizado${lastFinanceDbSyncedAt ? ` às ${lastFinanceDbSyncedAt}` : ''}` : 'Dados não sincronizados'} className={`rounded-xl p-2 disabled:opacity-50 ${isFinanceDbConnected ? 'text-emerald-600' : 'text-amber-600'}`} aria-label="Sincronizar dados financeiros">
            {isFinanceDbSaving ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Database className="h-5 w-5" />}
          </button>
          <button onClick={() => signOut()} className="rounded-xl p-2 text-neutral-500 hover:bg-neutral-100 hover:text-rose-600 dark:hover:bg-neutral-800" aria-label={`Sair da conta ${user?.email || ''}`}>
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

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
        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
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
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="grid min-h-[100dvh] place-items-center bg-neutral-950 text-sm font-semibold text-neutral-400">Preparando seu Fluxo Financeiro...</div>;
  if (!user) return <AuthScreen />;
  return <FinanceProvider key={user.id}><FinanceApp /></FinanceProvider>;
};

export default function App() {
  return <AppErrorBoundary><AuthProvider><AuthenticatedApp /></AuthProvider></AppErrorBoundary>;
}
