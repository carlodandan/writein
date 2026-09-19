# Architecture & System Design — WriteIn

WriteIn is an offline-first, local-first Windows desktop application tailored for long-form fiction writers and novelists (*"Scrivener-lite + personal writing notebook + story database"*).

---

## 1. High-Level Architecture (C4 Component Model)

WriteIn strictly isolates responsibilities across four clean architectural tiers:

```mermaid
graph TD
    subgraph UI ["Tier 1: Presentation & Workspace (React 19 + TypeScript)"]
        Desk["Writer's Desk Canvas"]
        Tree["Manuscript Hierarchy Tree"]
        Editor["TipTap Rich Prose Editor"]
        Bible["Story Bible (Cast, Settings, Lore)"]
        Org["Organization (Timeline, Notes, Attachments)"]
        Palette["Global Search & Command Palette (Ctrl+K)"]
    end

    subgraph Service ["Tier 2: Client Services & State Management"]
        Contexts["Context Providers (ManuscriptContext, ProjectContext)"]
        Services["Domain Services (manuscriptService, searchService, etc.)"]
        IPC["Typed Tauri IPC Bridge (tauriIpc.ts)"]
    end

    subgraph Backend ["Tier 3: Rust Core & IPC Handlers (Tauri 2.0)"]
        Commands["Tauri Command Handlers (11 Domain Modules)"]
        Validation["Security & Hierarchy Validation Layer"]
        Repos["Rust Repositories (rusqlite)"]
    end

    subgraph Storage ["Tier 4: Local Storage & Sovereignty"]
        SQLite["SQLite 3 Database (WAL Mode, Foreign Keys ON)"]
        Filesystem["Local Filesystem Sandbox (%APPDATA%/WriteIn/)"]
    end

    Desk --> Contexts
    Tree --> Contexts
    Editor --> Contexts
    Bible --> Services
    Org --> Services
    Palette --> Services

    Contexts --> Services
    Services --> IPC
    IPC --> Commands
    Commands --> Validation
    Validation --> Repos
    Repos --> SQLite
    Repos --> Filesystem
```

---

## 2. Directory Layout & Local Data Sovereignty

All user data lives strictly on the local machine under the OS application data path (`%APPDATA%/WriteIn/` on Windows) without any third-party cloud services or telemetry:

```text
%APPDATA%/WriteIn/
├── app.db                                     # Global application state & project registry
└── projects/
    └── {project-id}/                          # Isolated project sandbox
        ├── project.db                         # Complete self-contained SQLite novel database
        ├── attachments/                       # Secure local file repository
        │   └── {attachment-id}/
        │       └── {sanitized_filename}       # Character portraits, reference PDFs, maps
        ├── versions/                          # Document snapshot archives
        └── backups/                           # Automatic snapshots before destructive ops
```

### Benefits of Self-Contained Project Databases
1. **Zero Cross-Contamination**: Corruption in one project cannot impact other books.
2. **Instant Backups**: An entire novel is backed up by copying a single directory.
3. **Portability**: Writers can transfer their `{project-id}` directory to another computer with zero cloud dependence.

---

## 3. Technology Stack

- **Tauri 2.0**: Native desktop runtime with lightweight OS webview.
- **Rust**: Memory-safe, high-performance backend managing SQLite operations, filesystem access, path sanitization, and data migrations.
- **SQLite 3 (`rusqlite` bundled)**: Embedded transactional database running in WAL mode with foreign keys enabled.
- **React 19 & TypeScript**: Strict type-safe reactive UI.
- **Tailwind CSS v4**: High-speed utility styling configured with "A modern writer's desk" paper and ink design tokens.
- **TipTap / ProseMirror**: Robust, extensible rich-text editing engine.
- **Vitest & React Testing Library**: Unit and integration test suite.
- **Lucide React**: Crisp, accessible iconography.

---

## 4. Subsystem Architectures

### A. Manuscript & Document Subsystem (Phase 2)
- **Hierarchy Structure**: Directed acyclic tree: `Folder (Part) -> Chapter -> Scene`.
- **Validation Engine**: Rust validates moves to prevent circular hierarchies ($O(N)$ cycle detection using recursive ancestor queries).
- **Word Count Rollup**: When scene documents are saved, the backend updates the scene word count and recursively rolls up total word counts to parent chapters and parts in a single transaction.
- **Autosave Engine**: 1,000ms debounced auto-persist with unmount/window beforeunload flushes to ensure zero lost words.

### B. Story Bible & Cast Graph (Phase 3)
- **Character Dossiers**: Stores narrative roles, personality profiles, and dynamic JSON custom fields.
- **Visual Relationship Map**: Interactive SVG network with draggable nodes, zoom/pan transform controls, and relational edge labels.
- **Lore Encyclopedia**: Two-column categorized lore manager covering 9 domains with real-time tag filtering.

### C. Knowledge Management & Timeline (Phase 4)
- **Fictional Dates Engine**: Distinguishes between sortable collation keys (`date_value`) and rich fantasy date labels (`date_label` e.g., *"3rd Year of the Red Moon"*).
- **Categorized Notebook**: Multi-category notes with quick capture, search, tag association, pinning, and soft archiving.
- **Project-wide Global Search**: Fast SQLite queries with indexed substring matching, multi-entity categorization, and `<mark>` text highlighting.

---

## 5. Security & Attachment Sandbox Architecture

WriteIn enforces strict filesystem sandboxing when handling user attachments:

```mermaid
sequenceDiagram
    participant UI as React Frontend
    participant Rust as Rust Command Handler
    participant Sec as Security Validation
    participant FS as Local Filesystem Sandbox
    participant DB as SQLite Database

    UI->>Rust: save_attachment(project_id, filename, bytes, entity_type, entity_id)
    Rust->>Sec: Sanitize Filename
    Note over Sec: Strips path separators (/, \), null bytes, and traversal tokens (..)
    Rust->>Sec: Validate Extension Whitelist
    Note over Sec: Allows: .png, .jpg, .webp, .svg, .pdf, .docx, .txt, .mp3, etc.
    Rust->>FS: Write to %APPDATA%/WriteIn/projects/{project_id}/attachments/{id}/{filename}
    Rust->>DB: Record attachment metadata & relative path
    DB-->>Rust: Metadata stored
    Rust-->>UI: Return Attachment DTO
```

---

## 6. Backlinks & Cross-Linking Architecture

The cross-linking engine automatically computes a bidirectional knowledge graph across all project entities without duplicate linking tables:

```mermaid
graph LR
    Chapter[Manuscript Chapter / Scene] <--->|related_chapter_id| Event[Timeline Event]
    Event <--->|timeline_event_characters| Character[Character]
    Character <--->|character_relationships| OtherChar[Related Character]
    Event <--->|location_id| Location[Location]
    Chapter <--->|entity_id| Attach[Attachment / Reference]
    Character <--->|entity_id| Attach
    Location <--->|entity_id| Attach
    Tag[Tag] <--->|entity_tags| Chapter
    Tag <--->|entity_tags| Character
    Tag <--->|entity_tags| Location
```

When any entity is selected, `get_related_content` queries the graph to present all connected entities in the right-hand **Inspector** panel.

---

## 7. Crash Resilience & Data Safety

1. **Write-Ahead Logging (WAL)**: SQLite writes changes to a `.db-wal` file sequentially, preventing corruption in case of unexpected shutdown or power loss.
2. **Atomic Multi-Entity Operations**: Tree reordering, node duplication, and status updates run inside atomic SQL transactions.
3. **Save-Before-Navigate**: Switching chapters or closing the application forcibly flushes any uncommitted keystroke buffer.
4. **Non-Destructive Deletions**: Deleting manuscript nodes requires explicit confirmation, preserving authorial intent.
