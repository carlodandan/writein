export interface SearchResultItem {
  id: string;
  entity_type: 'manuscript' | 'character' | 'location' | 'worldbuilding' | 'timeline' | 'note' | 'tag' | string;
  title: string;
  subtitle?: string | null;
  snippet?: string | null;
  target_tab: string;
  target_id: string;
}

export interface SearchResponse {
  query: string;
  items: SearchResultItem[];
  total_count: number;
}

export type SearchResult = SearchResponse;
