# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [4.2.1] - 2026-09-30

### Fixed
- **Desktop Environment Detection**: Corrected Vite's `envPrefix` in `vite.config.ts` from `['VITE_', 'TAURI_ENV_*']` to `['VITE_', 'TAURI_ENV_']` so runtime environment variables (`TAURI_ENV_PLATFORM`) are exposed cleanly.
- **Tauri IPC Desktop Guard**: Enhanced `isDesktopTauri()` with multi-tier fallback checks (`isTauri()`, `TAURI_ENV_PLATFORM`, and non-mobile user agent validation) ensuring updater and native desktop hooks initialize reliably.

### Changed
- **Packaging Metadata**: Standardized application `productName` to **WriteIn** across `package.json` and `tauri.conf.json`.
- **Installer Settings**: Added official publisher metadata, copyright notice, category (`Productivity`), application descriptions, custom installer icon, and English language specification for Windows NSIS and MSI installers.
- **Website Downloads**: Updated landing page download links and version badges to point directly to `v4.2.1` release assets.

---

## [4.2.0] - 2026-09-29

### Added
- **Zero-Knowledge Device Transfer**: End-to-end encrypted device-to-device library migration across desktop PCs:
  - Ephemeral 10-minute pairing codes (`XXXX-XXXX`).
  - Client-side Web Crypto pipeline (ECDH P-256 key agreement, HKDF-SHA256 key derivation, AES-256-GCM authenticated encryption).
  - SHA-256 package checksum verification for tamper detection.
  - Conflict-safe, atomic SQLite import transactions (`[Title] (Transferred)` renaming).
  - `DeviceTransferView` in `Settings > Devices` with real-time stage progression and transfer audit history.
- **Transfer Audit Table**: SQLite Migration 006 adding `transfer_logs` table.
- **Development Relay Switcher**: Added dev-mode relay switcher allowing local relay testing (`127.0.0.1:8787`) alongside production Cloudflare Worker.

### Fixed
- **CSPRNG Hardening (CWE-338)**: Replaced pseudo-random math calls with cryptographically secure random number generators (`crypto.getRandomValues`) for session tokens, mock IDs, and fallback device identifiers.
- **Transfer Relational Integrity**: Attachment IDs and foreign keys are dynamically remapped during library import to guarantee integrity.
- **Cancellation Safety**: Immediate invalidation of session credentials and local buffers upon user cancellation.

### Security
- Rotated minisign signing keys for the Tauri v2 auto-updater.

---

## [4.1.0] - 2026-09-26

### Added
- **Smart Paste Sanitization**: Configurable paste behavior in Editor Preferences (`match-style`, `keep-format`, `plain-text`), stripping external fonts, inline styles, and CSS while preserving semantic formatting.
- **Plain Text Shortcut**: Supported `Ctrl + Shift + V` for instant plain-text paste.
- **Character Relationship Presets**: Added expanded relationship options (`Friend`, `Ex-Partner`, `Rival`, `Mentor`, etc.).

### Fixed
- **Cursor Jumping on Auto-Save**: Guarded TipTap `setContent` during background autosave passes to prevent cursor jump to document end.
- **Manuscript Word Count Bleed**: Isolated dirty state and word count propagation during rapid chapter navigation.

---

## [4.0.0] - 2026-09-26

### Added
- **MS Word (.docx) Compilation**: Industry-standard manuscript compilation engine generating compliant Office Open XML packages (1-inch margins, 12pt Times New Roman, 1.5 line spacing, 0.5-inch paragraph indents, front-matter title page, and scene breaks).
- **Intelligent Manuscript Importer**: Automatic parsing of text and Markdown files with chapter heading detection.
- **Project Trash Can**: Non-destructive deletion with serialized JSON snapshots and atomic restoration.
- **Project Backups**: One-click `.writein` compressed archive export and import.

---

## [3.0.0] - 2026-09-25

### Added
- **Writing Goals & Streaks**: Daily, chapter, and overall project word targets with completion streaks and progress rings.
- **Writing Sessions & Velocity**: Real-time interval tracking computing duration, net words written, and words-per-minute velocity.
- **Document Version History**: Capture immutable manuscript snapshots, inspect side-by-side diffs, and restore earlier drafts.
- **Writing Sessions Migration**: SQLite Migration 005 adding `writing_sessions` table.

---

## [2.0.0] - 2026-09-22

### Added
- **Tauri v2 Auto-Updater**: Background update detection on startup, manual preferences check, and minisign cryptographic verification.
- **Automated Version Tooling**: `scripts/set-version.ps1` and `pnpm version:set` with UTF-8 encoding protection and SemVer validation.
- **Deep Linking Protocol**: Custom `writein://` URI scheme registration for desktop launching and external integrations.

---

## [1.0.0] - 2026-09-20

### Added
- Initial public release of WriteIn desktop studio.
- Complete three-pane writer's desk layout with Warm Paper and Midnight Ink themes.
- Manuscript hierarchy tree (Parts, Chapters, Scenes) with drag-and-drop reordering.
- Rich prose editor powered by TipTap and ProseMirror with 1,000ms debounced autosave.
- Story Bible (Character dossiers, SVG relationship graph, location dossiers, 9-domain lore encyclopedia).
- Narrative timeline with custom fantasy calendar labels and participant junctions.
- Writer's notebook scratchpad with categorization and pinning.
- Project-wide global search (`Ctrl + K`) with keyword highlighting.
- Local SQLite database architecture with WAL mode and foreign key cascades.
