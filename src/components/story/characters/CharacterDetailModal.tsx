import React from 'react';
import {
  X,
  Edit2,
  Trash2,
  HeartHandshake,
  Target,
  ShieldAlert,
  Compass,
} from 'lucide-react';
import {
  Character,
  CharacterRelationshipWithNames,
  CustomField,
} from '../../../types/character';
import { getRoleColor } from '../../../utils/relationshipGraph';
import { ActiveNavTab } from '../../layout/Sidebar';
import { RelatedContentPanel } from '../../common/RelatedContentPanel';

interface CharacterDetailModalProps {
  character: Character | null;
  relationships: CharacterRelationshipWithNames[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: (char: Character) => void;
  onDelete: (char: Character) => void;
  onAddRelationship: (char: Character) => void;
  onNavigateTab?: (tab: ActiveNavTab, entityId?: string) => void;
}

export const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({
  character,
  relationships,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onAddRelationship,
  onNavigateTab,
}) => {
  if (!isOpen || !character) return null;

  const roleStyling = getRoleColor(character.role);
  const initials = character.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  let customFields: CustomField[] = [];
  if (character.custom_fields_json) {
    try {
      customFields = JSON.parse(character.custom_fields_json);
    } catch {
      customFields = [];
    }
  }

  const tagsList = character.tags
    ? character.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  const charRelationships = relationships.filter(
    (r) => r.character_a_id === character.id || r.character_b_id === character.id,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--paper-border)] bg-[var(--paper-desk)]">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-serif-novel font-bold text-sm border-2 shadow-xs"
              style={{
                backgroundColor: roleStyling.nodeBg,
                color: roleStyling.nodeText,
                borderColor: roleStyling.border,
              }}
            >
              {initials}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-serif-novel text-lg font-bold text-[var(--ink-primary)]">
                  {character.name}
                </h2>
                {character.nickname && (
                  <span className="text-xs text-[var(--ink-muted)] font-serif-novel italic">
                    &ldquo;{character.nickname}&rdquo;
                  </span>
                )}
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border font-mono"
                  style={{
                    backgroundColor: roleStyling.badgeBg,
                    color: roleStyling.badgeText,
                    borderColor: roleStyling.border,
                  }}
                >
                  {character.role}
                </span>
              </div>
              {character.age && (
                <div className="text-xs text-[var(--ink-muted)]">Age: {character.age}</div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => onEdit(character)}
              title="Edit Profile"
              className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-surface)] transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(character)}
              title="Delete Character"
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
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

          {/* Logline Description */}
          {character.description && (
            <div className="p-4 rounded-xl bg-[var(--paper-bg)] border border-[var(--paper-border)] font-serif-novel text-sm text-[var(--ink-primary)] leading-relaxed italic">
              {character.description}
            </div>
          )}

          {/* Psychology & Motivations */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)] flex items-center space-x-1.5">
              <Compass className="w-3.5 h-3.5 text-[var(--amber-accent)]" />
              <span>Psychology & Inner Compass</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[var(--paper-bg)] border border-[var(--paper-border)] space-y-1">
                <div className="font-semibold text-[var(--ink-secondary)] flex items-center space-x-1">
                  <Target className="w-3 h-3 text-emerald-500" />
                  <span>Goals & Stakes</span>
                </div>
                <p className="text-[var(--ink-primary)] leading-relaxed">
                  {character.goals || 'No specific goals noted.'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[var(--paper-bg)] border border-[var(--paper-border)] space-y-1">
                <div className="font-semibold text-[var(--ink-secondary)] flex items-center space-x-1">
                  <span>Core Motivations</span>
                </div>
                <p className="text-[var(--ink-primary)] leading-relaxed">
                  {character.motivations || 'No motivations recorded.'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[var(--paper-bg)] border border-[var(--paper-border)] space-y-1">
                <div className="font-semibold text-[var(--ink-secondary)] flex items-center space-x-1">
                  <ShieldAlert className="w-3 h-3 text-rose-500" />
                  <span>Fears & Flaws</span>
                </div>
                <p className="text-[var(--ink-primary)] leading-relaxed">
                  {character.fears || 'No major fears documented.'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[var(--paper-bg)] border border-[var(--paper-border)] space-y-1">
                <div className="font-semibold text-[var(--ink-secondary)]">Personality & Traits</div>
                <p className="text-[var(--ink-primary)] leading-relaxed">
                  {character.personality || 'No personality notes.'}
                </p>
              </div>
            </div>
          </div>

          {/* Physical Appearance */}
          {character.appearance && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                Physical Appearance & Cues
              </h3>
              <p className="text-xs text-[var(--ink-secondary)] leading-relaxed bg-[var(--paper-bg)] p-3 rounded-lg border border-[var(--paper-border)]">
                {character.appearance}
              </p>
            </div>
          )}

          {/* Background & History */}
          {character.background && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                Backstory & Origins
              </h3>
              <p className="text-xs text-[var(--ink-secondary)] leading-relaxed bg-[var(--paper-bg)] p-3 rounded-lg border border-[var(--paper-border)]">
                {character.background}
              </p>
            </div>
          )}

          {/* Custom Fields */}
          {customFields.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                Novel Attributes
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {customFields.map((f, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-[var(--paper-bg)] border border-[var(--paper-border)] flex items-center justify-between"
                  >
                    <span className="font-semibold text-[var(--ink-secondary)]">{f.key}:</span>
                    <span className="text-[var(--ink-primary)] font-mono">{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Direct Relationships */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)] flex items-center space-x-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-[var(--amber-accent)]" />
                <span>Story Relationships ({charRelationships.length})</span>
              </h3>
              <button
                type="button"
                onClick={() => onAddRelationship(character)}
                className="text-[11px] font-semibold text-[var(--amber-accent)] hover:underline"
              >
                + Link Another Character
              </button>
            </div>

            {charRelationships.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-[var(--paper-border)] rounded-lg text-xs text-[var(--ink-muted)]">
                No character relationships mapped yet.
              </div>
            ) : (
              <div className="space-y-1.5">
                {charRelationships.map((r) => {
                  const isA = r.character_a_id === character.id;
                  const partnerName = isA ? r.character_b_name : r.character_a_name;
                  return (
                    <div
                      key={r.id}
                      className="p-2.5 rounded-lg bg-[var(--paper-bg)] border border-[var(--paper-border)] flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-[var(--ink-primary)]">
                          {partnerName}
                          <span className="ml-2 font-normal text-[var(--amber-accent)] bg-[var(--amber-soft)] px-2 py-0.5 rounded text-[11px] font-mono">
                            {r.relation_type}
                          </span>
                        </div>
                        {r.description && (
                          <div className="text-[11px] text-[var(--ink-muted)] italic">
                            {r.description}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Writer Notes */}
          {character.notes && (
            <div className="space-y-1.5 pt-2 border-t border-[var(--paper-border)]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                Writer&apos;s Private Notes
              </h3>
              <p className="text-xs text-[var(--ink-muted)] italic bg-[var(--paper-desk)] p-3 rounded-lg border border-[var(--paper-border)]">
                {character.notes}
              </p>
            </div>
          )}

          {/* Automated Cross-Links & Backlinks */}
          <div className="pt-2 border-t border-[var(--paper-border)]">
            <RelatedContentPanel
              projectId={character.project_id}
              entityType="character"
              entityId={character.id}
              entityTitle={character.name}
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
