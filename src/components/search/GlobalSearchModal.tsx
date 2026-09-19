import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  BookOpen,
  Users,
  MapPin,
  Globe,
  Clock,
  StickyNote,
  Tag,
  X,
  FileText,
  CornerDownLeft,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { searchService } from '../../services/searchService';
import { SearchResultItem } from '../../types/search';
import { ActiveNavTab } from '../layout/Sidebar';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: ActiveNavTab, entityId?: string) => void;
}

const ENTITY_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string; badgeBg: string }
> = {
  manuscript: {
    label: 'Manuscript',
    icon: BookOpen,
    color: 'text-sky-600 dark:text-sky-400',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  chapter: {
    label: 'Chapter',
    icon: FileText,
    color: 'text-sky-600 dark:text-sky-400',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  character: {
    label: 'Character',
    icon: Users,
    color: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  location: {
    label: 'Location',
    icon: MapPin,
    color: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  worldbuilding: {
    label: 'Worldbuilding',
    icon: Globe,
    color: 'text-indigo-600 dark:text-indigo-400',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
  timeline: {
    label: 'Timeline',
    icon: Clock,
    color: 'text-orange-600 dark:text-orange-400',
    badgeBg: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  },
  note: {
    label: 'Note',
    icon: StickyNote,
    color: 'text-violet-600 dark:text-violet-400',
    badgeBg: 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800',
  },
  tag: {
    label: 'Tag',
    icon: Tag,
    color: 'text-rose-600 dark:text-rose-400',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  },
};

import { highlightMatch } from '../../utils/textHighlight';

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { currentProject } = useProject();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTypeFilter('all');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!isOpen || !currentProject) return;

    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await searchService.search(currentProject.id, query.trim());
        setResults(res.items || []);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Failed to run global search:', err);
      } finally {
        setLoading(false);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [query, isOpen, currentProject]);

  // Counts per category
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: results.length };
    for (const r of results) {
      const t = r.entity_type.toLowerCase();
      counts[t] = (counts[t] || 0) + 1;
    }
    return counts;
  }, [results]);

  // Filtered results
  const filteredResults = useMemo(() => {
    if (typeFilter === 'all') return results;
    return results.filter(
      (r) => r.entity_type.toLowerCase() === typeFilter.toLowerCase(),
    );
  }, [results, typeFilter]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredResults.length > 0 ? (prev + 1) % filteredResults.length : 0,
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredResults.length > 0
            ? (prev - 1 + filteredResults.length) % filteredResults.length
            : 0,
        );
      } else if (e.key === 'Enter') {
        if (filteredResults[selectedIndex]) {
          e.preventDefault();
          const item = filteredResults[selectedIndex];
          onNavigate(item.target_tab as ActiveNavTab, item.target_id);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredResults, selectedIndex, onClose, onNavigate]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(
        `[data-index="${selectedIndex}"]`,
      ) as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-[var(--paper-surface)] rounded-xl shadow-2xl border border-[var(--paper-border)] overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-[var(--paper-border)] bg-[var(--paper-desk)]">
          <Search className="w-5 h-5 text-[var(--ink-muted)] shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chapters, characters, locations, lore, timeline, notes..."
            className="flex-1 bg-transparent border-none text-base text-[var(--ink-primary)] placeholder-[var(--ink-muted)] focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] rounded-md mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-2 py-0.5 text-xs font-mono bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded text-[var(--ink-muted)]">
            ESC
          </kbd>
        </div>

        {/* Filter Pills with Counts */}
        <div className="flex items-center space-x-1.5 px-4 py-2 bg-[var(--paper-surface)] border-b border-[var(--paper-border-subtle)] overflow-x-auto text-xs">
          <span className="text-[var(--ink-muted)] mr-1 font-medium">Filter:</span>
          {[
            { id: 'all', label: 'All' },
            { id: 'manuscript', label: 'Manuscript' },
            { id: 'character', label: 'Characters' },
            { id: 'location', label: 'Locations' },
            { id: 'worldbuilding', label: 'World' },
            { id: 'timeline', label: 'Timeline' },
            { id: 'note', label: 'Notes' },
          ].map((f) => {
            const isActive = typeFilter === f.id;
            const count = typeCounts[f.id] || 0;

            return (
              <button
                key={f.id}
                onClick={() => {
                  setTypeFilter(f.id);
                  setSelectedIndex(0);
                }}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md transition-colors ${
                  isActive
                    ? 'bg-[var(--amber-accent)] text-white font-medium shadow-2xs'
                    : 'bg-[var(--paper-desk)] text-[var(--ink-secondary)] hover:bg-[var(--paper-desk-hover)]'
                }`}
              >
                <span>{f.label}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[var(--paper-surface)] text-[var(--ink-muted)] border border-[var(--paper-border-subtle)]'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[220px]"
        >
          {loading && (
            <div className="flex items-center justify-center py-12 text-sm text-[var(--ink-muted)]">
              <div className="w-4 h-4 border-2 border-[var(--amber-accent)] border-t-transparent rounded-full animate-spin mr-2" />
              Searching project...
            </div>
          )}

          {!loading && query.trim() === '' && (
            <div className="text-center py-12 text-[var(--ink-muted)]">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium text-[var(--ink-secondary)]">
                Search your entire novel workspace
              </p>
              <p className="text-xs text-[var(--ink-muted)] mt-1">
                Quickly locate scenes, characters, world lore, chronology, or notes
              </p>
            </div>
          )}

          {!loading && query.trim() !== '' && filteredResults.length === 0 && (
            <div className="text-center py-12 px-4 text-[var(--ink-muted)]">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30 text-[var(--ink-muted)]" />
              <p className="text-sm font-semibold text-[var(--ink-primary)]">
                No results for &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-[var(--ink-muted)] mt-1 max-w-sm mx-auto leading-relaxed">
                Check spelling or try a broader keyword across chapters, characters, locations, or notes.
              </p>
            </div>
          )}

          {!loading &&
            filteredResults.map((item, index) => {
              const config = ENTITY_CONFIG[item.entity_type] || {
                label: item.entity_type,
                icon: FileText,
                color: 'text-[var(--ink-secondary)]',
                badgeBg: 'bg-[var(--paper-desk)] text-[var(--ink-secondary)] border-[var(--paper-border)]',
              };
              const Icon = config.icon;
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={`${item.entity_type}-${item.id}-${index}`}
                  data-index={index}
                  onClick={() => {
                    onNavigate(item.target_tab as ActiveNavTab, item.target_id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-start justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[var(--paper-desk-hover)] ring-1 ring-[var(--amber-accent)]/40 shadow-2xs'
                      : 'hover:bg-[var(--paper-desk)]'
                  }`}
                >
                  <div className="flex items-start space-x-3 min-w-0 flex-1">
                    <div
                      className={`mt-0.5 p-1.5 rounded-md bg-[var(--paper-surface)] border border-[var(--paper-border-subtle)] ${config.color}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-[var(--ink-primary)] truncate">
                          {highlightMatch(item.title, query)}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${config.badgeBg}`}
                        >
                          {config.label}
                        </span>
                      </div>

                      {item.subtitle && (
                        <p className="text-xs text-[var(--ink-muted)] truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}

                      {item.snippet && (
                        <p className="text-xs text-[var(--ink-secondary)] mt-1 line-clamp-2 bg-[var(--paper-desk)]/50 p-1.5 rounded border border-[var(--paper-border-subtle)] font-serif-novel text-[13px] leading-relaxed">
                          {highlightMatch(item.snippet, query)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="ml-3 shrink-0 self-center flex items-center text-[var(--ink-muted)]">
                    {isSelected && (
                      <div className="flex items-center text-xs text-[var(--amber-accent)] font-medium space-x-1">
                        <span>Open</span>
                        <CornerDownLeft className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-[var(--paper-desk)] border-t border-[var(--paper-border)] flex items-center justify-between text-[11px] text-[var(--ink-muted)]">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <kbd className="px-1 py-0.2 bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded text-[10px]">
                &uarr;&darr;
              </kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="px-1 py-0.2 bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded text-[10px]">
                Enter
              </kbd>
              <span>to open</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="px-1 py-0.2 bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded text-[10px]">
                Esc
              </kbd>
              <span>to close</span>
            </span>
          </div>

          <div>
            {filteredResults.length > 0 && (
              <span>
                {filteredResults.length} result{filteredResults.length === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
