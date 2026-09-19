import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Globe,
  Plus,
  Search,
  BookOpen,
  Edit2,
  Trash2,
  Calendar,
  Sparkles,
  Landmark,
  Cpu,
  Shield,
  Sun,
  Map,
  Scale,
  Scroll,
} from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import { worldbuildingService } from '../../../services/worldbuildingService';
import {
  CreateWorldbuildingInput,
  UpdateWorldbuildingInput,
  WorldbuildingCategory,
  WorldbuildingEntry,
} from '../../../types/worldbuilding';
import { WorldbuildingFormModal } from './WorldbuildingFormModal';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  All: Globe,
  History: Scroll,
  Culture: Landmark,
  'Magic System': Sparkles,
  Technology: Cpu,
  Factions: Shield,
  Religion: Sun,
  Geography: Map,
  'Lore & Rules': Scale,
  General: BookOpen,
};

export const WorldbuildingWorkspace: React.FC = () => {
  const { currentProject } = useProject();
  const [entries, setEntries] = useState<WorldbuildingEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<WorldbuildingCategory>('All');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WorldbuildingEntry | null>(null);

  const loadEntries = useCallback(async () => {
    if (!currentProject) return;
    try {
      setLoading(true);
      const list = await worldbuildingService.getEntries(currentProject.id);
      setEntries(list);
      if (list.length > 0 && !selectedEntryId) {
        setSelectedEntryId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load worldbuilding entries:', err);
    } finally {
      setLoading(false);
    }
  }, [currentProject, selectedEntryId]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: entries.length };
    entries.forEach((e) => {
      counts[e.category] = (counts[e.category] || 0) + 1;
    });
    return counts;
  }, [entries]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const matchesCat =
        selectedCategory === 'All' ||
        e.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        searchQuery.trim() === '' ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.tags && e.tags.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [entries, selectedCategory, searchQuery]);

  const activeEntry = useMemo(() => {
    return entries.find((e) => e.id === selectedEntryId) || filteredEntries[0] || null;
  }, [entries, selectedEntryId, filteredEntries]);

  const handleSaveEntry = async (
    input: CreateWorldbuildingInput | UpdateWorldbuildingInput,
    isEdit: boolean,
  ) => {
    if (isEdit && editingEntry) {
      const updated = await worldbuildingService.updateEntry(
        editingEntry.id,
        input as UpdateWorldbuildingInput,
      );
      setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      setSelectedEntryId(updated.id);
    } else {
      const created = await worldbuildingService.createEntry(
        input as CreateWorldbuildingInput,
      );
      setEntries((prev) => [created, ...prev]);
      setSelectedEntryId(created.id);
    }
  };

  const handleDeleteEntry = async (entry: WorldbuildingEntry) => {
    if (window.confirm(`Delete worldbuilding article '${entry.title}'?`)) {
      await worldbuildingService.deleteEntry(entry.id);
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
      if (selectedEntryId === entry.id) {
        setSelectedEntryId(null);
      }
    }
  };

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-[var(--ink-muted)]">
        Please select or open a project first.
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[var(--paper-bg)]">
      {/* 1. Category Nav Column */}
      <div className="w-56 border-r border-[var(--paper-border)] bg-[var(--paper-desk)] flex flex-col justify-between shrink-0 p-3 select-none">
        <div className="space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)] flex items-center justify-between">
            <span>Story Bible</span>
            <span className="font-mono">{entries.length}</span>
          </div>

          <nav className="space-y-0.5">
            {(
              [
                'All',
                'History',
                'Culture',
                'Magic System',
                'Technology',
                'Factions',
                'Religion',
                'Geography',
                'Lore & Rules',
                'General',
              ] as const
            ).map((cat) => {
              const Icon = CATEGORY_ICONS[cat] || Globe;
              const count = categoryCounts[cat] || 0;
              const isActive = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[var(--paper-surface)] text-[var(--amber-accent)] border border-[var(--paper-border-subtle)] font-bold shadow-2xs'
                      : 'text-[var(--ink-secondary)] hover:bg-[var(--paper-desk-hover)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-[var(--amber-accent)]' : 'text-[var(--ink-muted)]'
                      }`}
                    />
                    <span className="truncate">{cat}</span>
                  </div>
                  {count > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--paper-surface)] border border-[var(--paper-border)] text-[var(--ink-muted)]">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <button
          onClick={() => {
            setEditingEntry(null);
            setIsFormOpen(true);
          }}
          className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-[var(--amber-accent)] text-stone-900 text-xs font-semibold hover:brightness-105 transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Article</span>
        </button>
      </div>

      {/* 2. Article List Column */}
      <div className="w-72 border-r border-[var(--paper-border)] bg-[var(--paper-surface)] flex flex-col shrink-0">
        {/* Search */}
        <div className="p-3 border-b border-[var(--paper-border)]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[var(--ink-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entries..."
              className="w-full pl-8 pr-2.5 py-1 text-xs rounded-md border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] placeholder-[var(--ink-muted)] focus:outline-hidden focus:border-[var(--amber-accent)]"
            />
          </div>
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--paper-border)]">
          {loading ? (
            <div className="p-6 text-center text-xs text-[var(--ink-muted)]">
              Loading lore articles...
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--ink-muted)] space-y-2">
              <p>No articles found.</p>
              <button
                onClick={() => {
                  setEditingEntry(null);
                  setIsFormOpen(true);
                }}
                className="text-[var(--amber-accent)] hover:underline font-semibold"
              >
                + Write new article
              </button>
            </div>
          ) : (
            filteredEntries.map((item) => {
              const isSelected = activeEntry?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedEntryId(item.id)}
                  className={`p-3.5 cursor-pointer transition-colors space-y-1 ${
                    isSelected
                      ? 'bg-[var(--paper-desk)] border-l-3 border-[var(--amber-accent)]'
                      : 'hover:bg-[var(--paper-desk-hover)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--amber-accent)] font-semibold">
                      {item.category}
                    </span>
                    <span className="text-[10px] text-[var(--ink-muted)] flex items-center space-x-1">
                      <Calendar className="w-2.5 h-2.5" />
                      <span>{new Date(item.updated_at).toLocaleDateString()}</span>
                    </span>
                  </div>
                  <h4 className="font-serif-novel text-xs font-bold text-[var(--ink-primary)] truncate">
                    {item.title}
                  </h4>
                  {item.content && (
                    <p className="text-[11px] text-[var(--ink-muted)] line-clamp-2 leading-relaxed">
                      {item.content}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. Detail Article Reader / Editor Pane */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--paper-bg)]">
        {activeEntry ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Reader Header Toolbar */}
            <div className="h-12 border-b border-[var(--paper-border)] bg-[var(--paper-surface)] px-6 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border font-mono bg-[var(--amber-soft)] border-[var(--amber-soft-border)] text-[var(--amber-accent)]">
                  {activeEntry.category}
                </span>
                <span className="text-xs text-[var(--ink-muted)] font-mono">
                  {activeEntry.content.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => {
                    setEditingEntry(activeEntry);
                    setIsFormOpen(true);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-desk)] transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeleteEntry(activeEntry)}
                  className="p-1.5 rounded-md text-[var(--ink-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Prose Content Surface */}
            <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full space-y-6">
              <div>
                <h1 className="font-serif-novel text-3xl font-bold text-[var(--ink-primary)] tracking-tight">
                  {activeEntry.title}
                </h1>
                <div className="flex items-center space-x-4 mt-2 text-xs text-[var(--ink-muted)]">
                  <span>Category: {activeEntry.category}</span>
                  <span>•</span>
                  <span>Last edited: {new Date(activeEntry.updated_at).toLocaleString()}</span>
                </div>
              </div>

              {activeEntry.tags && (
                <div className="flex flex-wrap gap-1.5">
                  {activeEntry.tags
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-[var(--paper-desk)] border border-[var(--paper-border)] text-xs text-[var(--ink-muted)] font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                </div>
              )}

              {/* Prose Content */}
              <div className="prose prose-stone font-serif-novel text-[15px] leading-relaxed text-[var(--ink-primary)] whitespace-pre-wrap pt-4 border-t border-[var(--paper-border)]">
                {activeEntry.content || (
                  <span className="italic text-[var(--ink-muted)]">
                    This article has no content yet. Click &quot;Edit&quot; to begin writing lore notes.
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-[var(--ink-muted)]">
            Select an article from the list or create a new entry.
          </div>
        )}
      </div>

      {/* Article Create / Edit Modal */}
      <WorldbuildingFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        projectId={currentProject.id}
        defaultCategory={selectedCategory === 'All' ? 'General' : selectedCategory}
        editingEntry={editingEntry}
        onSubmit={handleSaveEntry}
      />
    </div>
  );
};
