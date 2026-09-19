import { useState, useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import { ChevronUp, ChevronDown, X } from 'lucide-react';

interface FindReplaceBarProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FindReplaceBar: React.FC<FindReplaceBarProps> = ({
  editor,
  isOpen,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [matchCount, setMatchCount] = useState<number>(0);

  // Simple browser/editor in-memory find count based on text content
  useEffect(() => {
    if (!editor || !searchTerm.trim()) {
      setMatchCount(0);
      return;
    }
    const text = editor.getText();
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = text.match(regex);
    setMatchCount(matches ? matches.length : 0);
  }, [searchTerm, editor]);

  if (!isOpen) return null;

  const handleFindNext = () => {
    if (!searchTerm) return;
    const win = window as any;
    if (typeof win !== 'undefined' && win.find) {
      win.find(searchTerm, false, false, true, false, true, false);
    }
  };

  const handleFindPrev = () => {
    if (!searchTerm) return;
    const win = window as any;
    if (typeof win !== 'undefined' && win.find) {
      win.find(searchTerm, false, true, true, false, true, false);
    }
  };

  const handleReplace = () => {
    if (!editor || !searchTerm) return;
    const html = editor.getHTML();
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const updated = html.replace(regex, replaceTerm);
    editor.commands.setContent(updated);
  };

  const handleReplaceAll = () => {
    if (!editor || !searchTerm) return;
    const html = editor.getHTML();
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const updated = html.replace(regex, replaceTerm);
    editor.commands.setContent(updated);
  };

  return (
    <div className="border-b border-[var(--paper-border)] bg-[var(--paper-desk)] px-4 py-2 flex flex-wrap items-center gap-2 text-xs select-none transition-colors animate-in slide-in-from-top-2 duration-150">
      {/* Search Input */}
      <div className="flex items-center space-x-1.5 bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-md px-2 py-1">
        <input
          type="text"
          autoFocus
          placeholder="Find in document..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (e.shiftKey) handleFindPrev();
              else handleFindNext();
            } else if (e.key === 'Escape') {
              onClose();
            }
          }}
          className="bg-transparent text-[var(--ink-primary)] placeholder-[var(--ink-muted)] focus:outline-hidden w-40 text-xs"
        />
        <span className="text-[10px] font-mono text-[var(--ink-muted)]">
          {searchTerm ? `${matchCount} found` : ''}
        </span>
      </div>

      {/* Nav Buttons */}
      <div className="flex items-center space-x-0.5">
        <button
          type="button"
          onClick={handleFindPrev}
          disabled={!matchCount}
          className="p-1 rounded hover:bg-[var(--paper-desk-hover)] text-[var(--ink-secondary)] disabled:opacity-30"
          title="Previous Match (Shift+Enter)"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleFindNext}
          disabled={!matchCount}
          className="p-1 rounded hover:bg-[var(--paper-desk-hover)] text-[var(--ink-secondary)] disabled:opacity-30"
          title="Next Match (Enter)"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Replace Input */}
      <div className="flex items-center space-x-1.5 bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-md px-2 py-1 ml-2">
        <input
          type="text"
          placeholder="Replace with..."
          value={replaceTerm}
          onChange={(e) => setReplaceTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleReplace();
          }}
          className="bg-transparent text-[var(--ink-primary)] placeholder-[var(--ink-muted)] focus:outline-hidden w-36 text-xs"
        />
      </div>

      {/* Replace Actions */}
      <div className="flex items-center space-x-1">
        <button
          type="button"
          onClick={handleReplace}
          disabled={!matchCount}
          className="px-2 py-1 rounded bg-[var(--paper-surface)] hover:bg-[var(--paper-desk-hover)] border border-[var(--paper-border)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] font-medium disabled:opacity-30"
        >
          Replace
        </button>
        <button
          type="button"
          onClick={handleReplaceAll}
          disabled={!matchCount}
          className="px-2 py-1 rounded bg-[var(--paper-surface)] hover:bg-[var(--paper-desk-hover)] border border-[var(--paper-border)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] font-medium disabled:opacity-30"
        >
          All
        </button>
      </div>

      {/* Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="ml-auto p-1 rounded hover:bg-[var(--paper-desk-hover)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
        title="Close (Escape)"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
