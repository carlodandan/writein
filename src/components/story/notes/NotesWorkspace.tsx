import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StickyNote,
  Plus,
  Search,
  Archive,
  RotateCcw,
  Edit2,
  Trash2,
  Tag,
  Calendar,
  Lightbulb,
  MessageSquare,
  Compass,
  FileText,
  User,
  Globe,
  CheckSquare,
  HelpCircle,
} from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import { noteService } from '../../../services/noteService';
import { Note, NoteCategory } from '../../../types/note';
import { NoteFormModal } from './NoteFormModal';

interface NotesWorkspaceProps {
  selectedNoteId?: string | null;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  All: StickyNote,
  Ideas: Lightbulb,
  Plot: Compass,
  Dialogue: MessageSquare,
  Research: FileText,
  Scene: FileText,
  Character: User,
  Worldbuilding: Globe,
  TODO: CheckSquare,
  Random: HelpCircle,
  Other: StickyNote,
  Archived: Archive,
};

const CATEGORIES: NoteCategory[] = [
  'All',
  'Ideas',
  'Plot',
  'Dialogue',
  'Research',
  'Scene',
  'Character',
  'Worldbuilding',
  'TODO',
  'Random',
  'Other',
  'Archived',
];

export const NotesWorkspace: React.FC<NotesWorkspaceProps> = ({
  selectedNoteId,
}) => {
  const { currentProject } = useProject();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<NoteCategory>('All');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(
    selectedNoteId || null,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const loadNotes = useCallback(async () => {
    if (!currentProject) return;
    try {
      setLoading(true);
      // Load both active and archived to show counts accurately
      const allNotes = await noteService.getNotes(currentProject.id, undefined, true);
      setNotes(allNotes);

      if (allNotes.length > 0 && !activeNoteId) {
        // default to first active note
        const firstActive = allNotes.find((n) => !n.archived_at) || allNotes[0];
        setActiveNoteId(firstActive.id);
      }
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setLoading(false);
    }
  }, [currentProject, activeNoteId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // When selectedNoteId prop changes
  useEffect(() => {
    if (selectedNoteId) {
      setActiveNoteId(selectedNoteId);
    }
  }, [selectedNoteId]);

  // Counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: 0, Archived: 0 };
    notes.forEach((n) => {
      if (n.archived_at) {
        counts.Archived = (counts.Archived || 0) + 1;
      } else {
        counts.All = (counts.All || 0) + 1;
        counts[n.category] = (counts[n.category] || 0) + 1;
      }
    });
    return counts;
  }, [notes]);

  // Filtered notes list based on category & search
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      // Archive handling
      const isArchived = !!n.archived_at;
      if (selectedCategory === 'Archived') {
        if (!isArchived) return false;
      } else {
        if (isArchived) return false;
        if (
          selectedCategory !== 'All' &&
          n.category.toLowerCase() !== selectedCategory.toLowerCase()
        ) {
          return false;
        }
      }

      // Search matching
      if (searchQuery.trim() === '') return true;
      const q = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.tags && n.tags.toLowerCase().includes(q))
      );
    });
  }, [notes, selectedCategory, searchQuery]);

  const activeNote = useMemo(() => {
    return (
      notes.find((n) => n.id === activeNoteId) ||
      filteredNotes[0] ||
      null
    );
  }, [notes, activeNoteId, filteredNotes]);

  // Save Note
  const handleSaveNote = async (
    input: any,
    isEdit: boolean,
  ) => {
    if (isEdit && editingNote) {
      const updated = await noteService.updateNote(editingNote.id, input);
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      setActiveNoteId(updated.id);
    } else {
      const created = await noteService.createNote(input);
      setNotes((prev) => [created, ...prev]);
      setActiveNoteId(created.id);
    }
  };

  // Toggle Archive
  const handleToggleArchive = async (note: Note) => {
    const updated = await noteService.toggleArchive(note.id);
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  };

  // Delete Note
  const handleDeleteNote = async (note: Note) => {
    if (window.confirm(`Permanently delete note "${note.title}"?`)) {
      await noteService.deleteNote(note.id);
      setNotes((prev) => prev.filter((n) => n.id !== note.id));
      if (activeNoteId === note.id) {
        setActiveNoteId(null);
      }
    }
  };

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-[var(--ink-muted)]">
        Please select or open a project first.
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[var(--paper-bg)]">
      {/* 1. Categories Column */}
      <div className="w-56 border-r border-[var(--paper-border)] bg-[var(--paper-desk)] flex flex-col justify-between shrink-0 p-3 select-none">
        <div className="space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)] flex items-center justify-between">
            <span>Notebook</span>
            <span className="font-mono">{categoryCounts.All || 0}</span>
          </div>

          <nav className="space-y-0.5">
            {CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat] || StickyNote;
              const count = categoryCounts[cat] || 0;
              const isActive = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[var(--paper-surface)] text-[var(--amber-accent)] border border-[var(--paper-border-subtle)] font-bold shadow-2xs'
                      : 'text-[var(--ink-secondary)] hover:bg-[var(--paper-desk-hover)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive
                          ? 'text-[var(--amber-accent)]'
                          : 'text-[var(--ink-muted)]'
                      }`}
                    />
                    <span className="truncate">{cat}</span>
                  </div>
                  {count > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--paper-surface)] border border-[var(--paper-border)] text-[var(--ink-muted)]">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* New Note Button */}
        <button
          onClick={() => {
            setEditingNote(null);
            setIsFormOpen(true);
          }}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-[var(--amber-accent)] hover:bg-[var(--amber-accent)]/90 text-white text-xs font-semibold shadow-2xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Note</span>
        </button>
      </div>

      {/* 2. Notes List Column */}
      <div className="w-80 border-r border-[var(--paper-border)] bg-[var(--paper-surface)] flex flex-col shrink-0">
        {/* Search Header */}
        <div className="p-3 border-b border-[var(--paper-border)] bg-[var(--paper-desk)]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--ink-muted)] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${selectedCategory.toLowerCase()} notes...`}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] text-[var(--ink-primary)] placeholder-[var(--ink-muted)] focus:outline-hidden focus:border-[var(--amber-accent)]"
            />
          </div>
        </div>

        {/* Notes Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--paper-border-subtle)]">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-xs text-[var(--ink-muted)]">
              Loading notes...
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-16 p-4 text-[var(--ink-muted)]">
              <StickyNote className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-semibold text-[var(--ink-primary)]">No notes yet.</p>
              <p className="text-[11px] mt-1 text-[var(--ink-muted)]">
                Capture an idea before you forget it.
              </p>
              <button
                onClick={() => {
                  setEditingNote(null);
                  setIsFormOpen(true);
                }}
                className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[var(--amber-accent)] hover:bg-[var(--amber-accent)]/90 text-white text-xs font-medium shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Note</span>
              </button>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-16 p-4 text-[var(--ink-muted)]">
              <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-medium">No notes found</p>
              <p className="text-[11px] mt-1">
                {searchQuery
                  ? 'No notes match your search query.'
                  : `No ${selectedCategory.toLowerCase()} notes yet.`}
              </p>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isSelected = activeNote?.id === note.id;
              const tagsList = note.tags
                ? note.tags
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean)
                : [];

              return (
                <div
                  key={note.id}
                  onClick={() => setActiveNoteId(note.id)}
                  className={`p-3.5 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[var(--paper-desk)] border-l-3 border-[var(--amber-accent)]'
                      : 'hover:bg-[var(--paper-desk)]/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <h4 className="text-xs font-bold text-[var(--ink-primary)] truncate flex-1">
                      {note.title}
                    </h4>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--paper-desk)] border border-[var(--paper-border-subtle)] text-[var(--ink-secondary)] shrink-0">
                      {note.category}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--ink-secondary)] font-serif-novel line-clamp-2 leading-relaxed mb-2">
                    {note.content || 'Empty note'}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-[var(--ink-muted)]">
                    <span>
                      {new Date(note.updated_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    {tagsList.length > 0 && (
                      <span className="truncate max-w-[120px]">
                        #{tagsList.join(' #')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. Prose Reading & Quick View Pane */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--paper-bg)]">
        {activeNote ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Top Note Action Bar */}
            <div className="px-6 py-4 border-b border-[var(--paper-border)] bg-[var(--paper-surface)] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--paper-desk)] border border-[var(--paper-border)] text-[var(--amber-accent)]">
                  {activeNote.category}
                </span>
                {activeNote.archived_at && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                    Archived
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => handleToggleArchive(activeNote)}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-[var(--paper-border)] hover:bg-[var(--paper-desk)] text-xs text-[var(--ink-secondary)] transition-colors"
                  title={activeNote.archived_at ? 'Restore note' : 'Archive note'}
                >
                  {activeNote.archived_at ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Restore</span>
                    </>
                  ) : (
                    <>
                      <Archive className="w-3.5 h-3.5" />
                      <span>Archive</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setEditingNote(activeNote);
                    setIsFormOpen(true);
                  }}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-[var(--paper-border)] hover:bg-[var(--paper-desk)] text-xs text-[var(--ink-secondary)] transition-colors"
                  title="Edit note"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => handleDeleteNote(activeNote)}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-[var(--paper-border)] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs text-rose-600 dark:text-rose-400 transition-colors"
                  title="Delete note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            {/* Note Content View */}
            <div className="flex-1 overflow-y-auto p-8 max-w-3xl w-full mx-auto">
              <h1 className="text-2xl font-bold font-serif-novel text-[var(--ink-primary)] mb-3">
                {activeNote.title}
              </h1>

              {/* Tags & Dates */}
              <div className="flex flex-wrap items-center gap-3 pb-4 mb-6 border-b border-[var(--paper-border-subtle)] text-xs text-[var(--ink-muted)]">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Updated {new Date(activeNote.updated_at).toLocaleDateString()}
                  </span>
                </span>

                {activeNote.tags && (
                  <div className="flex items-center space-x-1.5">
                    <Tag className="w-3 h-3 text-[var(--amber-accent)]" />
                    <div className="flex flex-wrap gap-1">
                      {activeNote.tags
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean)
                        .map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded bg-[var(--paper-desk)] text-[var(--ink-secondary)] text-[11px]"
                          >
                            #{tag}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Prose text */}
              <div className="font-serif-novel text-base text-[var(--ink-primary)] leading-relaxed whitespace-pre-wrap">
                {activeNote.content || (
                  <p className="italic text-[var(--ink-muted)]">
                    This note has no written content yet. Click &ldquo;Edit&rdquo; to add thoughts.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-[var(--ink-muted)]">
            <StickyNote className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm font-medium text-[var(--ink-primary)]">
              {notes.length === 0 ? 'No notes yet.' : 'No note selected'}
            </p>
            <p className="text-xs mt-1 max-w-xs text-center">
              {notes.length === 0
                ? 'Capture an idea before you forget it.'
                : 'Select a note on the left or create a new one to begin reading and editing.'}
            </p>
            {notes.length === 0 && (
              <button
                onClick={() => {
                  setEditingNote(null);
                  setIsFormOpen(true);
                }}
                className="mt-4 inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--amber-accent)] hover:bg-[var(--amber-accent)]/90 text-white text-xs font-semibold shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Note</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Note Form Modal */}
      <NoteFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveNote}
        note={editingNote}
        projectId={currentProject.id}
        defaultCategory={selectedCategory}
      />
    </div>
  );
};
