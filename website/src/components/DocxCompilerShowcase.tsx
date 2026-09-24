import React from 'react';
import { FileType, CheckCircle2, Sliders, ShieldCheck, Download, Sparkles } from 'lucide-react';

export const DocxCompilerShowcase: React.FC = () => {
  return (
    <section id="compiler" className="py-20 md:py-28 bg-[var(--paper-desk)] border-y border-[var(--paper-border)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[var(--paper-surface)] border border-[var(--paper-border)] text-xs font-semibold text-[var(--amber-accent)] shadow-2xs">
            <FileType className="w-3.5 h-3.5" />
            <span>Standard Manuscript Format</span>
          </div>
          <h2 className="font-serif-novel text-3xl sm:text-5xl font-bold tracking-tight text-[var(--ink-primary)]">
            One-Click Compile to Microsoft Word (.docx)
          </h2>
          <p className="text-sm sm:text-base text-[var(--ink-secondary)] leading-relaxed">
            Stop wasting hours manually reformatting headings and indentation. WriteIn compiles your modular binder scenes directly into a publication-ready Word manuscript meeting standard literary agency submission requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Feature Specs */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-4">
              <h3 className="font-serif-novel text-2xl font-bold text-[var(--ink-primary)]">
                The Anatomy of a Perfect Manuscript
              </h3>
              <p className="text-xs sm:text-sm text-[var(--ink-secondary)] leading-relaxed">
                Literary agents and publishers expect exact typography and spacing. WriteIn formats every element strictly to industry guidelines automatically:
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  title: '1-Inch Margins on All Sides',
                  desc: 'Exact 1440 dxa margins conforming to US Letter & A4 submission standards.',
                },
                {
                  title: '12pt Times New Roman & 1.5 Line Spacing',
                  desc: 'Standardized editorial typography with clean line height for proofreading.',
                },
                {
                  title: '0.5-Inch First-Line Paragraph Indents',
                  desc: 'Automatic 720 dxa indents with zero blank lines between standard prose paragraphs.',
                },
                {
                  title: 'Title Page & Table of Contents Front-Matter',
                  desc: 'Includes book title, author byline, genre, approximate word count, and optional chapter index.',
                },
                {
                  title: 'Custom Scene Break Dividers',
                  desc: 'Standard traditional triple asterisks (* * *), markdown hashes (###), or em-dashes.',
                },
                {
                  title: 'Native File System Persistence',
                  desc: 'Saves directly to disk via Tauri native dialog with instant "Show in Folder" explorer action.',
                },
              ].map((spec, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-[var(--ink-primary)]">{spec.title}</h4>
                    <p className="text-[11px] text-[var(--ink-muted)] leading-tight">{spec.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Visual Manuscript Preview Sheet */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-[var(--paper-border)] bg-[var(--paper-surface)] p-6 sm:p-8 shadow-xl space-y-6 relative overflow-hidden">
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-[var(--amber-soft)] border border-[var(--amber-soft-border)] text-[10px] font-mono font-bold text-[var(--amber-accent)] flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>Word (.docx) Live Output</span>
              </div>

              {/* Title Page Simulation */}
              <div className="border border-[var(--paper-border-subtle)] p-6 rounded-xl bg-[var(--paper-desk)]/30 font-serif-novel text-xs space-y-4">
                <div className="text-right text-[10px] font-mono text-[var(--ink-muted)]">
                  Vance Marlowe<br />
                  contact@vancemarlowe.com<br />
                  Approx. 85,000 Words
                </div>

                <div className="py-8 text-center space-y-2">
                  <h3 className="text-xl font-bold uppercase tracking-wider text-[var(--ink-primary)]">
                    ECHOES OF THE CHANNEL
                  </h3>
                  <p className="text-xs italic text-[var(--ink-secondary)]">A Novel of Intrigue</p>
                  <p className="text-xs font-semibold text-[var(--ink-primary)] pt-1">By Vance Marlowe</p>
                </div>

                <div className="border-t border-dashed border-[var(--paper-border)] pt-4 text-center">
                  <span className="text-[10px] uppercase font-mono text-[var(--amber-accent)] font-bold">
                    --- Page Break ---
                  </span>
                </div>

                <div className="pt-2">
                  <h4 className="font-bold text-center text-sm text-[var(--ink-primary)]">
                    Chapter 1: The Quay at Midnight
                  </h4>
                  <p className="indent-6 leading-loose text-justify text-[11px] text-[var(--ink-secondary)] pt-3">
                    The fog lay heavy over St. Jude's basin, curling against the rotting pilings of Pier 44 like cold grease. Vance Marlowe pulled his trench coat tighter against the November chill, his collar turned high.
                  </p>
                </div>
              </div>

              {/* Export format tags */}
              <div className="flex flex-wrap items-center justify-between text-xs text-[var(--ink-muted)] pt-2 border-t border-[var(--paper-border-subtle)]">
                <span>Also exports: <strong>.md</strong>, <strong>.txt</strong>, <strong>.html</strong></span>
                <span className="font-mono text-[10px] text-emerald-600 font-semibold">100% Offline Generation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
