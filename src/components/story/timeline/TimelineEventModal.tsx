import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  AlertCircle,
  Check,
} from 'lucide-react';
import {
  TimelineEvent,
  CreateTimelineEventInput,
  UpdateTimelineEventInput,
  TimelineImportance,
} from '../../../types/timeline';
import { Character } from '../../../types/character';
import { Location } from '../../../types/location';
import { ManuscriptNode } from '../../../types/manuscript';
import { TagInput } from '../../common/TagInput';

interface TimelineEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    input: CreateTimelineEventInput | UpdateTimelineEventInput,
    isEdit: boolean,
  ) => Promise<void>;
  event: TimelineEvent | null;
  projectId: string;
  characters: Character[];
  locations: Location[];
  chapters: ManuscriptNode[];
}

export const TimelineEventModal: React.FC<TimelineEventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  event,
  projectId,
  characters,
  locations,
  chapters,
}) => {
  const [title, setTitle] = useState('');
  const [dateValue, setDateValue] = useState('');
  const [dateLabel, setDateLabel] = useState('');
  const [timeValue, timeSetTimeValue] = useState('');
  const [importance, setImportance] = useState<TimelineImportance>('normal');
  const [description, setDescription] = useState('');
  const [locationId, setLocationId] = useState<string>('');
  const [relatedChapterId, setRelatedChapterId] = useState<string>('');
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>([]);
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDateValue(event.date_value || event.event_date || '');
      setDateLabel(event.date_label || '');
      timeSetTimeValue(event.time_value || '');
      setImportance((event.importance as TimelineImportance) || 'normal');
      setDescription(event.description || '');
      setLocationId(event.location_id || '');
      setRelatedChapterId(event.related_chapter_id || '');
      setSelectedCharIds(event.character_ids || []);
      setTags(event.tags || '');
    } else {
      setTitle('');
      setDateValue('');
      setDateLabel('');
      timeSetTimeValue('');
      setImportance('normal');
      setDescription('');
      setLocationId('');
      setRelatedChapterId('');
      setSelectedCharIds([]);
      setTags('');
    }
    setError(null);
  }, [event, isOpen]);

  const toggleCharacter = (id: string) => {
    setSelectedCharIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Event title is required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const input: CreateTimelineEventInput | UpdateTimelineEventInput = {
        title: title.trim(),
        date_value: dateValue.trim() || null,
        date_label: dateLabel.trim() || null,
        time_value: timeValue.trim() || null,
        event_date: dateValue.trim() || null,
        importance,
        description: description.trim() || null,
        location_id: locationId || null,
        related_chapter_id: relatedChapterId || null,
        character_ids: selectedCharIds,
        tags: tags.trim() || null,
        ...(event ? {} : { project_id: projectId }),
      };

      await onSave(input, !!event);
      onClose();
    } catch (err: unknown) {
      console.error('Failed to save event:', err);
      setError(err instanceof Error ? err.message : 'Failed to save event.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-[var(--paper-surface)] rounded-xl shadow-xl border border-[var(--paper-border)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--paper-border)] bg-[var(--paper-desk)]">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-[var(--amber-accent)]" />
            <h2 className="text-base font-semibold text-[var(--ink-primary)]">
              {event ? 'Edit Timeline Event' : 'Add Story Event'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 text-sm flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink-secondary)] uppercase tracking-wider mb-1">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., The Bell Tower Conspiracy"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--paper-border)] bg-[var(--paper-desk)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
            />
          </div>

          {/* Fictional & Structured Dates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Display / Fantasy Date Label */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] uppercase tracking-wider mb-1">
                Story / Fantasy Date Label
              </label>
              <input
                type="text"
                value={dateLabel}
                onChange={(e) => setDateLabel(e.target.value)}
                placeholder="e.g., Year 12 — Frost 17 or Three Days Later"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--paper-border)] bg-[var(--paper-desk)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
              />
              <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                Display name shown in story spine and cards
              </p>
            </div>

            {/* Sort Order / Numerical Date */}
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] uppercase tracking-wider mb-1">
                Sort Key / Date
              </label>
              <input
                type="text"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                placeholder="0012.02.17"
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-[var(--paper-border)] bg-[var(--paper-desk)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
              />
              <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                Used for chronological sorting
              </p>
            </div>
          </div>

          {/* Time of Day & Importance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] uppercase tracking-wider mb-1">
                Time of Day / Hour (Optional)
              </label>
              <input
                type="text"
                value={timeValue}
                onChange={(e) => timeSetTimeValue(e.target.value)}
                placeholder="e.g., Midnight, Dawn, 14:00"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--paper-border)] bg-[var(--paper-desk)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] uppercase tracking-wider mb-1">
                Narrative Importance
              </label>
              <select
                value={importance}
                onChange={(e) => setImportance(e.target.value as TimelineImportance)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--paper-border)] bg-[var(--paper-desk)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
              >
                <option value="critical">Critical (Inciting, Climax, Turning Point)</option>
                <option value="high">Major (Key Subplot or Confrontation)</option>
                <option value="normal">Normal (Standard Scene Event)</option>
                <option value="low">Background (World History / Lore)</option>
              </select>
            </div>
          </div>

          {/* Linked Location & Linked Chapter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] uppercase tracking-wider mb-1">
                Location
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--paper-border)] bg-[var(--paper-desk)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
              >
                <option value="">-- No Location Linked --</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} {loc.location_type ? `(${loc.location_type})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] uppercase tracking-wider mb-1">
                Manuscript Chapter / Scene
              </label>
              <select
                value={relatedChapterId}
                onChange={(e) => setRelatedChapterId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--paper-border)] bg-[var(--paper-desk)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
              >
                <option value="">-- No Chapter Linked --</option>
                {chapters.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.title} ({ch.node_type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Connected Characters Multi-select */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink-secondary)] uppercase tracking-wider mb-1">
              Participating Characters
            </label>
            {characters.length === 0 ? (
              <p className="text-xs text-[var(--ink-muted)]">
                No characters created yet in this project.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-desk)] max-h-32 overflow-y-auto">
                {characters.map((char) => {
                  const isSelected = selectedCharIds.includes(char.id);
                  return (
                    <button
                      type="button"
                      key={char.id}
                      onClick={() => toggleCharacter(char.id)}
                      className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-[var(--amber-accent)] text-white'
                          : 'bg-[var(--paper-surface)] text-[var(--ink-secondary)] hover:bg-[var(--paper-desk-hover)] border border-[var(--paper-border-subtle)]'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 shrink-0" />}
                      <span>{char.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink-secondary)] uppercase tracking-wider mb-1">
              Event Narrative & Details
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What happens in this moment? What choices are made?"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--paper-border)] bg-[var(--paper-desk)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)] font-serif-novel leading-relaxed"
            />
          </div>

          {/* Tags with autocomplete */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink-secondary)] uppercase tracking-wider mb-1">
              Tags
            </label>
            <TagInput
              projectId={projectId}
              tags={
                tags
                  ? tags
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean)
                  : []
              }
              onChange={(newTags) => setTags(newTags.join(','))}
              placeholder="Add tag (e.g., battle, reveal, flashback)..."
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--paper-border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-[var(--paper-border)] hover:bg-[var(--paper-desk)] text-[var(--ink-secondary)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm rounded-lg bg-[var(--amber-accent)] hover:bg-[var(--amber-accent)]/90 text-white font-medium transition-colors shadow-2xs disabled:opacity-50"
            >
              {saving ? 'Saving...' : event ? 'Update Event' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
