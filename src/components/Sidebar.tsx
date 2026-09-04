import React from 'react';
import { useApp } from '../context/AppContext';
import { ActiveNavTab } from '../types';
import { FluxoLogo, FluxoIcon } from './FluxoLogo';
import {
  LayoutDashboard,
  Inbox,
  CheckSquare,
  Clock,
  Calendar,
  FolderKanban,
  CalendarRange,
  Target,
  Flame,
  FileText,
  BarChart3,
  Timer,
  Settings,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Plus,
  Zap,
  Sparkles,
  DollarSign,
} from 'lucide-react';

interface NavItem {
  id: ActiveNavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    tasks,
    projects,
    setSelectedProjectId,
    setIsQuickCaptureOpen,
    user,
  } = useApp();

  const inboxCount = tasks.filter((t) => t.isInbox && t.status !== 'done').length;
  const pendingTasksCount = tasks.filter((t) => !t.isInbox && t.status !== 'done').length;

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assistant', label: 'Assistente IA', icon: Sparkles },
    { id: 'inbox', label: 'Inbox', icon: Inbox, badge: inboxCount > 0 ? inboxCount : undefined },
    { id: 'tasks', label: 'Tarefas', icon: CheckSquare, badge: pendingTasksCount > 0 ? pendingTasksCount : undefined },
    { id: 'agenda', label: 'Agenda', icon: Clock },
    { id: 'calendar', label: 'Calendário', icon: Calendar },
    { id: 'projects', label: 'Projetos', icon: FolderKanban },
    { id: 'monthly', label: 'Plano Mensal', icon: CalendarRange },
    { id: 'goals', label: 'Metas', icon: Target },
    { id: 'finance', label: 'Finanças AUVP', icon: DollarSign },
    { id: 'habits', label: 'Hábitos', icon: Flame },
    { id: 'notes', label: 'Notas & Docs', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'focus', label: 'Modo Foco', icon: Timer },
    { id: 'guide', label: 'Como Usar', icon: BookOpen },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-neutral-200 bg-white transition-all duration-300 dark:border-neutral-800 dark:bg-neutral-900 ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-3.5 dark:border-neutral-800">
        {!isSidebarCollapsed && (
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center text-left transition-opacity hover:opacity-90"
            title="Fluxo - Página Inicial"
          >
            <FluxoLogo size="md" showSubtitle={true} />
          </button>
        )}
        {isSidebarCollapsed && (
          <button
            onClick={() => setActiveTab('dashboard')}
            className="mx-auto flex items-center justify-center transition-transform hover:scale-105"
            title="Fluxo - Página Inicial"
          >
            <FluxoIcon size={34} />
          </button>
        )}

        <button
          id="toggle-sidebar-btn"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={`hidden items-center justify-center rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 lg:flex dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 ${
            isSidebarCollapsed ? 'mx-auto' : ''
          }`}
          title={isSidebarCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
        >
          {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Quick Action Button */}
      <div className="p-3">
        <button
          id="sidebar-quick-task-btn"
          onClick={() => setIsQuickCaptureOpen(true)}
          className={`group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/25 transition-all hover:bg-indigo-700 active:scale-[0.98] ${
            isSidebarCollapsed ? 'px-0' : ''
          }`}
          title="Nova Tarefa Rápida"
        >
          <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
          {!isSidebarCollapsed && <span>Nova Tarefa</span>}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => {
                setActiveTab(item.id);
                if (item.id === 'projects') setSelectedProjectId(null);
              }}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-200'
              } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300'
                }`}
              />
              {!isSidebarCollapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
              {!isSidebarCollapsed && item.badge !== undefined && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    isActive
                      ? 'bg-indigo-200 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                      : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Project Shortcuts section */}
        {!isSidebarCollapsed && (
          <div className="pt-4">
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Projetos Ativos
              </span>
              <button
                id="sidebar-add-project-btn"
                onClick={() => {
                  setActiveTab('projects');
                  setSelectedProjectId(null);
                }}
                className="text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                title="Ver todos os projetos"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-1 space-y-0.5">
              {projects.slice(0, 5).map((project) => (
                <button
                  key={project.id}
                  id={`sidebar-project-${project.id}`}
                  onClick={() => {
                    setSelectedProjectId(project.id);
                    setActiveTab('projects');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-200"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="truncate text-left flex-1">{project.name}</span>
                  <span className="text-[10px] text-neutral-400">{project.progress}%</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* User profile footer */}
      <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">
        <button
          id="sidebar-user-profile-btn"
          onClick={() => setActiveTab('settings')}
          className={`flex w-full items-center gap-3 rounded-xl p-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
            isSidebarCollapsed ? 'justify-center p-1' : ''
          }`}
        >
          <img
            src={user.avatar}
            alt={user.name}
            className="h-8 w-8 rounded-full object-cover ring-2 ring-indigo-500/20"
          />
          {!isSidebarCollapsed && (
            <div className="flex-1 text-left truncate">
              <p className="truncate text-xs font-semibold text-neutral-900 dark:text-neutral-100">{user.name}</p>
              <p className="truncate text-[11px] text-neutral-500 dark:text-neutral-400">{user.role}</p>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
