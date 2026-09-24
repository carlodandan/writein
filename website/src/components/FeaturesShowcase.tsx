import React from 'react';
import {
  FolderTree,
  Network,
  BookOpen,
  Calendar,
  FileCheck2,
  EyeOff,
  Target,
  Database,
  Lock,
  Search,
  History,
  FileArchive
} from 'lucide-react';

export const FeaturesShowcase: React.FC = () => {
  const features = [
    {
      icon: FolderTree,
      title: 'Manuscript Hierarchy & Binder',
      category: 'Structure',
      desc: 'Organize your novel into Acts, Chapters, and Scenes. Reorder sections with fluid drag-and-drop, track progress states (Idea, Outline, Draft, Revised, Final), and watch word counts roll up in real-time.',
      badge: 'Binder',
    },
    {
      icon: Network,
      title: 'Infinite Relationship Web',
      category: 'Story Bible',
      desc: 'Map out deep character networks on an infinite pan & zoom canvas. Draw color-coded connection lines for alliances, rivalries, love interests, family lines, and organizational affiliations.',
      badge: 'Visual Graph',
    },
    {
      icon: FileCheck2,
      title: 'MS Word (.docx) Industry Compiler',
      category: 'Export',
      desc: 'Export publisher-ready manuscripts formatted strictly to industry guidelines: 1-inch margins, 12pt Times New Roman, 1.5 line spacing, 0.5-inch paragraph indents, title page front-matter, and scene breaks.',
      badge: 'Office Open XML',
    },
    {
      icon: BookOpen,
      title: 'Story Bible & World Lore',
      category: 'Worldbuilding',
      desc: 'Dossiers for characters, locations, factions, and historical lore. Link lore entries directly into your manuscript scenes with bidirectional backlinks.',
      badge: 'Encyclopedia',
    },
    {
      icon: Calendar,
      title: 'Narrative Chronology & Timelines',
      category: 'Plotting',
      desc: 'Chart your novel’s events chronologically. Pinpoint flashbacks, parallel subplots, and character timelines to avoid continuity plotholes across complex series.',
      badge: 'Timeline',
    },
    {
      icon: EyeOff,
      title: 'Distraction-Free Typewriter Desk',
      category: 'Writing Flow',
      desc: 'Immerse yourself in pure prose. Fullscreen typewriter scrolling keeps your active line centered while dimming surrounding UI chrome. Light and dark desk themes mimic tactile paper.',
      badge: 'Focus Mode',
    },
    {
      icon: Target,
      title: 'Writing Goals & Session Velocity',
      category: 'Productivity',
      desc: 'Set daily word targets, track writing velocity (words-per-minute), analyze session duration, and maintain productive writing habits with detailed session logs.',
      badge: 'Analytics',
    },
    {
      icon: Database,
      title: '100% Local SQLite & Data Sovereignty',
      category: 'Privacy',
      desc: 'Your writing is stored in a clean, self-contained SQLite database on your hard drive. Zero external cloud servers, zero telemetry, and zero chance of AI scraping your unpublished drafts.',
      badge: 'Local-First',
    },
    {
      icon: Search,
      title: 'Instant Global Search (Ctrl + K)',
      category: 'Navigation',
      desc: 'Blazing fast search across every scene, character note, lore article, and research scrap in milliseconds. Jump between documents without taking your hands off the keyboard.',
      badge: 'Quick Switcher',
    },
    {
      icon: History,
      title: 'Snapshots & Version History',
      category: 'Safety',
      desc: 'Capture complete manuscript snapshots before major revisions. Compare diffs side-by-side and safely restore earlier drafts whenever needed.',
      badge: 'Non-Destructive',
    },
    {
      icon: FileArchive,
      title: 'One-Click .writein Project Backups',
      category: 'Backup & Restore',
      desc: 'Export your entire project—manuscript, story bible, relationship graph, and settings—into a single compressed archive. Move effortlessly between desktop machines.',
      badge: 'Open Archives',
    },
    {
      icon: Lock,
      title: 'Zero Account & Zero Subscription',
      category: 'Independence',
      desc: 'No login required, no email collected, no subscription payments, and no software lockouts when your internet drops. Install WriteIn and own your workspace forever.',
      badge: 'Forever Free',
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-16">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--amber-accent)]">
            Built for Serious Storytellers
          </span>
          <h2 className="font-serif-novel text-3xl sm:text-5xl font-bold tracking-tight text-[var(--ink-primary)]">
            Everything your novel needs, none of the noise.
          </h2>
          <p className="text-sm sm:text-base text-[var(--ink-secondary)] leading-relaxed">
            From the first spark of an outline to final submission-ready Word manuscripts, WriteIn is purpose-engineered for authors who value depth, privacy, and craft.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl border border-[var(--paper-border)] bg-[var(--paper-surface)] hover:border-[var(--amber-accent)] transition-all hover:shadow-md flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[var(--paper-desk)] border border-[var(--paper-border-subtle)] flex items-center justify-center text-[var(--amber-accent)] group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--paper-desk)] text-[var(--ink-muted)]">
                      {feature.badge}
                    </span>
                  </div>

                  <h3 className="font-serif-novel text-lg font-bold text-[var(--ink-primary)]">
                    {feature.title}
                  </h3>

                  <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
                    {feature.desc}
                  </p>
                </div>

                <div className="pt-2 text-[11px] font-semibold text-[var(--amber-accent)] flex items-center space-x-1 opacity-80 group-hover:opacity-100">
                  <span>{feature.category}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
