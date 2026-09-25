import React, { useState } from 'react';
import { X, Download, AlertCircle } from 'lucide-react';
import { useUpdater } from '../../hooks/useUpdater';

interface UpdateNotificationDialogProps {
  isOpen: boolean;
  version: string;
  notes?: string | null;
  onClose: () => void;
  onOpenPreferences?: () => void;
}

/** Presents an available update and lets the user review or install it. */
export const UpdateNotificationDialog: React.FC<UpdateNotificationDialogProps> = ({
  isOpen,
  ...dialogProps
}) => {
  if (!isOpen) return null;

  return <OpenUpdateNotificationDialog {...dialogProps} />;
};

const OpenUpdateNotificationDialog: React.FC<
  Omit<UpdateNotificationDialogProps, 'isOpen'>
> = ({
  version,
  notes,
  onClose,
  onOpenPreferences,
}) => {
  const { state, install } = useUpdater();
  const [showNotes, setShowNotes] = useState(false);

  const isDownloading = state.stage === 'downloading';
  const percentLabel =
    state.percent === null ? null : `${Math.round(state.percent * 100)}%`;

  /** Starts installation of the update retained by the shared updater hook. */
  const handleInstall = async () => {
    await install();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--paper-border)] flex items-center justify-between bg-[var(--paper-desk)]">
          <div className="flex items-center space-x-2.5">
            <div>
              <h3 className="font-serif-novel text-base font-bold text-[var(--ink-primary)]">
                Update Available
              </h3>
              <p className="text-[11px] text-[var(--ink-muted)]">
                WriteIn v{version} is now available
              </p>
            </div>
          </div>
          {!isDownloading && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-surface)] transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-[var(--ink-secondary)]">
          <p className="leading-relaxed">
            A new version of WriteIn is ready to install. Updates bring performance enhancements, new features, and bug fixes.
          </p>

          {notes && (
            <div>
              <button
                type="button"
                onClick={() => setShowNotes(!showNotes)}
                className="text-[11px] font-medium text-[var(--amber-accent)] hover:underline flex items-center space-x-1"
              >
                <span>{showNotes ? 'Hide Release Notes' : 'View Release Notes'}</span>
              </button>
              {showNotes && (
                <div className="mt-2 p-3 bg-[var(--paper-desk)] border border-[var(--paper-border)] rounded-lg max-h-40 overflow-y-auto text-[11px] font-mono whitespace-pre-wrap leading-relaxed text-[var(--ink-primary)]">
                  {notes}
                </div>
              )}
            </div>
          )}

          {/* Download progress bar */}
          {isDownloading && (
            <div className="space-y-2 p-3 bg-[var(--paper-desk)] border border-[var(--paper-border)] rounded-lg">
              <div className="flex justify-between text-xs font-medium">
                <span className="flex items-center space-x-1.5 text-[var(--ink-primary)]">
                  <Download className="w-3.5 h-3.5 animate-bounce text-[var(--amber-accent)]" />
                  <span>Downloading update...</span>
                </span>
                <span className="font-mono text-[var(--amber-accent)]">{percentLabel || '...'}</span>
              </div>
              <div className="w-full bg-[var(--paper-surface)] border border-[var(--paper-border)] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[var(--amber-accent)] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${Math.round((state.percent ?? 0) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-[var(--ink-muted)]">
                The application will restart automatically once installation completes.
              </p>
            </div>
          )}

          {state.stage === 'failed' && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-2 text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="text-[11px]">
                <p className="font-medium">Could not install update</p>
                <p className="opacity-90">{state.error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--paper-border)] bg-[var(--paper-desk)] flex items-center justify-between">
          <div>
            {onOpenPreferences && !isDownloading && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPreferences();
                }}
                className="text-xs text-[var(--ink-muted)] hover:text-[var(--ink-primary)] underline transition-colors"
              >
                Go to Preferences
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {!isDownloading && (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg border border-[var(--paper-border)] text-xs font-medium text-[var(--ink-secondary)] hover:bg-[var(--paper-surface)] hover:text-[var(--ink-primary)] transition-colors"
              >
                Later
              </button>
            )}

            <button
              type="button"
              onClick={handleInstall}
              disabled={isDownloading}
              className="px-3.5 py-1.5 rounded-lg bg-[var(--amber-accent)] hover:bg-[var(--amber-accent-hover)] text-white text-xs font-medium shadow-xs transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Installing...' : 'Install Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
