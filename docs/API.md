# WriteIn — API & Developer Reference

This document provides a comprehensive reference for WriteIn's backend Tauri IPC commands, data transfer objects (DTOs), and frontend TypeScript client services.

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
SQLite 3 (`rusqlite` WAL mode) & Local Filesystem
```

---

## 1. Project Management IPC

### `create_project`
Creates a new novel project database and directory structure.
- **Command**: `create_project`
- **Arguments**: `input: CreateProjectInput`
- **Returns**: `Promise<Project>`

### `get_projects`
Retrieves all registered novel projects.
- **Command**: `get_projects`
- **Arguments**: None
- **Returns**: `Promise<Project[]>`

### `get_project`
Fetches a single project by ID.
- **Command**: `get_project`
- **Arguments**: `{ id: string }`
- **Returns**: `Promise<Project>`

### `update_project`
Updates project metadata, word count targets, or status.
- **Command**: `update_project`
- **Arguments**: `{ id: string, input: UpdateProjectInput }`
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

### `create_manuscript_node`
Creates a new Part, Chapter, or Scene.
- **Command**: `create_manuscript_node`
- **Arguments**: `input: CreateManuscriptNodeInput`
- **Returns**: `Promise<ManuscriptNode>`

### `update_manuscript_node`
Updates a node's title, synopsis, status, or parent relationship.
- **Command**: `update_manuscript_node`
- **Arguments**: `{ id: string, input: UpdateManuscriptNodeInput }`
- **Returns**: `Promise<ManuscriptNode>`

### `delete_manuscript_node`
Moves a node and all of its child scenes to the project trash bin.
- **Command**: `delete_manuscript_node`
- **Arguments**: `{ id: string }`
- **Returns**: `Promise<void>`

### `reorder_manuscript_nodes`
Updates sibling order or reparents a node with cycle prevention.
- **Command**: `reorder_manuscript_nodes`
- **Arguments**: `input: ReorderNodesInput`
- **Returns**: `Promise<void>`

### `duplicate_manuscript_node`
Clones a node, its document content, and any child scenes.
- **Command**: `duplicate_manuscript_node`
- **Arguments**: `{ id: string }`
- **Returns**: `Promise<ManuscriptNode>`

### `get_document`
Retrieves document text and rich TipTap JSON by node ID.
- **Command**: `get_document`
- **Arguments**: `{ node_id: string }`
- **Returns**: `Promise<Document>`

### `save_document`
Saves document content and rolls up word counts up the manuscript tree.
- **Command**: `save_document`
- **Arguments**: `input: SaveDocumentInput`
- **Returns**: `Promise<Document>`

---

## 3. Version History & Snapshots IPC

### `create_version_snapshot`
Captures an immutable snapshot of a document with timestamp and word count.
- **Command**: `create_version_snapshot`
- **Arguments**: `input: CreateVersionInput`
- **Returns**: `Promise<DocumentVersion>`

### `list_version_snapshots`
Lists all historical snapshots for a specific manuscript node.
- **Command**: `list_version_snapshots`
- **Arguments**: `{ node_id: string }`
- **Returns**: `Promise<DocumentVersion[]>`

### `get_version_snapshot`
Fetches the full text content of a specific snapshot.
- **Command**: `get_version_snapshot`
- **Arguments**: `{ version_id: string }`
- **Returns**: `Promise<DocumentVersion>`

### `restore_version_snapshot`
Replaces the active document text with the snapshot's contents.
- **Command**: `restore_version_snapshot`
- **Arguments**: `{ node_id: string, version_id: string }`
- **Returns**: `Promise<Document>`

### `delete_version_snapshot`
Deletes a specific snapshot record.
- **Command**: `delete_version_snapshot`
- **Arguments**: `{ version_id: string }`
- **Returns**: `Promise<void>`

---

## 4. Writing Goals & Sessions IPC

### `get_writing_goals`
Retrieves daily and project-level word count targets.
- **Command**: `get_writing_goals`
- **Arguments**: `{ project_id: string }`
- **Returns**: `Promise<WritingGoal[]>`

### `create_writing_goal` / `update_writing_goal` / `delete_writing_goal`
CRUD management for target word goals and deadlines.

### `start_writing_session`
Initializes a new writing session interval for a project or scene.
- **Command**: `start_writing_session`
- **Arguments**: `{ project_id: string, node_id?: string }`
- **Returns**: `Promise<WritingSession>`

### `update_writing_session`
Heartbeat update recording elapsed seconds and words written.
- **Command**: `update_writing_session`
- **Arguments**: `{ session_id: string, words_written: number, duration_seconds: number }`
- **Returns**: `Promise<WritingSession>`

### `end_writing_session`
Concludes a session interval and stores final metrics.
- **Command**: `end_writing_session`
- **Arguments**: `{ session_id: string, words_written: number, duration_seconds: number }`
- **Returns**: `Promise<WritingSession>`

### `get_writing_sessions` / `get_session_stats`
Queries session logs, calculating daily writing velocity (words per minute) and streak metrics.

---

## 5. Story Bible & Cast Graph IPC

### Characters & Cast
- `get_characters(project_id: string)`: Retrieves characters sorted by narrative role.
- `get_character(id: string)`: Retrieves single character profile.
- `create_character(input: CreateCharacterInput)`: Creates a new character dossier.
- `update_character(id: string, input: UpdateCharacterInput)`: Updates character attributes.
- `delete_character(id: string)`: Moves character to trash.

### Character Relationships
- `get_character_relationships(project_id: string)`: Fetches relationship graph edges.
- `create_character_relationship(input: CreateRelationshipInput)`: Links two characters.
- `update_character_relationship(id: string, input: UpdateRelationshipInput)`: Modifies edge type or notes.
- `delete_character_relationship(id: string)`: Removes relationship edge.

### Locations & Worldbuilding Lore
- `get_locations(project_id: string)` / `create_location` / `update_location` / `delete_location`: Manages story settings.
- `get_worldbuilding_entries(project_id: string, category?: string)`: Fetches lore articles across 9 domains.
- `create_worldbuilding_entry` / `update_worldbuilding_entry` / `delete_worldbuilding_entry`: Lore article CRUD.

---

## 6. Organization, Notes & Attachments IPC

### Timeline & Fictional Calendar
- `get_timeline_events(project_id: string, filter?: TimelineFilter)`: Retrieves chronological events.
- `create_timeline_event` / `update_timeline_event` / `delete_timeline_event` / `reorder_timeline_events`: Event management.

### Notes & Tags
- `get_notes` / `create_note` / `update_note` / `delete_note`: Notebook scratchpad operations.
- `get_tags` / `create_tag` / `update_tag` / `delete_tag` / `set_entity_tags`: Tag taxonomy management.

### Attachments & Filesystem Sandboxing
- `get_attachments(project_id: string)`: Lists attachment records.
- `save_attachment(input: SaveAttachmentDataInput)`: Writes binary data to disk and records metadata.
- `open_attachment(id: string)`: Launches file in system default application (`cmd /c start` on Windows, `open` on macOS, `xdg-open` on Linux).
- `reveal_attachment_folder(id: string)`: Reveals file in system file manager (Windows File Explorer, macOS Finder, or Linux desktop file manager).

### Search & Cross-Linking
- `search_project(project_id: string, query: string, entity_types?: string[])`: Indexed multi-entity search.
- `get_related_content(project_id: string, entity_type: string, entity_id: string)`: Bidirectional backlink lookup.

---

## 7. Compilation, Import & Export IPC

### `export_manuscript_docx`
Compiles selected nodes into an industry-standard MS Word `.docx` file.
- **Command**: `export_manuscript_docx`
- **Arguments**: `input: CompileOptionsInput`
- **Returns**: `Promise<CompileResult>` (base64 payload or written file path)

### `export_manuscript_markdown` / `export_manuscript_text`
Compiles manuscript into formatted Markdown or plain text files.

### `select_export_path` / `save_exported_file`
Native platform Save File dialog interaction and binary buffer persistence.

---

## 8. Backup & Trash Recovery IPC

### `create_backup` / `restore_backup`
Generates or restores full compressed `.writein` project archives.

### `list_trash_items`
Lists soft-deleted entities across all domains in the project.
- **Command**: `list_trash_items`
- **Arguments**: `{ project_id: string }`
- **Returns**: `Promise<TrashItem[]>`

### `restore_trash_item`
Restores a trashed entity from its serialized JSON backup.
- **Command**: `restore_trash_item`
- **Arguments**: `{ item_id: string }`
- **Returns**: `Promise<void>`

### `delete_trash_item` / `empty_trash`
Permanently purges deleted items.

---

## 9. End-to-End Encrypted Device Transfer IPC

### `get_device_id`
Returns a persistent, cryptographically secure UUID identifying the local desktop installation.
- **Command**: `get_device_id`
- **Arguments**: None
- **Returns**: `Promise<string>`

### `export_library_transfer_package`
Bundles all projects, nodes, documents, cast, lore, and attachments into a unified SQLite transfer package.
- **Command**: `export_library_transfer_package`
- **Arguments**: None
- **Returns**: `Promise<string>` (Base64-encoded package)

### `import_library_transfer_package`
Validates and imports a received package, automatically remapping collision names (`[Title] (Transferred)`).
- **Command**: `import_library_transfer_package`
- **Arguments**: `{ package_base64: string, remote_device_id: string }`
- **Returns**: `Promise<TransferImportResult>`

### `list_transfer_logs`
Retrieves past transfer audit records.
- **Command**: `list_transfer_logs`
- **Arguments**: None
- **Returns**: `Promise<TransferLog[]>`

---

## 10. Settings & System IPC

- `get_setting(key: string)`: Retrieves global user preference.
- `set_setting(key: string, value: string)`: Stores preference key-value pair.
- `get_all_settings()`: Retrieves complete settings map.
- `close_splashscreen()`: Closes desktop startup window and displays the main application workspace.

---

## 11. Client Services Directory

| Service | File | Primary Responsibility |
| :--- | :--- | :--- |
| `projectService` | `src/services/projectService.ts` | Novel project CRUD and dashboard statistics |
| `manuscriptService` | `src/services/manuscriptService.ts` | Tree hierarchy, document autosave, rollups, drag-drop reordering |
| `versionService` | `src/services/versionService.ts` | Manuscript snapshots and side-by-side revision rollback |
| `goalsService` | `src/services/goalsService.ts` | Word targets, daily goals, and streak calculation |
| `sessionService` | `src/services/sessionService.ts` | Writing session tracking and velocity calculation |
| `characterService` | `src/services/characterService.ts` | Cast dossiers and interactive relationship graph edges |
| `locationService` | `src/services/locationService.ts` | Setting profiles and geography notes |
| `worldbuildingService` | `src/services/worldbuildingService.ts` | 9 categories of lore and world rules |
| `timelineService` | `src/services/timelineService.ts` | Chronological events, fictional calendars, participant links |
| `noteService` | `src/services/noteService.ts` | Notebook CRUD, categories, pinning, archival toggle |
| `tagService` | `src/services/tagService.ts` | Global taxonomy, entity associations |
| `attachmentService` | `src/services/attachmentService.ts` | File persistence, system viewer opening, folder reveal |
| `searchService` | `src/services/searchService.ts` | Global search query execution and grouping |
| `crossLinkService` | `src/services/crossLinkService.ts` | Automated backlink aggregation |
| `exportService` | `src/services/exportService.ts` | Word (.docx), Markdown, and Plain Text manuscript compiling |
| `backupService` | `src/services/backupService.ts` | `.writein` archive backups and restorations |
| `trashService` | `src/services/trashService.ts` | Project trash bin recovery and purge operations |
| `transferService` | `src/services/transferService.ts` | Orchestrates sender/receiver device transfer workflows |
| `transferCrypto` | `src/services/transferCrypto.ts` | Ephemeral ECDH key agreement, HKDF, and AES-256-GCM encryption |
| `transferClient` | `src/services/transferClient.ts` | Communicates with the Cloudflare Worker transfer relay |
| `updater` | `src/lib/updater.ts` | Single-flight cached update check, download, and relaunch |
| `deepLinkService` | `src/services/deepLinkService.ts` | Parses and routes incoming `writein://` URIs |
| `pasteSanitizer` | `src/utils/pasteSanitizer.ts` | Sanitizes external clipboard content preserving semantic styles |
