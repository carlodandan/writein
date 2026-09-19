import React, { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';
import {
  CreateLocationInput,
  Location,
  UpdateLocationInput,
} from '../../../types/location';

interface LocationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  editingLocation?: Location | null;
  onSubmit: (
    input: CreateLocationInput | UpdateLocationInput,
    isEdit: boolean,
  ) => Promise<void>;
}

const TYPE_PRESETS = [
  'City / Settlement',
  'Building / Architecture',
  'Sanctuary / Temple',
  'Natural / Wilderness',
  'Maritime / Harbor',
  'Fortress / Castle',
  'Underworld / Ruin',
  'Room / Interior',
];

export const LocationFormModal: React.FC<LocationFormModalProps> = ({
  isOpen,
  onClose,
  projectId,
  editingLocation,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [locationType, setLocationType] = useState('City / Settlement');
  const [description, setDescription] = useState('');
  const [appearance, setAppearance] = useState('');
  const [atmosphere, setAtmosphere] = useState('');
  const [inhabitants, setInhabitants] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingLocation) {
      setName(editingLocation.name);
      setLocationType(editingLocation.location_type || 'City / Settlement');
      setDescription(editingLocation.description || '');
      setAppearance(editingLocation.appearance || '');
      setAtmosphere(editingLocation.atmosphere || '');
      setInhabitants(editingLocation.inhabitants || '');
      setNotes(editingLocation.notes || '');
      setTags(editingLocation.tags || '');
    } else {
      setName('');
      setLocationType('City / Settlement');
      setDescription('');
      setAppearance('');
      setAtmosphere('');
      setInhabitants('');
      setNotes('');
      setTags('');
    }
    setError(null);
  }, [editingLocation, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Location name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingLocation) {
        await onSubmit(
          {
            name: name.trim(),
            location_type: locationType.trim() || null,
            description: description.trim() || null,
            appearance: appearance.trim() || null,
            atmosphere: atmosphere.trim() || null,
            inhabitants: inhabitants.trim() || null,
            notes: notes.trim() || null,
            tags: tags.trim() || null,
          },
          true,
        );
      } else {
        await onSubmit(
          {
            project_id: projectId,
            name: name.trim(),
            location_type: locationType.trim() || null,
            description: description.trim() || null,
            appearance: appearance.trim() || null,
            atmosphere: atmosphere.trim() || null,
            inhabitants: inhabitants.trim() || null,
            notes: notes.trim() || null,
            tags: tags.trim() || null,
          },
          false,
        );
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save location');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--paper-border)] bg-[var(--paper-desk)]">
          <div className="flex items-center space-x-2.5">
            <MapPin className="w-5 h-5 text-[var(--amber-accent)]" />
            <h2 className="font-serif-novel text-lg font-bold text-[var(--ink-primary)]">
              {editingLocation ? `Edit Location: ${editingLocation.name}` : 'New Location & Setting'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-surface)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
          {error && (
            <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
              Location Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pier 14, The Obsidian Spire, Oakhaven"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
              Location Type
            </label>
            <input
              type="text"
              value={locationType}
              onChange={(e) => setLocationType(e.target.value)}
              placeholder="e.g. Harbor, Castle, Mountain Pass"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)] mb-2"
            />
            <div className="flex flex-wrap gap-1.5">
              {TYPE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setLocationType(preset)}
                  className={`px-2 py-0.5 text-[11px] rounded border transition-colors ${
                    locationType === preset
                      ? 'border-[var(--amber-accent)] bg-[var(--amber-soft)] text-[var(--amber-accent)] font-semibold'
                      : 'border-[var(--paper-border)] bg-[var(--paper-surface)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
              Brief Logline
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="One sentence summarizing the setting and significance..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                Atmosphere & Mood
              </label>
              <textarea
                value={atmosphere}
                onChange={(e) => setAtmosphere(e.target.value)}
                rows={3}
                placeholder="Sounds, odors, temperature, fog, tension..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                Appearance & Visuals
              </label>
              <textarea
                value={appearance}
                onChange={(e) => setAppearance(e.target.value)}
                rows={3}
                placeholder="Materials, architecture, lighting, size..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                Inhabitants & Factions
              </label>
              <input
                type="text"
                value={inhabitants}
                onChange={(e) => setInhabitants(e.target.value)}
                placeholder="e.g. Dockworkers, Guild guards, Monks"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. harbor, danger, secret"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
              Plot Notes & Writer Secrets
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Plot significance, secrets hidden here, scene ideas..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-[var(--paper-border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-lg border border-[var(--paper-border)] hover:bg-[var(--paper-desk)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-[var(--amber-accent)] text-stone-900 hover:brightness-105 transition-all shadow-xs"
            >
              {isSubmitting ? 'Saving...' : editingLocation ? 'Save Location' : 'Create Location'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
