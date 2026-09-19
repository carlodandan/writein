import React, { useState, useEffect } from 'react';
import { X, UserPlus, Plus, Trash2 } from 'lucide-react';
import {
  Character,
  CharacterRole,
  CreateCharacterInput,
  CustomField,
  UpdateCharacterInput,
} from '../../../types/character';

interface CharacterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  editingCharacter?: Character | null;
  onSubmit: (
    input: CreateCharacterInput | UpdateCharacterInput,
    isEdit: boolean,
  ) => Promise<void>;
}

const ROLES: { id: CharacterRole; label: string; desc: string }[] = [
  { id: 'protagonist', label: 'Protagonist', desc: 'Central driving figure' },
  { id: 'antagonist', label: 'Antagonist', desc: 'Primary opposition / conflict' },
  { id: 'supporting', label: 'Supporting', desc: 'Key allies, mentors, foils' },
  { id: 'minor', label: 'Minor / Cameo', desc: 'Incidental or brief roles' },
];

export const CharacterFormModal: React.FC<CharacterFormModalProps> = ({
  isOpen,
  onClose,
  projectId,
  editingCharacter,
  onSubmit,
}) => {
  const [activeTab, setActiveTab] = useState<'core' | 'psychology' | 'physical' | 'custom'>('core');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [role, setRole] = useState<CharacterRole>('supporting');
  const [age, setAge] = useState('');
  const [description, setDescription] = useState('');
  const [personality, setPersonality] = useState('');
  const [appearance, setAppearance] = useState('');
  const [background, setBackground] = useState('');
  const [motivations, setMotivations] = useState('');
  const [fears, setFears] = useState('');
  const [goals, setGoals] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingCharacter) {
      setName(editingCharacter.name);
      setNickname(editingCharacter.nickname || '');
      setRole(editingCharacter.role as CharacterRole);
      setAge(editingCharacter.age || '');
      setDescription(editingCharacter.description || '');
      setPersonality(editingCharacter.personality || '');
      setAppearance(editingCharacter.appearance || '');
      setBackground(editingCharacter.background || '');
      setMotivations(editingCharacter.motivations || '');
      setFears(editingCharacter.fears || '');
      setGoals(editingCharacter.goals || '');
      setNotes(editingCharacter.notes || '');
      setTags(editingCharacter.tags || '');
      if (editingCharacter.custom_fields_json) {
        try {
          setCustomFields(JSON.parse(editingCharacter.custom_fields_json));
        } catch {
          setCustomFields([]);
        }
      } else {
        setCustomFields([]);
      }
    } else {
      setName('');
      setNickname('');
      setRole('supporting');
      setAge('');
      setDescription('');
      setPersonality('');
      setAppearance('');
      setBackground('');
      setMotivations('');
      setFears('');
      setGoals('');
      setNotes('');
      setTags('');
      setCustomFields([]);
    }
    setActiveTab('core');
    setError(null);
  }, [editingCharacter, isOpen]);

  if (!isOpen) return null;

  const handleAddField = () => {
    setCustomFields([...customFields, { key: '', value: '' }]);
  };

  const handleUpdateField = (index: number, key: string, value: string) => {
    const updated = [...customFields];
    updated[index] = { key, value };
    setCustomFields(updated);
  };

  const handleRemoveField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Character name is required');
      setActiveTab('core');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const validCustomFields = customFields.filter((f) => f.key.trim().length > 0);
    const customJson = validCustomFields.length > 0 ? JSON.stringify(validCustomFields) : null;

    try {
      if (editingCharacter) {
        await onSubmit(
          {
            name: name.trim(),
            nickname: nickname.trim() || null,
            role,
            age: age.trim() || null,
            description: description.trim() || null,
            personality: personality.trim() || null,
            appearance: appearance.trim() || null,
            background: background.trim() || null,
            motivations: motivations.trim() || null,
            fears: fears.trim() || null,
            goals: goals.trim() || null,
            notes: notes.trim() || null,
            tags: tags.trim() || null,
            custom_fields_json: customJson,
          },
          true,
        );
      } else {
        await onSubmit(
          {
            project_id: projectId,
            name: name.trim(),
            nickname: nickname.trim() || null,
            role,
            age: age.trim() || null,
            description: description.trim() || null,
            personality: personality.trim() || null,
            appearance: appearance.trim() || null,
            background: background.trim() || null,
            motivations: motivations.trim() || null,
            fears: fears.trim() || null,
            goals: goals.trim() || null,
            notes: notes.trim() || null,
            tags: tags.trim() || null,
            custom_fields_json: customJson,
          },
          false,
        );
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save character');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--paper-border)] bg-[var(--paper-desk)]">
          <div className="flex items-center space-x-2.5">
            <UserPlus className="w-5 h-5 text-[var(--amber-accent)]" />
            <h2 className="font-serif-novel text-lg font-bold text-[var(--ink-primary)]">
              {editingCharacter ? `Edit: ${editingCharacter.name}` : 'New Character Profile'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-surface)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[var(--paper-border)] bg-[var(--paper-surface)] px-6 pt-2 space-x-6 text-xs font-semibold">
          {[
            { id: 'core', label: '1. Identity & Role' },
            { id: 'psychology', label: '2. Psychology & Arc' },
            { id: 'physical', label: '3. Physicality & History' },
            { id: 'custom', label: '4. Custom Fields' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`pb-2.5 border-b-2 transition-colors ${
                activeTab === t.id
                  ? 'border-[var(--amber-accent)] text-[var(--amber-accent)]'
                  : 'border-transparent text-[var(--ink-muted)] hover:text-[var(--ink-secondary)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
          {error && (
            <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          {activeTab === 'core' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Evelyn Vance"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                    Nickname / Alias
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="e.g. The Hawk"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
                  />
                </div>
              </div>

              {/* Role Radio Pills */}
              <div>
                <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-2">
                  Narrative Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        role === r.id
                          ? 'border-[var(--amber-accent)] bg-[var(--amber-soft)] text-[var(--amber-accent)]'
                          : 'border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-secondary)] hover:border-[var(--paper-border-subtle)]'
                      }`}
                    >
                      <div className="font-semibold text-xs capitalize">{r.label}</div>
                      <div className="text-[11px] text-[var(--ink-muted)] mt-0.5">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                    Age / Apparent Age
                  </label>
                  <input
                    type="text"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 34, ageless, teen"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g. detective, magic-user, royalty"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                  Logline / Brief Summary
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="One or two sentences capturing who this character is..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
                />
              </div>
            </div>
          )}

          {activeTab === 'psychology' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                  Core Motivations (What drives them?)
                </label>
                <textarea
                  value={motivations}
                  onChange={(e) => setMotivations(e.target.value)}
                  rows={2}
                  placeholder="e.g. Protect family honor, seek revenge, uncover truth..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                  Primary Goals & Stakes (What happens if they fail?)
                </label>
                <textarea
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  rows={2}
                  placeholder="e.g. Find the lost ledger before midnight..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                  Deepest Fears & Flaws
                </label>
                <textarea
                  value={fears}
                  onChange={(e) => setFears(e.target.value)}
                  rows={2}
                  placeholder="e.g. Fear of abandonment, excessive pride, paranoia..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                  Personality Traits & Mannerisms
                </label>
                <textarea
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  rows={2}
                  placeholder="e.g. Speaks in quiet cadences, taps fingers when calculating..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
                />
              </div>
            </div>
          )}

          {activeTab === 'physical' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                  Appearance & Sensory Details
                </label>
                <textarea
                  value={appearance}
                  onChange={(e) => setAppearance(e.target.value)}
                  rows={3}
                  placeholder="Height, build, eyes, signature clothing, scars, scent, voice tone..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                  Backstory & Origins
                </label>
                <textarea
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  rows={3}
                  placeholder="Formative past events, family heritage, training, childhood origins..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                  Writer Notes & Ideas
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Scene ideas, future twist planning, chapter appearances..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
                />
              </div>
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-xs text-[var(--ink-primary)]">
                    Novel-Specific Attributes
                  </h3>
                  <p className="text-[11px] text-[var(--ink-muted)]">
                    Add custom fields tailored to your world (e.g. Weapon, Wand Core, MBTI, Zodiac, Faction)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddField}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-[var(--amber-accent)] text-[var(--amber-accent)] bg-[var(--amber-soft)] text-xs font-medium hover:brightness-105 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Field</span>
                </button>
              </div>

              {customFields.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-[var(--paper-border)] rounded-xl text-xs text-[var(--ink-muted)]">
                  No custom fields yet. Click &quot;Add Field&quot; above to create one.
                </div>
              ) : (
                <div className="space-y-2">
                  {customFields.map((field, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={field.key}
                        onChange={(e) => handleUpdateField(index, e.target.value, field.value)}
                        placeholder="Field Name (e.g. Weapon)"
                        className="w-1/3 px-3 py-2 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
                      />
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => handleUpdateField(index, field.key, e.target.value)}
                        placeholder="Value (e.g. Silver Rapier)"
                        className="flex-1 px-3 py-2 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] focus:outline-hidden focus:border-[var(--amber-accent)]"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveField(index)}
                        className="p-2 text-[var(--ink-muted)] hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--paper-border)]">
            <div className="text-[11px] text-[var(--ink-muted)]">
              All details save locally to your project database.
            </div>
            <div className="flex space-x-2">
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
                {isSubmitting ? 'Saving...' : editingCharacter ? 'Save Changes' : 'Create Profile'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
