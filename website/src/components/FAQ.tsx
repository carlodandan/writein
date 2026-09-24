import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Is WriteIn completely free? Are there subscriptions or trial limits?',
      a: 'Yes, WriteIn is 100% free with zero subscriptions, zero paywalls, and no feature gates. You have unlimited projects, unlimited words, unlimited character web graphs, and full manuscript compiling forever.',
    },
    {
      q: 'Where is my writing stored on my computer?',
      a: 'Each novel project is stored inside your local Windows AppData directory as a self-contained SQLite database file (%APPDATA%/WriteIn/projects/{id}/). Your files never leave your computer.',
    },
    {
      q: 'Which operating systems does WriteIn support?',
      a: 'WriteIn is purpose-built exclusively for Windows desktop (Windows 10 and Windows 11, 64-bit). It leverages native Windows WebView2 and deep OS integrations like custom URI protocols (writein://) and native Windows Explorer file reveals.',
    },
    {
      q: 'How does the Microsoft Word (.docx) compile feature work?',
      a: 'WriteIn compiles your modular binder chapters and scenes into a single .docx file adhering to industry-standard manuscript format: 1-inch margins, 12pt Times New Roman, 1.5 line spacing, 0.5-inch paragraph indentation, front-matter title page, table of contents, and scene dividers (* * *). It opens natively in Microsoft Word, LibreOffice, and Google Docs.',
    },
    {
      q: 'What is the writein:// deep link protocol?',
      a: 'When you install WriteIn, the desktop application registers the writein:// custom protocol with your operating system. This allows you or external tools to launch WriteIn directly, trigger new project creation (writein://new), or jump straight into your manuscript workspace from a browser or script.',
    },
    {
      q: 'Can I import existing text or Markdown files into WriteIn?',
      a: 'Yes! WriteIn features an intelligent Manuscript Importer that parses single files or paste buffers, automatically detects chapter headers (e.g., "Chapter 1", "Act II"), and organizes them into individual binder nodes in your manuscript tree.',
    },
    {
      q: 'Can I sync my projects between multiple computers?',
      a: 'Because WriteIn uses local SQLite databases and offers one-click .writein portable backup archives, you can easily synchronize your project directory or backup archives across computers using your preferred local sync tools like Syncthing, OneDrive, or Dropbox.',
    },
    {
      q: 'Does WriteIn send any data to external servers or AI providers?',
      a: 'None whatsoever. WriteIn has zero telemetry, zero analytics tracking, and no external AI models connected to your private manuscript. Your prose is strictly yours.',
    },
  ];

  return (
    <section id="faq" className="py-20 md:py-28 bg-[var(--paper-desk)] border-y border-[var(--paper-border)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[var(--paper-surface)] border border-[var(--paper-border)] text-xs font-semibold text-[var(--amber-accent)] shadow-2xs">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Got Questions?</span>
          </div>
          <h2 className="font-serif-novel text-3xl sm:text-5xl font-bold tracking-tight text-[var(--ink-primary)]">
            Frequently Asked Questions
          </h2>
          <p className="text-sm sm:text-base text-[var(--ink-secondary)]">
            Everything you need to know about the WriteIn studio, architecture, and privacy.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="rounded-2xl border border-[var(--paper-border)] bg-[var(--paper-surface)] overflow-hidden transition-all shadow-xs"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full p-5 text-left flex items-center justify-between text-sm font-bold text-[var(--ink-primary)] hover:text-[var(--amber-accent)] transition-colors cursor-pointer"
                >
                  <span className="font-serif-novel text-base">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[var(--ink-muted)] shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 text-[var(--amber-accent)]' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-[var(--ink-secondary)] leading-relaxed border-t border-[var(--paper-border-subtle)] pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
