import React from 'react';
import { CheckCircle2, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { SaveStatus } from '../../context/ManuscriptContext';

interface EditorStatusProps {
  saveStatus: SaveStatus;
  lastSavedTime: Date | null;
  wordCount: number;
  characterCount: number;
  characterCountNoSpaces?: number;
}

export const EditorStatus: React.FC<EditorStatusProps> = ({
  saveStatus,
  lastSavedTime,
  wordCount,
  characterCount,
  characterCountNoSpaces,
}) => {
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 225));

  const renderSaveState = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <div className="flex items-center space-x-1 text-[var(--amber-accent)]">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Saving changes...</span>
          </div>
        );
      case 'unsaved':
        return (
          <div className="flex items-center space-x-1 text-[var(--ink-muted)]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            <span>Unsaved edits</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
            <AlertCircle className="w-3 h-3" />
            <span>Autosave failed</span>
          </div>
        );
      case 'saved':
      default:
        return (
          <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            <span>
              Saved{' '}
              {lastSavedTime
                ? lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'locally'}
            </span>
          </div>
        );
    }
  };

  return (
    <div className="h-7 border-t border-[var(--paper-border)] bg-[var(--paper-surface)] flex items-center justify-between px-4 text-[11px] text-[var(--ink-muted)] font-mono select-none shrink-0 transition-colors">
      {/* Left: Save state */}
      <div>{renderSaveState()}</div>

      {/* Right: Metrics */}
      <div className="flex items-center space-x-3">
        <span>
          <strong className="text-[var(--ink-secondary)]">{wordCount.toLocaleString()}</strong> words
        </span>
        <span className="text-[var(--paper-border)]">•</span>
        <span
          className="cursor-help"
          title={`${characterCount.toLocaleString()} characters (${(characterCountNoSpaces ?? characterCount).toLocaleString()} excluding spaces)`}
        >
          <strong className="text-[var(--ink-secondary)]">{characterCount.toLocaleString()}</strong> chars
          {characterCountNoSpaces !== undefined && (
            <span className="text-[10px] text-[var(--ink-muted)] ml-1">
              ({characterCountNoSpaces.toLocaleString()} no spaces)
            </span>
          )}
        </span>
        <span className="text-[var(--paper-border)]">•</span>
        <span className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>~{readingTimeMinutes} min read</span>
        </span>
      </div>
    </div>
  );
};
