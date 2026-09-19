import React, { useState, useEffect, useCallback } from 'react';
import { Users, HeartHandshake } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import { characterService } from '../../../services/characterService';
import {
  Character,
  CharacterRelationshipWithNames,
  CreateCharacterInput,
  UpdateCharacterInput,
  CreateRelationshipInput,
  UpdateRelationshipInput,
} from '../../../types/character';
import { CharacterListView } from './CharacterListView';
import { CharacterRelationshipMap } from './CharacterRelationshipMap';
import { CharacterDetailModal } from './CharacterDetailModal';
import { CharacterFormModal } from './CharacterFormModal';
import { RelationshipFormModal } from './RelationshipFormModal';
import { ActiveNavTab } from '../../layout/Sidebar';

interface CharacterWorkspaceProps {
  selectedCharacterId?: string | null;
  onNavigateTab?: (tab: ActiveNavTab, entityId?: string) => void;
}

export const CharacterWorkspace: React.FC<CharacterWorkspaceProps> = ({
  selectedCharacterId,
  onNavigateTab,
}) => {
  const { currentProject } = useProject();
  const [activeTab, setActiveTab] = useState<'roster' | 'relationships'>('roster');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [relationships, setRelationships] = useState<CharacterRelationshipWithNames[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedCharForDetail, setSelectedCharForDetail] = useState<Character | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [isCharFormOpen, setIsCharFormOpen] = useState(false);

  const [editingRelationship, setEditingRelationship] =
    useState<CharacterRelationshipWithNames | null>(null);
  const [isRelFormOpen, setIsRelFormOpen] = useState(false);
  const [defaultRelCharA, setDefaultRelCharA] = useState<string | undefined>();

  const loadData = useCallback(async () => {
    if (!currentProject) return;
    try {
      setLoading(true);
      const [chars, rels] = await Promise.all([
        characterService.getCharacters(currentProject.id),
        characterService.getRelationships(currentProject.id),
      ]);
      setCharacters(chars);
      setRelationships(rels);
    } catch (err) {
      console.error('Failed to load characters or relationships:', err);
    } finally {
      setLoading(false);
    }
  }, [currentProject]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedCharacterId && characters.length > 0) {
      const match = characters.find((c) => c.id === selectedCharacterId);
      if (match) {
        setSelectedCharForDetail(match);
      }
    }
  }, [selectedCharacterId, characters]);

  // Character handlers
  const handleSaveCharacter = async (
    input: CreateCharacterInput | UpdateCharacterInput,
    isEdit: boolean,
  ) => {
    if (isEdit && editingCharacter) {
      const updated = await characterService.updateCharacter(
        editingCharacter.id,
        input as UpdateCharacterInput,
      );
      setCharacters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      if (selectedCharForDetail?.id === updated.id) {
        setSelectedCharForDetail(updated);
      }
    } else {
      const created = await characterService.createCharacter(input as CreateCharacterInput);
      setCharacters((prev) => [created, ...prev]);
    }
  };

  const handleDeleteCharacter = async (char: Character) => {
    if (window.confirm(`Are you sure you want to delete ${char.name}? Any linked relationships will also be removed.`)) {
      await characterService.deleteCharacter(char.id);
      setCharacters((prev) => prev.filter((c) => c.id !== char.id));
      setRelationships((prev) =>
        prev.filter((r) => r.character_a_id !== char.id && r.character_b_id !== char.id),
      );
      if (selectedCharForDetail?.id === char.id) {
        setSelectedCharForDetail(null);
      }
    }
  };

  // Relationship handlers
  const handleSaveRelationship = async (
    input: CreateRelationshipInput | UpdateRelationshipInput,
    isEdit: boolean,
  ) => {
    if (isEdit && editingRelationship) {
      const updated = await characterService.updateRelationship(
        editingRelationship.id,
        input as UpdateRelationshipInput,
      );
      setRelationships((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } else {
      const created = await characterService.createRelationship(
        input as CreateRelationshipInput,
      );
      setRelationships((prev) => [created, ...prev]);
    }
  };

  const handleDeleteRelationship = async (rel: CharacterRelationshipWithNames) => {
    if (window.confirm(`Remove relationship '${rel.relation_type}' between ${rel.character_a_name} and ${rel.character_b_name}?`)) {
      await characterService.deleteRelationship(rel.id);
      setRelationships((prev) => prev.filter((r) => r.id !== rel.id));
    }
  };

  const handleOpenAddRelationship = (char?: Character) => {
    setDefaultRelCharA(char?.id);
    setEditingRelationship(null);
    setIsRelFormOpen(true);
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
      {/* Top Bar Switcher */}
      <div className="h-12 border-b border-[var(--paper-border)] bg-[var(--paper-surface)] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-4">
          <h1 className="font-serif-novel text-base font-bold text-[var(--ink-primary)]">
            Story Cast & Relations
          </h1>

          <div className="flex items-center space-x-1 p-1 rounded-lg bg-[var(--paper-desk)] border border-[var(--paper-border)] text-xs font-semibold">
            <button
              onClick={() => setActiveTab('roster')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-colors ${
                activeTab === 'roster'
                  ? 'bg-[var(--paper-surface)] text-[var(--amber-accent)] shadow-2xs font-bold'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Cast Roster ({characters.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('relationships')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-colors ${
                activeTab === 'relationships'
                  ? 'bg-[var(--paper-surface)] text-[var(--amber-accent)] shadow-2xs font-bold'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Relationship Web ({relationships.length})</span>
            </button>
          </div>
        </div>

        <div className="text-xs text-[var(--ink-muted)] font-mono">
          {characters.length} characters • {relationships.length} links
        </div>
      </div>

      {/* Main Workspace Area */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-xs text-[var(--ink-muted)]">
          Loading characters...
        </div>
      ) : activeTab === 'roster' ? (
        <CharacterListView
          characters={characters}
          relationships={relationships}
          onSelectCharacter={(c) => setSelectedCharForDetail(c)}
          onEditCharacter={(c) => {
            setEditingCharacter(c);
            setIsCharFormOpen(true);
          }}
          onDeleteCharacter={handleDeleteCharacter}
          onAddRelationship={handleOpenAddRelationship}
          onOpenNewModal={() => {
            setEditingCharacter(null);
            setIsCharFormOpen(true);
          }}
        />
      ) : (
        <CharacterRelationshipMap
          characters={characters}
          relationships={relationships}
          onSelectCharacter={(c) => setSelectedCharForDetail(c)}
          onEditRelationship={(r) => {
            setEditingRelationship(r);
            setIsRelFormOpen(true);
          }}
          onDeleteRelationship={handleDeleteRelationship}
          onOpenNewRelationshipModal={() => handleOpenAddRelationship()}
          onOpenNewCharacterModal={() => {
            setEditingCharacter(null);
            setIsCharFormOpen(true);
          }}
        />
      )}

      {/* Detail Dossier Modal */}
      <CharacterDetailModal
        character={selectedCharForDetail}
        relationships={relationships}
        isOpen={Boolean(selectedCharForDetail)}
        onClose={() => setSelectedCharForDetail(null)}
        onEdit={(c) => {
          setSelectedCharForDetail(null);
          setEditingCharacter(c);
          setIsCharFormOpen(true);
        }}
        onDelete={handleDeleteCharacter}
        onAddRelationship={(c) => handleOpenAddRelationship(c)}
        onNavigateTab={onNavigateTab}
      />

      {/* Character Create / Edit Modal */}
      <CharacterFormModal
        isOpen={isCharFormOpen}
        onClose={() => setIsCharFormOpen(false)}
        projectId={currentProject.id}
        editingCharacter={editingCharacter}
        onSubmit={handleSaveCharacter}
      />

      {/* Relationship Create / Edit Modal */}
      <RelationshipFormModal
        isOpen={isRelFormOpen}
        onClose={() => setIsRelFormOpen(false)}
        characters={characters}
        editingRelationship={editingRelationship}
        defaultCharAId={defaultRelCharA}
        onSubmit={handleSaveRelationship}
      />
    </div>
  );
};
