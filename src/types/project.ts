export type ProjectStatus = 'idea' | 'planning' | 'writing' | 'editing' | 'completed' | 'archived';

export interface Project {
  id: string;
  title: string;
  subtitle?: string | null;
  author?: string | null;
  description?: string | null;
  genre?: string | null;
  status: ProjectStatus;
  target_word_count: number;
  current_word_count: number;
  cover_image?: string | null;
  project_notes?: string | null;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
}

export interface CreateProjectInput {
  title: string;
  subtitle?: string | null;
  author?: string | null;
  description?: string | null;
  genre?: string | null;
  target_word_count?: number | null;
}

export interface UpdateProjectInput {
  title?: string;
  subtitle?: string | null;
  author?: string | null;
  description?: string | null;
  genre?: string | null;
  status?: ProjectStatus;
  target_word_count?: number | null;
  project_notes?: string | null;
}

export interface ProjectSummary {
  project: Project;
  chapter_count: number;
  scene_count: number;
  character_count: number;
  location_count: number;
  note_count: number;
  last_edited_chapter_title?: string | null;
}
