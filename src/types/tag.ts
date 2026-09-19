export interface Tag {
  id: string;
  project_id: string;
  name: string;
  color: string | null;
}

export interface TagWithUsageCount {
  id: string;
  project_id: string;
  name: string;
  color: string | null;
  usage_count: number;
}

export interface CreateTagInput {
  project_id: string;
  name: string;
  color?: string | null;
}

export interface SetEntityTagsInput {
  project_id: string;
  entity_type: 'character' | 'location' | 'worldbuilding' | 'timeline' | 'note' | 'manuscript';
  entity_id: string;
  tag_names: string[];
}
