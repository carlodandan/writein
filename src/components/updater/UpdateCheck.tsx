import React, { useState } from 'react';
import { useUpdater } from '../../hooks/useUpdater';
import { useAppVersion } from '../../utils/appVersion';
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Download,
  Sparkles,
  Info,
} from 'lucide-react';

export const UpdateCheck: React.FC = () => {
  const currentVersion = useAppVersion();
  const { state, check, install } = useUpdater();
  const [confirming, setConfirming] = useState(false);

  const busy = state.stage === 'checking' || state.stage === 'downloading';
  const percentLabel =
    state.percent === null ? null : `${Math.round(state.percent * 100)}%`;

  return (
    <div className="bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Sparkles className="w-5 h-5 text-[var(--amber-accent)]" />
          <div>
            <h3 className="font-serif-novel text-base font-semibold text-[var(--ink-primary)]">
              Application Updates
            </h3>
            <p className="text-xs text-[var(--ink-muted)]">
              Installed version: <span className="font-mono font-medium text-[var(--ink-primary)]">{currentVersion}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void check(true)}
          disabled={busy}
          className="px-3 py-1.5 rounded-lg border border-[var(--paper-border)] hover:bg-[var(--paper-desk-hover)] text-xs font-medium text-[var(--ink-primary)] transition-colors flex items-center space-x-1.5 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${state.stage === 'checking' ? 'animate-spin text-[var(--amber-accent)]' : ''}`} />
          <span>{state.stage === 'checking' ? 'Checking...' : 'Check for updates'}</span>
        </button>
      </div>

      {/* Status feedback */}
      <div className="space-y-3 pt-1">
        {state.stage === 'checking' && (
          <div className="flex items-center space-x-2 text-xs text-[var(--ink-muted)]">
            <RefreshCw className="w-4 h-4 animate-spin text-[var(--amber-accent)]" />
            <span>Checking the release server for newer versions...</span>
          </div>
        )}

        {state.stage === 'current' && (
          <div className="flex items-center space-x-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>WriteIn is up to date ({currentVersion}). No new updates available.</span>
          </div>
        )}

        {state.stage === 'failed' && (
          <div className="flex items-start space-x-2 text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Could not check for updates</p>
              <p className="opacity-90">{state.error}</p>
            </div>
          </div>
        )}

        {state.stage === 'available' && (
          <div className="space-y-3 bg-[var(--amber-soft)] border border-[var(--amber-soft-border)] p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[var(--amber-accent)]" />
                <span className="text-xs font-semibold text-[var(--ink-primary)]">
                  Version v{state.version} is available
                </span>
              </div>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="px-3 py-1.5 rounded-lg bg-[var(--amber-accent)] hover:bg-[var(--amber-accent-hover)] text-white text-xs font-medium shadow-xs transition-colors flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install & Restart</span>
              </button>
            </div>

            {state.notes && (
              <div className="mt-2 p-3 bg-[var(--paper-surface)] border border-[var(--paper-border-subtle)] rounded-md text-xs font-mono whitespace-pre-wrap text-[var(--ink-secondary)] max-h-48 overflow-y-auto">
                {state.notes}
              </div>
            )}
          </div>
        )}

        {state.stage === 'downloading' && (
          <div className="space-y-2 p-4 bg-[var(--paper-desk)] border border-[var(--paper-border)] rounded-lg">
            <div className="flex justify-between text-xs font-medium text-[var(--ink-primary)]">
              <span className="flex items-center space-x-1.5">
                <Download className="w-4 h-4 animate-bounce text-[var(--amber-accent)]" />
                <span>Downloading WriteIn v{state.version}...</span>
              </span>
              <span className="font-mono text-[var(--amber-accent)]">{percentLabel || '...'}</span>
            </div>
            <div className="w-full bg-[var(--paper-surface)] border border-[var(--paper-border)] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[var(--amber-accent)] h-full transition-all duration-300 rounded-full"
                style={{ width: `${Math.round((state.percent ?? 0) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-[var(--ink-muted)]">
              The application will automatically close and reopen when the update finishes.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-start space-x-2 text-[11px] text-[var(--ink-muted)] pt-1">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          Updates are signed with minisign verification. The application checks for updates quietly in the background without forcing changes.
        </span>
      </div>

      {/* Confirmation Dialog */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-xl p-5 shadow-2xl space-y-4">
            <h4 className="font-serif-novel text-base font-bold text-[var(--ink-primary)]">
              Install v{state.version}?
            </h4>
            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
              WriteIn will download the update, close, and restart automatically. Please ensure any open work is saved before continuing.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="px-3 py-1.5 rounded-lg border border-[var(--paper-border)] text-xs text-[var(--ink-secondary)] hover:bg-[var(--paper-desk-hover)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                  void install();
                }}
                className="px-3 py-1.5 rounded-lg bg-[var(--amber-accent)] hover:bg-[var(--amber-accent-hover)] text-white text-xs font-medium shadow-xs transition-colors"
              >
                Download & Install
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
