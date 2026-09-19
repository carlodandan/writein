export type NodeType = 'part' | 'chapter' | 'scene';

export interface ManuscriptNode {
  id: string;
  project_id: string;
  parent_id: string | null;
  node_type: NodeType;
  title: string;
  synopsis: string | null;
  sort_order: number;
  status: string;
  word_count: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface DocumentContent {
  id: string;
  node_id: string;
  content_json: string;
  content_text: string;
  word_count: number;
  character_count: number;
  last_edited_at: string;
}

export interface CreateNodeInput {
  project_id: string;
  parent_id?: string | null;
  node_type: NodeType;
  title: string;
  synopsis?: string | null;
}

export interface UpdateNodeInput {
  title?: string;
  synopsis?: string | null;
  status?: string;
  sort_order?: number;
  parent_id?: string | null;
}

export interface MoveNodeInput {
  node_id: string;
  target_parent_id?: string | null;
  target_sort_order: number;
}

export interface ReorderItem {
  id: string;
  parent_id: string | null;
  sort_order: number;
}

export interface SaveDocumentInput {
  node_id: string;
  content_json: string;
  content_text: string;
  word_count: number;
  character_count: number;
}
