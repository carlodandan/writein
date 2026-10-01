export interface ReleaseHighlight {
  title: string;
  description: string;
}

export interface ReleaseNote {
  version: string;
  date: string;
  title: string;
  badge?: string;
  highlights: ReleaseHighlight[];
  details?: {
    category: 'Added' | 'Fixed' | 'Changed' | 'Security';
    items: string[];
  }[];
}

export const RELEASES: ReleaseNote[] = [
  {
    version: 'v4.2.1',
    date: 'September 30, 2026',
    title: 'Desktop Environment Detection & Installer Polish',
    badge: 'Latest',
    highlights: [
      {
        title: 'Desktop Environment Detection Fix',
        description: 'Corrected Vite runtime prefix handling and multi-tier desktop checks so auto-updater and native desktop hooks initialize reliably.',
      },
      {
        title: 'Application & Installer Packaging Polish',
        description: 'Standardized application name to WriteIn with official publisher metadata, copyright, category tags, and custom installer icons.',
      },
    ],
    details: [
      {
        category: 'Fixed',
        items: [
          'Corrected Vite envPrefix syntax so TAURI_ENV_ variables are exposed to import.meta.env.',
          'Enhanced isDesktopTauri() with multi-tier fallback checks across platform flags and user agent detection.',
        ],
      },
      {
        category: 'Changed',
        items: [
          'Standardized application productName to WriteIn across configuration files.',
          'Added official installer metadata for Windows NSIS and MSI packages.',
        ],
      },
    ],
  },
  {
    version: 'v4.2.0',
    date: 'September 29, 2026',
    title: 'End-to-End Encrypted Device-to-Device Transfer',
    highlights: [
      {
        title: 'Zero-Knowledge Device Transfer',
        description: 'Migrate your complete novel library between PCs in minutes using temporary 10-minute pairing codes and client-side Web Crypto encryption.',
      },
      {
        title: 'Conflict-Safe Atomic Import',
        description: 'Imported projects are safely segregated and renamed with [Title] (Transferred) to avoid overwriting existing local manuscripts.',
      },
    ],
    details: [
      {
        category: 'Added',
        items: [
          'Ephemeral ECDH (P-256) key agreement with HKDF-SHA256 and AES-256-GCM encryption.',
          'SQLite Migration 006 adding transfer_logs audit table.',
          'DeviceTransferView in Settings > Devices with real-time stage progression.',
        ],
      },
      {
        category: 'Fixed',
        items: [
          'Replaced Math.random with CSPRNG for session tokens and mock IDs (CWE-338).',
          'Safe cancellation handling: immediately invalidates session tokens upon user abort.',
          'Remapped attachment IDs during library import to preserve relational links.',
        ],
      },
    ],
  },
  {
    version: 'v4.1.0',
    date: 'September 26, 2026',
    title: 'Smart Paste Sanitization & Editor Precision',
    highlights: [
      {
        title: 'Smart Paste Sanitization',
        description: 'Strip messy web fonts, inline colors, and external styles while preserving semantic bold and italics.',
      },
      {
        title: 'Editor Stability Fixes',
        description: 'Fixed cursor jumping during debounced auto-save and isolated word count rollups during rapid chapter navigation.',
      },
    ],
  },
  {
    version: 'v4.0.0',
    date: 'September 26, 2026',
    title: 'Manuscript Compilation & Smart Importer',
    highlights: [
      {
        title: 'MS Word (.docx) Compilation',
        description: 'Export publication-ready manuscripts formatted strictly to industry guidelines (1-inch margins, 12pt Times New Roman, 1.5 spacing, title page).',
      },
      {
        title: 'Intelligent Importer & Backups',
        description: 'Automatically detect chapter headings from imported files, and create compressed .writein archive backups.',
      },
    ],
  },
  {
    version: 'v3.0.0',
    date: 'September 25, 2026',
    title: 'Writing Goals & Session Velocity Analytics',
    highlights: [
      {
        title: 'Writing Goals & Streaks',
        description: 'Set daily word quotas and project word targets with visual progress rings and streak counters.',
      },
      {
        title: 'Version History & Snapshots',
        description: 'Capture immutable snapshots of your chapters, inspect side-by-side diffs, and restore earlier drafts non-destructively.',
      },
    ],
  },
];
