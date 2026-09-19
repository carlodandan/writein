export type WorldbuildingCategory =
  | 'All'
  | 'History'
  | 'Culture'
  | 'Magic System'
  | 'Technology'
  | 'Factions'
  | 'Religion'
  | 'Geography'
  | 'Lore & Rules'
  | 'General';

export interface WorldbuildingEntry {
  id: string;
  project_id: string;
  category: string;
  title: string;
  content: string;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateWorldbuildingInput {
  project_id: string;
  category: string;
  title: string;
  content?: string | null;
  tags?: string | null;
}

export interface UpdateWorldbuildingInput {
  category?: string;
  title?: string;
  content?: string | null;
  tags?: string | null;
}
