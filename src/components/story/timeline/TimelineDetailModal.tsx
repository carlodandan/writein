import React from 'react';
import {
  X,
  Clock,
  MapPin,
  BookOpen,
  Users,
  Tag,
  Edit2,
  Trash2,
  Calendar,
} from 'lucide-react';
import { TimelineEvent } from '../../../types/timeline';
import { ActiveNavTab } from '../../layout/Sidebar';
import { RelatedContentPanel } from '../../common/RelatedContentPanel';

interface TimelineDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: TimelineEvent | null;
  onEdit: (event: TimelineEvent) => void;
  onDelete: (event: TimelineEvent) => void;
  onNavigateTab?: (tab: ActiveNavTab, entityId?: string) => void;
}

const IMPORTANCE_LABELS: Record<string, { label: string; badge: string }> = {
  critical: {
    label: 'Critical Event',
    badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
  },
  high: {
    label: 'Major Event',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  },
  normal: {
    label: 'Normal Event',
    badge: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
  },
  low: {
    label: 'Background Lore',
    badge: 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700',
  },
};

export const TimelineDetailModal: React.FC<TimelineDetailModalProps> = ({
  isOpen,
  onClose,
  event,
  onEdit,
  onDelete,
  onNavigateTab,
}) => {
  if (!isOpen || !event) return null;

  const impKey = (event.importance || 'normal').toLowerCase();
  const imp = IMPORTANCE_LABELS[impKey] || IMPORTANCE_LABELS.normal;

  const displayDate =
    event.date_label || event.date_value || event.event_date || 'Undated';

  const tagsList = event.tags
    ? event.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-[var(--paper-surface)] rounded-xl shadow-xl border border-[var(--paper-border)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--paper-border)] bg-[var(--paper-desk)]">
          <div className="flex items-center space-x-2.5">
            <Clock className="w-5 h-5 text-[var(--amber-accent)]" />
            <div>
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm border ${imp.badge}`}>
                {imp.label}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => {
                onClose();
                onEdit(event);
              }}
              className="p-1.5 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-surface)] rounded-md transition-colors"
              title="Edit Event"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                onClose();
                onDelete(event);
              }}
              className="p-1.5 text-[var(--ink-muted)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors"
              title="Delete Event"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] rounded-md transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title & Chronology */}
          <div>
            <h1 className="text-xl font-bold font-serif-novel text-[var(--ink-primary)] mb-2">
              {event.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ink-secondary)]">
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[var(--paper-desk)] border border-[var(--paper-border-subtle)] font-medium">
                <Calendar className="w-3.5 h-3.5 text-[var(--amber-accent)]" />
                <span>{displayDate}</span>
                {event.time_value && (
                  <span className="text-[var(--ink-muted)] font-normal">
                    &bull; {event.time_value}
                  </span>
                )}
              </div>

              {event.date_value && event.date_label && (
                <span className="text-[11px] font-mono text-[var(--ink-muted)]">
                  (Sort key: {event.date_value})
                </span>
              )}
            </div>
          </div>

          {/* Narrative description */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)] mb-2">
              Narrative Description
            </h4>
            <div className="p-4 rounded-xl bg-[var(--paper-desk)]/50 border border-[var(--paper-border-subtle)] font-serif-novel text-sm text-[var(--ink-primary)] leading-relaxed whitespace-pre-wrap">
              {event.description || 'No detailed description provided for this event.'}
            </div>
          </div>

          {/* Cross-Linked Connections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Location */}
            <div className="p-3.5 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-desk)]/40">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)] block mb-1.5">
                Location
              </span>
              {event.location_name ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-[var(--ink-primary)]">
                    <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-medium">{event.location_name}</span>
                  </div>
                  {onNavigateTab && event.location_id && (
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateTab('locations', event.location_id || undefined);
                      }}
                      className="text-xs text-[var(--amber-accent)] hover:underline"
                    >
                      View Location
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[var(--ink-muted)] italic">No location attached</p>
              )}
            </div>

            {/* Chapter */}
            <div className="p-3.5 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-desk)]/40">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)] block mb-1.5">
                Manuscript Chapter
              </span>
              {event.chapter_title ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-[var(--ink-primary)]">
                    <BookOpen className="w-4 h-4 text-sky-500 shrink-0" />
                    <span className="font-medium truncate max-w-[170px]">
                      {event.chapter_title}
                    </span>
                  </div>
                  {onNavigateTab && event.related_chapter_id && (
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateTab('manuscript', event.related_chapter_id || undefined);
                      }}
                      className="text-xs text-[var(--amber-accent)] hover:underline"
                    >
                      Open in Editor
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[var(--ink-muted)] italic">No chapter attached</p>
              )}
            </div>
          </div>

          {/* Character Participants */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)] block mb-2">
              Character Participants
            </span>
            {event.character_names && event.character_names.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {event.character_names.map((name, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-[var(--paper-desk)] border border-[var(--paper-border-subtle)] text-xs font-medium text-[var(--ink-primary)]"
                  >
                    <Users className="w-3.5 h-3.5 text-amber-500" />
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--ink-muted)] italic">No characters associated</p>
            )}
          </div>

          {/* Tags */}
          {tagsList.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)] block mb-2">
                Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {tagsList.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-[var(--paper-desk)] border border-[var(--paper-border-subtle)] text-xs text-[var(--ink-secondary)]"
                  >
                    <Tag className="w-3 h-3 text-[var(--ink-muted)]" />
                    <span>#{tag}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Linked References & Backlinks */}
          <div className="pt-2 border-t border-[var(--paper-border)]">
            <RelatedContentPanel
              projectId={event.project_id}
              entityType="timeline"
              entityId={event.id}
              entityTitle={event.title}
              onNavigate={(tab, id) => {
                onClose();
                onNavigateTab?.(tab, id);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
