import type { Project } from './project';
import type { ManuscriptNode, DocumentContent } from './manuscript';
import type { Character, CharacterRelationship } from './character';
import type { Location } from './location';
import type { WorldbuildingEntry } from './worldbuilding';
import type { TimelineEvent } from './timeline';
import type { Note } from './note';
import type { Tag } from './tag';
import type { WritingGoal, WritingSession } from './phase5';

export interface EntityTag {
  entity_type: string;
  entity_id: string;
  tag_id: string;
}

export interface TrashItem {
  id: string;
  project_id: string;
  entity_type: 'manuscript' | 'character' | 'location' | 'note';
  entity_id: string;
  title: string;
  deleted_at: string;
}

export interface BackupFileInfo {
  fileName: string;
  filePath: string;
  fileSizeBytes: number;
  createdAt: string;
}

export interface BackupResult {
  fileName: string;
  filePath?: string | null;
  contentJson: string;
}

export interface ProjectBackupBundle {
  version: string;
  exportedAt: string;
  project: Project;
  nodes: ManuscriptNode[];
  documents: Record<string, DocumentContent>;
  characters: Character[];
  relationships: CharacterRelationship[];
  locations: Location[];
  worldbuilding: WorldbuildingEntry[];
  timeline: TimelineEvent[];
  notes: Note[];
  tags: Tag[];
  entityTags: EntityTag[];
  writingGoals: WritingGoal[];
  writingSessions: WritingSession[];
  settings: Record<string, string>;
}
