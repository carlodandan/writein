import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, MapPin, Edit2, Trash2, ExternalLink, Wind, Users } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import { locationService } from '../../../services/locationService';
import {
  CreateLocationInput,
  Location,
  UpdateLocationInput,
} from '../../../types/location';
import { LocationFormModal } from './LocationFormModal';
import { LocationDetailModal } from './LocationDetailModal';
import { ActiveNavTab } from '../../layout/Sidebar';

interface LocationWorkspaceProps {
  selectedLocationId?: string | null;
  onNavigateTab?: (tab: ActiveNavTab, entityId?: string) => void;
}

export const LocationWorkspace: React.FC<LocationWorkspaceProps> = ({
  selectedLocationId,
  onNavigateTab,
}) => {
  const { currentProject } = useProject();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Modal states
  const [selectedLocForDetail, setSelectedLocForDetail] = useState<Location | null>(null);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadLocations = useCallback(async () => {
    if (!currentProject) return;
    try {
      setLoading(true);
      const list = await locationService.getLocations(currentProject.id);
      setLocations(list);
    } catch (err) {
      console.error('Failed to load locations:', err);
    } finally {
      setLoading(false);
    }
  }, [currentProject]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  useEffect(() => {
    if (selectedLocationId && locations.length > 0) {
      const match = locations.find((l) => l.id === selectedLocationId);
      if (match) {
        setSelectedLocForDetail(match);
      }
    }
  }, [selectedLocationId, locations]);

  const uniqueTypes = useMemo(() => {
    const set = new Set<string>();
    locations.forEach((l) => {
      if (l.location_type) set.add(l.location_type);
    });
    return Array.from(set);
  }, [locations]);

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (loc.location_type && loc.location_type.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (loc.description && loc.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (loc.atmosphere && loc.atmosphere.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (loc.tags && loc.tags.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = selectedType === 'all' || loc.location_type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [locations, searchQuery, selectedType]);

  const handleSaveLocation = async (
    input: CreateLocationInput | UpdateLocationInput,
    isEdit: boolean,
  ) => {
    if (isEdit && editingLocation) {
      const updated = await locationService.updateLocation(
        editingLocation.id,
        input as UpdateLocationInput,
      );
      setLocations((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      if (selectedLocForDetail?.id === updated.id) {
        setSelectedLocForDetail(updated);
      }
    } else {
      const created = await locationService.createLocation(input as CreateLocationInput);
      setLocations((prev) => [created, ...prev]);
    }
  };

  const handleDeleteLocation = async (loc: Location) => {
    if (window.confirm(`Are you sure you want to delete ${loc.name}?`)) {
      await locationService.deleteLocation(loc.id);
      setLocations((prev) => prev.filter((l) => l.id !== loc.id));
      if (selectedLocForDetail?.id === loc.id) {
        setSelectedLocForDetail(null);
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
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--paper-bg)]">
      {/* Top Header */}
      <div className="h-12 border-b border-[var(--paper-border)] bg-[var(--paper-surface)] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <MapPin className="w-4 h-4 text-[var(--amber-accent)]" />
          <h1 className="font-serif-novel text-base font-bold text-[var(--ink-primary)]">
            World Geography & Settings
          </h1>
          <span className="text-xs text-[var(--ink-muted)] font-mono">
            ({locations.length} places)
          </span>
        </div>

        <button
          onClick={() => {
            setEditingLocation(null);
            setIsFormOpen(true);
          }}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[var(--amber-accent)] text-stone-900 text-xs font-semibold hover:brightness-105 transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Location</span>
        </button>
      </div>

      {/* Toolbar: Search & Filter */}
      <div className="p-4 border-b border-[var(--paper-border)] bg-[var(--paper-surface)] flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--ink-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search locations by name, atmosphere, inhabitants, or tags..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] placeholder-[var(--ink-muted)] focus:outline-hidden focus:border-[var(--amber-accent)]"
          />
        </div>

        {/* Type Filter Chips */}
        {uniqueTypes.length > 0 && (
          <div className="flex items-center space-x-1 text-xs">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                selectedType === 'all'
                  ? 'bg-[var(--amber-soft)] text-[var(--amber-accent)] border border-[var(--amber-soft-border)] font-semibold'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-desk)]'
              }`}
            >
              All
            </button>
            {uniqueTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  selectedType === type
                    ? 'bg-[var(--amber-soft)] text-[var(--amber-accent)] border border-[var(--amber-soft-border)] font-semibold'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-desk)]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid of Locations */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-xs text-[var(--ink-muted)]">
            Loading locations...
          </div>
        ) : filteredLocations.length === 0 ? (
          <div className="max-w-md mx-auto my-12 text-center space-y-4 p-8 bg-[var(--paper-surface)] rounded-2xl border border-[var(--paper-border)] shadow-xs">
            <MapPin className="w-12 h-12 mx-auto text-[var(--amber-accent)] opacity-60" />
            <div className="space-y-1">
              <h3 className="font-serif-novel text-base font-semibold text-[var(--ink-primary)]">
                {searchQuery || selectedType !== 'all'
                  ? 'No locations match your filter'
                  : 'No locations mapped yet'}
              </h3>
              <p className="text-xs text-[var(--ink-muted)]">
                {searchQuery || selectedType !== 'all'
                  ? 'Try a different search keyword or clear the type filter.'
                  : 'Define cities, chambers, kingdoms, landmarks, and mystical sanctuaries.'}
              </p>
            </div>
            {!searchQuery && selectedType === 'all' && (
              <button
                onClick={() => {
                  setEditingLocation(null);
                  setIsFormOpen(true);
                }}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[var(--amber-accent)] text-stone-900 text-xs font-semibold hover:brightness-105 transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Location</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLocations.map((loc) => {
              return (
                <div
                  key={loc.id}
                  className="bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-xl p-5 hover:border-[var(--paper-border-subtle)] hover:shadow-sm transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3
                          onClick={() => setSelectedLocForDetail(loc)}
                          className="font-serif-novel text-base font-bold text-[var(--ink-primary)] hover:text-[var(--amber-accent)] cursor-pointer transition-colors"
                        >
                          {loc.name}
                        </h3>
                        {loc.location_type && (
                          <span className="text-[11px] font-mono text-[var(--amber-accent)]">
                            {loc.location_type}
                          </span>
                        )}
                      </div>
                    </div>

                    {loc.description && (
                      <p className="text-xs text-[var(--ink-secondary)] line-clamp-2 leading-relaxed">
                        {loc.description}
                      </p>
                    )}

                    {/* Atmosphere snippet */}
                    {loc.atmosphere && (
                      <div className="p-2.5 rounded-lg bg-[var(--paper-bg)] border border-[var(--paper-border)] text-[11px] text-[var(--ink-muted)] flex items-start space-x-1.5 line-clamp-2">
                        <Wind className="w-3.5 h-3.5 text-cyan-600 shrink-0 mt-0.5" />
                        <span className="italic">{loc.atmosphere}</span>
                      </div>
                    )}

                    {/* Inhabitants */}
                    {loc.inhabitants && (
                      <div className="flex items-center space-x-1.5 text-[11px] text-[var(--ink-muted)]">
                        <Users className="w-3 h-3 text-[var(--amber-accent)]" />
                        <span className="truncate">{loc.inhabitants}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-4 mt-3 border-t border-[var(--paper-border)] flex items-center justify-between">
                    <button
                      onClick={() => setSelectedLocForDetail(loc)}
                      className="text-xs text-[var(--ink-secondary)] hover:text-[var(--amber-accent)] font-medium flex items-center space-x-1 transition-colors"
                    >
                      <span>Explore Setting</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>

                    <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingLocation(loc);
                          setIsFormOpen(true);
                        }}
                        title="Edit Location"
                        className="p-1.5 rounded hover:bg-[var(--paper-desk)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteLocation(loc)}
                        title="Delete Location"
                        className="p-1.5 rounded hover:bg-red-500/10 text-[var(--ink-muted)] hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <LocationDetailModal
        location={selectedLocForDetail}
        isOpen={Boolean(selectedLocForDetail)}
        onClose={() => setSelectedLocForDetail(null)}
        onEdit={(loc) => {
          setSelectedLocForDetail(null);
          setEditingLocation(loc);
          setIsFormOpen(true);
        }}
        onDelete={handleDeleteLocation}
        onNavigateTab={onNavigateTab}
      />

      <LocationFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        projectId={currentProject.id}
        editingLocation={editingLocation}
        onSubmit={handleSaveLocation}
      />
    </div>
  );
};
