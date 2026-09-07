import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { FluxoIcon } from './FluxoLogo';
import {
  Search,
  Plus,
  Bell,
  Sun,
  Moon,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Check,
  X,
  ExternalLink,
  BookOpen,
  Database,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    setIsCommandPaletteOpen,
    setIsQuickCaptureOpen,
    user,
    updateUserProfile,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    activeTab,
    setActiveTab,
    selectedTagFilter,
    setSelectedTagFilter,
    activeTimer,
    pauseFocusTimer,
    resumeFocusTimer,
    stopFocusTimer,
    isDbConnected,
    isDbSaving,
    lastDbSyncedAt,
    forceDbSync,
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const nextTheme = user.theme === 'dark' ? 'light' : 'dark';
    updateUserProfile({ theme: nextTheme });
  };

  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-neutral-200 bg-white/95 px-3 sm:px-6 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/95">
      {/* Search / Command trigger & Mobile Logo */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3 flex-1 sm:flex-initial">
        {/* Mobile Logo Button */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className="flex lg:hidden items-center justify-center p-1 rounded-xl shrink-0 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          title="Fluxo - Página Inicial"
        >
          <FluxoIcon size={26} />
        </button>

        <button
          id="header-search-btn"
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex h-9 sm:h-10 flex-1 sm:flex-initial items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-2.5 sm:px-3.5 text-xs text-neutral-500 transition-all hover:border-neutral-300 hover:bg-neutral-100 hover:text-neutral-800 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 sm:w-64 min-w-0"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate text-left">
            <span className="inline sm:hidden">Buscar...</span>
            <span className="hidden sm:inline">Buscar tarefas, projetos...</span>
          </span>
          <kbd className="hidden rounded bg-neutral-200/70 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 sm:inline-block shrink-0">
            ⌘K
          </kbd>
        </button>

        {/* Active Tag filter indicator */}
        {selectedTagFilter && (
          <div className="hidden items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 md:flex">
            <span>#{selectedTagFilter}</span>
            <button
              onClick={() => setSelectedTagFilter(null)}
              className="hover:text-indigo-950 dark:hover:text-indigo-100"
              title="Remover filtro"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Right Action Icons & Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 ml-2">
        {/* Active Pomodoro Widget Pill */}
        {activeTimer && (
          <div className="hidden sm:flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/80 px-2.5 py-1 text-xs text-indigo-900 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200">
            <Timer className="h-3.5 w-3.5 text-indigo-600 animate-pulse dark:text-indigo-400" />
            <span className="font-mono font-bold">{formatTimeRemaining(activeTimer.secondsRemaining)}</span>
            <div className="flex items-center gap-1">
              {activeTimer.isRunning ? (
                <button
                  onClick={pauseFocusTimer}
                  className="rounded p-0.5 hover:bg-indigo-200/60 dark:hover:bg-indigo-900/60"
                  title="Pausar"
                >
                  <Pause className="h-3 w-3" />
                </button>
              ) : (
                <button
                  onClick={resumeFocusTimer}
                  className="rounded p-0.5 hover:bg-indigo-200/60 dark:hover:bg-indigo-900/60"
                  title="Continuar"
                >
                  <Play className="h-3 w-3" />
                </button>
              )}
              <button
                onClick={stopFocusTimer}
                className="rounded p-0.5 hover:bg-indigo-200/60 dark:hover:bg-indigo-900/60"
                title="Parar timer"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Database Connection Status Indicator */}
        <button
          id="header-db-sync-btn"
          onClick={() => forceDbSync()}
          disabled={isDbSaving}
          title={`Banco de Dados: ${isDbConnected ? 'Conectado e sincronizado' : 'Offline'}. Último sync: ${lastDbSyncedAt || 'agora'}. Clique para forçar gravação.`}
          className="hidden md:flex items-center gap-1.5 rounded-xl border border-neutral-200/80 bg-neutral-50/80 px-2.5 py-1.5 text-xs text-neutral-600 transition-all hover:border-neutral-300 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-300 dark:hover:border-neutral-700"
        >
          <span className="relative flex h-2 w-2">
            {isDbConnected && !isDbSaving && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            )}
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                isDbSaving
                  ? 'bg-amber-400 animate-pulse'
                  : isDbConnected
                  ? 'bg-emerald-500'
                  : 'bg-rose-500'
              }`}
            />
          </span>
          <span className="text-[11px] font-medium tracking-tight">
            {isDbSaving
              ? 'Salvando...'
              : isDbConnected
              ? 'Conectado'
              : 'Offline'}
          </span>
        </button>

        {/* Global Quick Capture Button (Princípio #8 e #9: Ação Principal Contextual e Consistente) */}
        <button
          id="header-quick-capture-btn"
          onClick={() => setIsQuickCaptureOpen(true)}
          className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-2.5 sm:px-3 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-95 shrink-0"
          title="Captura Rápida Universal (+)"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">
            {activeTab === 'tasks'
              ? 'Nova Tarefa'
              : activeTab === 'finance'
              ? 'Adicionar'
              : activeTab === 'projects'
              ? 'Novo Projeto'
              : activeTab === 'notes'
              ? 'Nova Nota'
              : activeTab === 'agenda' || activeTab === 'calendar'
              ? 'Novo Evento'
              : activeTab === 'goals'
              ? 'Nova Meta'
              : activeTab === 'habits'
              ? 'Novo Hábito'
              : 'Novo'}
          </span>
        </button>

        {/* Guide / How to use */}
        <button
          id="header-guide-btn"
          onClick={() => setActiveTab('guide')}
          className="hidden md:flex h-9 items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 px-2.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
          title="Como Usar o Sistema (Guia & Dicas)"
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Como Usar</span>
        </button>

        {/* Theme Toggle */}
        <button
          id="header-theme-toggle-btn"
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 shrink-0"
          title={user.theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        >
          {user.theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative shrink-0" ref={notifRef}>
          <button
            id="header-notifications-btn"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
            title="Notificações"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl shadow-neutral-900/10 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-black/40 z-30">
              <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Notificações</h3>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                      {unreadCount} novas
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                  >
                    Marcar todas lidas
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-neutral-400">
                    Nenhuma notificação no momento.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`group flex items-start gap-3 p-3 transition-colors ${
                        n.read ? 'opacity-70 hover:opacity-100' : 'bg-indigo-50/40 dark:bg-indigo-950/20'
                      }`}
                    >
                      <div className="mt-0.5 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">{n.title}</p>
                          <span className="text-[10px] text-neutral-400">{n.timestamp}</span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-neutral-600 dark:text-neutral-300">{n.message}</p>
                        {n.linkView && (
                          <button
                            onClick={() => {
                              setActiveTab(n.linkView as any);
                              markNotificationAsRead(n.id);
                              setIsNotifOpen(false);
                            }}
                            className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                          >
                            <span>Visualizar detalhes</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.read && (
                          <button
                            onClick={() => markNotificationAsRead(n.id)}
                            className="rounded p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                            title="Marcar como lida"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(n.id)}
                          className="rounded p-1 text-neutral-400 hover:text-rose-600"
                          title="Excluir notificação"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
