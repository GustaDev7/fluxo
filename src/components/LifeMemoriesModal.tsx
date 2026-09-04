import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserMemoryItem, MemoryCategory } from '../types';
import {
  Brain,
  X,
  Plus,
  Trash2,
  Edit2,
  Download,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  DollarSign,
  Calendar,
  Settings,
  Target,
  FolderKanban,
  HelpCircle,
} from 'lucide-react';

interface LifeMemoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LifeMemoriesModal: React.FC<LifeMemoriesModalProps> = ({ isOpen, onClose }) => {
  const {
    userMemories = [],
    addUserMemory,
    deleteUserMemory,
    toggleUserMemory,
    updateUserMemory,
    user,
    updateUserProfile,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('finance');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  if (!isOpen) return null;

  const isMemoryEnabled = user.aiMemoryEnabled !== false;

  const filteredMemories = userMemories.filter((m) => {
    if (selectedCategory === 'all') return true;
    return m.category === selectedCategory;
  });

  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;

    if (addUserMemory) {
      addUserMemory({
        key: newKey.trim().toLowerCase().replace(/\s+/g, '_'),
        value: newValue.trim(),
        category: newCategory,
        source: 'manual',
        confidence: 1.0,
      });
    }

    setNewKey('');
    setNewValue('');
    setIsAdding(false);
  };

  const handleSaveEdit = (id: string) => {
    if (updateUserMemory && editValue.trim()) {
      updateUserMemory(id, { value: editValue.trim() });
    }
    setEditingId(null);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(userMemories, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `fluxo_user_memories_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const categoryIcons: Record<MemoryCategory, any> = {
    finance: DollarSign,
    routine: Calendar,
    preference: Settings,
    goal: Target,
    project: FolderKanban,
    general: Brain,
  };

  const categoryLabels: Record<MemoryCategory, string> = {
    finance: 'Padrão Financeiro',
    routine: 'Rotina / Horários',
    preference: 'Preferência Pessoal',
    goal: 'Metas & Prioridades',
    project: 'Regra de Projeto',
    general: 'Conhecimento Geral',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 bg-gradient-to-r from-purple-50/70 via-white to-indigo-50/70 px-6 py-4 dark:border-neutral-800 dark:from-purple-950/30 dark:via-neutral-900 dark:to-indigo-950/30">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/20">
              <Brain className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                  Memória Estruturada do Usuário
                </h2>
                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  Fluxo Memory
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Padrões, preferências e regras que a IA utiliza para evitar perguntas repetitivas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50/80 px-6 py-3 dark:border-neutral-800 dark:bg-neutral-800/40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
              Aprendizado Ativo:
            </span>
            <button
              onClick={() => updateUserProfile({ aiMemoryEnabled: !isMemoryEnabled })}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-colors ${
                isMemoryEnabled
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                  : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
              }`}
            >
              {isMemoryEnabled ? (
                <>
                  <ToggleRight className="h-4 w-4 text-emerald-600" /> Ativado
                </>
              ) : (
                <>
                  <ToggleLeft className="h-4 w-4 text-neutral-500" /> Pausado
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
            >
              <Download className="h-3.5 w-3.5" /> Exportar JSON
            </button>
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-purple-700"
            >
              <Plus className="h-3.5 w-3.5" /> Nova Memória
            </button>
          </div>
        </div>

        {/* Categories Tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-neutral-200 px-6 py-2 dark:border-neutral-800">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'finance', label: 'Finanças' },
            { id: 'routine', label: 'Rotinas' },
            { id: 'goal', label: 'Metas' },
            { id: 'preference', label: 'Preferências' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300'
                  : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Content List */}
        <div className="flex-1 space-y-3 overflow-y-auto p-6">
          {/* Add form */}
          {isAdding && (
            <form onSubmit={handleCreateMemory} className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 dark:border-purple-900/60 dark:bg-purple-950/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-purple-700 dark:text-purple-300">
                  Cadastrar Novo Padrão de Memória
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                    Identificador / Chave
                  </label>
                  <input
                    type="text"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="ex: mensalidade_academia"
                    className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                    Categoria
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
                    className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  >
                    <option value="finance">Padrão Financeiro</option>
                    <option value="routine">Rotina / Horários</option>
                    <option value="preference">Preferência</option>
                    <option value="goal">Metas</option>
                    <option value="project">Projeto</option>
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  Valor / Regra
                </label>
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="ex: Academia SmartFit R$ 139,90 vence todo dia 15"
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  required
                />
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-200 dark:text-neutral-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-purple-700"
                >
                  Salvar Memória
                </button>
              </div>
            </form>
          )}

          {filteredMemories.length === 0 ? (
            <div className="py-12 text-center text-sm text-neutral-400">
              Nenhuma memória encontrada nesta categoria.
            </div>
          ) : (
            filteredMemories.map((mem) => {
              const Icon = categoryIcons[mem.category] || Brain;
              const isEditing = editingId === mem.id;

              return (
                <div
                  key={mem.id}
                  className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 transition-colors ${
                    mem.isActive
                      ? 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
                      : 'border-neutral-200/50 bg-neutral-50/50 opacity-60 dark:border-neutral-800/40 dark:bg-neutral-900/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-neutral-900 dark:text-neutral-200">
                          {mem.key}
                        </span>
                        <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                          {categoryLabels[mem.category]}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {mem.source === 'auto_inferred' ? '🤖 Aprendido' : '✍️ Manual'}
                        </span>
                      </div>

                      {isEditing ? (
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="rounded border border-purple-300 bg-white px-2 py-1 text-xs text-neutral-900 dark:border-purple-700 dark:bg-neutral-800 dark:text-white"
                          />
                          <button
                            onClick={() => handleSaveEdit(mem.id)}
                            className="rounded bg-purple-600 px-2 py-1 text-xs font-bold text-white"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-xs text-neutral-400 hover:text-neutral-600"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
                          {mem.value}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingId(mem.id);
                        setEditValue(mem.value);
                      }}
                      title="Editar memória"
                      className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    {toggleUserMemory && (
                      <button
                        onClick={() => toggleUserMemory(mem.id)}
                        title={mem.isActive ? 'Desativar memória' : 'Ativar memória'}
                        className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800"
                      >
                        {mem.isActive ? (
                          <ToggleRight className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-neutral-400" />
                        )}
                      </button>
                    )}
                    {deleteUserMemory && (
                      <button
                        onClick={() => deleteUserMemory(mem.id)}
                        title="Excluir memória permanentemente"
                        className="rounded-lg p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-6 py-3 text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Privacidade total: dados de memória ficam armazenados localmente e sob seu controle.
          </span>
          <button
            onClick={onClose}
            className="rounded-xl bg-neutral-200 px-4 py-1.5 font-bold text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-200"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
