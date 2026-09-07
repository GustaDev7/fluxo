import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useFinance } from '../context/FinanceContext';
import {
  Search,
  CheckSquare,
  FolderKanban,
  FileText,
  Target,
  Plus,
  Timer,
  Sun,
  Moon,
  X,
  ArrowRight,
  BookOpen,
  Keyboard,
  DollarSign,
  ShieldCheck,
  ReceiptText,
  CalendarClock,
  Sparkles,
  Flame,
  PieChart,
} from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    setIsQuickCaptureOpen,
    tasks,
    projects,
    notes,
    goals,
    habits,
    setActiveTab,
    setSelectedTaskId,
    setSelectedProjectId,
    startFocusTimer,
    user,
    updateUserProfile,
    setIsShortcutsOpen,
  } = useApp();

  const {
    setSubTab,
    openTransactionModal,
    openDiagnosisModal,
  } = useFinance();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  // Filter actions and entities
  const q = query.toLowerCase().trim();

  const quickActions = [
    {
      id: 'act_new_task',
      label: 'Criar nova tarefa',
      category: 'Ações Rápidas',
      icon: Plus,
      action: () => {
        setIsCommandPaletteOpen(false);
        setIsQuickCaptureOpen(true);
      },
    },
    {
      id: 'act_new_project',
      label: 'Novo Projeto',
      category: 'Ações Rápidas',
      icon: FolderKanban,
      action: () => {
        setIsCommandPaletteOpen(false);
        setActiveTab('projects');
      },
    },
    {
      id: 'act_finance',
      label: 'Finanças AUVP (Orçamento Base Zero, Contas & Investimentos)',
      category: 'Navegação & Módulos',
      icon: DollarSign,
      action: () => {
        setIsCommandPaletteOpen(false);
        setActiveTab('finance');
      },
    },
    {
      id: 'act_finance_expense',
      label: 'Novo Lançamento / Despesa Financeira',
      category: 'Finanças AUVP',
      icon: ReceiptText,
      action: () => {
        setIsCommandPaletteOpen(false);
        openTransactionModal('expense');
      },
    },
    {
      id: 'act_emergency_fund',
      label: 'Reserva de Emergência AUVP (Blindagem & Cobertura)',
      category: 'Finanças AUVP',
      icon: ShieldCheck,
      action: () => {
        setIsCommandPaletteOpen(false);
        setSubTab('emergency');
        setActiveTab('finance');
      },
    },
    {
      id: 'act_budget_zero',
      label: 'Orçamento Base Zero (Regra 50-30-20 & Gastos)',
      category: 'Finanças AUVP',
      icon: PieChart,
      action: () => {
        setIsCommandPaletteOpen(false);
        setSubTab('budget');
        setActiveTab('finance');
      },
    },
    {
      id: 'act_bills',
      label: 'Contas Fixas & Boletos do Mês',
      category: 'Finanças AUVP',
      icon: CalendarClock,
      action: () => {
        setIsCommandPaletteOpen(false);
        setSubTab('bills');
        setActiveTab('finance');
      },
    },
    {
      id: 'act_diagnosis',
      label: 'Diagnóstico 360° Financeiro AUVP',
      category: 'Finanças AUVP',
      icon: Sparkles,
      action: () => {
        setIsCommandPaletteOpen(false);
        openDiagnosisModal();
      },
    },
    {
      id: 'act_start_pomodoro',
      label: 'Iniciar Modo Foco (Pomodoro 25m)',
      category: 'Ações Rápidas',
      icon: Timer,
      action: () => {
        setIsCommandPaletteOpen(false);
        startFocusTimer(undefined, 'Sessão de Foco Livre', 25);
      },
    },
    {
      id: 'act_toggle_theme',
      label: `Alternar Tema (Atual: ${user.theme})`,
      category: 'Ações Rápidas',
      icon: user.theme === 'dark' ? Sun : Moon,
      action: () => {
        updateUserProfile({ theme: user.theme === 'dark' ? 'light' : 'dark' });
        setIsCommandPaletteOpen(false);
      },
    },
    {
      id: 'act_guide',
      label: 'Como Usar o Sistema (Guia & Boas Práticas)',
      category: 'Ajuda & Aprendizado',
      icon: BookOpen,
      action: () => {
        setIsCommandPaletteOpen(false);
        setActiveTab('guide');
      },
    },
    {
      id: 'act_shortcuts',
      label: 'Ver Mapa de Atalhos de Teclado (?)',
      category: 'Ajuda & Aprendizado',
      icon: Keyboard,
      action: () => {
        setIsCommandPaletteOpen(false);
        setIsShortcutsOpen(true);
      },
    },
  ];

  const matchedActions = quickActions.filter((a) => a.label.toLowerCase().includes(q));

  const matchedTasks = tasks
    .filter((t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
    .slice(0, 5)
    .map((t) => ({
      id: t.id,
      label: t.title,
      sublabel: `Status: ${t.status} • Prioridade: ${t.priority}`,
      category: 'Tarefas',
      icon: CheckSquare,
      action: () => {
        setIsCommandPaletteOpen(false);
        setSelectedTaskId(t.id);
        setActiveTab('tasks');
      },
    }));

  const matchedProjects = projects
    .filter((p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
    .slice(0, 3)
    .map((p) => ({
      id: p.id,
      label: p.name,
      sublabel: `Progresso: ${p.progress}%`,
      category: 'Projetos',
      icon: FolderKanban,
      action: () => {
        setIsCommandPaletteOpen(false);
        setSelectedProjectId(p.id);
        setActiveTab('projects');
      },
    }));

  const matchedNotes = notes
    .filter((n) => n.title.toLowerCase().includes(q))
    .slice(0, 3)
    .map((n) => ({
      id: n.id,
      label: n.title,
      sublabel: `Nota Notion-like`,
      category: 'Notas & Documentos',
      icon: FileText,
      action: () => {
        setIsCommandPaletteOpen(false);
        setActiveTab('notes');
      },
    }));

  const matchedGoals = goals
    .filter((g) => g.title.toLowerCase().includes(q))
    .slice(0, 3)
    .map((g) => ({
      id: g.id,
      label: g.title,
      sublabel: `${g.currentValue} / ${g.targetValue} ${g.unit}`,
      category: 'Metas',
      icon: Target,
      action: () => {
        setIsCommandPaletteOpen(false);
        setActiveTab('goals');
      },
    }));

  const matchedHabits = habits
    .filter((h) => h.name.toLowerCase().includes(q) || h.category.toLowerCase().includes(q))
    .slice(0, 3)
    .map((h) => ({
      id: h.id,
      label: h.name,
      sublabel: `Hábito • Sequência atual: ${h.currentStreak} dias`,
      category: 'Hábitos',
      icon: Flame,
      action: () => {
        setIsCommandPaletteOpen(false);
        setActiveTab('habits');
      },
    }));

  const allResults = [
    ...matchedActions,
    ...matchedTasks,
    ...matchedProjects,
    ...matchedHabits,
    ...matchedNotes,
    ...matchedGoals,
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsCommandPaletteOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (allResults.length === 0 ? 0 : (prev + 1) % allResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (allResults.length === 0 ? 0 : (prev - 1 + allResults.length) % allResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allResults[selectedIndex]) {
        allResults[selectedIndex].action();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-neutral-900/50 p-4 pt-20 backdrop-blur-sm sm:pt-28">
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3.5 dark:border-neutral-800">
          <Search className="h-5 w-5 text-neutral-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Digite um comando, tarefa, projeto ou nota..."
            className="flex-1 bg-transparent text-sm text-neutral-900 placeholder-neutral-400 outline-none dark:text-neutral-100"
          />
          <button
            onClick={() => setIsCommandPaletteOpen(false)}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {allResults.length === 0 ? (
            <div className="py-12 text-center text-sm text-neutral-400">
              Nenhum resultado encontrado para "{query}".
            </div>
          ) : (
            <div className="space-y-1">
              {allResults.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={`${item.category}-${item.id || idx}`}
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 font-medium text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200'
                        : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="truncate">
                        <p className="truncate font-semibold text-neutral-900 dark:text-neutral-100">{item.label}</p>
                        {item.sublabel && (
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{item.sublabel}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                        {item.category}
                      </span>
                      {isSelected && <ArrowRight className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50 px-4 py-2 text-[11px] text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="rounded bg-neutral-200/80 px-1 py-0.5 font-mono text-[10px] dark:bg-neutral-800">↑↓</kbd> navegar
            </span>
            <span>
              <kbd className="rounded bg-neutral-200/80 px-1 py-0.5 font-mono text-[10px] dark:bg-neutral-800">Enter</kbd> executar
            </span>
            <span>
              <kbd className="rounded bg-neutral-200/80 px-1 py-0.5 font-mono text-[10px] dark:bg-neutral-800">Esc</kbd> fechar
            </span>
          </div>
          <span className="font-medium text-indigo-600 dark:text-indigo-400">Central de Produtividade</span>
        </div>
      </div>
    </div>
  );
};
