import type { Project } from './project';
import type { ManuscriptNode, DocumentContent } from './manuscript';
import type { Character, CharacterRelationship } from './character';
import type { Location } from './location';
import type { WorldbuildingEntry } from './worldbuilding';
import type { TimelineEvent } from './timeline';
import type { Note } from './note';
import type { Tag } from './tag';
import type { WritingGoal } from './phase5';
import type { Attachment } from './attachment';

export interface TransferStats {
  projectsCount: number;
  documentsCount: number;
  chaptersCount: number;
  charactersCount: number;
  locationsCount: number;
  timelineCount: number;
  notesCount: number;
  worldbuildingCount: number;
  attachmentsCount: number;
}

export interface TransferManifest {
  formatVersion: string;
  writeinVersion: string;
  sourceDeviceId: string;
  createdAt: string;
  stats: TransferStats;
  checksumSha256?: string | null;
}

export interface AttachmentTransferItem {
  attachment: Attachment;
  base64Data?: string | null;
}

export interface LibraryTransferData {
  projects: Project[];
  nodes: ManuscriptNode[];
  documents: Record<string, DocumentContent>;
  characters: Character[];
  relationships: CharacterRelationship[];
  locations: Location[];
  worldbuilding: WorldbuildingEntry[];
  timeline: TimelineEvent[];
  notes: Note[];
  tags: Tag[];
  writingGoals: WritingGoal[];
  attachments: AttachmentTransferItem[];
}

export interface LibraryTransferPackage {
  manifest: TransferManifest;
  data: LibraryTransferData;
}

export interface TransferLogItem {
  id: string;
  sessionId: string;
  direction: 'outgoing' | 'incoming';
  peerDeviceId?: string | null;
  statsJson: string;
  createdAt: string;
}

export interface RelayCreateResponse {
  sessionId: string;
  code: string;
  expiresAt: number;
  createdAt: number;
}

export interface RelayClaimResponse {
  sessionId: string;
  sourcePublicKey: string;
  expiresAt: number;
}

export interface RelayStatusResponse {
  status: 'CREATED' | 'CLAIMED' | 'READY' | 'COMPLETED' | 'CANCELLED';
  destinationPublicKey?: string;
  hasPayload: boolean;
  manifestPreview?: TransferStats;
  expiresAt: number;
}

export interface RelayPayloadResponse {
  iv: string;
  ciphertext: string;
  manifestPreview?: TransferStats;
}
