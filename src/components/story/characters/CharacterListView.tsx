import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Users,
  Edit2,
  Trash2,
  HeartHandshake,
  ExternalLink,
} from 'lucide-react';
import {
  Character,
  CharacterRelationshipWithNames,
  CharacterRole,
} from '../../../types/character';
import { getRoleColor } from '../../../utils/relationshipGraph';

interface CharacterListViewProps {
  characters: Character[];
  relationships: CharacterRelationshipWithNames[];
  onSelectCharacter: (char: Character) => void;
  onEditCharacter: (char: Character) => void;
  onDeleteCharacter: (char: Character) => void;
  onAddRelationship: (char: Character) => void;
  onOpenNewModal: () => void;
}

export const CharacterListView: React.FC<CharacterListViewProps> = ({
  characters,
  relationships,
  onSelectCharacter,
  onEditCharacter,
  onDeleteCharacter,
  onAddRelationship,
  onOpenNewModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  const filteredCharacters = useMemo(() => {
    return characters.filter((c) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.nickname && c.nickname.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.tags && c.tags.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole = selectedRole === 'all' || c.role === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [characters, searchQuery, selectedRole]);

  const counts = useMemo(() => {
    return {
      all: characters.length,
      protagonist: characters.filter((c) => c.role === 'protagonist').length,
      antagonist: characters.filter((c) => c.role === 'antagonist').length,
      supporting: characters.filter((c) => c.role === 'supporting').length,
      minor: characters.filter((c) => c.role === 'minor').length,
    };
  }, [characters]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--paper-bg)]">
      {/* Search & Filter Toolbar */}
      <div className="p-4 border-b border-[var(--paper-border)] bg-[var(--paper-surface)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--ink-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, role, tags, or description..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] text-[var(--ink-primary)] placeholder-[var(--ink-muted)] focus:outline-hidden focus:border-[var(--amber-accent)]"
            />
          </div>
        </div>

        {/* Role Filters */}
        <div className="flex items-center space-x-1 text-xs">
          {(['all', 'protagonist', 'antagonist', 'supporting', 'minor'] as const).map((r) => {
            const count = counts[r as keyof typeof counts];
            const isActive = selectedRole === r;
            return (
              <button
                key={r}
                onClick={() => setSelectedRole(r)}
                className={`px-3 py-1 rounded-md capitalize font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--amber-soft)] text-[var(--amber-accent)] border border-[var(--amber-soft-border)] font-semibold'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-desk)]'
                }`}
              >
                {r} <span className="opacity-60 text-[10px] ml-1">({count})</span>
              </button>
            );
          })}
        </div>

        {/* New Character Button */}
        <button
          onClick={onOpenNewModal}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--amber-accent)] text-stone-900 text-xs font-semibold hover:brightness-105 transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Character</span>
        </button>
      </div>

      {/* Characters Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredCharacters.length === 0 ? (
          <div className="max-w-md mx-auto my-12 text-center space-y-4 p-8 bg-[var(--paper-surface)] rounded-2xl border border-[var(--paper-border)]">
            <Users className="w-12 h-12 mx-auto text-[var(--amber-accent)] opacity-60" />
            <div className="space-y-1">
              <h3 className="font-serif-novel text-base font-semibold text-[var(--ink-primary)]">
                {searchQuery || selectedRole !== 'all'
                  ? 'No characters match your filter'
                  : 'No characters created yet'}
              </h3>
              <p className="text-xs text-[var(--ink-muted)]">
                {searchQuery || selectedRole !== 'all'
                  ? 'Try changing your search term or selecting another role tab.'
                  : 'Start building your story cast, protagonists, villains, and allies.'}
              </p>
            </div>
            {(!searchQuery && selectedRole === 'all') && (
              <button
                onClick={onOpenNewModal}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[var(--amber-accent)] text-stone-900 text-xs font-semibold hover:brightness-105 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Character</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCharacters.map((char) => {
              const roleStyling = getRoleColor(char.role as CharacterRole);
              const initials = char.name
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((n) => n[0])
                .join('')
                .toUpperCase();

              const charRels = relationships.filter(
                (r) => r.character_a_id === char.id || r.character_b_id === char.id,
              );

              return (
                <div
                  key={char.id}
                  className="bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-xl p-5 hover:border-[var(--paper-border-subtle)] hover:shadow-sm transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Top Row: Avatar & Role */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center font-serif-novel font-bold text-sm border shadow-2xs"
                          style={{
                            backgroundColor: roleStyling.nodeBg,
                            color: roleStyling.nodeText,
                            borderColor: roleStyling.border,
                          }}
                        >
                          {initials}
                        </div>
                        <div>
                          <h4
                            onClick={() => onSelectCharacter(char)}
                            className="font-serif-novel text-base font-bold text-[var(--ink-primary)] hover:text-[var(--amber-accent)] cursor-pointer transition-colors"
                          >
                            {char.name}
                          </h4>
                          {char.nickname && (
                            <span className="text-xs text-[var(--ink-muted)] italic font-serif-novel">
                              &ldquo;{char.nickname}&rdquo;
                            </span>
                          )}
                        </div>
                      </div>

                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border font-mono"
                        style={{
                          backgroundColor: roleStyling.badgeBg,
                          color: roleStyling.badgeText,
                          borderColor: roleStyling.border,
                        }}
                      >
                        {char.role}
                      </span>
                    </div>

                    {/* Description or Motivations */}
                    <p className="text-xs text-[var(--ink-secondary)] line-clamp-2 leading-relaxed min-h-[2.5rem]">
                      {char.description || char.motivations || 'No description added yet.'}
                    </p>

                    {/* Metadata Badges */}
                    <div className="flex items-center space-x-2 text-[11px] text-[var(--ink-muted)] pt-1">
                      {char.age && (
                        <span className="bg-[var(--paper-desk)] px-2 py-0.5 rounded border border-[var(--paper-border)]">
                          Age {char.age}
                        </span>
                      )}
                      <span className="bg-[var(--paper-desk)] px-2 py-0.5 rounded border border-[var(--paper-border)] flex items-center space-x-1">
                        <HeartHandshake className="w-3 h-3 text-[var(--amber-accent)]" />
                        <span>{charRels.length} links</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-4 mt-3 border-t border-[var(--paper-border)] flex items-center justify-between">
                    <button
                      onClick={() => onSelectCharacter(char)}
                      className="text-xs text-[var(--ink-secondary)] hover:text-[var(--amber-accent)] font-medium flex items-center space-x-1 transition-colors"
                    >
                      <span>View Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>

                    <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onAddRelationship(char)}
                        title="Link with character"
                        className="p-1.5 rounded hover:bg-[var(--paper-desk)] text-[var(--ink-muted)] hover:text-[var(--amber-accent)] transition-colors"
                      >
                        <HeartHandshake className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEditCharacter(char)}
                        title="Edit character"
                        className="p-1.5 rounded hover:bg-[var(--paper-desk)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteCharacter(char)}
                        title="Delete character"
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
    </div>
  );
};
