import React, { useState, useEffect } from 'react';
import {
  History,
  X,
  RotateCcw,
  Clock,
  Trash2,
  FileText,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { versionService } from '../../services/versionService';
import type { DocumentVersion } from '../../types/phase5';

interface VersionHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  documentId?: string;
  nodeId?: string;
  currentText: string;
  currentWordCount: number;
  onRestore: (text: string, wordCount: number) => void;
}

export const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
  isOpen,
  onClose,
  documentId,
  nodeId,
  currentText,
  currentWordCount,
  onRestore,
}) => {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen && nodeId) {
      loadVersions();
    }
  }, [isOpen, nodeId]);

  const loadVersions = async () => {
    if (!nodeId) return;
    setIsLoading(true);
    try {
      const list = await versionService.listDocumentVersions(nodeId);
      setVersions(list);
      if (list.length > 0) {
        // Load content of first version
        const full = await versionService.getDocumentVersion(list[0].id);
        setSelectedVersion(full);
      } else {
        setSelectedVersion(null);
      }
    } catch (err) {
      console.warn('Failed to load document versions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectVersion = async (v: DocumentVersion) => {
    try {
      const full = await versionService.getDocumentVersion(v.id);
      setSelectedVersion(full);
    } catch (err) {
      console.warn('Failed to load version content:', err);
    }
  };

  const handleCreateSnapshot = async () => {
    if (!nodeId || !documentId) return;
    setIsCreating(true);
    try {
      await versionService.createDocumentSnapshot(
        documentId,
        nodeId,
        currentText,
        currentWordCount
      );
      await loadVersions();
    } catch (err) {
      console.warn('Failed to create snapshot:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestore = async (v: DocumentVersion) => {
    if (!nodeId) return;
    const confirmed = window.confirm(
      `Restore Version ${v.version_num}? Your current document will be saved as a snapshot first.`
    );
    if (!confirmed) return;

    try {
      const restored = await versionService.restoreDocumentVersion(nodeId, v.id);
      onRestore(restored.content_text, restored.word_count);
      await loadVersions();
      onClose();
    } catch (err) {
      console.warn('Failed to restore version:', err);
    }
  };

  const handleDelete = async (versionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this version snapshot?')) return;
    try {
      await versionService.deleteDocumentVersion(versionId);
      if (selectedVersion?.id === versionId) {
        setSelectedVersion(null);
      }
      await loadVersions();
    } catch (err) {
      console.warn('Failed to delete version:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="w-full max-w-2xl bg-[var(--paper-surface)] border-l border-[var(--paper-border)] h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="h-14 border-b border-[var(--paper-border)] px-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <History className="w-5 h-5 text-[var(--amber-accent)]" />
            <h2 className="font-serif-novel text-lg font-bold text-[var(--ink-primary)]">
              Version History
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCreateSnapshot}
              disabled={isCreating}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--amber-accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              title="Save current state as a new snapshot"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Snapshot Now</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-desk-hover)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Version List */}
          <div className="w-64 border-r border-[var(--paper-border)] overflow-y-auto p-3 space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)] px-2 py-1">
              Snapshots ({versions.length})
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-xs text-[var(--ink-muted)]">
                Loading versions...
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8 px-3 text-xs text-[var(--ink-muted)] space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto opacity-30" />
                <p>No snapshots yet.</p>
                <p className="text-[10px]">
                  Click "Snapshot Now" or save with Ctrl+S to create automatic checkpoints.
                </p>
              </div>
            ) : (
              versions.map((v) => {
                const isSelected = selectedVersion?.id === v.id;
                const date = new Date(v.created_at);
                return (
                  <div
                    key={v.id}
                    onClick={() => handleSelectVersion(v)}
                    className={`p-2.5 rounded-lg text-xs cursor-pointer transition-colors border group ${
                      isSelected
                        ? 'bg-[var(--paper-desk)] border-[var(--amber-accent)] text-[var(--ink-primary)]'
                        : 'border-[var(--paper-border-subtle)] hover:bg-[var(--paper-desk-hover)] text-[var(--ink-secondary)]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span>Version {v.version_num}</span>
                      <button
                        onClick={(e) => handleDelete(v.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                        title="Delete snapshot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-1 text-[10px] text-[var(--ink-muted)] mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-[10px] font-mono text-[var(--ink-muted)] mt-0.5">
                      {v.word_count.toLocaleString()} words
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Version Preview */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[var(--paper-bg)]">
            {selectedVersion ? (
              <>
                <div className="p-3.5 border-b border-[var(--paper-border)] bg-[var(--paper-surface)] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-[var(--ink-primary)]">
                      Preview: Version {selectedVersion.version_num}
                    </span>
                    <span className="text-[11px] text-[var(--ink-muted)] ml-2">
                      ({selectedVersion.word_count.toLocaleString()} words)
                    </span>
                  </div>
                  <button
                    onClick={() => handleRestore(selectedVersion)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore This Version</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 font-serif-novel text-sm leading-relaxed text-[var(--ink-primary)] whitespace-pre-wrap selection:bg-[var(--amber-accent)]/20">
                  {selectedVersion.snapshot_text || (
                    <span className="italic text-[var(--ink-muted)]">
                      (Empty document at this snapshot)
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8 text-[var(--ink-muted)]">
                <div>
                  <FileText className="w-10 h-10 mx-auto opacity-30 mb-2" />
                  <p className="text-xs">Select a version snapshot to preview its contents.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
