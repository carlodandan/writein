import React, { useState, useEffect } from 'react';
import { X, Globe } from 'lucide-react';
import {
  CreateWorldbuildingInput,
  UpdateWorldbuildingInput,
  WorldbuildingEntry,
} from '../../../types/worldbuilding';

interface WorldbuildingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  defaultCategory?: string;
  editingEntry?: WorldbuildingEntry | null;
  onSubmit: (
    input: CreateWorldbuildingInput | UpdateWorldbuildingInput,
    isEdit: boolean,
  ) => Promise<void>;
}

const CATEGORIES = [
  'History',
  'Culture',
  'Magic System',
  'Technology',
  'Factions',
  'Religion',
  'Geography',
  'Lore & Rules',
  'General',
];

export const WorldbuildingFormModal: React.FC<WorldbuildingFormModalProps> = ({
  isOpen,
  onClose,
  projectId,
  defaultCategory,
  editingEntry,
  onSubmit,
}) => {
  const [category, setCategory] = useState('General');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingEntry) {
      setCategory(editingEntry.category);
      setTitle(editingEntry.title);
      setContent(editingEntry.content);
      setTags(editingEntry.tags || '');
    } else {
      setCategory(defaultCategory && defaultCategory !== 'All' ? defaultCategory : 'General');
      setTitle('');
      setContent('');
      setTags('');
    }
    setError(null);
  }, [editingEntry, defaultCategory, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Article title is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingEntry) {
        await onSubmit(
          {
            category,
            title: title.trim(),
            content: content.trim(),
            tags: tags.trim() || null,
          },
          true,
        );
      } else {
        await onSubmit(
          {
            project_id: projectId,
            category,
            title: title.trim(),
            content: content.trim(),
            tags: tags.trim() || null,
          },
          false,
        );
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--paper-border)] bg-[var(--paper-desk)]">
          <div className="flex items-center space-x-2.5">
            <Globe className="w-5 h-5 text-[var(--amber-accent)]" />
            <h2 className="font-serif-novel text-lg font-bold text-[var(--ink-primary)]">
              {editingEntry ? `Edit Entry: ${editingEntry.title}` : 'New Worldbuilding Article'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-surface)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
          {error && (
            <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                Article Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. The Rules of Blood Alchemy, The Treaty of 1844"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
              Article Content & Lore Notes
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              placeholder="Write the lore, historical chronology, mechanical rules, cultural practices, or faction hierarchies..."
              className="w-full p-3 font-serif-novel text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)] leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. magic, history, guild, prohibited"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-[var(--paper-border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-lg border border-[var(--paper-border)] hover:bg-[var(--paper-desk)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-[var(--amber-accent)] text-stone-900 hover:brightness-105 transition-all shadow-xs"
            >
              {isSubmitting ? 'Saving...' : editingEntry ? 'Save Article' : 'Create Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
