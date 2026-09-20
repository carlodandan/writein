import React, { useState, useEffect, useCallback } from 'react';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  FileText,
  User,
  MapPin,
  StickyNote,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import { trashService } from '../../../services/trashService';
import type { TrashItem } from '../../../types/backupTrash';

type FilterType = 'all' | 'manuscript' | 'character' | 'location' | 'note';

export const TrashWorkspace: React.FC = () => {
  const { currentProject } = useProject();
  const [items, setItems] = useState<TrashItem[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<TrashItem | null>(null);

  const loadTrash = useCallback(async () => {
    if (!currentProject) return;
    setIsLoading(true);
    try {
      const data = await trashService.listTrash(currentProject.id);
      setItems(data);
    } catch (err) {
      console.error('Failed to load trash items:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentProject]);

  useEffect(() => {
    loadTrash();
  }, [loadTrash]);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleRestore = async (item: TrashItem) => {
    try {
      await trashService.restoreFromTrash(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      showToast(`Restored "${item.title}" successfully.`);
    } catch (err: any) {
      alert(`Failed to restore: ${err?.message || err}`);
    }
  };

  const handleDeletePermanently = async (item: TrashItem) => {
    try {
      await trashService.deletePermanently(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setItemToDelete(null);
      showToast(`Permanently deleted "${item.title}".`);
    } catch (err: any) {
      alert(`Failed to delete: ${err?.message || err}`);
    }
  };

  const handleEmptyTrash = async () => {
    if (!currentProject) return;
    try {
      const count = await trashService.emptyTrash(currentProject.id);
      setItems([]);
      setShowEmptyConfirm(false);
      showToast(`Emptied trash (${count} items removed permanently).`);
    } catch (err: any) {
      alert(`Failed to empty trash: ${err?.message || err}`);
    }
  };

  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true;
    return item.entity_type === filter;
  });

  const counts: Record<FilterType, number> = {
    all: items.length,
    manuscript: items.filter((i) => i.entity_type === 'manuscript').length,
    character: items.filter((i) => i.entity_type === 'character').length,
    location: items.filter((i) => i.entity_type === 'location').length,
    note: items.filter((i) => i.entity_type === 'note').length,
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'manuscript':
        return <FileText className="w-4 h-4 text-amber-500" />;
      case 'character':
        return <User className="w-4 h-4 text-blue-500" />;
      case 'location':
        return <MapPin className="w-4 h-4 text-emerald-500" />;
      case 'note':
        return <StickyNote className="w-4 h-4 text-purple-500" />;
      default:
        return <Trash2 className="w-4 h-4 text-[var(--ink-muted)]" />;
    }
  };

  const getEntityLabel = (type: string) => {
    switch (type) {
      case 'manuscript':
        return 'Manuscript';
      case 'character':
        return 'Character';
      case 'location':
        return 'Location';
      case 'note':
        return 'Note';
      default:
        return type;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--paper-bg)] text-[var(--ink-primary)] p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--paper-border)]">
        <div>
          <div className="flex items-center space-x-2">
            <Trash2 className="w-6 h-6 text-[var(--ink-muted)]" />
            <h1 className="font-serif-novel text-2xl font-semibold text-[var(--ink-primary)]">
              Trash & Recovery
            </h1>
          </div>
          <p className="text-xs text-[var(--ink-muted)] mt-1">
            Deleted items stay here until permanently removed. Restoring an item returns it to its original workspace.
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={() => setShowEmptyConfirm(true)}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium shadow-sm transition-colors self-start sm:self-center"
          >
            <Trash2 className="w-4 h-4" />
            <span>Empty Trash ({items.length})</span>
          </button>
        )}
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className="mt-4 flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 mt-6 overflow-x-auto pb-1">
        <Filter className="w-3.5 h-3.5 text-[var(--ink-muted)] mr-1 shrink-0" />
        {(['all', 'manuscript', 'character', 'location', 'note'] as FilterType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 ${
              filter === tab
                ? 'bg-[var(--amber-accent)] text-white shadow-sm'
                : 'bg-[var(--paper-desk)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-border)]'
            }`}
          >
            <span className="capitalize">{tab}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filter === tab ? 'bg-white/20 text-white' : 'bg-[var(--paper-border)] text-[var(--ink-muted)]'
              }`}
            >
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Items List */}
      <div className="mt-6 flex-1">
        {isLoading ? (
          <div className="text-center py-16 text-xs text-[var(--ink-muted)]">
            Loading trash items...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[var(--paper-border)] rounded-xl bg-[var(--paper-desk)]/50">
            <Trash2 className="w-12 h-12 text-[var(--ink-muted)] mx-auto opacity-40 mb-3" />
            <h3 className="font-serif-novel text-base font-semibold text-[var(--ink-primary)]">
              {filter === 'all' ? 'Trash is Empty' : `No deleted ${filter} items`}
            </h3>
            <p className="text-xs text-[var(--ink-muted)] mt-1 max-w-sm mx-auto">
              {filter === 'all'
                ? 'When you delete chapters, characters, locations, or notes, they will appear here safely for recovery.'
                : `No items found under the ${filter} filter.`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] hover:border-[var(--paper-border-focus)] transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="p-2 rounded-lg bg-[var(--paper-desk)] shrink-0">
                    {getEntityIcon(item.entity_type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-sm text-[var(--ink-primary)] truncate">
                        {item.title}
                      </h4>
                      <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[var(--paper-desk)] text-[var(--ink-muted)] border border-[var(--paper-border-subtle)]">
                        {getEntityLabel(item.entity_type)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                      Deleted on {new Date(item.deleted_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 ml-4">
                  <button
                    onClick={() => handleRestore(item)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
                    title="Restore item to workspace"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>
                  <button
                    onClick={() => setItemToDelete(item)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal: Empty All Trash */}
      {showEmptyConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="empty-trash-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
        >
          <div className="w-full max-w-md bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-500">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 id="empty-trash-dialog-title" className="font-serif-novel text-lg font-semibold text-[var(--ink-primary)]">
                Permanently Empty Trash?
              </h3>
            </div>
            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
              This action cannot be undone. All <strong>{items.length}</strong> items in the trash will be permanently deleted from this project.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowEmptyConfirm(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg text-[var(--ink-secondary)] hover:bg-[var(--paper-desk)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEmptyTrash}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors"
              >
                Yes, Empty Trash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Single Item Permanently */}
      {itemToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-perm-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
        >
          <div className="w-full max-w-md bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-500">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 id="delete-perm-dialog-title" className="font-serif-novel text-lg font-semibold text-[var(--ink-primary)]">
                Delete Permanently?
              </h3>
            </div>
            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
              Are you sure you want to permanently delete "<strong>{itemToDelete.title}</strong>"? You will not be able to recover this item.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg text-[var(--ink-secondary)] hover:bg-[var(--paper-desk)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePermanently(itemToDelete)}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
