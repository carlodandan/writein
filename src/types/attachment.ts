export interface Attachment {
  id: string;
  project_id: string;
  file_name: string;
  file_path: string;
  relative_path?: string | null;
  file_type: string;
  mime_type?: string | null;
  file_size: number;
  entity_type?: string | null;
  entity_id?: string | null;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAttachmentInput {
  project_id: string;
  file_name: string;
  file_path: string;
  relative_path?: string | null;
  file_type: string;
  mime_type?: string | null;
  file_size: number;
  entity_type?: string | null;
  entity_id?: string | null;
  description?: string | null;
}

export interface UpdateAttachmentInput {
  file_name?: string | null;
  description?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
}

export interface SaveAttachmentPayload {
  project_id: string;
  file_name: string;
  base64_data?: string | null;
  source_path?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  description?: string | null;
}

export interface RelatedContentItem {
  id: string;
  entity_type: 'chapter' | 'character' | 'location' | 'timeline' | 'note' | 'attachment' | string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  target_tab: string;
  target_id: string;
}

export interface RelatedContentResponse {
  entity_type: string;
  entity_id: string;
  chapters: RelatedContentItem[];
  characters: RelatedContentItem[];
  locations: RelatedContentItem[];
  timeline_events: RelatedContentItem[];
  notes: RelatedContentItem[];
  attachments: RelatedContentItem[];
}

export type EntityReference = RelatedContentItem;
