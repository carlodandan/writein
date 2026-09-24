import React, { useState, useEffect } from 'react';
import { X, HeartHandshake } from 'lucide-react';
import {
  Character,
  CharacterRelationshipWithNames,
  CreateRelationshipInput,
  UpdateRelationshipInput,
} from '../../../types/character';

interface RelationshipFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: Character[];
  editingRelationship?: CharacterRelationshipWithNames | null;
  defaultCharAId?: string;
  defaultCharBId?: string;
  onSubmit: (
    input: CreateRelationshipInput | UpdateRelationshipInput,
    isEdit: boolean,
  ) => Promise<void>;
}

const RELATION_PRESETS = [
  'Nemesis / Rival',
  'Ally / Partner',
  'Mentor / Student',
  'Family / Sibling',
  'Parent / Child',
  'Romantic / Lover',
  'Former Friend',
  'Employer / Employee',
  'Distrustful Truce',
];

export const RelationshipFormModal: React.FC<RelationshipFormModalProps> = ({
  isOpen,
  onClose,
  characters,
  editingRelationship,
  defaultCharAId,
  defaultCharBId,
  onSubmit,
}) => {
  const [charA, setCharA] = useState('');
  const [charB, setCharB] = useState('');
  const [relationType, setRelationType] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingRelationship) {
      setCharA(editingRelationship.character_a_id);
      setCharB(editingRelationship.character_b_id);
      setRelationType(editingRelationship.relation_type);
      setDescription(editingRelationship.description || '');
    } else {
      const initialA = defaultCharAId || (characters[0]?.id ?? '');
      const otherChar = characters.find((c) => c.id !== initialA);
      const initialB = defaultCharBId || (otherChar ? otherChar.id : (characters[1]?.id ?? ''));
      setCharA(initialA);
      setCharB(initialB);
      setRelationType('Ally / Partner');
      setDescription('');
    }
    setError(null);
  }, [editingRelationship, characters, defaultCharAId, defaultCharBId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relationType.trim()) {
      setError('Please specify a relationship type');
      return;
    }
    if (!editingRelationship && charA === charB) {
      setError('Characters A and B cannot be the same person');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      if (editingRelationship) {
        await onSubmit(
          {
            relation_type: relationType.trim(),
            description: description.trim() || null,
          },
          true,
        );
      } else {
        await onSubmit(
          {
            project_id:
              characters.find((c) => c.id === charA)?.project_id ||
              characters[0]?.project_id ||
              '',
            character_a_id: charA,
            character_b_id: charB,
            relation_type: relationType.trim(),
            description: description.trim() || null,
          },
          false,
        );
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save relationship');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--paper-border)] bg-[var(--paper-desk)]">
          <div className="flex items-center space-x-2.5">
            <HeartHandshake className="w-5 h-5 text-[var(--amber-accent)]" />
            <h2 className="font-serif-novel text-lg font-bold text-[var(--ink-primary)]">
              {editingRelationship ? 'Edit Relationship' : 'Link Characters'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-surface)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {error && (
            <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          {!editingRelationship ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                  Character A
                </label>
                <select
                  value={charA}
                  onChange={(e) => setCharA(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
                >
                  {characters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                  Character B
                </label>
                <select
                  value={charB}
                  onChange={(e) => setCharB(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
                >
                  {characters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-[var(--paper-desk)] border border-[var(--paper-border)] flex items-center justify-between text-xs font-semibold">
              <span>{editingRelationship.character_a_name}</span>
              <span className="text-[var(--ink-muted)]">↔</span>
              <span>{editingRelationship.character_b_name}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
              Relationship Type
            </label>
            <input
              type="text"
              value={relationType}
              onChange={(e) => setRelationType(e.target.value)}
              placeholder="e.g. Rival, Mentor, Secret Sibling"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)] mb-2"
            />
            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5">
              {RELATION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRelationType(preset)}
                  className="px-2 py-0.5 text-[11px] rounded border border-[var(--paper-border)] bg-[var(--paper-surface)] text-[var(--ink-muted)] hover:text-[var(--amber-accent)] hover:border-[var(--amber-accent)] transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
              Dynamics & Secret History (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe the nature of their dynamic, tension, or shared history..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-2 pt-2 border-t border-[var(--paper-border)]">
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
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--amber-accent)] text-stone-900 hover:brightness-105 transition-all shadow-xs"
            >
              {isSubmitting ? 'Saving...' : editingRelationship ? 'Update Link' : 'Create Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
