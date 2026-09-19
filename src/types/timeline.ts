export type TimelineImportance = 'critical' | 'high' | 'normal' | 'low';

export interface TimelineEvent {
  id: string;
  project_id: string;
  title: string;
  event_date: string | null;
  date_value: string | null;
  date_label: string | null;
  time_value: string | null;
  order_index: number;
  description: string | null;
  location_id: string | null;
  location_name: string | null;
  importance: TimelineImportance | string;
  related_chapter_id: string | null;
  chapter_title: string | null;
  character_ids: string[];
  character_names: string[];
  tags: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTimelineEventInput {
  project_id: string;
  title: string;
  event_date?: string | null;
  date_value?: string | null;
  date_label?: string | null;
  time_value?: string | null;
  order_index?: number | null;
  description?: string | null;
  location_id?: string | null;
  importance?: TimelineImportance | string | null;
  related_chapter_id?: string | null;
  character_ids?: string[] | null;
  tags?: string | null;
}

export interface UpdateTimelineEventInput {
  title?: string;
  event_date?: string | null;
  date_value?: string | null;
  date_label?: string | null;
  time_value?: string | null;
  order_index?: number | null;
  description?: string | null;
  location_id?: string | null;
  importance?: TimelineImportance | string | null;
  related_chapter_id?: string | null;
  character_ids?: string[] | null;
  tags?: string | null;
}

export interface TimelineFilter {
  character_id?: string | null;
  location_id?: string | null;
  related_chapter_id?: string | null;
  importance?: string | null;
  tag?: string | null;
  search_query?: string | null;
  sort_direction?: 'asc' | 'desc' | null;
}
