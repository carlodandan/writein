export type NoteCategory =
  | 'All'
  | 'Ideas'
  | 'Plot'
  | 'Dialogue'
  | 'Research'
  | 'Scene'
  | 'Character'
  | 'Worldbuilding'
  | 'TODO'
  | 'Random'
  | 'Other'
  | 'Archived';

export interface Note {
  id: string;
  project_id: string;
  category: string;
  title: string;
  content: string;
  tags: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteInput {
  project_id: string;
  category?: string | null;
  title: string;
  content?: string | null;
  tags?: string | null;
}

export interface UpdateNoteInput {
  category?: string | null;
  title?: string | null;
  content?: string | null;
  tags?: string | null;
  archived?: boolean | null;
}
