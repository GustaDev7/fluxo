import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Plus,
  Trash2,
  Heading1,
  Heading2,
  CheckSquare,
  List as ListIcon,
  Code,
  AlertCircle,
  FolderKanban,
  Search,
  ChevronLeft,
} from 'lucide-react';
import { NotePage, NoteBlock } from '../../types';

export const NotesView: React.FC = () => {
  const {
    notes,
    projects,
    addNote,
    updateNote,
    deleteNote,
    addNoteBlock,
    updateNoteBlock,
    deleteNoteBlock,
  } = useApp();

  const [selectedNoteId, setSelectedNoteId] = useState<string>(notes[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileViewingEditor, setIsMobileViewingEditor] = useState<boolean>(false);

  const currentNote = notes.find((n) => n.id === selectedNoteId);

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.blocks.some((b) => b.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateNote = () => {
    const newNote = addNote({
      title: 'Documento Sem Título',
    });
    setSelectedNoteId(newNote.id);
    setIsMobileViewingEditor(true);
  };

  const blockTypeIcons: Record<NoteBlock['type'], React.ComponentType<{ className?: string }>> = {
    h1: Heading1,
    h2: Heading2,
    h3: Heading2,
    p: FileText,
    todo: CheckSquare,
    bullet: ListIcon,
    toggle: AlertCircle,
    code: Code,
    callout: AlertCircle,
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left Sidebar: Notes Library */}
      <div className={`w-full md:w-64 sm:md:w-72 border-r border-neutral-200 bg-neutral-50/70 p-4 dark:border-neutral-800 dark:bg-neutral-900/60 flex flex-col ${isMobileViewingEditor ? 'hidden md:flex' : 'flex'}`}>
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Notas & Docs</h2>
          </div>
          <button
            onClick={handleCreateNote}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800 dark:hover:bg-neutral-800"
            title="Nova Página"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="mt-3 flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-2.5 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800">
          <Search className="h-3.5 w-3.5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar documentos..."
            className="bg-transparent text-xs text-neutral-800 outline-none placeholder-neutral-400 dark:text-neutral-200 w-full"
          />
        </div>

        {/* Notes List */}
        <div className="mt-3 flex-1 overflow-y-auto space-y-1">
          {filteredNotes.map((note) => {
            const isSelected = note.id === selectedNoteId;
            return (
              <div
                key={note.id}
                onClick={() => {
                  setSelectedNoteId(note.id);
                  setIsMobileViewingEditor(true);
                }}
                className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-colors cursor-pointer min-h-[44px] ${
                  isSelected
                    ? 'bg-indigo-50 font-bold text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200'
                    : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800/60'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText className="h-4 w-4 shrink-0 text-neutral-400 group-hover:text-indigo-600" />
                  <span className="truncate">{note.title || 'Sem título'}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNote(note.id);
                    if (selectedNoteId === note.id) {
                      const remaining = notes.find((n) => n.id !== note.id);
                      setSelectedNoteId(remaining?.id || '');
                      if (!remaining) setIsMobileViewingEditor(false);
                    }
                  }}
                  className="opacity-60 md:opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-rose-500 p-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Document Content / Notion-like Block Editor */}
      <div className={`flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 bg-white dark:bg-neutral-900 ${isMobileViewingEditor ? 'flex flex-col' : 'hidden md:flex flex-col'}`}>
        {currentNote ? (
          <div className="max-w-3xl mx-auto space-y-6 w-full">
            {/* Header: Title & Project Link & Mobile Back button */}
            <div className="space-y-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMobileViewingEditor(false)}
                    className="md:hidden flex items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-semibold text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Notas</span>
                  </button>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-800">
                  <FolderKanban className="h-3.5 w-3.5 text-neutral-400" />
                  <select
                    value={currentNote.projectId || ''}
                    onChange={(e) =>
                      updateNote(currentNote.id, { projectId: e.target.value || undefined })
                    }
                    className="bg-transparent text-xs text-neutral-700 outline-none dark:text-neutral-300"
                  >
                    <option value="">Sem projeto vinculado</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <input
                type="text"
                value={currentNote.title}
                onChange={(e) => updateNote(currentNote.id, { title: e.target.value })}
                placeholder="Título do Documento..."
                className="w-full text-2xl sm:text-3xl font-extrabold text-neutral-900 bg-transparent focus:outline-none dark:text-neutral-100"
              />
            </div>

            {/* Block Items Stream */}
            <div className="space-y-3">
              {currentNote.blocks.map((block) => {
                return (
                  <div key={block.id} className="group relative flex items-start gap-2">
                    {/* Render according to block.type */}
                    {block.type === 'h1' && (
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) =>
                          updateNoteBlock(currentNote.id, block.id, { content: e.target.value })
                        }
                        placeholder="Título H1..."
                        className="w-full text-xl font-bold text-neutral-900 bg-transparent focus:outline-none dark:text-neutral-100"
                      />
                    )}

                    {block.type === 'h2' && (
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) =>
                          updateNoteBlock(currentNote.id, block.id, { content: e.target.value })
                        }
                        placeholder="Subtítulo H2..."
                        className="w-full text-base font-bold text-neutral-800 bg-transparent focus:outline-none dark:text-neutral-200"
                      />
                    )}

                    {block.type === 'p' && (
                      <textarea
                        rows={1}
                        value={block.content}
                        onChange={(e) =>
                          updateNoteBlock(currentNote.id, block.id, { content: e.target.value })
                        }
                        placeholder="Digite '/' para comandos ou comece a escrever..."
                        className="w-full resize-none bg-transparent text-sm leading-relaxed text-neutral-800 placeholder-neutral-300 focus:outline-none dark:text-neutral-200 dark:placeholder-neutral-600"
                      />
                    )}

                    {block.type === 'todo' && (
                      <div className="flex items-center gap-2.5 w-full">
                        <input
                          type="checkbox"
                          checked={block.checked}
                          onChange={(e) =>
                            updateNoteBlock(currentNote.id, block.id, { checked: e.target.checked })
                          }
                          className="h-4 w-4 rounded text-indigo-600"
                        />
                        <input
                          type="text"
                          value={block.content}
                          onChange={(e) =>
                            updateNoteBlock(currentNote.id, block.id, { content: e.target.value })
                          }
                          placeholder="Item de afazer..."
                          className={`w-full bg-transparent text-xs sm:text-sm focus:outline-none ${
                            block.checked
                              ? 'line-through text-neutral-400'
                              : 'text-neutral-800 dark:text-neutral-200'
                          }`}
                        />
                      </div>
                    )}

                    {block.type === 'bullet' && (
                      <div className="flex items-center gap-2.5 w-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 shrink-0" />
                        <input
                          type="text"
                          value={block.content}
                          onChange={(e) =>
                            updateNoteBlock(currentNote.id, block.id, { content: e.target.value })
                          }
                          placeholder="Item de lista..."
                          className="w-full bg-transparent text-xs sm:text-sm text-neutral-800 focus:outline-none dark:text-neutral-200"
                        />
                      </div>
                    )}

                    {block.type === 'callout' && (
                      <div className="flex items-start gap-2.5 w-full rounded-xl border border-indigo-200 bg-indigo-50/60 p-3.5 text-xs text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200">
                        <AlertCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                        <textarea
                          rows={2}
                          value={block.content}
                          onChange={(e) =>
                            updateNoteBlock(currentNote.id, block.id, { content: e.target.value })
                          }
                          placeholder="Nota de destaque ou aviso..."
                          className="w-full resize-none bg-transparent outline-none"
                        />
                      </div>
                    )}

                    {block.type === 'code' && (
                      <div className="w-full rounded-xl border border-neutral-200 bg-neutral-900 p-3 text-xs font-mono text-emerald-400">
                        <textarea
                          rows={3}
                          value={block.content}
                          onChange={(e) =>
                            updateNoteBlock(currentNote.id, block.id, { content: e.target.value })
                          }
                          placeholder="// Código, comandos ou SQL..."
                          className="w-full resize-none bg-transparent outline-none text-emerald-400 placeholder-neutral-500"
                        />
                      </div>
                    )}

                    {/* Delete Block action */}
                    <button
                      onClick={() => deleteNoteBlock(currentNote.id, block.id)}
                      className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-rose-500 p-1 transition-opacity shrink-0"
                      title="Excluir bloco"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Notion-style Add Block Toolbar */}
            <div className="flex flex-wrap items-center gap-1.5 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <span className="text-[11px] font-semibold text-neutral-400 mr-1">+ Inserir:</span>
              <button
                onClick={() => addNoteBlock(currentNote.id, 'p')}
                className="rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
              >
                Parágrafo
              </button>
              <button
                onClick={() => addNoteBlock(currentNote.id, 'h1')}
                className="rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
              >
                Título H1
              </button>
              <button
                onClick={() => addNoteBlock(currentNote.id, 'h2')}
                className="rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
              >
                Subtítulo H2
              </button>
              <button
                onClick={() => addNoteBlock(currentNote.id, 'todo')}
                className="rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
              >
                To-Do Checklist
              </button>
              <button
                onClick={() => addNoteBlock(currentNote.id, 'bullet')}
                className="rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
              >
                Lista com Pontos
              </button>
              <button
                onClick={() => addNoteBlock(currentNote.id, 'callout')}
                className="rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
              >
                Caixa Destaque
              </button>
              <button
                onClick={() => addNoteBlock(currentNote.id, 'code')}
                className="rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
              >
                Código
              </button>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-neutral-400">
            Selecione ou crie um documento para começar a escrever.
          </div>
        )}
      </div>
    </div>
  );
};
