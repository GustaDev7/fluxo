import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { CommandPalette } from './components/CommandPalette';
import { TaskModal } from './components/TaskModal';
import { ShortcutsModal } from './components/ShortcutsModal';

// Views
import { DashboardView } from './components/views/DashboardView';
import { InboxView } from './components/views/InboxView';
import { TasksView } from './components/views/TasksView';
import { AgendaView } from './components/views/AgendaView';
import { CalendarView } from './components/views/CalendarView';
import { ProjectsView } from './components/views/ProjectsView';
import { MonthlyPlanView } from './components/views/MonthlyPlanView';
import { HabitsView } from './components/views/HabitsView';
import { GoalsView } from './components/views/GoalsView';
import { NotesView } from './components/views/NotesView';
import { FocusView } from './components/views/FocusView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { SettingsView } from './components/views/SettingsView';
import { GuideView } from './components/views/GuideView';
import { AssistantView } from './components/views/AssistantView';
import { FinanceView } from './components/views/FinanceView';
import { AIAssistantWidget } from './components/AIAssistantWidget';
import { FinanceProvider } from './context/FinanceContext';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';

const AppContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isDarkMode,
    setIsQuickCaptureOpen,
    setIsCommandPaletteOpen,
    isShortcutsOpen,
    setIsShortcutsOpen,
    toast,
    dismissToast,
  } = useApp();

  // Apply dark mode class to document element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K, 'c' or 'q' for quick capture, '?' for shortcuts, 1-9 for tabs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (!isInput) {
        if (e.key === 'q' || e.key === 'c') {
          e.preventDefault();
          setIsQuickCaptureOpen(true);
        } else if (e.key === '?') {
          e.preventDefault();
          setIsShortcutsOpen((prev) => !prev);
        } else if (e.key === 'f' || e.key === '$') {
          setActiveTab('finance');
        } else if (e.key === 'a') {
          setActiveTab('assistant');
        } else if (e.key === '1') {
          setActiveTab('dashboard');
        } else if (e.key === '2') {
          setActiveTab('inbox');
        } else if (e.key === '3') {
          setActiveTab('tasks');
        } else if (e.key === '4') {
          setActiveTab('agenda');
        } else if (e.key === '5') {
          setActiveTab('calendar');
        } else if (e.key === '6') {
          setActiveTab('projects');
        } else if (e.key === '7') {
          setActiveTab('monthly');
        } else if (e.key === '8') {
          setActiveTab('habits');
        } else if (e.key === '9') {
          setActiveTab('focus');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsCommandPaletteOpen, setIsQuickCaptureOpen, setIsShortcutsOpen, setActiveTab]);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'assistant':
        return <AssistantView />;
      case 'inbox':
        return <InboxView />;
      case 'tasks':
        return <TasksView />;
      case 'agenda':
        return <AgendaView />;
      case 'calendar':
        return <CalendarView />;
      case 'projects':
        return <ProjectsView />;
      case 'monthly':
        return <MonthlyPlanView />;
      case 'habits':
        return <HabitsView />;
      case 'goals':
        return <GoalsView />;
      case 'notes':
        return <NotesView />;
      case 'focus':
        return <FocusView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'guide':
        return <GuideView />;
      case 'settings':
        return <SettingsView />;
      case 'finance':
        return <FinanceView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen h-[100dvh] w-full max-w-full overflow-hidden bg-neutral-50 text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
      {/* Global Sidebar Navigation */}
      <Sidebar />

      {/* Main App Container */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <Header />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0 bg-neutral-50 dark:bg-neutral-950 transition-colors">
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation (Princípio #24) */}
      <MobileBottomNav />

      {/* Floating Instant Feedback & Undo Notification (Princípios #15 e #16) */}
      {toast && (
        <div
          id="global-toast-notification"
          className="fixed bottom-20 lg:bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-2xl border border-neutral-800/10 bg-neutral-900/95 px-4 py-2.5 text-xs font-medium text-white shadow-2xl backdrop-blur-md dark:border-neutral-700/60 dark:bg-white/95 dark:text-neutral-900 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <span>{toast.message}</span>
          {toast.undoAction && (
            <button
              onClick={() => {
                toast.undoAction?.();
                dismissToast();
              }}
              className="rounded-lg bg-white/20 px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:bg-white/30 dark:bg-neutral-900/10 dark:text-indigo-700 dark:hover:bg-neutral-900/20 transition-colors"
            >
              {toast.undoLabel || 'Desfazer'}
            </button>
          )}
        </div>
      )}

      {/* Global Interactive Modals & Voice Copilot */}
      <QuickCaptureModal />
      <CommandPalette />
      <TaskModal />
      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
      <AIAssistantWidget />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

function AuthenticatedApp() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-neutral-950 text-sm font-semibold text-neutral-400">
        Preparando seu Fluxo...
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  return (
    <AppProvider>
      <FinanceProvider>
        <AppContent />
      </FinanceProvider>
    </AppProvider>
  );
}
