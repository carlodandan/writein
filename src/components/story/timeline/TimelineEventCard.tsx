import React from 'react';
import {
  Clock,
  MapPin,
  BookOpen,
  Users,
  Tag,
  Edit2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { TimelineEvent } from '../../../types/timeline';

interface TimelineEventCardProps {
  event: TimelineEvent;
  onSelect: (event: TimelineEvent) => void;
  onEdit: (event: TimelineEvent) => void;
  onDelete: (event: TimelineEvent) => void;
  isLast?: boolean;
}

const IMPORTANCE_CONFIG: Record<
  string,
  { label: string; badgeClass: string; dotClass: string }
> = {
  critical: {
    label: 'Critical',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    dotClass: 'bg-rose-500 ring-rose-200 dark:ring-rose-900',
  },
  high: {
    label: 'Major',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    dotClass: 'bg-amber-500 ring-amber-200 dark:ring-amber-900',
  },
  normal: {
    label: 'Normal',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
    dotClass: 'bg-sky-500 ring-sky-200 dark:ring-sky-900',
  },
  low: {
    label: 'Background',
    badgeClass: 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700',
    dotClass: 'bg-stone-400 ring-stone-200 dark:ring-stone-700',
  },
};

export const TimelineEventCard: React.FC<TimelineEventCardProps> = ({
  event,
  onSelect,
  onEdit,
  onDelete,
  isLast = false,
}) => {
  const imp = (event.importance || 'normal').toLowerCase();
  const impConfig = IMPORTANCE_CONFIG[imp] || IMPORTANCE_CONFIG.normal;

  const displayDate =
    event.date_label || event.date_value || event.event_date || 'Undated';

  const tagsList = event.tags
    ? event.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="relative flex items-start group">
      {/* Vertical Spine Spine & Dot */}
      <div className="flex flex-col items-center mr-4 select-none shrink-0 self-stretch">
        <div
          className={`w-3.5 h-3.5 rounded-full ring-4 transition-all group-hover:scale-110 ${impConfig.dotClass}`}
        />
        {!isLast && (
          <div className="w-0.5 flex-1 bg-[var(--paper-border)] my-1 group-hover:bg-[var(--amber-accent)]/40 transition-colors" />
        )}
      </div>

      {/* Event Content Card */}
      <div className="flex-1 pb-6 min-w-0">
        <div className="bg-[var(--paper-surface)] border border-[var(--paper-border)] hover:border-[var(--paper-border-focus)] rounded-xl p-4 shadow-2xs hover:shadow-sm transition-all">
          {/* Header: Date + Time + Importance + Actions */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Date Badge */}
              <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-[var(--paper-desk)] border border-[var(--paper-border-subtle)] text-xs font-medium text-[var(--ink-primary)]">
                <Clock className="w-3.5 h-3.5 text-[var(--amber-accent)]" />
                <span>{displayDate}</span>
                {event.time_value && (
                  <span className="text-[var(--ink-muted)]">
                    &bull; {event.time_value}
                  </span>
                )}
              </div>

              {/* Importance Badge */}
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm border ${impConfig.badgeClass}`}
              >
                {impConfig.label}
              </span>
            </div>

            {/* Actions Menu */}
            <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onSelect(event)}
                className="p-1 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-desk)] rounded transition-colors"
                title="View full event details"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onEdit(event)}
                className="p-1 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-desk)] rounded transition-colors"
                title="Edit event"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(event)}
                className="p-1 text-[var(--ink-muted)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition-colors"
                title="Delete event"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Title */}
          <h3
            onClick={() => onSelect(event)}
            className="text-base font-semibold text-[var(--ink-primary)] cursor-pointer hover:text-[var(--amber-accent)] transition-colors line-clamp-1"
          >
            {event.title}
          </h3>

          {/* Description Snippet */}
          {event.description && (
            <p className="mt-1.5 text-xs text-[var(--ink-secondary)] font-serif-novel leading-relaxed line-clamp-3">
              {event.description}
            </p>
          )}

          {/* Linked entities metadata */}
          <div className="mt-3 pt-2.5 border-t border-[var(--paper-border-subtle)] flex flex-wrap items-center gap-2 text-xs text-[var(--ink-muted)]">
            {/* Location */}
            {event.location_name && (
              <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[var(--paper-desk)] text-[var(--ink-secondary)]">
                <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="truncate max-w-[140px]">
                  {event.location_name}
                </span>
              </div>
            )}

            {/* Chapter */}
            {event.chapter_title && (
              <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[var(--paper-desk)] text-[var(--ink-secondary)]">
                <BookOpen className="w-3 h-3 text-sky-500 shrink-0" />
                <span className="truncate max-w-[140px]">
                  {event.chapter_title}
                </span>
              </div>
            )}

            {/* Character participants */}
            {event.character_names && event.character_names.length > 0 && (
              <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[var(--paper-desk)] text-[var(--ink-secondary)]">
                <Users className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="truncate max-w-[200px]">
                  {event.character_names.join(', ')}
                </span>
              </div>
            )}

            {/* Tags */}
            {tagsList.length > 0 && (
              <div className="flex items-center space-x-1 ml-auto">
                <Tag className="w-3 h-3 text-[var(--ink-muted)] shrink-0" />
                <div className="flex flex-wrap gap-1">
                  {tagsList.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--paper-desk)] text-[var(--ink-muted)]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
