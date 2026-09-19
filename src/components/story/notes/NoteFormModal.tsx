import React, { useState, useEffect } from 'react';
import { X, StickyNote, AlertCircle } from 'lucide-react';
import { CreateNoteInput, Note, UpdateNoteInput } from '../../../types/note';
import { TagInput } from '../../common/TagInput';

interface NoteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    input: CreateNoteInput | UpdateNoteInput,
    isEdit: boolean,
  ) => Promise<void>;
  note: Note | null;
  projectId: string;
  defaultCategory?: string;
}

const CATEGORIES = [
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
];

export const NoteFormModal: React.FC<NoteFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  note,
  projectId,
  defaultCategory = 'Ideas',
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Ideas');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setCategory(note.category || 'Ideas');
      setContent(note.content || '');
      setTags(note.tags || '');
    } else {
      setTitle('');
      setCategory(defaultCategory === 'All' || defaultCategory === 'Archived' ? 'Ideas' : defaultCategory);
      setContent('');
      setTags('');
    }
    setError(null);
  }, [note, defaultCategory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Note title is required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const input: CreateNoteInput | UpdateNoteInput = {
        title: title.trim(),
        category,
        content: content.trim(),
        tags: tags.trim() || null,
        ...(note ? {} : { project_id: projectId }),
      };

      await onSave(input, !!note);
      onClose();
    } catch (err: unknown) {
      console.error('Failed to save note:', err);
      setError(err instanceof Error ? err.message : 'Failed to save note.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-[var(--paper-surface)] rounded-xl shadow-xl border border-[var(--paper-border)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--paper-border)] bg-[var(--paper-desk)]">
          <div className="flex items-center space-x-2">
            <StickyNote className="w-5 h-5 text-[var(--amber-accent)]" />
            <h2 className="text-base font-semibold text-[var(--ink-primary)]">
              {note ? 'Edit Note' : 'Create New Note'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 text-sm flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title & Category Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] uppercase tracking-wider mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Clue left behind at the lighthouse"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--paper-border)] bg-[var(--paper-desk)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--paper-border)] bg-[var(--paper-desk)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Note Content */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink-secondary)] uppercase tracking-wider mb-1">
              Content / Notes
            </label>
            <textarea
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Jot down your idea, snippet of dialogue, or plot reminder..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--paper-border)] bg-[var(--paper-desk)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)] font-serif-novel leading-relaxed"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink-secondary)] uppercase tracking-wider mb-1">
              Tags
            </label>
            <TagInput
              projectId={projectId}
              tags={
                tags
                  ? tags
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean)
                  : []
              }
              onChange={(newTags) => setTags(newTags.join(','))}
              placeholder="Add tag and press Enter..."
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--paper-border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-[var(--paper-border)] hover:bg-[var(--paper-desk)] text-[var(--ink-secondary)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm rounded-lg bg-[var(--amber-accent)] hover:bg-[var(--amber-accent)]/90 text-white font-medium transition-colors shadow-2xs disabled:opacity-50"
            >
              {saving ? 'Saving...' : note ? 'Save Changes' : 'Create Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
