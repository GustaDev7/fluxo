import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ActiveNavTab } from '../types';
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  DollarSign,
  Plus,
  MoreHorizontal,
  FolderKanban,
  Target,
  FileText,
  Timer,
  BarChart3,
  Sparkles,
  Settings,
  BookOpen,
  X,
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab, setIsQuickCaptureOpen, tasks } = useApp();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const pendingTasksCount = tasks.filter((t) => !t.isInbox && t.status !== 'done').length;

  const moreItems: { id: ActiveNavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'projects', label: 'Projetos', icon: FolderKanban },
    { id: 'goals', label: 'Metas', icon: Target },
    { id: 'notes', label: 'Notas', icon: FileText },
    { id: 'focus', label: 'Modo Foco', icon: Timer },
    { id: 'analytics', label: 'Análises', icon: BarChart3 },
    { id: 'assistant', label: 'Assistente IA', icon: Sparkles },
    { id: 'guide', label: 'Como Usar', icon: BookOpen },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <>
      {/* "Mais" Bottom Sheet for secondary items */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMoreOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-16 z-50 rounded-t-3xl border-t border-neutral-200 bg-white p-5 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Mais Módulos & Ferramentas
              </span>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-4">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMoreOpen(false);
                    }}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl p-2.5 text-center transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 font-semibold'
                        : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] truncate w-full">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-30 flex h-16 items-center justify-around border-t border-neutral-200/90 bg-white/95 px-2 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/95 lg:hidden shadow-lg">
        {/* Home */}
        <button
          onClick={() => {
            setActiveTab('dashboard');
            setIsMoreOpen(false);
          }}
          className={`flex flex-col items-center justify-center gap-1 px-3 py-1 text-xs transition-colors ${
            activeTab === 'dashboard'
              ? 'font-bold text-indigo-600 dark:text-indigo-400'
              : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
          }`}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[10px]">Início</span>
        </button>

        {/* Tarefas */}
        <button
          onClick={() => {
            setActiveTab('tasks');
            setIsMoreOpen(false);
          }}
          className={`relative flex flex-col items-center justify-center gap-1 px-3 py-1 text-xs transition-colors ${
            activeTab === 'tasks'
              ? 'font-bold text-indigo-600 dark:text-indigo-400'
              : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
          }`}
        >
          <div className="relative">
            <CheckSquare className="h-5 w-5" />
            {pendingTasksCount > 0 && (
              <span className="absolute -top-1 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white">
                {pendingTasksCount > 9 ? '9+' : pendingTasksCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Tarefas</span>
        </button>

        {/* Floating Center '+' Button */}
        <button
          id="mobile-universal-create-btn"
          onClick={() => {
            setIsMoreOpen(false);
            setIsQuickCaptureOpen(true);
          }}
          className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 ring-4 ring-white transition-transform active:scale-95 dark:ring-neutral-900"
          title="Captura Rápida Universal (+)"
        >
          <Plus className="h-6 w-6" />
        </button>

        {/* Agenda */}
        <button
          onClick={() => {
            setActiveTab('agenda');
            setIsMoreOpen(false);
          }}
          className={`flex flex-col items-center justify-center gap-1 px-3 py-1 text-xs transition-colors ${
            activeTab === 'agenda'
              ? 'font-bold text-indigo-600 dark:text-indigo-400'
              : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
          }`}
        >
          <Clock className="h-5 w-5" />
          <span className="text-[10px]">Agenda</span>
        </button>

        {/* Finanças */}
        <button
          onClick={() => {
            setActiveTab('finance');
            setIsMoreOpen(false);
          }}
          className={`flex flex-col items-center justify-center gap-1 px-3 py-1 text-xs transition-colors ${
            activeTab === 'finance'
              ? 'font-bold text-indigo-600 dark:text-indigo-400'
              : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
          }`}
        >
          <DollarSign className="h-5 w-5" />
          <span className="text-[10px]">Finanças</span>
        </button>

        {/* Mais */}
        <button
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className={`flex flex-col items-center justify-center gap-1 px-3 py-1 text-xs transition-colors ${
            isMoreOpen || !['dashboard', 'tasks', 'agenda', 'finance'].includes(activeTab)
              ? 'font-bold text-indigo-600 dark:text-indigo-400'
              : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
          }`}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[10px]">Mais</span>
        </button>
      </nav>
    </>
  );
};
