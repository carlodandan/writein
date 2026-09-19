import React from 'react';
import { CheckCircle2, HardDrive, Shield } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

interface StatusBarProps {
  isDistractionFree: boolean;
  onExitDistractionFree: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  isDistractionFree,
  onExitDistractionFree,
}) => {
  const { currentProject } = useProject();

  return (
    <footer className="h-7 border-t border-[var(--paper-border)] bg-[var(--paper-surface)] flex items-center justify-between px-3 text-[11px] text-[var(--ink-muted)] select-none shrink-0 transition-colors">
      {/* Left: Autosave & Storage Status */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="font-medium">Saved</span>
        </div>

        <span className="text-[var(--paper-border)]">•</span>

        <div className="flex items-center space-x-1">
          <HardDrive className="w-3 h-3 text-[var(--ink-muted)]" />
          <span>Local SQLite Database</span>
        </div>
      </div>

      {/* Center: Distraction free alert if active */}
      {isDistractionFree && (
        <div className="flex items-center space-x-2">
          <span className="text-[var(--amber-accent)] font-medium">
            Distraction-Free Mode
          </span>
          <button
            onClick={onExitDistractionFree}
            className="underline hover:text-[var(--ink-primary)]"
          >
            Exit (Esc)
          </button>
        </div>
      )}

      {/* Right: Words & Characters */}
      <div className="flex items-center space-x-3 font-mono">
        <div>
          <span className="text-[var(--ink-secondary)] font-medium">
            {currentProject?.current_word_count.toLocaleString() || '0'}
          </span>{' '}
          words
        </div>

        <span className="text-[var(--paper-border)]">|</span>

        <div className="flex items-center space-x-1 text-emerald-700 dark:text-emerald-400">
          <Shield className="w-3 h-3" />
          <span className="text-[10px]">100% Offline & Private</span>
        </div>
      </div>
    </footer>
  );
};
