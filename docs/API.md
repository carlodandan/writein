# WriteIn — API & Developer Reference

This document provides a comprehensive reference for WriteIn's backend IPC commands, data transfer objects (DTOs), and frontend TypeScript client services.

---

## Architecture Overview

WriteIn implements a type-safe IPC boundary between the React frontend and the Rust backend using Tauri 2.0:

```text
React 19 Components
        │
        ▼
TypeScript Services (`src/services/*`)
        │
        ▼
Tauri IPC Invoke (`src/services/tauriIpc.ts`)
        │
        ▼ (JSON serialization / deserialization)
Rust Tauri Commands (`src-tauri/src/commands/*`)
        │
        ▼
Rust Repositories (`src-tauri/src/db/*`)
        │
        ▼
SQLite 3 (`rusqlite` WAL mode) & Filesystem
```

---

## 1. Project Management IPC

### `create_project`
Creates a new novel project database and directory structure.
- **Command**: `create_project`
- **Arguments**:
  - `input`: `CreateProjectInput`
    ```typescript
    interface CreateProjectInput {
      title: string;
      subtitle?: string | null;
      author?: string | null;
      description?: string | null;
      genre?: string | null;
      target_word_count?: number;
    }
    ```
- **Returns**: `Promise<Project>`

### `get_projects`
Retrieves all registered active novel projects.
- **Command**: `get_projects`
- **Arguments**: None
- **Returns**: `Promise<Project[]>`

### `get_project`
Fetches a single project by ID.
- **Command**: `get_project`
- **Arguments**: `{ id: string }`
- **Returns**: `Promise<Project>`

### `update_project`
Updates project metadata or status.
- **Command**: `update_project`
- **Arguments**:
  - `id`: `string`
  - `input`: `UpdateProjectInput`
- **Returns**: `Promise<Project>`

### `delete_project`
Deletes a project record and its associated SQLite database.
- **Command**: `delete_project`
- **Arguments**: `{ id: string }`
- **Returns**: `Promise<void>`

### `get_project_summary`
Returns high-level project analytics (manuscript words, targets, entity counts).
- **Command**: `get_project_summary`
- **Arguments**: `{ id: string }`
- **Returns**: `Promise<ProjectSummary>`

---

## 2. Manuscript & Document IPC

### `get_manuscript_tree`
Fetches the hierarchical manuscript tree (Parts, Chapters, Scenes) sorted by `sort_order`.
- **Command**: `get_manuscript_tree`
- **Arguments**: `{ project_id: string }`
- **Returns**: `Promise<ManuscriptTreeNode[]>`
  ```typescript
  interface ManuscriptTreeNode {
    node: ManuscriptNode;
    children: ManuscriptTreeNode[];
  }
  ```

### `create_manuscript_node`
Creates a new Part, Chapter, or Scene.
- **Command**: `create_manuscript_node`
- **Arguments**:
  - `input`: `CreateManuscriptNodeInput`
    ```typescript
    interface CreateManuscriptNodeInput {
      project_id: string;
      parent_id?: string | null;
      node_type: 'folder' | 'chapter' | 'scene';
      title: string;
      synopsis?: string | null;
      sort_order?: number;
    }
    ```
- **Returns**: `Promise<ManuscriptNode>`

### `update_manuscript_node`
Updates node metadata (title, synopsis, status, sort order).
- **Command**: `update_manuscript_node`
- **Arguments**:
  - `id`: `string`
  - `input`: `UpdateManuscriptNodeInput`
- **Returns**: `Promise<ManuscriptNode>`

### `delete_manuscript_node`
Safely deletes a node and cascades to its child scenes and associated document contents.
- **Command**: `delete_manuscript_node`
- **Arguments**: `{ id: string }`
- **Returns**: `Promise<void>`

### `duplicate_manuscript_node`
Performs a deep clone of a chapter or scene, duplicating document text and generating new IDs.
- **Command**: `duplicate_manuscript_node`
- **Arguments**: `{ id: string }`
- **Returns**: `Promise<ManuscriptNode>`

### `move_manuscript_node`
Moves a node to a new parent and updates its sort order. Strictly checks for cycle loops and hierarchy validity.
- **Command**: `move_manuscript_node`
- **Arguments**:
  - `node_id`: `string`
  - `target_parent_id`: `string | null`
  - `target_sort_order`: `number`
- **Returns**: `Promise<void>`

### `reorder_manuscript_nodes`
Batch reorders siblings in a single atomic database transaction.
- **Command**: `reorder_manuscript_nodes`
- **Arguments**:
  - `items`: `Array<{ id: string; sort_order: number; parent_id?: string | null }>`
- **Returns**: `Promise<void>`

### `get_document_content`
Retrieves the TipTap JSON and plain text content for a manuscript document.
- **Command**: `get_document_content`
- **Arguments**: `{ node_id: string }`
- **Returns**: `Promise<DocumentContent | null>`
  ```typescript
  interface DocumentContent {
    id: string;
    node_id: string;
    content_json: string;
    content_text: string;
    word_count: number;
    character_count: number;
    last_edited_at: string;
  }
  ```

### `save_document_content`
Persists document text, updates node word counts, and automatically rolls up aggregated counts to parent chapters and parts.
- **Command**: `save_document_content`
- **Arguments**:
  - `input`: `SaveDocumentContentInput`
    ```typescript
    interface SaveDocumentContentInput {
      node_id: string;
      content_json: string;
      content_text: string;
      word_count: number;
      character_count: number;
    }
    ```
- **Returns**: `Promise<void>`

---

## 3. Story Bible IPC

### Characters & Relationships
- `get_characters(project_id: string)`: Retrieves character roster.
- `get_character(id: string)`: Retrieves single dossier with custom fields.
- `create_character(input: CreateCharacterInput)`: Creates character.
- `update_character(id: string, input: UpdateCharacterInput)`: Updates character.
- `delete_character(id: string)`: Deletes character dossier and cascades relationships.
- `reorder_characters(items: ReorderItem[])`: Reorders character cards.
- `get_character_relationships(project_id: string)`: Retrieves relationship graph edges.
- `create_character_relationship(input: CreateRelationshipInput)`: Adds relationship bond.
- `update_character_relationship(id: string, input: UpdateRelationshipInput)`: Updates bond label.
- `delete_character_relationship(id: string)`: Deletes relationship bond.

### Locations
- `get_locations(project_id: string)`: Retrieves setting entries.
- `get_location(id: string)`: Retrieves single location details.
- `create_location(input: CreateLocationInput)`: Creates location entry.
- `update_location(id: string, input: UpdateLocationInput)`: Updates location.
- `delete_location(id: string)`: Deletes location.

### Worldbuilding & Lore
- `get_worldbuilding_entries(project_id: string, category?: string)`: Retrieves lore articles, optionally filtered by domain category.
- `get_worldbuilding_entry(id: string)`: Retrieves single lore entry.
- `create_worldbuilding_entry(input: CreateWorldbuildingInput)`: Creates lore entry.
- `update_worldbuilding_entry(id: string, input: UpdateWorldbuildingInput)`: Updates lore entry.
- `delete_worldbuilding_entry(id: string)`: Deletes lore entry.

---

## 4. Organization & Knowledge Management IPC

### Timeline
- `get_timeline_events(project_id: string, filter?: TimelineFilter)`: Retrieves chronological timeline events sorted ascending or descending.
- `get_timeline_event(id: string)`: Retrieves single event with participating characters.
- `create_timeline_event(input: CreateTimelineEventInput)`: Creates event.
- `update_timeline_event(id: string, input: UpdateTimelineEventInput)`: Updates event.
- `delete_timeline_event(id: string)`: Deletes event.
- `reorder_timeline_events(items: ReorderItem[])`: Updates manual chronological order index.

### Notes
- `get_notes(project_id: string, filter?: NoteFilter)`: Retrieves notes list with category, search, and archive filters.
- `get_note(id: string)`: Retrieves single note.
- `create_note(input: CreateNoteInput)`: Creates note.
- `update_note(id: string, input: UpdateNoteInput)`: Updates note (supports pinning and soft archive).
- `delete_note(id: string)`: Permanently deletes note.

### Tags
- `get_tags(project_id: string)`: Retrieves all project tags with usage counts.
- `create_tag(input: CreateTagInput)`: Creates tag.
- `update_tag(id: string, input: UpdateTagInput)`: Updates tag name or color.
- `delete_tag(id: string)`: Deletes tag without deleting associated entities.
- `get_entity_tags(entity_type: string, entity_id: string)`: Fetches tags for an entity.
- `set_entity_tags(input: SetEntityTagsInput)`: Bulk synchronizes tags for an entity.
- `assign_tag_to_entity(tag_id: string, entity_type: string, entity_id: string)`: Links single tag.
- `remove_tag_from_entity(tag_id: string, entity_type: string, entity_id: string)`: Unlinks single tag.

### Attachments & References
- `get_attachments(project_id: string)`: Retrieves attachment metadata list.
- `save_attachment(input: SaveAttachmentDataInput)`: Writes binary data to disk and records metadata in SQLite.
- `create_attachment(input: CreateAttachmentInput)`: Records attachment metadata.
- `update_attachment(id: string, input: UpdateAttachmentInput)`: Updates notes or filename.
- `delete_attachment(id: string)`: Deletes binary file from disk and deletes DB row.
- `open_attachment(id: string)`: Launches file in system default application.
- `reveal_attachment_folder(id: string)`: Opens Windows File Explorer highlighting the file.
- `get_entity_attachments(entity_type: string, entity_id: string)`: Fetches files linked to a specific entity.

### Global Search & Cross-Linking
- `search_project(project_id: string, query: string, entity_types?: string[])`: Performs fast SQLite multi-entity query returning `SearchResultItem[]`.
- `get_related_content(project_id: string, entity_type: string, entity_id: string)`: Aggregates all bidirectional backlinks across chapters, characters, locations, timeline events, and notes.

---

## 5. Client Services Reference

Frontend code communicates through structured client services in `src/services/*`:

| Service | File | Primary Responsibility |
| :--- | :--- | :--- |
| `projectService` | `src/services/projectService.ts` | Novel project CRUD and dashboard statistics |
| `manuscriptService` | `src/services/manuscriptService.ts` | Tree hierarchy, document saves, rollups, drag-drop reordering |
| `characterService` | `src/services/characterService.ts` | Dossiers and interactive relationship graph edges |
| `locationService` | `src/services/locationService.ts` | Setting profiles and geography notes |
| `worldbuildingService` | `src/services/worldbuildingService.ts` | 9 categories of lore and world rules |
| `timelineService` | `src/services/timelineService.ts` | Chronological events, fictional calendars, participant links |
| `noteService` | `src/services/noteService.ts` | Notebook CRUD, categories, pinning, archival toggle |
| `tagService` | `src/services/tagService.ts` | Global taxonomy, entity associations |
| `attachmentService` | `src/services/attachmentService.ts` | File persistence, system viewer opening, folder reveal |
| `searchService` | `src/services/searchService.ts` | Global search query execution and grouping |
| `crossLinkService` | `src/services/crossLinkService.ts` | Automated backlink aggregation |

---

## 6. Error Handling & Validation Rules

1. **Security & Path Sanitization**:
   - Attachment filenames are strictly sanitized using alphanumeric whitelists.
   - Any attempt to provide directory traversal sequences (`..`, `/`, `\`) is rejected.
2. **Hierarchy Integrity**:
   - Reordering and parent moves check for cycle loops in Rust. If `target_parent_id` is a descendant of `node_id`, the operation returns an error and aborts transaction.
3. **Database Consistency**:
   - All multi-step write operations (node reordering, node duplication, document word rollup) execute inside explicit SQLite transactions (`conn.transaction()`).
