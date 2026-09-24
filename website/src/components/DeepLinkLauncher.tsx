import React, { useState } from 'react';
import { ExternalLink, X, Check, Copy, Sparkles } from 'lucide-react';

interface DeepLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeepLinkModal: React.FC<DeepLinkModalProps> = ({ isOpen, onClose }) => {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  if (!isOpen) return null;

  const links = [
    {
      title: 'Open WriteIn Desktop',
      scheme: 'writein://open',
      desc: 'Launches your installed WriteIn desktop application.',
    },
    {
      title: 'Start a New Novel Project',
      scheme: 'writein://new',
      desc: 'Triggers the New Project setup wizard in WriteIn.',
    },
    {
      title: 'Open Manuscript Workspace',
      scheme: 'writein://tab?to=manuscript',
      desc: 'Navigates directly to your chapters and prose desk.',
    },
    {
      title: 'Open Character Relationship Web',
      scheme: 'writein://tab?to=characters',
      desc: 'Opens your visual character relationship map.',
    },
    {
      title: 'Open Narrative Timeline',
      scheme: 'writein://tab?to=timeline',
      desc: 'Jumps directly to your story chronology tracker.',
    },
  ];

  const handleCopy = (scheme: string) => {
    navigator.clipboard.writeText(scheme);
    setCopiedLink(scheme);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--paper-border)] bg-[var(--paper-surface)] shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--paper-border-subtle)] pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--amber-soft)] border border-[var(--amber-soft-border)] flex items-center justify-center text-[var(--amber-accent)]">
              <ExternalLink className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif-novel text-lg font-bold text-[var(--ink-primary)]">
                Launch via Deep Link
              </h3>
              <p className="text-[11px] text-[var(--ink-muted)]">
                Registered custom protocol: <code className="font-mono text-[var(--amber-accent)] font-semibold">writein://</code>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[var(--paper-border)] hover:bg-[var(--paper-desk-hover)] text-[var(--ink-muted)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info box */}
        <div className="p-3.5 rounded-xl border border-[var(--paper-border-subtle)] bg-[var(--paper-desk)]/60 text-xs text-[var(--ink-secondary)] space-y-1">
          <p className="font-semibold text-[var(--ink-primary)] flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[var(--amber-accent)]" />
            <span>Tauri Deep-Link Plugin Integration</span>
          </p>
          <p className="text-[11px] leading-relaxed">
            Clicking a deep link below sends an OS activation event to WriteIn on your computer. If the application is closed, it will launch automatically.
          </p>
        </div>

        {/* Deep Link Triggers */}
        <div className="space-y-2.5">
          {links.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] hover:border-[var(--amber-accent)] transition-all flex items-center justify-between"
            >
              <div className="space-y-0.5 max-w-[280px]">
                <div className="text-xs font-bold text-[var(--ink-primary)]">{item.title}</div>
                <div className="text-[10px] text-[var(--ink-muted)] truncate">{item.desc}</div>
                <code className="text-[10px] font-mono text-[var(--amber-accent)] block pt-0.5">
                  {item.scheme}
                </code>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => handleCopy(item.scheme)}
                  title="Copy link"
                  className="p-1.5 rounded-lg border border-[var(--paper-border)] hover:bg-[var(--paper-desk-hover)] text-[var(--ink-muted)] cursor-pointer text-xs"
                >
                  {copiedLink === item.scheme ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                <a
                  href={item.scheme}
                  onClick={onClose}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[var(--amber-accent)] hover:bg-[var(--amber-accent-hover)] text-white text-xs font-semibold shadow-2xs cursor-pointer"
                >
                  <span>Launch</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Fallback note */}
        <div className="pt-2 border-t border-[var(--paper-border-subtle)] flex items-center justify-between text-xs text-[var(--ink-muted)]">
          <span>Don't have WriteIn installed yet?</span>
          <a
            href="#download"
            onClick={onClose}
            className="font-semibold text-[var(--amber-accent)] underline hover:opacity-80"
          >
            Download for Desktop &rarr;
          </a>
        </div>
      </div>
    </div>
  );
};
