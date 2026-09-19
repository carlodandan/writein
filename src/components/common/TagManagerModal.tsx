import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, Edit2, Trash2, X, Check, AlertCircle } from 'lucide-react';
import { tagService } from '../../services/tagService';
import { TagWithUsageCount } from '../../types/tag';

interface TagManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export const TagManagerModal: React.FC<TagManagerModalProps> = ({
  isOpen,
  onClose,
  projectId,
}) => {
  const [tags, setTags] = useState<TagWithUsageCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTagName, setNewTagName] = useState('');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadTags = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const list = await tagService.getTags(projectId);
      setTags(list);
    } catch (err) {
      console.error('Failed to load project tags:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (isOpen) {
      loadTags();
      setNewTagName('');
      setEditingTagId(null);
      setError(null);
    }
  }, [isOpen, loadTags]);

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      setError(null);
      await tagService.createTag({
        project_id: projectId,
        name: newTagName.trim(),
      });
      setNewTagName('');
      await loadTags();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create tag');
    }
  };

  const handleRename = async (tag: TagWithUsageCount) => {
    if (!editingTagName.trim() || editingTagName.trim() === tag.name) {
      setEditingTagId(null);
      return;
    }

    try {
      setError(null);
      await tagService.renameTag(tag.id, editingTagName.trim());
      setEditingTagId(null);
      await loadTags();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to rename tag');
    }
  };

  const handleDelete = async (tag: TagWithUsageCount) => {
    if (
      window.confirm(
        `Delete tag #${tag.name}? Entities with this tag will not be deleted, but the tag association will be removed.`,
      )
    ) {
      try {
        setError(null);
        await tagService.deleteTag(tag.id);
        setTags((prev) => prev.filter((t) => t.id !== tag.id));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to delete tag');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-[var(--paper-surface)] rounded-xl shadow-xl border border-[var(--paper-border)] overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--paper-border)] bg-[var(--paper-desk)]">
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-[var(--amber-accent)]" />
            <h3 className="text-sm font-semibold text-[var(--ink-primary)]">
              Manage Project Tags
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Create new tag inline form */}
        <form
          onSubmit={handleCreateTag}
          className="p-4 border-b border-[var(--paper-border-subtle)] bg-[var(--paper-surface)] flex items-center space-x-2"
        >
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Create new tag name..."
            className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-desk)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
          />
          <button
            type="submit"
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[var(--amber-accent)] hover:bg-[var(--amber-accent)]/90 text-white text-xs font-medium transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>

        {error && (
          <div className="mx-4 mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tags List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 min-h-[160px]">
          {loading ? (
            <div className="text-center py-10 text-xs text-[var(--ink-muted)]">
              Loading tags...
            </div>
          ) : tags.length === 0 ? (
            <div className="text-center py-10 text-xs text-[var(--ink-muted)]">
              No tags defined yet for this project.
            </div>
          ) : (
            tags.map((tag) => {
              const isEditing = editingTagId === tag.id;

              return (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-[var(--paper-desk)] hover:bg-[var(--paper-desk-hover)] transition-colors text-xs"
                >
                  {isEditing ? (
                    <div className="flex items-center space-x-1 flex-1 mr-2">
                      <input
                        type="text"
                        value={editingTagName}
                        onChange={(e) => setEditingTagName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(tag);
                          if (e.key === 'Escape') setEditingTagId(null);
                        }}
                        autoFocus
                        className="flex-1 px-2 py-1 text-xs rounded border border-[var(--paper-border-focus)] bg-[var(--paper-surface)] text-[var(--ink-primary)] focus:outline-hidden"
                      />
                      <button
                        onClick={() => handleRename(tag)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        title="Save name"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingTagId(null)}
                        className="p-1 text-[var(--ink-muted)] hover:bg-[var(--paper-desk)] rounded"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 truncate flex-1">
                      <span className="font-medium text-[var(--ink-primary)]">
                        #{tag.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--paper-surface)] border border-[var(--paper-border-subtle)] text-[var(--ink-muted)] font-mono">
                        {tag.usage_count} {tag.usage_count === 1 ? 'use' : 'uses'}
                      </span>
                    </div>
                  )}

                  {!isEditing && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setEditingTagId(tag.id);
                          setEditingTagName(tag.name);
                        }}
                        className="p-1 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] rounded"
                        title="Rename Tag"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(tag)}
                        className="p-1 text-[var(--ink-muted)] hover:text-rose-500 rounded"
                        title="Delete Tag"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-[var(--paper-desk)] border-t border-[var(--paper-border)] flex items-center justify-between text-[11px] text-[var(--ink-muted)]">
          <span>Safe deletion: does not delete tagged chapters or characters</span>
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs rounded-md bg-[var(--paper-surface)] border border-[var(--paper-border)] hover:bg-[var(--paper-desk-hover)] text-[var(--ink-secondary)]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
