import { invokeCommand } from './tauriIpc';
import {
  Character,
  CreateCharacterInput,
  UpdateCharacterInput,
  CharacterRelationshipWithNames,
  CreateRelationshipInput,
  UpdateRelationshipInput,
} from '../types/character';

export const characterService = {
  async getCharacters(projectId: string): Promise<Character[]> {
    return invokeCommand<Character[]>('get_characters', { projectId });
  },

  async getCharacter(id: string): Promise<Character> {
    return invokeCommand<Character>('get_character', { id });
  },

  async createCharacter(input: CreateCharacterInput): Promise<Character> {
    return invokeCommand<Character>('create_character', { input });
  },

  async updateCharacter(id: string, input: UpdateCharacterInput): Promise<Character> {
    return invokeCommand<Character>('update_character', { id, input });
  },

  async deleteCharacter(id: string): Promise<boolean> {
    return invokeCommand<boolean>('delete_character', { id });
  },

  async getRelationships(projectId: string): Promise<CharacterRelationshipWithNames[]> {
    return invokeCommand<CharacterRelationshipWithNames[]>('get_character_relationships', {
      projectId,
    });
  },

  async createRelationship(
    input: CreateRelationshipInput,
  ): Promise<CharacterRelationshipWithNames> {
    return invokeCommand<CharacterRelationshipWithNames>('create_character_relationship', {
      input,
    });
  },

  async updateRelationship(
    id: string,
    input: UpdateRelationshipInput,
  ): Promise<CharacterRelationshipWithNames> {
    return invokeCommand<CharacterRelationshipWithNames>('update_character_relationship', {
      id,
      input,
    });
  },

  async deleteRelationship(id: string): Promise<boolean> {
    return invokeCommand<boolean>('delete_character_relationship', { id });
  },
};
