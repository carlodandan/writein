# Testing Strategy & Automated Test Suite — WriteIn

WriteIn uses a dual-layer automated testing strategy combining **Vitest** for the React frontend, text analysis, UI components, client cryptography, and service operations, with **Rust Native Tests** for SQLite operations, schema migrations, foreign keys, secure filesystem storage, and repository CRUD logic.

---

## 1. Test Suite Summary

| Test Layer | Test Runner | Test Files | Total Tests | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend & Services** | Vitest (jsdom) | 42 suites | 187 tests | **All Passed (100%)** |
| **Backend & Repositories** | Cargo Test | Rust binary | 37 tests | **All Passed (100%)** |
| **Total Automated Coverage** | — | — | **224 tests** | **0 Failures** |

---

## 2. Frontend Tests (Vitest)

### Running Tests
Run all frontend test suites:
```pwsh
pnpm test
```

Watch mode during active development:
```pwsh
pnpm test:watch
```

Run a specific suite:
```pwsh
pnpm test src/tests/transferCrypto.test.ts
```

### Vitest Test Suites Inventory

#### A. Core Text Analysis & Manuscript Mechanics
- `src/tests/projectService.test.ts` (4 tests): Project creation, retrieval, updates, listing, and summary statistics.
- `src/tests/wordCount.test.ts` (9 tests): Validates standard prose word counts, empty strings, dialogue quotes, em-dashes (`"love—hate"` -> 2 words), embedded numbers, Unicode/CJK scripts, and character counts with/without spaces.
- `src/tests/manuscriptHierarchy.test.ts` (6 tests): Validates hierarchy rules (Parts at root, Chapters in Parts, Scenes in Chapters), cycle prevention, sequential naming, and tree transformations.
- `src/tests/manuscriptOrdering.test.ts` (1 test): Validates manual drag-and-drop reordering and contiguous sort order index maintenance.
- `src/tests/manuscriptService.test.ts` (4 tests): Validates tree fetching, inline title editing, document autosaving, and chapter duplication.
- `src/tests/manuscriptComponents.test.tsx` (6 tests): Tests `EditorStatus` states (`saving`, `saved`, `unsaved`, `error`), `FindReplaceBar` key handling, and `ManuscriptTreeNode` rename confirmations.

#### B. Story Bible & Knowledge Graph
- `src/tests/characterService.test.ts` (3 tests): Character CRUD, role hierarchy sorting, and cascade deletions.
- `src/tests/relationshipGraph.test.ts` (8 tests): Radial circular layout geometry, centering, edge mappings, and narrative role styling.
- `src/tests/characterRelationshipMap.test.tsx` (7 tests): Graph rendering, node interactions, and edge creation modals.
- `src/tests/locationService.test.ts` (2 tests): Setting dossiers, atmosphere attributes, and location queries.
- `src/tests/worldbuildingService.test.ts` (2 tests): Lore article filtering across 9 domains and article CRUD.
- `src/tests/timelineService.test.ts` & `timelineSorting.test.ts` (6 tests): Chronological event ordering, custom fantasy calendars, and participant junctions.
- `src/tests/noteService.test.ts` (4 tests): Notebook scratchpad operations, pinning, and soft archiving.
- `src/tests/tagService.test.ts` (5 tests): Taxonomy management and polymorphic entity tag associations.
- `src/tests/attachmentService.test.ts` (7 tests): Filesystem reference metadata, lightbox view models, and system file manager folder reveal triggers.
- `src/tests/searchService.test.ts` & `searchHighlight.test.ts` (12 tests): Project-wide multi-entity search and `<mark>` text highlight token generation.
- `src/tests/crossLink.test.ts` (4 tests): Bidirectional backlink graph resolution.

#### C. Writing Tools, Goals & Version History
- `src/tests/writingGoals.test.ts` & `goalsService.test.ts` (6 tests): Target word goal progress percentages, completion states, exceeded goal flags, and safe division boundaries.
- `src/tests/writingSession.test.ts` (3 tests): Session tracking intervals, elapsed duration, and typing velocity (words-per-minute).
- `src/tests/versionHistory.test.ts` (3 tests): Snapshot creation, side-by-side diffing, and revision restoration.
- `src/tests/pasteSanitizer.test.ts` & `editorPreferences.test.ts` (13 tests): Smart clipboard paste behavior (`match-style`, `keep-format`, `plain-text`), stripping unwanted CSS/fonts while preserving bold and italic tags.

#### D. Compilation, Import & Export
- `src/tests/docxCompiler.test.ts` & `manuscriptCompiler.test.ts` (10 tests): Generates valid Office Open XML packages adhering to publishing guidelines (1-inch margins, 12pt Times New Roman, 1.5 line spacing, 0.5-inch indents, title page front-matter, and scene breaks).
- `src/tests/manuscriptImporter.test.ts` (4 tests): Intelligent parsing of plain text and Markdown files, splitting chapters automatically via regex matching.
- `src/tests/exportService.test.ts` & `exportSaveFlow.test.ts` (8 tests): Native file dialog saves and browser download fallbacks.
- `src/tests/backupService.test.ts` & `trashService.test.ts` (7 tests): `.writein` archive backup packaging and non-destructive trash restoration.

#### E. Device Transfer & Zero-Knowledge Cryptography
- `src/tests/transferCrypto.test.ts` (5 tests): Ephemeral ECDH (P-256) key agreement, HKDF-SHA256 key derivation, AES-256-GCM encryption/decryption, and SHA-256 package checksum tamper detection.
- `src/tests/transferService.test.ts` (6 tests): End-to-end device transfer simulation across sender and receiver states.
- `src/tests/DeviceTransferView.test.tsx` (5 tests): UI rendering of pairing codes, 10-minute expiry countdown timers, stage progressions, and audit history.

#### F. Auto-Updater & System Services
- `src/tests/changelog.test.tsx` (13 tests): Release data, modal preferences and keyboard focus, and startup checks including StrictMode replay and canceled timers.
- `src/tests/updater.test.ts` (3 tests): Desktop environment checks, mock fallbacks, and update installation.
- `src/tests/useUpdater.test.tsx` & `updaterComponents.test.tsx` (5 tests): React hook state machine and modal notifications.
- `src/tests/deepLinkService.test.ts` (2 tests): `writein://` custom URI scheme parsing and navigation.
- `src/tests/appVersion.test.ts` & `logger.test.ts` (4 tests): Cached version lookups and diagnostic log outputs.

---

## 3. Backend Tests (Rust / Cargo Test)

### Running Tests
Execute all native Rust tests:
```pwsh
cd src-tauri
cargo test
```

### Rust Test Inventory (37 Passing Tests)
- **Migrations & Schemas**: `test_migrations_run_successfully` (runs all migrations 001–006 on clean in-memory database and tests idempotency).
- **Projects**: `test_create_and_get_project`, `test_update_project`, `test_delete_project`, `test_list_projects`, `test_empty_title_validation`.
- **Manuscripts & Documents**: `test_create_and_query_tree`, `test_hierarchy_validation_rules`, `test_cycle_prevention`, `test_duplicate_chapter`, `test_save_document_and_word_count_rollup`.
- **Characters & Cast**: `test_character_crud_and_sorting`, `test_relationships_and_foreign_key_cascade`.
- **Locations & Worldbuilding**: `test_location_crud`, `test_worldbuilding_crud_and_category_filtering`.
- **Timelines & Notes**: `test_timeline_crud_and_sorting`, `test_note_crud_and_archiving`.
- **Tags & Links**: `test_tags_crud_and_entity_linking`, `test_assign_and_remove_tag_explicitly`, `test_cross_link_query`.
- **Attachments & Security**: `test_filename_sanitization_and_security`, `test_attachment_crud_and_entity_linking`.
- **Search Engine**: `test_global_search_across_entities`, `test_realistic_search_dataset_with_maria`, `test_search_performance_with_large_dataset`.
- **Goals & Sessions**: `test_writing_goals_crud`, `test_writing_session_start_and_end`.
- **Versions & Trash**: `test_version_snapshot_crud`, `test_trash_lifecycle`.
- **Compilers & Backups**: `test_compile_manuscript_and_story_bible`, `test_backup_and_restore_roundtrip`, `writes_only_once_to_a_native_dialog_selection`, and 3 camelCase serialization tests.
- **Device Transfer**: `test_device_id_generation_and_persistence`, `test_library_export_and_import_roundtrip`.
