# Testing Strategy & Automated Test Suite — WriteIn

WriteIn uses a dual-layer automated testing strategy combining **Vitest** for the React frontend, text analysis, UI components, and client service operations, with **Rust Native Tests** for SQLite operations, schema migrations, foreign keys, secure filesystem storage, and repository CRUD logic.

---

## 1. Frontend Tests (Vitest)

Run all frontend tests:
```pwsh
pnpm test
```

Watch mode during active development:
```pwsh
pnpm test:watch
```

**Total Vitest Suites**: 19 test files, 84 passing tests (0 failures).

### Test Suites Overview

#### A. Word & Character Counting (`src/tests/wordCount.test.ts`)
Validates:
- Standard prose word counts (`"Hello world"` -> 2 words)
- Empty strings, whitespace-only, `null`, and `undefined` safely returning 0 words and characters
- Punctuation, ellipses, and dialogue quotes (`'"I don\'t think so," she whispered.'` -> 6 words)
- Em-dashes (`"love—hate"` -> 2 words) and hyphenated compounds
- Embedded numbers in text (`"In 2024, there were 42 cats."` -> 6 words)
- Unicode characters, CJK scripts, and diacritics
- Total character counts with and without whitespace

#### B. React Component Tests (`src/tests/manuscriptComponents.test.tsx`)
Validates user interaction and reactive UI behavior:
- `EditorStatus`: Renders all 4 save states (`saving`, `unsaved`, `saved`, `error`) and distinguishes characters with vs. without spaces.
- `FindReplaceBar`: Search input handling, key navigation, and closing cleanly on `Escape`.
- `ManuscriptTreeNode`: Inline title editing, confirming on `Enter`, and canceling on `Escape` without altering the original title.

#### C. Writing Goals Calculations (`src/tests/writingGoals.test.ts`)
Validates:
- Progress percentage calculation (750 / 1,000 words -> 75%)
- Reached and completed goals (5,000 / 5,000 words -> 100%, `isCompleted: true`)
- Exceeded goals (1,500 / 1,000 words -> 150%, `isExceeded: true`)
- Zero goal boundaries (safe division, no NaN/Infinity)
- Negative or invalid numbers gracefully normalized to 0

#### D. Project Client Service (`src/tests/projectService.test.ts`)
Validates:
- Project list retrieval
- New project creation and immediate retrieval by ID
- Project updates (title, genre, status transitions)
- Project summary statistics aggregation

#### E. Manuscript Hierarchy & Validation (`src/tests/manuscriptHierarchy.test.ts`)
Validates:
- Part placement at root level only
- Chapter placement at root or inside Part
- Scene placement inside Chapter only
- Cycle prevention (blocking move into self or own descendants)
- Sequential default title generation (Part I, Chapter 01, Scene 01)
- Flat node list to hierarchical tree transformation preserving sort order

#### F. Manuscript Ordering & Drag-and-Drop (`src/tests/manuscriptOrdering.test.ts`)
Validates:
- Moving Chapter 3 before Chapter 1 and verifying resulting sort_order
- Maintaining contiguous sort indices across sibling nodes

#### G. Manuscript Client Service (`src/tests/manuscriptService.test.ts`)
Validates:
- Fetching manuscript tree for project
- Node creation and inline title renaming
- Document autosave and word count persistence
- Node duplication cloning contents and child scenes

#### H. Character Service & Relationships (`src/tests/characterService.test.ts`)
Validates:
- Fetching project characters with role ordering (Protagonist -> Antagonist -> Supporting -> Minor)
- Character creation, profile updates, and cascade deletion
- Relationship creation linking character A and character B with relation types and descriptions
- Relationship updates and relationship deletion

#### I. Character Relationship Graph Geometry (`src/tests/relationshipGraph.test.ts`)
Validates:
- Circular radial layout calculation for SVG canvas
- Single-node centering and empty-set safety
- Relationship mapping to graph edges
- Distinct visual styling tokens across narrative roles

#### J. Location Service (`src/tests/locationService.test.ts`)
Validates:
- Location listing, retrieval by UUID
- Creation with setting types, atmospheres, appearances, and inhabitants
- Location updates and deletion

#### K. Worldbuilding Service (`src/tests/worldbuildingService.test.ts`)
Validates:
- Category filtering across story bible domains (History, Culture, Magic System, Factions, etc.)
- Article creation, content updates, and deletion

#### L. Timeline Service & Sorting (`src/tests/timelineService.test.ts` & `timelineSorting.test.ts`)
Validates:
- Timeline event creation with fictional date labels (`date_label`), sort collation (`date_value`), and time of day
- Importance level assignments (`critical`, `high`, `normal`, `low`)
- Multi-character participant links (`character_ids`)
- Updates, event deletion, and bidirectional sort queries (ascending/descending)

#### M. Note Service (`src/tests/noteService.test.ts`)
Validates:
- Category filtering (`Ideas`, `Plot`, `Dialogue`, `Research`, etc.)
- Creation, retrieval, prose updates, and deletion
- Soft-archiving and restoration without data loss (`toggleArchive`)

#### N. Tag Service (`src/tests/tagService.test.ts`)
Validates:
- Project tag retrieval with usage counts
- Tag creation and inline renaming
- Associating tags with entities (`setEntityTags`, `assignTag`, `removeTag`)
- Safe tag deletion without destroying tagged story entities

#### O. Global Search Service & Highlighting (`src/tests/searchService.test.ts` & `searchHighlight.test.ts`)
Validates:
- Cross-entity query execution across chapters, characters, locations, worldbuilding lore, notes, and timeline events
- Substring match splitting, case-insensitivity, and `<mark>` token generation
- SQL wildcard and special character handling (`%`, `_`, `'`, `"`, `;--`)

#### P. Attachments & File References (`src/tests/attachmentService.test.ts`)
Validates:
- Attachment metadata persistence
- Base64 file saving
- Strict path-traversal prevention (`../../../../etc/passwd` and `..\\..\\Windows\\System32\\cmd.exe`)
- System viewer launching and folder reveal

#### Q. Cross-Link & Backlinks Engine (`src/tests/crossLink.test.ts`)
Validates:
- Backlink aggregation across characters, locations, chapters, and timeline events
- Empty backlink safety

---

## 2. Backend Tests (Rust `cargo test`)

Run all backend tests:
```pwsh
cd src-tauri
cargo test
```

**Total Rust Unit Tests**: 25 passing tests (0 failures).

### Test Coverage Highlights

1. **`test_migrations_run_successfully`**: Verifies Migrations 001, 002, 003, and 004 execute idempotently with foreign keys and WAL mode.
2. **`test_create_and_query_tree`**: Verifies Part, Chapter, and Scene tree creation and retrieval.
3. **`test_hierarchy_validation_rules`**: Confirms strict hierarchy rules (Scenes cannot parent Chapters, etc.).
4. **`test_cycle_prevention`**: Confirms cyclical parent reassignment is blocked and returns an error.
5. **`test_duplicate_chapter`**: Verifies deep cloning of a chapter, its document, and child scenes with new IDs.
6. **`test_save_document_and_word_count_rollup`**: Validates document persistence and automatic recursive word rollups to parent nodes.
7. **`test_character_crud_and_sorting`**: Verifies character dossiers and ordering by narrative role.
8. **`test_relationships_and_foreign_key_cascade`**: Validates character relationships and automatic cascading deletion when a character is deleted.
9. **`test_location_crud`**: Tests location records, types, atmospheres, and tags.
10. **`test_worldbuilding_crud_and_category_filtering`**: Tests lore articles and category filtering across 9 domains.
11. **`test_timeline_crud_and_sorting`**: Tests timeline events, flexible fantasy dates, and ordering.
12. **`test_note_crud_and_archiving`**: Tests notebook entries, pinning, and soft archiving.
13. **`test_tags_crud_and_entity_linking`**: Tests tag creation, polymorphic entity association, and usage counts.
14. **`test_assign_and_remove_tag_explicitly`**: Tests adding and removing tags from individual entities.
15. **`test_filename_sanitization_and_security`**: Validates strict rejection of directory traversal (`../`, `..\`) and illegal characters.
16. **`test_attachment_crud_and_entity_linking`**: Tests attachment metadata and filesystem storage.
17. **`test_cross_link_query`**: Tests automated backlink aggregation across all entity types.
18. **`test_global_search_across_entities`**: Tests parameterized SQL multi-entity search.
19. **`test_realistic_search_dataset_with_maria`**: Tests realistic novel datasets with Maria Santos, Carlo Reyes, Anna Cruz, scenes, and lore.
20. **`test_search_performance_with_large_dataset`**: Stress tests 2,900+ items, executing global search in < 1ms (well below 50ms budget).

---

## 3. Production Build Verification

Verify that TypeScript compiles with strict checking and Vite generates optimized bundles:
```pwsh
pnpm build
```

Verify that Tauri compiles cleanly:
```pwsh
cd src-tauri
cargo check
cargo test
```
