# WriteIn — Author's User Guide & Tutorial

Welcome to **WriteIn**, your private, distraction-free desktop writing studio.

WriteIn is crafted specifically for long-form fiction writers, novelists, and worldbuilders who desire the organizational depth of tools like Scrivener paired with the focus of a minimalist writing desk—all completely offline, secure, and under your total control.

---

## Table of Contents

1. [Core Philosophy & Privacy](#1-core-philosophy--privacy)
2. [Getting Started & Your First Project](#2-getting-started--your-first-project)
3. [The Workspace: A Modern Writer's Desk](#3-the-workspace-a-modern-writers-desk)
4. [Structuring Your Manuscript](#4-structuring-your-manuscript)
5. [The Prose Editor](#5-the-prose-editor)
6. [Distraction-Free Writing Mode](#6-distraction-free-writing-mode)
7. [In-Document Find & Replace](#7-in-document-find--replace)
8. [The Story Bible: Characters & Cast](#8-the-story-bible-characters--cast)
9. [Interactive Relationship Graph](#9-interactive-relationship-graph)
10. [Locations & Setting Dossiers](#10-locations--setting-dossiers)
11. [Worldbuilding & Lore Encyclopedia](#11-worldbuilding--lore-encyclopedia)
12. [Timelines & Narrative Chronology](#12-timelines--narrative-chronology)
13. [Writer's Notebook & Scratchpad](#13-writers-notebook--scratchpad)
14. [Tags & Cross-Cutting Taxonomy](#14-tags--cross-cutting-taxonomy)
15. [Global Project Search (`Ctrl + K`)](#15-global-project-search-ctrl--k)
16. [Research Files & Attachments](#16-research-files--attachments)
17. [Backlinks & Connected Content](#17-backlinks--connected-content)
18. [Data Sovereignty, Backups & Portability](#18-data-sovereignty-backups--portability)
19. [Writing Goals, Targets & Session Velocity](#19-writing-goals-targets--session-velocity)
20. [Manuscript Snapshots & Version History](#20-manuscript-snapshots--version-history)
21. [Compiling Publication-Ready Books (.docx, .md, .txt)](#21-compiling-publication-ready-books-docx-md-txt)
22. [Intelligent Manuscript Importer](#22-intelligent-manuscript-importer)
23. [Clipboard & Paste Formatting Preferences](#23-clipboard--paste-formatting-preferences)
24. [The Project Trash Can & Item Recovery](#24-the-project-trash-can--item-recovery)
25. [End-to-End Encrypted Device Transfer](#25-end-to-end-encrypted-device-transfer)
26. [Application Updates & Preferences](#26-application-updates--preferences)
27. [Keyboard Shortcuts Reference](#27-keyboard-shortcuts-reference)

---

## 1. Core Philosophy & Privacy

- **100% Local & Offline**: WriteIn never phones home, uses no external cloud servers, collects zero telemetry, and requires no account or subscription.
- **Your Computer, Your Files**: Each novel project is stored in a clean, self-contained SQLite database file inside your personal application folder (`%APPDATA%/WriteIn/projects/{project-id}/`).
- **Non-Destructive by Design**: Edits are safely autosaved, reordering preserves data integrity, and deletions are protected by confirmations.

---

## 2. Getting Started & Your First Project

When you launch WriteIn:

1. **Create or Open a Project**:
   - In the project selector or sidebar, click **"New Project"**.
   - Enter your working **Title** (e.g., *Echoes of the Channel*), **Author Name**, **Genre** (e.g., *Historical Fiction*, *Sci-Fi*, *Fantasy*), and an optional **Target Word Count** (e.g., `80,000` words).
   - Click **Create Project**.
2. **Project Dashboard**:
   - The project dashboard displays your overall manuscript progress, current word count, daily progress toward your target, and recent activity.

---

## 3. The Workspace: A Modern Writer's Desk

WriteIn utilizes a balanced three-pane layout designed to evoke warm paper, ink, and focused concentration:

```text
┌──────────────┬───────────────────────────────────────────┬──────────────┐
│  Navigation  │                                           │  Inspector   │
│   Sidebar    │           Central Writing Canvas          │   & Notes    │
│              │                                           │              │
│ • Manuscript │ [Chapter 01: The Docks                 ]  │ Status:      │
│ • Characters │                                           │ [Draft    ▼] │
│ • Locations  │ The cold North Sea spray clung to the...  │              │
│ • Lore       │                                           │ Word Count:  │
│ • Timeline   │                                           │ 1,842 words  │
│ • Notebook   │                                           │              │
│ • Attachments│                                           │ Related:     │
│ • Tags       │                                           │ • Marcus     │
│              │                                           │ • Harbor     │
└──────────────┴───────────────────────────────────────────┴──────────────┘
```

- **Left Sidebar**: Access all sections of your project: Manuscript tree, Story Bible (Characters, Locations, Lore), Organization (Timeline, Notes, Attachments, Tags), and Settings.
- **Center Canvas**: Your distraction-free workspace. In Manuscript mode, this contains your document header, formatting toolbar, and high-performance rich text editor.
- **Right Inspector**: Context-aware details for the selected document, including status, word count, dates, synopsis, and automatically aggregated related story connections.
- **Appearance Toggle**: Seamlessly switch between **Warm Paper** (light mode) and **Midnight Ink** (dark mode) via the theme toggle in the sidebar.

---

## 4. Structuring Your Manuscript

WriteIn organizes manuscripts in a natural fiction hierarchy:

$$\text{Project} \longrightarrow \text{Parts (Folders)} \longrightarrow \text{Chapters} \longrightarrow \text{Scenes}$$

### Creating Nodes
- Click the **`+`** button in the Manuscript sidebar header or right-click any item:
  - **New Part**: A major structural division (e.g., *Part I: The Departure*).
  - **New Chapter**: A standard chapter container or standalone chapter document.
  - **New Scene**: A focused scene unit inside a chapter.

### Renaming
- **Inline Rename**: Click the chapter title in the tree or the top of the editor canvas, type the new name, and press `Enter` to confirm (or `Escape` to cancel without modifying).

### Reordering & Drag-and-Drop
- Grab the drag handle on the left of any manuscript node to reorder siblings or drag scenes into/out of chapters.
- WriteIn automatically validates hierarchy rules:
  - Scenes cannot contain chapters or parts.
  - Nodes cannot be dragged into their own descendants (preventing circular loops).

### Duplicating & Deleting
- **Duplicate**: Choose **Duplicate** from the node action menu to clone a chapter or scene along with all its text content and formatting.
- **Delete**: Choose **Delete** to safely remove a node. A confirmation dialog prevents accidental loss.

---

## 5. The Prose Editor

The center editor is a custom-engineered rich-text prose editor built for smooth typing even in 50,000+ word documents:

### Formatting Options
The top toolbar provides essential formatting without visual clutter:
- **Headings**: H1, H2, H3 for chapter titles and section dividers.
- **Inline Styles**: Bold (`Ctrl+B`), Italic (`Ctrl+I`), Underline (`Ctrl+U`), Strikethrough.
- **Blocks**: Bulleted lists, numbered lists, blockquotes (for letters, epigraphs, or diary entries), and horizontal rules (scene break dividers `***`).

### Live Word & Character Counts
- The bottom status bar shows your live document **Word Count**, **Character Count** (including spaces), and **Characters excluding spaces**.
- As you type in scenes, word counts automatically roll up into the parent chapter and part totals in the tree.

### Unsaved Content Protection & Autosave
- **Debounced Autosave**: Changes are automatically saved to SQLite 1,000 milliseconds after your last keystroke.
- **Save Status Indicator**: The status pill tracks your state:
  - `Unsaved edits` (yellow amber)
  - `Saving changes...` (blue pulsing)
  - `Saved at 10:45 AM` (quiet green)
- **Manual Save**: Press `Ctrl+S` anytime for an instant forced save.
- **Flush on Navigation**: Switching between chapters or closing the application immediately flushes any pending buffer, ensuring zero lost words.

---

## 6. Distraction-Free Writing Mode

When it is time to enter a flow state:

1. Click the **Distraction-Free** button (maximize icon) in the editor toolbar, or press the shortcut key.
2. The entire application transitions into a clean, minimalist writing view:
   - Sidebar, tree navigation, toolbar, and inspector panels gently fade away.
   - Your manuscript prose is centered on a comfortable reading column.
   - A subtle word count and save indicator rests unobtrusively at the lower corner.
3. To exit, press `Escape` or click the exit button at the top right.

---

## 7. In-Document Find & Replace

Press `Ctrl+F` while editing any document to reveal the floating Find & Replace bar:

- **Find**: Type your search term. The total match counter shows `1 of 8` matches and highlights them directly in the text.
- **Navigation**: Click **Next** (`Enter`) or **Previous** (`Shift+Enter`) to jump between occurrences.
- **Replace**: Enter replacement text and click **Replace** for the current match or **Replace All** to substitute across the active scene.
- **Dismiss**: Press `Escape` to close the search bar and return your cursor to writing.

---

## 8. The Story Bible: Characters & Cast

Manage your entire ensemble without leaving your manuscript:

1. Click **Characters** in the sidebar.
2. View your cast in a card grid or detailed list, filterable by narrative role:
   - **Protagonist**
   - **Antagonist**
   - **Supporting**
   - **Minor**
3. Open any character dossier to record:
   - **Core Identity**: Full name, nickname, age, occupation.
   - **Psychology & Arc**: Core motivation, primary goals, internal conflict, greatest fears.
   - **Physical Appearance**: Hair, eyes, build, clothing, distinguishing features.
   - **Backstory**: Formative history and secrets.
   - **Custom Fields**: Dynamic key-value pairs (e.g., *Weapon of Choice*, *Alignment*, *Hogwarts House*, *Blood Type*).

---

## 9. Interactive Relationship Graph

Visualizing interpersonal dynamics is effortless:

1. In the Characters section, switch to the **Relationship Map** tab.
2. An interactive SVG network displays your characters as nodes.
3. **Connecting Characters**:
   - Select two characters and click **Add Relationship**.
   - Specify the relation (e.g., *Brothers*, *Rival*, *Mentor*, *Secret Lover*, *Debt Owed*).
4. **Interactive Controls**:
   - Drag characters across the canvas to organize factions or family clusters.
   - Zoom in/out and pan across large ensembles.
   - Click connection lines to edit the label or delete outdated bonds.

---

## 10. Locations & Setting Dossiers

Ground your story in vivid environments:

1. Click **Locations** in the sidebar.
2. Add a new setting (e.g., *St. Jude's Bell Tower*, *The Rusty Anchor Tavern*, *The Whispering Steppes*).
3. Document atmospheric details:
   - **Geography & Location Type**: City, fortress, ruin, planet, tavern.
   - **Visual Details**: Architectural quirks, lighting, colors.
   - **Sensory Atmosphere**: Smells, ambient sounds, weather.
   - **Notable Inhabitants**: Key NPCs who frequent the area.
   - **Plot Significance**: Hidden clues or historical events tied to this venue.

---

## 11. Worldbuilding & Lore Encyclopedia

Build a structured reference bible across 9 specialized categories:

- **History**: Epochs, wars, historical treaties.
- **Culture**: Customs, folklore, holidays, cuisine, taboos.
- **Magic System**: Sources of power, spells, limitations, costs.
- **Technology**: Inventions, transportation, weaponry.
- **Factions & Guilds**: Ranks, allegiances, mottos.
- **Religion**: Deities, rituals, sacred relics.
- **Geography**: Continents, climates, borders.
- **Lore & Rules**: Laws of nature, ancient curses.
- **General**: Miscellaneous world trivia.

Filter by category or search through articles instantly.

---

## 12. Timelines & Narrative Chronology

Never lose track of your story's chronological sequence:

1. Click **Timeline** in the sidebar.
2. **Add an Event**:
   - Provide a title (e.g., *The Harbor Heist*, *The King's Coronation*).
   - Set the date:
     - Standard dates (e.g., `1892-10-14`).
     - **Fictional / Fantasy Dates**: Use the `Date Label` field for custom calendars (e.g., *"Year of the Dragon, 3rd Sun"* or *"Two Days After the Fire"*). WriteIn sorts events reliably using your chronological order index.
   - Assign **Importance**: `Critical` (gold), `High` (coral), `Normal` (teal), or `Low` (slate).
   - Link participating **Characters**, the **Location**, and the corresponding **Manuscript Chapter**.
3. Toggle between **Chronological (Ascending)** and **Reverse Chronological (Descending)** order.

---

## 13. Writer's Notebook & Scratchpad

Capture transient thoughts, snippet dialogues, and cut scenes before they vanish:

- **Categories**: Organize notes into *Ideas*, *Research*, *Cut Content*, *Questions*, and *General*.
- **Quick Search**: Filter notes in real time.
- **Pinning**: Pin high-priority notes to keep them anchored at the top of your list.
- **Soft Archiving**: Archive completed research notes to keep your workspace decluttered while preserving every word for future reference.

---

## 14. Tags & Cross-Cutting Taxonomy

Tags cut across every element in your project:

- Create color-coded tags like `#foreshadowing`, `#plot-hole`, `#historical-fact`, `#draft-2-revision`.
- Attach tags to **Manuscript Nodes**, **Characters**, **Locations**, **Lore Entries**, **Timeline Events**, and **Notes**.
- Click any tag in the tag manager to see every associated story element across your entire novel.

---

## 15. Global Project Search (`Ctrl + K`)

Press `Ctrl + K` (or click the search icon in the top header) from anywhere in WriteIn:

1. **Instant Multi-Entity Results**: Type any name, place, dialogue snippet, or phrase. WriteIn searches across:
   - Manuscript documents and scene text
   - Character names, bios, and descriptions
   - Location entries and atmospheric details
   - Worldbuilding articles
   - Timeline events
   - Notebook entries
   - Tags
2. **Keyword Highlighting**: Matches are highlighted directly in the search results with surrounding snippet context.
3. **Filter Tabs**: Narrow down results by entity category (*Manuscript*, *Characters*, *Locations*, *Notes*, etc.).
4. **Keyboard Navigation**: Use `↑` and `↓` arrow keys to highlight an item and press `Enter` to immediately navigate to it.

---

## 16. Research Files & Attachments

Keep your reference visual and documentary materials alongside your text:

- **Supported Formats**: Images (`PNG`, `JPG`, `WEBP`, `SVG`), documents (`PDF`, `DOCX`, `TXT`, `MD`), and audio.
- **Secure File Storage**: Files are copied into your novel's local project folder (`%APPDATA%/WriteIn/projects/{project-id}/attachments/{id}/`). WriteIn strips dangerous path traversal attempts and keeps your database lightweight.
- **Entity Association**: Link reference maps directly to a Location, or a portrait directly to a Character.
- **Lightbox & System Launch**:
  - Click images for a high-resolution lightbox preview.
  - Click **Open** to launch the file in your default Windows viewer (e.g., Adobe Acrobat, Microsoft Word).
  - Click **Reveal in Explorer** to open the exact file location in Windows File Explorer.

---

## 17. Backlinks & Connected Content

The right-hand **Inspector** panel features a dynamic **Related Content** section:

- When inspecting **Chapter 03**, you will automatically see:
  - Timeline events set in Chapter 03.
  - Characters who take part in those events.
  - Locations where the events transpire.
  - Reference attachments linked to Chapter 03.
- Clicking any related item smoothly navigates you directly to that entity, making cross-referencing effortless.

---

## 18. Data Sovereignty, Backups & Portability

### Where is your data stored?
On Windows, WriteIn stores everything under your user profile:
```text
C:\Users\<YourUsername>\AppData\Roaming\WriteIn\
├── app.db                                     # Global application state
└── projects\
    └── {project-id}\
        ├── project.db                         # Complete novel SQLite database
        └── attachments\                       # Your images, PDFs, and references
```

### One-Click Project Backups (.writein)
In addition to copying the `{project-id}` directory manually, WriteIn features a native backup manager:
1. Open **Settings** or the project menu.
2. Click **Export .writein Backup**.
3. WriteIn bundles the database and all local attachments into a single compressed `.writein` archive.
4. You can restore this archive at any time via **Restore Backup**, restoring your entire novel to that exact point in time.

---

## 19. Writing Goals, Targets & Session Velocity

WriteIn provides dedicated productivity tracking to help you maintain writing momentum:

### Setting Word Count Goals
1. Navigate to **Writing Goals** in the project dashboard or inspector.
2. Create a goal:
   - **Project Goal**: Overall target for your finished book (e.g., `80,000` words).
   - **Daily Goal**: Daily quota (e.g., `1,000` words per day) with optional target completion dates.
3. Progress rings visually display percentage completed, words remaining, and completion streaks.

### Session Velocity & Analytics
- When you begin writing, WriteIn automatically tracks your active writing intervals.
- The **Writing Statistics** panel displays:
  - Total words written in the current session.
  - Active writing duration (in minutes and seconds).
  - Current **Velocity** (words per minute).
  - Historical session logs to analyze your most productive writing times.

---

## 20. Manuscript Snapshots & Version History

Never fear making sweeping editorial changes again. WriteIn includes non-destructive document versioning:

### Taking a Snapshot
1. In the editor toolbar or document menu, click the **Version History** icon.
2. Click **Create Snapshot**.
3. Give your snapshot an optional label (e.g., *"Before cutting prologue"* or *"Draft 2 complete"*).
4. WriteIn saves a permanent, timestamped snapshot of the document with its word count.

### Inspecting Diffs & Restoring Earlier Drafts
- Select any earlier snapshot from the history list to preview its contents.
- Use the side-by-side diff view to compare the historical snapshot against your current document.
- Click **Restore this Version** to revert your active document text safely.

---

## 21. Compiling Publication-Ready Books (.docx, .md, .txt)

When your manuscript is ready for beta readers, agents, or formatters, use the **Manuscript Compiler**:

1. Click **Compile Manuscript** in the sidebar or top menu.
2. Select your target export format:
   - **Microsoft Word (.docx)**: Compiles formatted strictly to publishing industry standards:
     - 1-inch margins on all sides.
     - 12pt Times New Roman font.
     - 1.5 line spacing with 0.5-inch first-line paragraph indents.
     - Centered `#` or `* * *` scene divider glyphs.
     - Clean title page front-matter (Title, Subtitle, Author, Word Count).
     - Page breaks between major chapters.
   - **Markdown (.md)**: Clean Markdown export with customizable heading levels.
   - **Plain Text (.txt)**: Clean plain text prose export.
3. Choose which binder folders, chapters, or scenes to include.
4. Click **Compile & Save**. WriteIn triggers the native Windows file save dialog.

---

## 22. Intelligent Manuscript Importer

If you have an existing manuscript written in another application:
1. Click **Import Manuscript** in the project binder.
2. Drag and drop a `.txt`, `.md`, or `.docx` file, or paste your text directly into the import buffer.
3. WriteIn's parsing engine scans your text and automatically detects chapter markers (e.g., *"Chapter 1"*, *"Act II"*, *"Prologue"*).
4. Review the generated binder preview and click **Import**. WriteIn creates all folders, chapters, and scenes automatically.

---

## 23. Clipboard & Paste Formatting Preferences

Copying and pasting text from web browsers, Word documents, or research notes often introduces jarring fonts and messy styling. WriteIn solves this with a smart paste sanitization engine:

1. Open **Settings > Editor Preferences**.
2. Select your default **Paste Behavior**:
   - **Match Style (Default)**: Strips external font families, sizes, line heights, and background colors while preserving semantic italics, bolding, and links.
   - **Plain Text**: Strips all formatting, pasting raw unformatted text.
   - **Keep Format**: Retains external rich formatting where possible.
3. **Quick Plain-Text Shortcut**: Regardless of your preference setting, pressing `Ctrl + Shift + V` always performs an immediate plain-text paste.

---

## 24. The Project Trash Can & Item Recovery

Accidental deletions are completely reversible in WriteIn:
1. When you delete a chapter, character, location, lore article, or note, it is moved to the **Project Trash Can**.
2. Open **Settings > Trash & Recovery** to view all soft-deleted items with their original deletion timestamps.
3. Click **Restore** to return any item back to its original place in your project.
4. Click **Empty Trash** when you are ready to permanently purge deleted items.

---

## 25. End-to-End Encrypted Device Transfer

Migrate your entire WriteIn studio library from one Windows PC to another without cloud accounts:

### Starting a Transfer (Source PC)
1. On your primary computer, go to **Settings > Devices**.
2. Click **Transfer to another device**.
3. WriteIn bundles your library and generates a temporary **8-character Pairing Code** (e.g., `8F4K-92QX`).
4. A 10-minute security countdown begins.

### Receiving on Your New Computer (Destination PC)
1. On your second computer, open WriteIn and go to **Settings > Devices**.
2. Click **Import from another device**.
3. Enter the pairing code shown on your source computer and click **Connect**.
4. Both devices establish an **End-to-End Encrypted channel** (using ephemeral ECDH P-256 key exchange and AES-256-GCM authenticated encryption).
5. Review the package summary (project counts, word totals, attachments) and click **Import Library**.
6. The transfer completes atomically, and the temporary relay session is permanently destroyed.

---

## 26. Application Updates & Preferences

WriteIn includes a built-in desktop auto-updater verified with cryptographic minisign signatures:
- **Quiet Background Detection**: WriteIn silently checks for official GitHub releases a few seconds after startup.
- **Update Dialog**: When an update is detected, an unobtrusive banner notifies you with release highlights. You can choose to update now or later.
- **Manual Check**: You can manually check for updates at any time by going to **Settings > Check for Updates**.

---

## 27. Keyboard Shortcuts Reference

| Shortcut | Action | Scope |
| :--- | :--- | :--- |
| `Ctrl + S` | Force Manual Save | Editor |
| `Ctrl + F` | Open In-Document Find & Replace | Editor |
| `Ctrl + K` | Open Global Command Palette & Search | Project-wide |
| `F11` | Toggle Distraction-Free Typewriter Mode | Editor |
| `Ctrl + Shift + V` | Paste as Plain Text | Editor |
| `Ctrl + B` | Toggle Bold | Editor |
| `Ctrl + I` | Toggle Italic | Editor |
| `Ctrl + U` | Toggle Underline | Editor |
| `Ctrl + Z` | Undo | Editor |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Redo | Editor |
| `Escape` | Exit Distraction-Free Mode / Close Search / Cancel Rename | Global |
| `Enter` (in tree rename) | Confirm inline title change | Manuscript Tree |
| `Escape` (in tree rename) | Cancel inline title change without saving | Manuscript Tree |
| `↑` / `↓` + `Enter` | Navigate and select global search results | Global Search Modal |
| `Shift + Enter` | Find previous match | Find & Replace Bar |

---

*Happy writing! May your words flow freely and your story come to life.*

