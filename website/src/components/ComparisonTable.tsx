import React from 'react';
import { Check, X } from 'lucide-react';

export const ComparisonTable: React.FC = () => {
  const features = [
    {
      name: 'Offline-First & No Account Required',
      writein: true,
      scrivener: true,
      ulysses: false,
      docs: false,
    },
    {
      name: 'Infinite Visual Character Relationship Web',
      writein: true,
      scrivener: false,
      ulysses: false,
      docs: false,
    },
    {
      name: 'Story Bible & World Lore Encyclopedia',
      writein: true,
      scrivener: 'Partial (Folder Notes)',
      ulysses: false,
      docs: false,
    },
    {
      name: 'Narrative Chronology & Event Timelines',
      writein: true,
      scrivener: false,
      ulysses: false,
      docs: false,
    },
    {
      name: 'One-Click Standard MS Word (.docx) Compile',
      writein: true,
      scrivener: 'Complex Setup',
      ulysses: true,
      docs: 'Manual Styling',
    },
    {
      name: 'Distraction-Free Typewriter Scrolling',
      writein: true,
      scrivener: true,
      ulysses: true,
      docs: false,
    },
    {
      name: 'Zero Cloud Telemetry & AI Scraping',
      writein: true,
      scrivener: true,
      ulysses: 'Cloud Dependent',
      docs: 'Cloud & AI Scraping',
    },
    {
      name: 'Modern Lightweight Desktop (Tauri + Rust)',
      writein: true,
      scrivener: false,
      ulysses: false,
      docs: false,
    },
    {
      name: 'Pricing & Licensing',
      writein: '100% Free & Open',
      scrivener: '$59.99 per OS',
      ulysses: '$49.99 / year',
      docs: 'Word: Paid (Microsoft 365); Google Docs: Free for personal use',
    },
  ];

  const renderValue = (val: boolean | string, isWriteIn = false) => {
    if (val === true) {
      return (
        <div className="flex items-center justify-center">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isWriteIn ? 'bg-[var(--amber-soft)] text-[var(--amber-accent)]' : 'bg-emerald-500/20 text-emerald-600'}`}>
            <Check aria-hidden="true" className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <span className="sr-only">Yes</span>
        </div>
      );
    }
    if (val === false) {
      return (
        <div className="flex items-center justify-center">
          <div className="w-5 h-5 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
            <X aria-hidden="true" className="w-3.5 h-3.5" />
          </div>
          <span className="sr-only">No</span>
        </div>
      );
    }
    return (
      <span className={`text-xs font-semibold ${isWriteIn ? 'text-[var(--amber-accent)]' : 'text-[var(--ink-secondary)]'}`}>
        {val}
      </span>
    );
  };

  return (
    <section id="compare" className="py-20 md:py-28 bg-[var(--paper-desk)] border-y border-[var(--paper-border)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--amber-accent)]">
            Transparent Comparison
          </span>
          <h2 className="font-serif-novel text-3xl sm:text-5xl font-bold tracking-tight text-[var(--ink-primary)]">
            How WriteIn Compares
          </h2>
          <p className="text-sm sm:text-base text-[var(--ink-secondary)]">
            See how WriteIn delivers the deep organizational features of dedicated novel suites without subscription fees or cloud fragility.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[var(--paper-border)] bg-[var(--paper-surface)] shadow-md">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-[var(--paper-border)] bg-[var(--paper-desk)]/50 text-xs uppercase font-bold text-[var(--ink-muted)]">
                <th className="py-4 px-6 w-1/3">Capability</th>
                <th className="py-4 px-4 text-center bg-[var(--amber-soft)]/50 text-[var(--amber-accent)] font-extrabold w-1/6">
                  WriteIn
                </th>
                <th className="py-4 px-4 text-center w-1/6">Scrivener</th>
                <th className="py-4 px-4 text-center w-1/6">Ulysses</th>
                <th className="py-4 px-4 text-center w-1/6">Word / Docs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--paper-border-subtle)] text-xs text-[var(--ink-secondary)]">
              {features.map((row, i) => (
                <tr key={i} className="hover:bg-[var(--paper-desk)]/30 transition-colors">
                  <th scope="row" className="py-3.5 px-6 font-medium text-[var(--ink-primary)]">
                    {row.name}
                  </th>
                  <td className="py-3.5 px-4 text-center bg-[var(--amber-soft)]/20 font-bold">
                    {renderValue(row.writein, true)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {renderValue(row.scrivener)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {renderValue(row.ulysses)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {renderValue(row.docs)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
