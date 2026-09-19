export interface Location {
  id: string;
  project_id: string;
  name: string;
  location_type: string | null;
  description: string | null;
  appearance: string | null;
  atmosphere: string | null;
  inhabitants: string | null;
  notes: string | null;
  map_path: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateLocationInput {
  project_id: string;
  name: string;
  location_type?: string | null;
  description?: string | null;
  appearance?: string | null;
  atmosphere?: string | null;
  inhabitants?: string | null;
  notes?: string | null;
  map_path?: string | null;
  tags?: string | null;
}

export interface UpdateLocationInput {
  name?: string;
  location_type?: string | null;
  description?: string | null;
  appearance?: string | null;
  atmosphere?: string | null;
  inhabitants?: string | null;
  notes?: string | null;
  map_path?: string | null;
  tags?: string | null;
}
