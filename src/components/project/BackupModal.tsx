import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Archive,
  Download,
  Upload,
  Clock,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { backupService } from '../../services/backupService';
import type { BackupFileInfo, BackupResult } from '../../types/backupTrash';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
  const { currentProject, refreshProjects, selectProject } = useProject();
  const [activeTab, setActiveTab] = useState<'create' | 'restore' | 'history'>('create');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastBackupResult, setLastBackupResult] = useState<BackupResult | null>(null);
  const [savedBackups, setSavedBackups] = useState<BackupFileInfo[]>([]);
  const [restoreFileJson, setRestoreFileJson] = useState<string | null>(null);
  const [restorePreview, setRestorePreview] = useState<any | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBackups = async () => {
    try {
      const list = await backupService.listBackups(currentProject?.id);
      setSavedBackups(list);
    } catch (err) {
      console.error('Failed to list backups:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBackups();
      setFeedback(null);
      setLastBackupResult(null);
      setRestoreFileJson(null);
      setRestorePreview(null);
    }
  }, [isOpen, currentProject?.id]);

  const handleCreateBackup = async () => {
    if (!currentProject) return;
    setIsProcessing(true);
    setFeedback(null);
    try {
      const result = await backupService.createBackup(currentProject.id);
      setLastBackupResult(result);
      setFeedback({
        type: 'success',
        message: `Backup archive created successfully: ${result.fileName}`,
      });
      await fetchBackups();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Backup failed: ${err?.message || err}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.project || !parsed.nodes) {
          throw new Error('Invalid WriteIn backup bundle. Missing project or manuscript data.');
        }
        setRestoreFileJson(text);
        setRestorePreview(parsed);
        setFeedback(null);
      } catch (err: any) {
        setFeedback({
          type: 'error',
          message: `Failed to parse backup file: ${err?.message || err}`,
        });
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreBackup = async () => {
    if (!restoreFileJson) return;
    setIsProcessing(true);
    setFeedback(null);
    try {
      const restoredProject = await backupService.restoreBackup(restoreFileJson);
      await refreshProjects();
      await selectProject(restoredProject.id);
      setFeedback({
        type: 'success',
        message: 'Project restored and switched successfully!',
      });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Restore failed: ${err?.message || err}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteBackup = async (fileName: string) => {
    try {
      await backupService.deleteBackupFile(fileName);
      setSavedBackups((prev) => prev.filter((b) => b.fileName !== fileName));
    } catch (err: any) {
      alert(`Failed to delete backup file: ${err?.message || err}`);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="backup-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in select-none"
    >
      <div className="w-full max-w-2xl bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-[var(--ink-primary)]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--paper-border)] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Archive className="w-5 h-5 text-[var(--amber-accent)]" />
            <div>
              <h2 id="backup-modal-title" className="font-serif-novel text-lg font-semibold text-[var(--ink-primary)]">
                Project Backups & Recovery
              </h2>
              <p className="text-xs text-[var(--ink-muted)]">
                {currentProject?.title ? `For "${currentProject.title}"` : 'Manage backups and snapshots'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-desk)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--paper-border)] px-6 bg-[var(--paper-desk)]/50">
          <button
            onClick={() => setActiveTab('create')}
            className={`py-3 px-4 text-xs font-medium border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'create'
                ? 'border-[var(--amber-accent)] text-[var(--amber-accent)]'
                : 'border-transparent text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Create Backup</span>
          </button>
          <button
            onClick={() => setActiveTab('restore')}
            className={`py-3 px-4 text-xs font-medium border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'restore'
                ? 'border-[var(--amber-accent)] text-[var(--amber-accent)]'
                : 'border-transparent text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Restore from File</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 text-xs font-medium border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'history'
                ? 'border-[var(--amber-accent)] text-[var(--amber-accent)]'
                : 'border-transparent text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Saved Backups ({savedBackups.length})</span>
          </button>
        </div>

        {/* Status / Feedback Banner */}
        {feedback && (
          <div
            className={`mx-6 mt-4 p-3 rounded-lg flex items-center space-x-2.5 text-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Tab 1: Create Backup */}
          {activeTab === 'create' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-[var(--paper-border)] bg-[var(--paper-desk)]/30 space-y-2">
                <h3 className="text-sm font-semibold text-[var(--ink-primary)]">
                  Complete Offline Archive (.writein)
                </h3>
                <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                  Backs up the entire project, including all chapters, scenes, document text, characters, relationships, locations, worldbuilding, timeline events, notes, writing goals, and sessions into a self-contained archive.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center p-8 border border-dashed border-[var(--paper-border)] rounded-xl bg-[var(--paper-surface)] text-center space-y-4">
                <Archive className="w-12 h-12 text-[var(--amber-accent)] opacity-80" />
                <div>
                  <h4 className="font-serif-novel text-base font-semibold text-[var(--ink-primary)]">
                    Ready to Backup "{currentProject?.title}"
                  </h4>
                  <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                    The archive will be saved locally to your secure application data directory.
                  </p>
                </div>

                <button
                  onClick={handleCreateBackup}
                  disabled={isProcessing || !currentProject}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-[var(--amber-accent)] hover:opacity-90 text-white text-xs font-semibold shadow transition-all disabled:opacity-50"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <HardDrive className="w-4 h-4" />
                  )}
                  <span>{isProcessing ? 'Generating Archive...' : 'Create Backup Now'}</span>
                </button>
              </div>

              {lastBackupResult && (
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-xs font-semibold text-[var(--ink-primary)]">
                        {lastBackupResult.fileName}
                      </p>
                      <p className="text-[11px] text-[var(--ink-muted)]">
                        Saved to disk. You can also download a copy directly.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => backupService.downloadBackup(lastBackupResult)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[var(--paper-surface)] hover:bg-[var(--paper-desk)] border border-[var(--paper-border)] text-xs font-medium text-[var(--ink-primary)] transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-[var(--amber-accent)]" />
                    <span>Download File</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Restore from File */}
          {activeTab === 'restore' && (
            <div className="space-y-6">
              <input
                ref={fileInputRef}
                type="file"
                accept=".writein,.json"
                onChange={handleFileChange}
                className="hidden"
              />

              {!restorePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-[var(--paper-border)] hover:border-[var(--amber-accent)] rounded-xl bg-[var(--paper-desk)]/30 hover:bg-[var(--paper-desk)]/60 cursor-pointer text-center transition-colors space-y-3"
                >
                  <Upload className="w-10 h-10 text-[var(--ink-muted)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--ink-primary)]">
                      Click to choose a backup file (.writein or .json)
                    </p>
                    <p className="text-xs text-[var(--ink-muted)] mt-1">
                      Restoring creates a complete copy of the project without overwriting existing data.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-[var(--paper-border)] bg-[var(--paper-desk)]/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif-novel text-base font-semibold text-[var(--ink-primary)]">
                        {restorePreview.project?.title || 'Unknown Project'}
                      </h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--amber-accent)]/10 text-[var(--amber-accent)]">
                        v{restorePreview.version || '1.0'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2 rounded bg-[var(--paper-surface)] border border-[var(--paper-border-subtle)]">
                        <span className="text-[var(--ink-muted)] block text-[10px]">Chapters/Scenes</span>
                        <strong className="text-sm">{restorePreview.nodes?.length || 0}</strong>
                      </div>
                      <div className="p-2 rounded bg-[var(--paper-surface)] border border-[var(--paper-border-subtle)]">
                        <span className="text-[var(--ink-muted)] block text-[10px]">Characters</span>
                        <strong className="text-sm">{restorePreview.characters?.length || 0}</strong>
                      </div>
                      <div className="p-2 rounded bg-[var(--paper-surface)] border border-[var(--paper-border-subtle)]">
                        <span className="text-[var(--ink-muted)] block text-[10px]">Locations</span>
                        <strong className="text-sm">{restorePreview.locations?.length || 0}</strong>
                      </div>
                      <div className="p-2 rounded bg-[var(--paper-surface)] border border-[var(--paper-border-subtle)]">
                        <span className="text-[var(--ink-muted)] block text-[10px]">Notes</span>
                        <strong className="text-sm">{restorePreview.notes?.length || 0}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-2">
                    <button
                      onClick={() => {
                        setRestoreFileJson(null);
                        setRestorePreview(null);
                      }}
                      className="px-4 py-2 text-xs font-medium rounded-lg text-[var(--ink-muted)] hover:bg-[var(--paper-desk)] transition-colors"
                    >
                      Choose Different File
                    </button>
                    <button
                      onClick={handleRestoreBackup}
                      disabled={isProcessing}
                      className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-[var(--amber-accent)] hover:opacity-90 text-white text-xs font-semibold shadow transition-all disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>{isProcessing ? 'Restoring...' : 'Restore as Project'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Saved Backups History */}
          {activeTab === 'history' && (
            <div>
              {savedBackups.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-[var(--paper-border)] rounded-xl bg-[var(--paper-desk)]/30">
                  <Archive className="w-10 h-10 text-[var(--ink-muted)] mx-auto opacity-40 mb-2" />
                  <p className="text-xs font-medium text-[var(--ink-secondary)]">No local backups found</p>
                  <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                    Click "Create Backup Now" to create your first archive.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedBackups.map((b) => (
                    <div
                      key={b.fileName}
                      className="flex items-center justify-between p-3 rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] hover:border-[var(--paper-border-focus)] transition-colors"
                    >
                      <div className="min-w-0 flex items-center space-x-3">
                        <Archive className="w-4 h-4 text-[var(--amber-accent)] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[var(--ink-primary)] truncate">
                            {b.fileName}
                          </p>
                          <p className="text-[10px] text-[var(--ink-muted)]">
                            {new Date(b.createdAt).toLocaleString()} &bull; {formatBytes(b.fileSizeBytes)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0 ml-3">
                        <button
                          onClick={() => handleDeleteBackup(b.fileName)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Delete backup file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
