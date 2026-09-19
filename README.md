# WriteIn — Offline Novel & Writing Manager

[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen.svg)]()
[![Platform](https://img.shields.io/badge/Platform-Windows%20Desktop%20%7C%20Tauri%202.0-blue.svg)]()
[![Database](https://img.shields.io/badge/Database-SQLite%203%20(Local%20WAL)-orange.svg)]()
[![License](https://img.shields.io/badge/License-Proprietary-lightgrey.svg)]()

**WriteIn** is a private, offline-first desktop application designed for novelists and long-form fiction writers who want to write, organize, research, and manage complex stories without relying on cloud services.

> **Scrivener-lite + personal writing notebook + story database**

---

## Key Highlights

- **100% Offline & Private**: Zero accounts, zero cloud dependencies, zero telemetry, and zero ads. All data remains completely sovereign on your local machine.
- **Isolated SQLite Storage**: Each novel is saved in its own self-contained database (`%APPDATA%/WriteIn/projects/{project-id}/project.db`), enabling effortless portability, backups, and snapshotting.
- **A Modern Writer's Desk**: Distraction-free typography, warm paper palettes, and a balanced three-pane workspace tailored for creative flow.
- **Manuscript Hierarchy**: Parts, chapters, and scenes with nested structure, live word/character counts, rollup statistics, inline title editing, and drag-and-drop organization.
- **Rich Prose Editor**: Clean formatting (H1–H3, bold, italic, quotes, scene dividers), in-document Find & Replace (`Ctrl+F`), 1,000ms debounced autosave, manual save (`Ctrl+S`), and Distraction-Free Writing Mode.
- **Story Bible & Cast Graph**: Character dossiers with personality traits and custom attributes, linked via an interactive visual SVG relationship map.
- **Settings & Worldbuilding**: Location profiles with sensory atmosphere quotes and a 9-domain lore encyclopedia.
- **Timeline & Chronology**: Event tracking with custom fantasy calendars, importance flags, participating characters, and chapter links.
- **Writer's Notebook**: Multi-category scratchpad with quick capture, tagging, pinning, and soft archiving.
- **Global Project Search (`Ctrl + K`)**: Lightning-fast SQLite search across scenes, characters, lore, timeline, notes, and tags with keyword highlighting.
- **Secure References & Attachments**: Filesystem-backed storage for research PDFs, images, maps, and documents with lightbox previews and Windows Explorer integration.
- **Dynamic Cross-Linking**: Contextual inspector automatically aggregating connected characters, locations, events, and attachments.

---

## Documentation Directory

WriteIn includes a complete suite of documentation for authors and developers:

| Document | Description |
| :--- | :--- |
| 📖 **[TUTORIAL.md](file:///c:/Users/Administrator/Desktop/build/Write%20In/docs/TUTORIAL.md)** | **Author's Step-by-Step User Guide & Tutorial on how to use every feature in WriteIn.** |
| 🏛️ **[ARCHITECTURE.md](file:///c:/Users/Administrator/Desktop/build/Write%20In/docs/ARCHITECTURE.md)** | System architecture, C4 diagrams, subsystem designs, and security sandbox. |
| 🗄️ **[DATABASE.md](file:///c:/Users/Administrator/Desktop/build/Write%20In/docs/DATABASE.md)** | Relational SQLite schema, migrations (001–004), Mermaid ER diagrams, and indexes. |
| 🔌 **[API.md](file:///c:/Users/Administrator/Desktop/build/Write%20In/docs/API.md)** | Complete developer reference for Tauri IPC commands and TypeScript services. |
| 🧪 **[TESTING.md](file:///c:/Users/Administrator/Desktop/build/Write%20In/docs/TESTING.md)** | Automated Vitest and Rust test suites, coverage strategy, and test isolation. |

---

## Technology Stack

- **Desktop Shell**: [Tauri 2.0](https://v2.tauri.app/)
- **Backend Core**: Rust (memory-safe, high-performance)
- **Local Database**: SQLite 3 via `rusqlite` (bundled, WAL mode, foreign key cascades)
- **Frontend**: React 19 + TypeScript (strict mode)
- **Editor Engine**: TipTap / ProseMirror
- **Styling**: Tailwind CSS v4 ("A modern writer's desk" paper & ink design system)
- **Icons**: Lucide React
- **Test Runners**: Vitest (frontend) & Cargo Test (backend)

---

## Development & Build Commands

### Prerequisites
- Node.js (v18+ or v20+) & `pnpm`
- Rust toolchain (`cargo`, `rustc`)
- Windows 10/11 with WebView2 runtime

### Install Dependencies
```pwsh
pnpm install
```

### Launch Development Desktop App
```pwsh
pnpm tauri dev
```

### Run Browser Preview (with simulated IPC fallback)
```pwsh
pnpm dev
```

### Run Automated Tests
```pwsh
# Run all Vitest frontend suites (19 test files, 84 tests)
pnpm test

# Run all Rust backend tests (25 unit tests)
cd src-tauri
cargo test
```

### Build Production Desktop Application
```pwsh
pnpm build
pnpm tauri build
```
The compiled installer (`.msi` / `.exe`) will be generated in `src-tauri/target/release/bundle/`.

---

## Data Storage Location

On Windows, all projects and settings are saved under your local user profile:
```text
C:\Users\<YourUsername>\AppData\Roaming\WriteIn\
├── app.db                                     # App preferences & project index
└── projects\
    └── {project-id}\                          # Self-contained novel directory
        ├── project.db                         # SQLite database for this novel
        └── attachments\                       # Local images, PDFs, and maps
```

To backup your novel, simply copy the `{project-id}` directory.
