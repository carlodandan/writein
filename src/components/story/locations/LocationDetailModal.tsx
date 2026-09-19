import React from 'react';
import { X, Edit2, Trash2, MapPin, Users, Wind, Eye } from 'lucide-react';
import { Location } from '../../../types/location';
import { ActiveNavTab } from '../../layout/Sidebar';
import { RelatedContentPanel } from '../../common/RelatedContentPanel';

interface LocationDetailModalProps {
  location: Location | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (loc: Location) => void;
  onDelete: (loc: Location) => void;
  onNavigateTab?: (tab: ActiveNavTab, entityId?: string) => void;
}

export const LocationDetailModal: React.FC<LocationDetailModalProps> = ({
  location,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onNavigateTab,
}) => {
  if (!isOpen || !location) return null;

  const tagsList = location.tags
    ? location.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--paper-border)] bg-[var(--paper-desk)]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[var(--amber-soft)] border border-[var(--amber-soft-border)] text-[var(--amber-accent)]">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-serif-novel text-lg font-bold text-[var(--ink-primary)]">
                  {location.name}
                </h2>
                {location.location_type && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border font-mono bg-[var(--paper-surface)] border-[var(--paper-border)] text-[var(--amber-accent)]">
                    {location.location_type}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => onEdit(location)}
              title="Edit Location"
              className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-surface)] transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(location)}
              title="Delete Location"
              className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-surface)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
          {/* Tags */}
          {tagsList.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tagsList.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-[var(--paper-desk)] border border-[var(--paper-border)] text-xs text-[var(--ink-secondary)] font-mono"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {location.description && (
            <div className="p-4 rounded-xl bg-[var(--paper-bg)] border border-[var(--paper-border)] font-serif-novel text-sm text-[var(--ink-primary)] leading-relaxed italic">
              {location.description}
            </div>
          )}

          {/* Atmosphere Quote */}
          {location.atmosphere && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)] flex items-center space-x-1.5">
                <Wind className="w-3.5 h-3.5 text-cyan-600" />
                <span>Atmosphere & Sensory Mood</span>
              </h3>
              <div className="p-3 rounded-lg bg-[var(--paper-bg)] border border-[var(--paper-border)] text-xs text-[var(--ink-secondary)] leading-relaxed">
                {location.atmosphere}
              </div>
            </div>
          )}

          {/* Appearance */}
          {location.appearance && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)] flex items-center space-x-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-600" />
                <span>Visuals & Architectural Form</span>
              </h3>
              <div className="p-3 rounded-lg bg-[var(--paper-bg)] border border-[var(--paper-border)] text-xs text-[var(--ink-secondary)] leading-relaxed">
                {location.appearance}
              </div>
            </div>
          )}

          {/* Inhabitants */}
          {location.inhabitants && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)] flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Inhabitants & Present Factions</span>
              </h3>
              <div className="p-3 rounded-lg bg-[var(--paper-bg)] border border-[var(--paper-border)] text-xs text-[var(--ink-secondary)] leading-relaxed">
                {location.inhabitants}
              </div>
            </div>
          )}

          {/* Plot Notes */}
          {location.notes && (
            <div className="space-y-1.5 pt-2 border-t border-[var(--paper-border)]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                Writer Notes & Hidden Secrets
              </h3>
              <p className="text-xs text-[var(--ink-muted)] italic bg-[var(--paper-desk)] p-3 rounded-lg border border-[var(--paper-border)] leading-relaxed">
                {location.notes}
              </p>
            </div>
          )}

          {/* Automated Cross-Links & Backlinks */}
          <div className="pt-2 border-t border-[var(--paper-border)]">
            <RelatedContentPanel
              projectId={location.project_id}
              entityType="location"
              entityId={location.id}
              entityTitle={location.name}
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
