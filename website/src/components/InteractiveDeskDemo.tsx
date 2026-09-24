import React, { useState } from 'react';
import {
  BookOpen,
  Users,
  Compass,
  FileCheck2,
  FolderTree,
  FileText,
  Clock,
  ChevronDown
} from 'lucide-react';

export const InteractiveDeskDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'editor' | 'canvas' | 'bible' | 'compile'>('editor');
  const [activeSceneId, setActiveSceneId] = useState<'scene-1' | 'scene-2'>('scene-1');
  const [sampleContent, setSampleContent] = useState<Record<string, string>>({
    'scene-1': `The fog lay heavy over St. Jude's basin, curling against the rotting pilings of Pier 44 like cold grease.

Vance Marlowe pulled his trench coat tighter against the November chill, his collar turned high. Beneath his fingertips, the brass casing of his pocket watch was warm—the only thing in this salt-choked district that was.

"He won't come, Marlowe," Katherine murmured from the shadows of the warehouse overhang. Her cigarette burned a tiny amber pinprick in the dark. "Blackwood knows every watchman between here and the customs house. If you blow the whistle now, the harbor swallows the ledger whole."

Marlowe didn't answer. He adjusted the sight line through the rain-spotted glass. A signal lantern flickered twice across the channel. The barge had cleared the shoals.`,
    'scene-2': `The warehouse was cavernous, smelling of burlap and roasted chicory. Stacks of crates reached toward the iron girders, stenciled with the black anchor of the Maritime Shipping Syndicate.

Marlowe stepped softly over the damp floorboards. In his hand, the small iron prybar was heavier than his service revolver, and far more dangerous to Blackwood's empire.

"Hold the lantern steady," he whispered.

"I am holding it steady," Katherine replied, though the amber ring of light trembled slightly against the cedar planks. "Hurry, Vance. The night patrol turns at two."`
  });

  const [activeDocxOption, setActiveDocxOption] = useState<'docx' | 'markdown' | 'txt'>('docx');

  // Word count computation
  const currentText = sampleContent[activeSceneId] || '';
  const wordCount = currentText.trim().split(/\s+/).filter(Boolean).length;
  const readTime = Math.ceil(wordCount / 220);

  return (
    <section id="demo" className="py-20 md:py-28 bg-[var(--paper-desk)] border-y border-[var(--paper-border)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Heading */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[var(--paper-surface)] border border-[var(--paper-border)] text-xs font-semibold text-[var(--amber-accent)] shadow-2xs">
            <span>Interactive Simulator</span>
          </div>
          <h2 className="font-serif-novel text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink-primary)]">
            Experience the Author's Desk
          </h2>
          <p className="text-sm sm:text-base text-[var(--ink-secondary)]">
            Test drive WriteIn right now in your browser. Switch views below to explore the manuscript binder, interactive character graph, and manuscript compiler.
          </p>
        </div>

        {/* View Switcher Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            { id: 'editor', label: 'Prose Editor & Binder', icon: BookOpen },
            { id: 'canvas', label: 'Character Relationship Web', icon: Users },
            { id: 'bible', label: 'Story Bible Dossiers', icon: Compass },
            { id: 'compile', label: 'Word (.docx) Compiler', icon: FileCheck2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--amber-accent)] text-white shadow-xs'
                    : 'bg-[var(--paper-surface)] hover:bg-[var(--paper-desk-hover)] text-[var(--ink-secondary)] border border-[var(--paper-border)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Interactive App Window Frame */}
        <div className="rounded-2xl border border-[var(--paper-border)] bg-[var(--paper-surface)] shadow-xl overflow-hidden transition-all">
          {/* Mock Window Titlebar */}
          <div className="px-4 py-3 bg-[var(--paper-desk)] border-b border-[var(--paper-border)] flex items-center justify-between select-none">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-red-400/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-400/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-400/80 inline-block" />
              <span className="text-xs font-mono font-medium text-[var(--ink-secondary)] ml-2">
                WriteIn — Echoes of the Channel [demo-novel-1]
              </span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-[var(--ink-muted)]">
              <span className="hidden sm:inline font-mono">100% Offline SQLite</span>
              <span className="px-2 py-0.5 rounded-md bg-[var(--paper-surface)] border border-[var(--paper-border)] text-[10px] uppercase font-bold text-[var(--amber-accent)]">
                Local-First
              </span>
            </div>
          </div>

          {/* Window Body by View */}
          <div className="min-h-[460px] flex flex-col md:flex-row">
            {/* VIEW 1: PROSE EDITOR & BINDER */}
            {activeTab === 'editor' && (
              <>
                {/* Left Mini Binder */}
                <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[var(--paper-border)] bg-[var(--paper-desk)]/50 p-4 space-y-3 shrink-0 select-none">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                    <span className="flex items-center space-x-1.5">
                      <FolderTree className="w-3.5 h-3.5" />
                      <span>Manuscript</span>
                    </span>
                    <span className="font-mono text-[10px]">{wordCount + 1420} words</span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center space-x-1 text-[var(--ink-primary)] font-semibold py-1">
                      <ChevronDown className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
                      <span>Act I: The Channel Fog</span>
                    </div>

                    <div className="pl-4 space-y-1">
                      <div className="flex items-center space-x-1 text-[var(--ink-secondary)] py-1 font-medium">
                        <ChevronDown className="w-3 h-3 text-[var(--ink-muted)]" />
                        <span>Chapter 1: The Quay</span>
                      </div>

                      <div className="pl-4 space-y-1">
                        <button
                          onClick={() => setActiveSceneId('scene-1')}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                            activeSceneId === 'scene-1'
                              ? 'bg-[var(--amber-soft)] text-[var(--amber-accent)] font-semibold border border-[var(--amber-soft-border)]'
                              : 'hover:bg-[var(--paper-desk-hover)] text-[var(--ink-secondary)]'
                          }`}
                        >
                          <div className="flex items-center space-x-1.5 truncate">
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Scene 1: Tide at Midnight</span>
                          </div>
                          <span className="text-[10px] font-mono opacity-80 shrink-0">Draft</span>
                        </button>

                        <button
                          onClick={() => setActiveSceneId('scene-2')}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                            activeSceneId === 'scene-2'
                              ? 'bg-[var(--amber-soft)] text-[var(--amber-accent)] font-semibold border border-[var(--amber-soft-border)]'
                              : 'hover:bg-[var(--paper-desk-hover)] text-[var(--ink-secondary)]'
                          }`}
                        >
                          <div className="flex items-center space-x-1.5 truncate">
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Scene 2: The Cedar Crates</span>
                          </div>
                          <span className="text-[10px] font-mono opacity-80 shrink-0">Outline</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Prose Editor */}
                <div className="flex-1 flex flex-col p-6 sm:p-8 bg-[var(--paper-surface)]">
                  {/* Scene Header */}
                  <div className="flex items-center justify-between border-b border-[var(--paper-border-subtle)] pb-4 mb-4">
                    <div>
                      <h3 className="font-serif-novel text-xl font-bold text-[var(--ink-primary)]">
                        {activeSceneId === 'scene-1' ? 'Scene 1: Tide at Midnight' : 'Scene 2: The Cedar Crates'}
                      </h3>
                      <p className="text-xs text-[var(--ink-muted)]">
                        Status: <span className="font-semibold text-[var(--amber-accent)]">Draft</span> • POV: Vance Marlowe
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 text-xs font-mono text-[var(--ink-muted)]">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{readTime} min read</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[var(--paper-desk)] border border-[var(--paper-border)] font-semibold text-[var(--ink-primary)]">
                        {wordCount} words
                      </span>
                    </div>
                  </div>

                  {/* Textarea Simulator */}
                  <textarea
                    value={sampleContent[activeSceneId]}
                    onChange={(e) =>
                      setSampleContent({
                        ...sampleContent,
                        [activeSceneId]: e.target.value,
                      })
                    }
                    rows={10}
                    className="w-full flex-1 font-serif-novel text-base leading-relaxed text-[var(--ink-primary)] bg-transparent resize-none border-none focus:outline-hidden selection:bg-[var(--amber-soft)]"
                    placeholder="Begin typing your manuscript scene here..."
                  />

                  {/* Footbar Status */}
                  <div className="pt-3 border-t border-[var(--paper-border-subtle)] flex items-center justify-between text-[11px] text-[var(--ink-muted)] font-mono">
                    <span>Autosaved to SQLite</span>
                    <span>Typewriter Scrolling: ON</span>
                  </div>
                </div>
              </>
            )}

            {/* VIEW 2: CHARACTER RELATIONSHIP WEB */}
            {activeTab === 'canvas' && (
              <div className="flex-1 p-8 bg-[var(--paper-surface)] flex flex-col items-center justify-center text-center space-y-6">
                <div className="max-w-xl space-y-2">
                  <h3 className="font-serif-novel text-2xl font-bold text-[var(--ink-primary)]">
                    Infinite Canvas Relationship Web
                  </h3>
                  <p className="text-xs text-[var(--ink-secondary)]">
                    Trace complex character webs across your story. Connect alliances, conflicts, love interests, and rivalries with interactive draggable nodes.
                  </p>
                </div>

                {/* Simulated Visual Graph */}
                <div className="relative w-full max-w-2xl h-72 border border-[var(--paper-border)] rounded-xl bg-grid-subtle flex items-center justify-center overflow-hidden">
                  {/* Connecting lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <line x1="25%" y1="50%" x2="50%" y2="25%" stroke="#C26100" strokeWidth="2" strokeDasharray="4 2" />
                    <line x1="50%" y1="25%" x2="75%" y2="50%" stroke="#DC2626" strokeWidth="2" />
                    <line x1="25%" y1="50%" x2="75%" y2="50%" stroke="#8C857B" strokeWidth="1.5" />
                  </svg>

                  {/* Nodes */}
                  <div className="absolute left-[15%] top-[40%] p-3 rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] shadow-md text-left w-36">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mb-1" />
                    <div className="font-bold text-xs text-[var(--ink-primary)]">Vance Marlowe</div>
                    <div className="text-[10px] text-[var(--ink-muted)]">Protagonist • Detective</div>
                  </div>

                  <div className="absolute left-[40%] top-[10%] p-3 rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] shadow-md text-left w-36">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mb-1" />
                    <div className="font-bold text-xs text-[var(--ink-primary)]">Katherine Bell</div>
                    <div className="text-[10px] text-[var(--ink-muted)]">Informant • Ally</div>
                  </div>

                  <div className="absolute right-[15%] top-[40%] p-3 rounded-xl border border-[var(--paper-border)] bg-[var(--paper-surface)] shadow-md text-left w-36">
                    <div className="w-2 h-2 rounded-full bg-red-500 mb-1" />
                    <div className="font-bold text-xs text-[var(--ink-primary)]">Lord Blackwood</div>
                    <div className="text-[10px] text-[var(--ink-muted)]">Antagonist • Syndicate</div>
                  </div>

                  <div className="absolute bottom-3 left-4 text-[11px] font-mono text-[var(--ink-muted)]">
                    Endless Pan & Zoom Canvas
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 3: STORY BIBLE */}
            {activeTab === 'bible' && (
              <div className="flex-1 p-8 bg-[var(--paper-surface)] space-y-6">
                <div className="border-b border-[var(--paper-border-subtle)] pb-4">
                  <h3 className="font-serif-novel text-2xl font-bold text-[var(--ink-primary)]">
                    The Story Bible & Lore Dossiers
                  </h3>
                  <p className="text-xs text-[var(--ink-muted)]">
                    Keep characters, settings, worldbuilding lore, and historical timelines synchronized with your prose.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-[var(--paper-border)] bg-[var(--paper-desk)]/50 space-y-2">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[var(--paper-surface)] border border-[var(--paper-border)] font-bold text-[var(--amber-accent)]">
                      Character Dossier
                    </span>
                    <h4 className="font-serif-novel font-bold text-base text-[var(--ink-primary)]">
                      Vance Marlowe
                    </h4>
                    <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
                      Former harbor patrolman turned private investigator. Smokes Turkish leaf, carries a damaged pocket watch from the 1937 strike.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-[var(--paper-border)] bg-[var(--paper-desk)]/50 space-y-2">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[var(--paper-surface)] border border-[var(--paper-border)] font-bold text-blue-600">
                      Location Setting
                    </span>
                    <h4 className="font-serif-novel font-bold text-base text-[var(--ink-primary)]">
                      Pier 44 & Harbor Basin
                    </h4>
                    <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
                      Salt-crusted timber docks guarded by the Maritime Syndicate. Fog is heaviest between 01:00 and 04:00 high tide.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-[var(--paper-border)] bg-[var(--paper-desk)]/50 space-y-2">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[var(--paper-surface)] border border-[var(--paper-border)] font-bold text-emerald-600">
                      Lore / Worldbuilding
                    </span>
                    <h4 className="font-serif-novel font-bold text-base text-[var(--ink-primary)]">
                      The Strike of 1937
                    </h4>
                    <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
                      The forty-day harbor standoff that resulted in Blackwood seizing municipal control over the customs registry.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 4: COMPILER PREVIEW */}
            {activeTab === 'compile' && (
              <div className="flex-1 p-8 bg-[var(--paper-surface)] space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--paper-border-subtle)] pb-4">
                  <div>
                    <h3 className="font-serif-novel text-2xl font-bold text-[var(--ink-primary)]">
                      Manuscript Compiler Output
                    </h3>
                    <p className="text-xs text-[var(--ink-muted)]">
                      Standard industry submission formatting with 1-click export.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {(['docx', 'markdown', 'txt'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setActiveDocxOption(fmt)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          activeDocxOption === fmt
                            ? 'bg-[var(--amber-accent)] text-white'
                            : 'bg-[var(--paper-desk)] text-[var(--ink-secondary)] border border-[var(--paper-border)]'
                        }`}
                      >
                        .{fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mock Word Sheet */}
                <div className="max-w-xl mx-auto p-8 rounded-xl border border-[var(--paper-border)] bg-[var(--paper-desk)]/30 font-serif-novel text-xs text-[var(--ink-primary)] space-y-4 shadow-xs">
                  <div className="text-center space-y-1 border-b border-[var(--paper-border-subtle)] pb-4">
                    <h2 className="text-lg font-bold uppercase tracking-wider">ECHOES OF THE CHANNEL</h2>
                    <p className="text-xs italic text-[var(--ink-muted)]">A Novel by Vance Marlowe</p>
                    <p className="text-[10px] font-mono text-[var(--ink-muted)]">Approx. 84,200 Words • Standard Manuscript Format</p>
                  </div>

                  <div className="text-center font-bold text-sm pt-2">Chapter 1: The Quay</div>

                  <p className="indent-8 leading-loose text-justify text-[13px]">
                    The fog lay heavy over St. Jude's basin, curling against the rotting pilings of Pier 44 like cold grease. Vance Marlowe pulled his trench coat tighter against the November chill, his collar turned high. Beneath his fingertips, the brass casing of his pocket watch was warm—the only thing in this salt-choked district that was.
                  </p>

                  <div className="text-center text-xs tracking-widest text-[var(--ink-muted)] py-2">
                    * * *
                  </div>

                  <p className="indent-8 leading-loose text-justify text-[13px]">
                    The warehouse was cavernous, smelling of burlap and roasted chicory. Stacks of crates reached toward the iron girders, stenciled with the black anchor of the Maritime Syndicate.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
