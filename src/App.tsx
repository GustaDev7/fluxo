import React, { useEffect, useState } from 'react';
import { Database, LogOut, Moon, RefreshCw, Sun, WalletCards } from 'lucide-react';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { AuthScreen } from './components/AuthScreen';
import { FluxoLogo } from './components/FluxoLogo';
import { FinanceView } from './components/views/FinanceView';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { safeStorage } from './lib/safeStorage';

const FinanceApp: React.FC = () => {
  const { user, signOut } = useAuth();
  const { isFinanceDbConnected, isFinanceDbSaving, isFinanceHydrated, lastFinanceDbSyncedAt, forceFinanceDbSync, openTransactionModal } = useFinance();
  const [dark, setDark] = useState(() => safeStorage.getItem('fluxo_theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    safeStorage.setItem('fluxo_theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div className="flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden bg-neutral-50 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-100">
      <header className="z-30 flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 bg-white/95 px-3 backdrop-blur sm:px-6 dark:border-neutral-800 dark:bg-neutral-900/95">
        <div className="flex min-w-0 items-center gap-3">
          <FluxoLogo />
          <span className="hidden h-6 w-px bg-neutral-200 sm:block dark:bg-neutral-700" />
          <span className="hidden text-sm font-bold text-neutral-500 sm:block">Finanças pessoais</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button onClick={() => openTransactionModal('expense')} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500 sm:px-4">
            <span className="sm:hidden">+ Lançar</span><span className="hidden sm:inline">+ Novo lançamento</span>
          </button>
          <button onClick={() => forceFinanceDbSync()} disabled={isFinanceDbSaving || !isFinanceHydrated} title={isFinanceDbConnected ? `Sincronizado${lastFinanceDbSyncedAt ? ` às ${lastFinanceDbSyncedAt}` : ''}` : 'Dados não sincronizados'} className={`rounded-xl p-2 disabled:opacity-50 ${isFinanceDbConnected ? 'text-emerald-600' : 'text-amber-600'}`} aria-label="Sincronizar dados financeiros">
            {isFinanceDbSaving ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Database className="h-5 w-5" />}
          </button>
          <button onClick={() => setDark((value) => !value)} className="rounded-xl p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800" aria-label="Alternar tema">
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
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
          {!isFinanceDbConnected && <div role="alert" className="bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">Alterações pendentes de sincronização. Seus dados permanecem nesta tela.</div>}
          <FinanceView />
        </main>
      )}
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
