import React, { useState } from 'react';
import { useUpdater } from '../../hooks/useUpdater';
import { useAppVersion } from '../../utils/appVersion';
import { logger } from '../../utils/logger';
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Download,
  Info,
} from 'lucide-react';

/** Renders the Preferences panel for checking and installing application updates. */
export const UpdateCheck: React.FC = () => {
  const currentVersion = useAppVersion();
  const { state, check, install } = useUpdater();
  const [confirming, setConfirming] = useState(false);
  const [isManualChecking, setIsManualChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const isChecking = isManualChecking || state.stage === 'checking';
  const busy = isChecking || state.stage === 'downloading';
  const percentLabel =
    state.percent === null ? null : `${Math.round(state.percent * 100)}%`;

  const handleManualCheck = async () => {
    logger.info('[UpdateCheck] "Check for updates" clicked by user.');
    setIsManualChecking(true);
    const startTime = Date.now();
    try {
      const result = await check(true);
      if (result.stage === 'failed') {
        logger.error('[UpdateCheck] Manual check failed:', result.error);
      } else {
        logger.info('[UpdateCheck] Manual check finished successfully.');
      }
    } catch (err) {
      logger.error('[UpdateCheck] Manual check encountered error:', err);
    } finally {
      // Ensure the spinning animation displays for at least 800ms so user gets clear visual confirmation
      const elapsed = Date.now() - startTime;
      if (elapsed < 800) {
        await new Promise((resolve) => setTimeout(resolve, 800 - elapsed));
      }
      setIsManualChecking(false);
      const timestamp = new Date();
      setLastChecked(timestamp);
      logger.info(`[UpdateCheck] Update check logged at ${timestamp.toLocaleTimeString()}`);
    }
  };

  return (
    <div className="bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div>
            <h3 className="font-serif-novel text-base font-semibold text-[var(--ink-primary)]">
              Application Updates
            </h3>
            <p className="text-xs text-[var(--ink-muted)] flex items-center flex-wrap gap-x-2">
              <span>
                Installed version:{' '}
                <span className="font-mono font-medium text-[var(--ink-primary)]">{currentVersion}</span>
              </span>
              {lastChecked && (
                <>
                  <span className="text-[var(--paper-border)]">•</span>
                  <span className="text-[11px] text-[var(--ink-secondary)]">
                    Last checked: <span className="font-mono font-medium">{lastChecked.toLocaleTimeString()}</span>
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleManualCheck()}
          disabled={busy || confirming}
          className="group px-3 py-1.5 rounded-lg border border-[var(--paper-border)] hover:bg-[var(--paper-desk-hover)] text-xs font-medium text-[var(--ink-primary)] transition-colors flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          title={isChecking ? 'Checking for updates...' : 'Check for updates now'}
        >
          <RefreshCw
            className={`w-3.5 h-3.5 transition-transform duration-300 ${
              isChecking
                ? 'animate-spin text-[var(--amber-accent)]'
                : 'text-[var(--ink-muted)] group-hover:text-[var(--ink-primary)] group-hover:rotate-45'
            }`}
          />
          <span>{isChecking ? 'Checking...' : 'Check for updates'}</span>
        </button>
      </div>

      {/* Status feedback */}
      <div className="space-y-3 pt-1">
        {isChecking && (
          <div className="flex items-center space-x-2 text-xs text-[var(--amber-accent)] bg-[var(--amber-soft)]/50 border border-[var(--amber-soft-border)] p-3 rounded-lg animate-in fade-in duration-150">
            <RefreshCw className="w-4 h-4 animate-spin text-[var(--amber-accent)] shrink-0" />
            <span>Checking the release server for newer versions...</span>
          </div>
        )}

        {!isChecking && state.stage === 'current' && (
          <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg animate-in fade-in duration-150">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>WriteIn is up to date ({currentVersion}). No new updates available.</span>
            </div>
            {lastChecked && (
              <span className="text-[10px] font-mono opacity-80 shrink-0">
                Logged: {lastChecked.toLocaleTimeString()}
              </span>
            )}
          </div>
        )}

        {!isChecking && state.stage === 'failed' && (
          <div className="flex items-start space-x-2 text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Could not check for updates</p>
              <p className="opacity-90">{state.error}</p>
            </div>
          </div>
        )}

        {!isChecking && state.stage === 'available' && (
          <div className="space-y-3 bg-[var(--amber-soft)] border border-[var(--amber-soft-border)] p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
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
