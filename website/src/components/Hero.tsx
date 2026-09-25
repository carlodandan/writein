import React from 'react';
import { Download, Sparkles, ShieldCheck, HardDrive, FileText, ArrowRight, Play } from 'lucide-react';

interface HeroProps {
  onOpenDeepLinkModal: () => void;
  onScrollToDemo: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenDeepLinkModal, onScrollToDemo }) => {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-grid-subtle">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-radial from-[var(--amber-soft)]/60 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        {/* Release Pill Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-[var(--paper-border)] bg-[var(--paper-surface)]/80 backdrop-blur-xs text-xs shadow-2xs">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-[var(--ink-primary)]">WriteIn v3.0 Released</span>
          <span className="text-[var(--paper-border)]">|</span>
          <span className="text-[var(--ink-muted)] flex items-center space-x-1">
            <span>Now with MS Word (.docx) Manuscript Compile</span>
          </span>
        </div>

        {/* Main Editorial Headline */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="font-serif-novel text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[var(--ink-primary)] leading-[1.12]">
            The private desktop studio for{' '}
            <span className="italic decoration-[var(--amber-accent)]/50 decoration-wavy decoration-2">
              long-form fiction
            </span>{' '}
            & novelists.
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-[var(--ink-secondary)] max-w-2xl mx-auto leading-relaxed">
            Organize multi-act manuscripts, weave dynamic character relationship webs, and compile publication-ready books—100% offline, local-first, with zero subscriptions.
          </p>
        </div>

        {/* CTA Buttons Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <a
            href="#download"
            className="w-full sm:w-auto flex items-center justify-center space-x-2.5 px-7 py-3.5 rounded-xl bg-[var(--amber-accent)] hover:bg-[var(--amber-accent-hover)] text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all cursor-pointer group"
          >
            <Download className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
            <span>Download for Windows</span>
            <span className="text-[11px] opacity-75 font-normal">(v2.0 • 64-bit .exe)</span>
          </a>

          <button
            onClick={onScrollToDemo}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl border border-[var(--paper-border)] hover:border-[var(--amber-accent)] bg-[var(--paper-surface)] hover:bg-[var(--paper-desk-hover)] text-[var(--ink-primary)] text-sm font-semibold transition-all cursor-pointer shadow-2xs"
          >
            <Play className="w-4 h-4 text-[var(--amber-accent)] fill-current" />
            <span>Try Interactive Desk</span>
          </button>

          <button
            onClick={onOpenDeepLinkModal}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-3.5 rounded-xl text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] underline decoration-[var(--paper-border)] hover:decoration-[var(--amber-accent)] transition-all cursor-pointer"
          >
            <span>Have app installed? Launch (writein://)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Real App Screenshot Preview */}
        <div className="pt-4 max-w-5xl mx-auto">
          <div className="rounded-2xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-2 sm:p-3 shadow-2xl overflow-hidden group">
            <div className="rounded-xl overflow-hidden border border-[var(--paper-border-subtle)] relative">
              <img
                src="/projectpage.webp"
                alt="WriteIn Novelist Studio Workspace"
                className="w-full h-auto object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.01]"
                loading="eager"
              />
            </div>
          </div>
        </div>

        {/* Value Proposition Pillars */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 max-w-3xl mx-auto">
          {[
            {
              icon: HardDrive,
              title: '100% Local SQLite',
              desc: 'Stored on your machine. No accounts.',
            },
            {
              icon: ShieldCheck,
              title: 'Zero Cloud Telemetry',
              desc: 'Your manuscript is never used to train AI.',
            },
            {
              icon: FileText,
              title: 'Word (.docx) Compile',
              desc: 'Standard manuscript layout with 1-click.',
            },
            {
              icon: Sparkles,
              title: 'Infinite Character Web',
              desc: 'Interactive visual relationship graph.',
            },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="p-3.5 rounded-xl border border-[var(--paper-border-subtle)] bg-[var(--paper-surface)]/60 text-left space-y-1 shadow-2xs"
              >
                <div className="flex items-center space-x-2 text-[var(--amber-accent)]">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="font-semibold text-xs text-[var(--ink-primary)] truncate">
                    {item.title}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--ink-muted)] leading-tight">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
