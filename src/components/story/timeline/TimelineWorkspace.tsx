import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Clock,
  Plus,
  Search,
  ArrowUpDown,
  Filter,
  X,
} from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import { timelineService } from '../../../services/timelineService';
import { characterService } from '../../../services/characterService';
import { locationService } from '../../../services/locationService';
import { manuscriptService } from '../../../services/manuscriptService';
import {
  TimelineEvent,
  CreateTimelineEventInput,
  UpdateTimelineEventInput,
} from '../../../types/timeline';
import { Character } from '../../../types/character';
import { Location } from '../../../types/location';
import { ManuscriptNode } from '../../../types/manuscript';
import { TimelineEventCard } from './TimelineEventCard';
import { TimelineEventModal } from './TimelineEventModal';
import { TimelineDetailModal } from './TimelineDetailModal';
import { ActiveNavTab } from '../../layout/Sidebar';

interface TimelineWorkspaceProps {
  onNavigateTab?: (tab: ActiveNavTab, entityId?: string) => void;
  selectedEventId?: string | null;
}

export const TimelineWorkspace: React.FC<TimelineWorkspaceProps> = ({
  onNavigateTab,
  selectedEventId,
}) => {
  const { currentProject } = useProject();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Entities for links and filtering
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [chapters, setChapters] = useState<ManuscriptNode[]>([]);

  // Filtering & Sorting State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('all');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('all');
  const [selectedImportance, setSelectedImportance] = useState<string>('all');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modal States
  const [selectedEventForDetail, setSelectedEventForDetail] =
    useState<TimelineEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!currentProject) return;
    try {
      setLoading(true);
      const [eventsList, charsList, locsList, tree] = await Promise.all([
        timelineService.getEvents(currentProject.id, {
          sort_direction: sortDirection,
        }),
        characterService.getCharacters(currentProject.id),
        locationService.getLocations(currentProject.id),
        manuscriptService.getManuscriptTree(currentProject.id),
      ]);
      setEvents(eventsList);
      setCharacters(charsList);
      setLocations(locsList);
      setChapters(tree);

      if (selectedEventId) {
        const match = eventsList.find((e) => e.id === selectedEventId);
        if (match) {
          setSelectedEventForDetail(match);
        }
      }
    } catch (err) {
      console.error('Failed to load timeline workspace data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentProject, sortDirection, selectedEventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side filtering
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Search
      const matchesSearch =
        searchQuery.trim() === '' ||
        ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ev.description &&
          ev.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (ev.date_label &&
          ev.date_label.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (ev.date_value &&
          ev.date_value.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (ev.tags && ev.tags.toLowerCase().includes(searchQuery.toLowerCase()));

      // Character
      const matchesChar =
        selectedCharacterId === 'all' ||
        (ev.character_ids && ev.character_ids.includes(selectedCharacterId));

      // Location
      const matchesLoc =
        selectedLocationId === 'all' || ev.location_id === selectedLocationId;

      // Chapter
      const matchesChapter =
        selectedChapterId === 'all' || ev.related_chapter_id === selectedChapterId;

      // Importance
      const matchesImportance =
        selectedImportance === 'all' ||
        (ev.importance &&
          ev.importance.toLowerCase() === selectedImportance.toLowerCase());

      return (
        matchesSearch &&
        matchesChar &&
        matchesLoc &&
        matchesChapter &&
        matchesImportance
      );
    });
  }, [
    events,
    searchQuery,
    selectedCharacterId,
    selectedLocationId,
    selectedChapterId,
    selectedImportance,
  ]);

  // Save Event Handler
  const handleSaveEvent = async (
    input: CreateTimelineEventInput | UpdateTimelineEventInput,
    isEdit: boolean,
  ) => {
    if (isEdit && editingEvent) {
      const updated = await timelineService.updateEvent(
        editingEvent.id,
        input as UpdateTimelineEventInput,
      );
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      if (selectedEventForDetail?.id === updated.id) {
        setSelectedEventForDetail(updated);
      }
    } else {
      const created = await timelineService.createEvent(
        input as CreateTimelineEventInput,
      );
      if (sortDirection === 'desc') {
        setEvents((prev) => [created, ...prev]);
      } else {
        setEvents((prev) => [...prev, created]);
      }
    }
  };

  // Delete Event Handler
  const handleDeleteEvent = async (event: TimelineEvent) => {
    if (window.confirm(`Delete story event "${event.title}"?`)) {
      await timelineService.deleteEvent(event.id);
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
      if (selectedEventForDetail?.id === event.id) {
        setSelectedEventForDetail(null);
      }
    }
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCharacterId !== 'all' ||
    selectedLocationId !== 'all' ||
    selectedChapterId !== 'all' ||
    selectedImportance !== 'all';

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCharacterId('all');
    setSelectedLocationId('all');
    setSelectedChapterId('all');
    setSelectedImportance('all');
  };

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-[var(--ink-muted)]">
        Please select or open a project first.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--paper-bg)]">
      {/* Top Header & Action Controls */}
      <div className="p-4 border-b border-[var(--paper-border)] bg-[var(--paper-surface)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-[var(--paper-desk)] border border-[var(--paper-border-subtle)] text-[var(--amber-accent)]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--ink-primary)] font-serif-novel">
                Story Timeline & Chronology
              </h1>
              <p className="text-xs text-[var(--ink-muted)]">
                Track fictional dates, key plot turns, character movements, and narrative pacing
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Sort order toggle */}
            <button
              onClick={() =>
                setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
              }
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[var(--paper-border)] hover:bg-[var(--paper-desk)] text-xs text-[var(--ink-secondary)] transition-colors"
              title={`Sorting: ${sortDirection === 'asc' ? 'Chronological (Oldest First)' : 'Reverse Chronological (Newest First)'}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-[var(--amber-accent)]" />
              <span className="capitalize">
                {sortDirection === 'asc' ? 'Oldest First' : 'Newest First'}
              </span>
            </button>

            {/* Add event button */}
            <button
              onClick={() => {
                setEditingEvent(null);
                setIsEventModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--amber-accent)] hover:bg-[var(--amber-accent)]/90 text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Event</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {/* Search box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-[var(--ink-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search event title, description, date..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-desk)] text-[var(--ink-primary)] placeholder-[var(--ink-muted)] focus:outline-hidden focus:border-[var(--amber-accent)]"
            />
          </div>

          {/* Character filter */}
          <select
            value={selectedCharacterId}
            onChange={(e) => setSelectedCharacterId(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-desk)] text-[var(--ink-secondary)] focus:outline-hidden"
          >
            <option value="all">All Characters</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Location filter */}
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-desk)] text-[var(--ink-secondary)] focus:outline-hidden"
          >
            <option value="all">All Locations</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>

          {/* Importance filter */}
          <select
            value={selectedImportance}
            onChange={(e) => setSelectedImportance(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-desk)] text-[var(--ink-secondary)] focus:outline-hidden"
          >
            <option value="all">All Importance</option>
            <option value="critical">Critical</option>
            <option value="high">Major</option>
            <option value="normal">Normal</option>
            <option value="low">Background</option>
          </select>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-900 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area: Vertical Chronological Spine */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl w-full mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-[var(--ink-muted)]">
            <div className="w-5 h-5 border-2 border-[var(--amber-accent)] border-t-transparent rounded-full animate-spin mr-2" />
            Loading timeline events...
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-[var(--paper-surface)] border border-dashed border-[var(--paper-border)] rounded-2xl p-8">
            <Clock className="w-12 h-12 text-[var(--ink-muted)] mx-auto mb-3 opacity-30" />
            <h3 className="text-base font-semibold text-[var(--ink-primary)]">
              No timeline events yet.
            </h3>
            <p className="text-xs text-[var(--ink-muted)] mt-1.5 max-w-md mx-auto leading-relaxed">
              Create your first story event to begin building your timeline.
            </p>
            <button
              onClick={() => {
                setEditingEvent(null);
                setIsEventModalOpen(true);
              }}
              className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[var(--amber-accent)] hover:bg-[var(--amber-accent)]/90 text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Event</span>
            </button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 text-[var(--ink-muted)]">
            <Filter className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No events match your active filters</p>
            <button
              onClick={handleClearFilters}
              className="mt-2 text-xs text-[var(--amber-accent)] hover:underline font-medium"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="relative pl-2">
            {filteredEvents.map((event, index) => (
              <TimelineEventCard
                key={event.id}
                event={event}
                isLast={index === filteredEvents.length - 1}
                onSelect={(ev) => setSelectedEventForDetail(ev)}
                onEdit={(ev) => {
                  setEditingEvent(ev);
                  setIsEventModalOpen(true);
                }}
                onDelete={handleDeleteEvent}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <TimelineEventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
        event={editingEvent}
        projectId={currentProject.id}
        characters={characters}
        locations={locations}
        chapters={chapters}
      />

      <TimelineDetailModal
        isOpen={!!selectedEventForDetail}
        onClose={() => setSelectedEventForDetail(null)}
        event={selectedEventForDetail}
        onEdit={(ev) => {
          setEditingEvent(ev);
          setIsEventModalOpen(true);
        }}
        onDelete={handleDeleteEvent}
        onNavigateTab={onNavigateTab}
      />
    </div>
  );
};
