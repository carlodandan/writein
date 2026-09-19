export type CharacterRole = 'protagonist' | 'antagonist' | 'supporting' | 'minor';

export interface CustomField {
  key: string;
  value: string;
}

export interface Character {
  id: string;
  project_id: string;
  name: string;
  nickname: string | null;
  role: CharacterRole;
  age: string | null;
  description: string | null;
  personality: string | null;
  appearance: string | null;
  background: string | null;
  motivations: string | null;
  fears: string | null;
  goals: string | null;
  notes: string | null;
  avatar_path: string | null;
  tags: string | null;
  custom_fields_json: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCharacterInput {
  project_id: string;
  name: string;
  nickname?: string | null;
  role?: CharacterRole | string | null;
  age?: string | null;
  description?: string | null;
  personality?: string | null;
  appearance?: string | null;
  background?: string | null;
  motivations?: string | null;
  fears?: string | null;
  goals?: string | null;
  notes?: string | null;
  avatar_path?: string | null;
  tags?: string | null;
  custom_fields_json?: string | null;
}

export interface UpdateCharacterInput {
  name?: string;
  nickname?: string | null;
  role?: CharacterRole | string | null;
  age?: string | null;
  description?: string | null;
  personality?: string | null;
  appearance?: string | null;
  background?: string | null;
  motivations?: string | null;
  fears?: string | null;
  goals?: string | null;
  notes?: string | null;
  avatar_path?: string | null;
  tags?: string | null;
  custom_fields_json?: string | null;
}

export interface CharacterRelationship {
  id: string;
  project_id: string;
  character_a_id: string;
  character_b_id: string;
  relation_type: string;
  description: string | null;
  created_at: string;
}

export interface CharacterRelationshipWithNames {
  id: string;
  project_id: string;
  character_a_id: string;
  character_a_name: string;
  character_b_id: string;
  character_b_name: string;
  relation_type: string;
  description: string | null;
  created_at: string;
}

export interface CreateRelationshipInput {
  project_id: string;
  character_a_id: string;
  character_b_id: string;
  relation_type: string;
  description?: string | null;
}

export interface UpdateRelationshipInput {
  relation_type?: string;
  description?: string | null;
}
