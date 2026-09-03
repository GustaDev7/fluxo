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

const AppContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isDarkMode,
    setIsQuickCaptureOpen,
    setIsCommandPaletteOpen,
    isShortcutsOpen,
    setIsShortcutsOpen,
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
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-50 text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
      {/* Global Sidebar Navigation */}
      <Sidebar />

      {/* Main App Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <Header />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-950 transition-colors">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Interactive Modals */}
      <QuickCaptureModal />
      <CommandPalette />
      <TaskModal />
      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
