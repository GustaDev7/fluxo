import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '⌘K / Ctrl+K', desc: 'Abrir Paleta de Comandos e busca global' },
    { key: 'Q / C', desc: 'Captura Rápida de Demanda (Tarefas, Gastos, Metas)' },
    { key: 'F / $', desc: 'Abrir Gestão Financeira AUVP' },
    { key: 'A', desc: 'Abrir Assistente Inteligente IA & Voz' },
    { key: '?', desc: 'Abrir este guia de atalhos de teclado' },
    { key: 'Esc', desc: 'Fechar modais, menus e janelas ativas' },
    { key: '1', desc: 'Ir para o Painel Geral (Dashboard)' },
    { key: '2', desc: 'Ir para a Caixa de Entrada (Inbox)' },
    { key: '3', desc: 'Ir para Tarefas & Kanban' },
    { key: '4', desc: 'Ir para Agenda & Time Blocking' },
    { key: '5', desc: 'Ir para o Calendário Mensal' },
    { key: '6', desc: 'Ir para Projetos' },
    { key: '7', desc: 'Ir para Planejamento Mensal' },
    { key: '8', desc: 'Ir para Rastreador de Hábitos' },
    { key: '9', desc: 'Ir para Modo Foco (Pomodoro)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Keyboard className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Atalhos de Teclado
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Navegação ultra rápida sem tirar a mão do teclado
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-2.5">
            {shortcuts.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/60 px-3.5 py-2.5 dark:border-neutral-800 dark:bg-neutral-800/40"
              >
                <span className="text-xs text-neutral-700 dark:text-neutral-300">{s.desc}</span>
                <kbd className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] font-mono font-semibold text-neutral-800 shadow-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-neutral-100 bg-neutral-50 px-6 py-3 text-right dark:border-neutral-800 dark:bg-neutral-900/50">
          <button
            onClick={onClose}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
