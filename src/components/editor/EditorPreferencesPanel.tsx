import React from 'react';
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  Type,
  AlignJustify,
  ClipboardPaste,
} from 'lucide-react';
import type { EditorPreferences } from '../../types/phase5';

interface EditorPreferencesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: EditorPreferences;
  onUpdatePreference: <K extends keyof EditorPreferences>(
    key: K,
    value: EditorPreferences[K]
  ) => void;
  onResetPreferences: () => void;
}

export const EditorPreferencesPanel: React.FC<EditorPreferencesPanelProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreference,
  onResetPreferences,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="w-full max-w-md bg-[var(--paper-surface)] border-l border-[var(--paper-border)] h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="h-14 border-b border-[var(--paper-border)] px-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <SlidersHorizontal className="w-5 h-5 text-[var(--amber-accent)]" />
            <h2 className="font-serif-novel text-lg font-bold text-[var(--ink-primary)]">
              Editor Preferences
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-desk-hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Typography Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
              <Type className="w-4 h-4 text-[var(--amber-accent)]" />
              <span>Typography</span>
            </div>

            {/* Font Family */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--ink-secondary)]">
                Font Family
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'serif', label: 'Serif (Novel)', style: 'font-serif-novel' },
                  { id: 'sans', label: 'Sans-Serif', style: 'font-sans' },
                  { id: 'mono', label: 'Monospace', style: 'font-mono' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() =>
                      onUpdatePreference('fontFamily', f.id as EditorPreferences['fontFamily'])
                    }
                    className={`p-2 rounded-lg border text-xs text-center transition-all ${f.style} ${
                      preferences.fontFamily === f.id
                        ? 'border-[var(--amber-accent)] bg-[var(--paper-desk)] text-[var(--amber-accent)] font-bold shadow-xs'
                        : 'border-[var(--paper-border-subtle)] text-[var(--ink-secondary)] hover:bg-[var(--paper-desk-hover)]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size Slider */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between items-center text-xs font-medium text-[var(--ink-secondary)]">
                <span>Font Size</span>
                <span className="font-mono text-[var(--amber-accent)] font-semibold">
                  {preferences.fontSize}px
                </span>
              </div>
              <input
                type="range"
                min={14}
                max={24}
                step={1}
                value={preferences.fontSize}
                onChange={(e) => onUpdatePreference('fontSize', Number(e.target.value))}
                className="w-full accent-[var(--amber-accent)] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[var(--ink-muted)] font-mono">
                <span>14px (Compact)</span>
                <span>18px (Standard)</span>
                <span>24px (Large)</span>
              </div>
            </div>
          </div>

          {/* Layout & Spacing Section */}
          <div className="space-y-3 pt-3 border-t border-[var(--paper-border-subtle)]">
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
              <AlignJustify className="w-4 h-4 text-[var(--amber-accent)]" />
              <span>Spacing & Layout</span>
            </div>

            {/* Line Height */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--ink-secondary)]">
                Line Height
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'normal', label: 'Normal (1.5)' },
                  { id: 'relaxed', label: 'Relaxed (1.75)' },
                  { id: 'loose', label: 'Loose (2.0)' },
                ].map((lh) => (
                  <button
                    key={lh.id}
                    type="button"
                    onClick={() =>
                      onUpdatePreference('lineHeight', lh.id as EditorPreferences['lineHeight'])
                    }
                    className={`p-2 rounded-lg border text-xs text-center transition-all ${
                      preferences.lineHeight === lh.id
                        ? 'border-[var(--amber-accent)] bg-[var(--paper-desk)] text-[var(--amber-accent)] font-bold shadow-xs'
                        : 'border-[var(--paper-border-subtle)] text-[var(--ink-secondary)] hover:bg-[var(--paper-desk-hover)]'
                    }`}
                  >
                    {lh.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Editor Width */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-medium text-[var(--ink-secondary)]">
                Editor Width
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'narrow', label: 'Narrow' },
                  { id: 'medium', label: 'Standard' },
                  { id: 'wide', label: 'Wide' },
                ].map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() =>
                      onUpdatePreference('editorWidth', w.id as EditorPreferences['editorWidth'])
                    }
                    className={`p-2 rounded-lg border text-xs text-center transition-all ${
                      preferences.editorWidth === w.id
                        ? 'border-[var(--amber-accent)] bg-[var(--paper-desk)] text-[var(--amber-accent)] font-bold shadow-xs'
                        : 'border-[var(--paper-border-subtle)] text-[var(--ink-secondary)] hover:bg-[var(--paper-desk-hover)]'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Paragraph Spacing */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-medium text-[var(--ink-secondary)]">
                Paragraph Spacing
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'normal', label: 'Standard Spacing' },
                  { id: 'wide', label: 'Wide Spacing' },
                ].map((ps) => (
                  <button
                    key={ps.id}
                    type="button"
                    onClick={() =>
                      onUpdatePreference(
                        'paragraphSpacing',
                        ps.id as EditorPreferences['paragraphSpacing']
                      )
                    }
                    className={`p-2 rounded-lg border text-xs text-center transition-all ${
                      preferences.paragraphSpacing === ps.id
                        ? 'border-[var(--amber-accent)] bg-[var(--paper-desk)] text-[var(--amber-accent)] font-bold shadow-xs'
                        : 'border-[var(--paper-border-subtle)] text-[var(--ink-secondary)] hover:bg-[var(--paper-desk-hover)]'
                    }`}
                  >
                    {ps.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Clipboard & Paste Section */}
          <div className="space-y-3 pt-3 border-t border-[var(--paper-border-subtle)]">
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
              <ClipboardPaste className="w-4 h-4 text-[var(--amber-accent)]" />
              <span>Clipboard & Paste</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--ink-secondary)]">
                Default Paste Format
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  {
                    id: 'match-style',
                    label: 'Match Style',
                    desc: 'Inherits font & size, keeps bold/italics',
                  },
                  {
                    id: 'keep-format',
                    label: 'Keep Format',
                    desc: 'Preserves source styling & headers',
                  },
                  {
                    id: 'plain-text',
                    label: 'Plain Text',
                    desc: 'Strips all formatting into text',
                  },
                ].map((p) => {
                  const isSelected = (preferences.pasteBehavior || 'match-style') === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        onUpdatePreference(
                          'pasteBehavior',
                          p.id as EditorPreferences['pasteBehavior']
                        )
                      }
                      className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-[var(--amber-accent)] bg-[var(--paper-desk)] text-[var(--amber-accent)] shadow-xs'
                          : 'border-[var(--paper-border-subtle)] text-[var(--ink-secondary)] hover:bg-[var(--paper-desk-hover)]'
                      }`}
                    >
                      <span
                        className={`text-xs font-semibold ${
                          isSelected ? 'text-[var(--amber-accent)]' : 'text-[var(--ink-primary)]'
                        }`}
                      >
                        {p.label}
                      </span>
                      <span className="text-[10px] text-[var(--ink-muted)] mt-1 leading-tight">
                        {p.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-[var(--ink-muted)] pt-1">
                Tip: Press <kbd className="px-1 py-0.5 rounded bg-[var(--paper-desk)] border border-[var(--paper-border-subtle)] font-mono text-[10px]">Ctrl+Shift+V</kbd> anytime to paste as plain text.
              </p>
            </div>
          </div>

          {/* Focus & Immersion Section */}
          <div className="space-y-3 pt-3 border-t border-[var(--paper-border-subtle)]">
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
              <span>Immersion</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--paper-border-subtle)] bg-[var(--paper-desk)]">
              <div>
                <div className="text-xs font-medium text-[var(--ink-primary)]">
                  Typewriter Scrolling
                </div>
                <div className="text-[11px] text-[var(--ink-muted)]">
                  Keeps the active line vertically centered while typing
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.typewriterMode}
                onChange={(e) => onUpdatePreference('typewriterMode', e.target.checked)}
                className="w-4 h-4 accent-[var(--amber-accent)] rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--paper-border)] flex items-center justify-between">
          <button
            type="button"
            onClick={onResetPreferences}
            className="flex items-center space-x-1.5 text-xs text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md text-xs font-medium bg-[var(--amber-accent)] text-white hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
