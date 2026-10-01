import React, { useState, useEffect, useRef, useId } from 'react';
import { X } from 'lucide-react';
import { RELEASES } from './changelogData';
import { useAppVersion } from '../../utils/appVersion';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY_LAST_SEEN = 'writein_last_seen_changelog_version';
const STORAGE_KEY_DONT_SHOW = 'writein_dont_show_changelog_on_startup';

export const ChangelogModal: React.FC<ChangelogModalProps> = ({
  isOpen,
  onClose,
}) => {
  const currentVersion = useAppVersion();
  const [activeTab, setActiveTab] = useState<'highlights' | 'history'>('highlights');
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (isOpen) {
      const dismissedVersion = localStorage.getItem(STORAGE_KEY_DONT_SHOW);
      setDontShowAgain(dismissedVersion === currentVersion);
    }
  }, [isOpen, currentVersion]);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement;
    dialogRef.current?.focus();

    return () => {
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'Tab' && dialogRef.current) {
        const dialog = dialogRef.current;
        const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]'
        )).filter((element) => element.tabIndex >= 0 && !element.matches(':disabled, [hidden]'));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (!first || active === dialog || !dialog.contains(active)) {
          e.preventDefault();
          ((e.shiftKey ? last : first) ?? dialog).focus();
        } else if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, dontShowAgain, currentVersion, onClose]);

  if (!isOpen) return null;

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY_LAST_SEEN, currentVersion);
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY_DONT_SHOW, currentVersion);
    } else {
      localStorage.removeItem(STORAGE_KEY_DONT_SHOW);
    }
    onClose();
  };

  const latestRelease = RELEASES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-150">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--paper-border)] flex items-center justify-between bg-[var(--paper-desk)]">
          <div>
            <div className="flex items-center space-x-2.5">
              <h3 id={titleId} className="font-serif-novel text-lg font-bold text-[var(--ink-primary)]">
                What's New in WriteIn
              </h3>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-[var(--paper-surface)] border border-[var(--paper-border)] text-[var(--amber-accent)]">
                {currentVersion}
              </span>
            </div>
            <p className="text-xs text-[var(--ink-muted)] mt-0.5">
              Release notes and updates for your writing workspace
            </p>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-surface)] rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[var(--paper-border)] px-6 bg-[var(--paper-surface)]">
          <button
            onClick={() => setActiveTab('highlights')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'highlights'
                ? 'border-[var(--amber-accent)] text-[var(--amber-accent)]'
                : 'border-transparent text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
            }`}
          >
            Latest Highlights ({latestRelease.version})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'border-[var(--amber-accent)] text-[var(--amber-accent)]'
                : 'border-transparent text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
            }`}
          >
            All Releases ({RELEASES.length})
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'highlights' ? (
            <div className="space-y-6">
              {/* Release Header Banner */}
              <div className="p-4 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-desk)] flex items-center justify-between">
                <div>
                  <h4 className="font-serif-novel text-base font-bold text-[var(--ink-primary)]">
                    {latestRelease.title}
                  </h4>
                  <p className="text-xs text-[var(--ink-muted)]">
                    Released on {latestRelease.date} • 100% Offline &amp; Private
                  </p>
                </div>
                <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Current Version
                </span>
              </div>

              {/* Major Feature Highlights */}
              <div className="space-y-3">
                <h5 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                  Key Updates
                </h5>
                <div className="space-y-2.5">
                  {latestRelease.highlights.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] space-y-1"
                    >
                      <div className="text-sm font-semibold text-[var(--ink-primary)]">
                        {item.title}
                      </div>
                      <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Breakdown if present */}
              {latestRelease.details && (
                <div className="space-y-3 pt-1">
                  <h5 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                    Changelog Details
                  </h5>
                  <div className="space-y-2">
                    {latestRelease.details.map((group, gIdx) => (
                      <div
                        key={gIdx}
                        className="p-3.5 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] space-y-1.5"
                      >
                        <span className="text-[10px] uppercase font-mono font-semibold px-1.5 py-0.5 rounded bg-[var(--paper-desk)] text-[var(--ink-secondary)]">
                          {group.category}
                        </span>
                        <ul className="text-xs text-[var(--ink-secondary)] space-y-1 list-disc list-inside">
                          {group.items.map((it, iIdx) => (
                            <li key={iIdx}>{it}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Complete History Tab */
            <div className="space-y-4">
              {RELEASES.map((rel, rIdx) => (
                <div
                  key={rIdx}
                  className="p-4 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-surface)] space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-[var(--paper-border-subtle)] pb-2.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold font-serif-novel text-[var(--ink-primary)]">
                        {rel.version}
                      </span>
                      <span className="text-xs text-[var(--ink-muted)]">• {rel.title}</span>
                    </div>
                    <span className="text-[11px] font-mono text-[var(--ink-muted)]">
                      {rel.date}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {rel.highlights.map((h, hIdx) => (
                      <div
                        key={hIdx}
                        className="p-3 rounded-md bg-[var(--paper-desk)] text-xs space-y-1"
                      >
                        <div className="font-semibold text-[var(--ink-primary)]">
                          {h.title}
                        </div>
                        <p className="text-[11px] text-[var(--ink-secondary)] line-clamp-2 leading-relaxed">
                          {h.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[var(--paper-border)] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[var(--paper-desk)]">
          <label className="flex items-center space-x-2 text-xs text-[var(--ink-secondary)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-[var(--paper-border)] text-[var(--amber-accent)] focus:ring-[var(--amber-accent)]"
            />
            <span>Don't show again on startup for {currentVersion}</span>
          </label>

          <button
            onClick={handleClose}
            className="w-full sm:w-auto px-5 py-2 rounded-lg bg-[var(--amber-accent)] hover:bg-[var(--amber-accent-hover)] text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer"
          >
            Got it, Let's Write
          </button>
        </div>
      </div>
    </div>
  );
};
