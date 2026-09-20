export interface DocumentVersion {
  id: string;
  document_id: string;
  node_id: string;
  version_num: number;
  snapshot_text: string;
  word_count: number;
  created_at: string;
}

export interface WritingGoal {
  id: string;
  project_id: string;
  goal_type: 'novel' | 'daily' | 'session' | string;
  target_words: number;
  current_words: number;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateWritingGoalInput {
  project_id: string;
  goal_type: string;
  target_words: number;
  start_date?: string | null;
  end_date?: string | null;
}

export interface UpdateWritingGoalInput {
  target_words?: number;
  current_words?: number;
  is_active?: boolean;
  start_date?: string | null;
  end_date?: string | null;
}

export interface WritingSession {
  id: string;
  project_id: string;
  node_id?: string | null;
  started_at: string;
  ended_at?: string | null;
  duration_seconds: number;
  words_written: number;
}

export interface SessionStats {
  today_words: number;
  week_words: number;
  all_time_words: number;
  today_sessions: number;
  avg_session_words: number;
}

export interface EditorPreferences {
  fontSize: number; // 14 - 24
  fontFamily: 'serif' | 'sans' | 'mono';
  lineHeight: 'normal' | 'relaxed' | 'loose';
  paragraphSpacing: 'normal' | 'wide';
  editorWidth: 'narrow' | 'medium' | 'wide';
  focusModeEnabled: boolean;
  typewriterMode: boolean;
}

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 16,
  fontFamily: 'serif',
  lineHeight: 'relaxed',
  paragraphSpacing: 'normal',
  editorWidth: 'medium',
  focusModeEnabled: false,
  typewriterMode: false,
};
