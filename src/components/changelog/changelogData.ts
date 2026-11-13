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
    version: 'v4.3.1',
    date: 'November 13, 2026',
    title: 'Multi-Platform Desktop Support, Security Hardening & Web SEO',
    badge: 'Latest',
    highlights: [
      {
        title: 'macOS & Linux Multi-Platform Support',
        description: 'WriteIn is now built for macOS (Apple Silicon & Intel) and Linux (Ubuntu .deb & AppImage) alongside Windows, featuring platform-adaptive shortcuts and native system integration.',
      },
      {
        title: 'Security Hardening & Content Isolation',
        description: 'Hardened attachment file handling with native system openers and extension blocking, enforced strict Content Security Policy, and sanitized clipboard paste and deep links.',
      },
      {
        title: 'Web Discoverability & SEO Polish',
        description: 'Added automated sitemaps, robots configuration, enhanced structured data, and LLM-friendly index files for writein.pages.dev.',
      },
    ],
    details: [
      {
        category: 'Added',
        items: [
          'Multi-platform GitHub Actions release matrix generating desktop builds for Windows x64, macOS (Universal/arm64/x64), and Linux (.deb, .AppImage).',
          'Dynamic platform-aware search shortcut in HeaderBar displaying ⌘K on macOS and Ctrl K on Windows and Linux.',
          'Native operating system file open and folder reveal commands for macOS (open, open -R) and Linux (xdg-open).',
          'Branch-aware staging release workflow tagging builds as staging-__VERSION__ and marking them as prereleases.',
          'Automated sitemap.xml and robots.txt generation on writein.pages.dev via vite-plugin-sitemap.',
          'Enhanced website metadata, OpenGraph cards, JSON-LD schema, and machine-readable llms.txt index.',
        ],
      },
      {
        category: 'Security',
        items: [
          'Replaced shell execution (cmd.exe /c start) with tauri_plugin_opener to prevent command injection risks.',
          'Blocked opening executable and script files (.exe, .bat, .cmd, .ps1, .vbs, .js, .msi, etc.) from the attachment manager.',
          'Configured strict Content Security Policy (CSP) in tauri.conf.json restricting script execution to self.',
          'Hardened keep-format paste mode to actively strip dangerous executable elements, on* event handlers, and javascript:/vbscript:/data: URIs.',
          'Enforced strict regex token validation on deep-link project IDs and navigation targets.',
        ],
      },
      {
        category: 'Changed',
        items: [
          'Updated Linux package dependencies in tauri.conf.json to require libwebkit2gtk-4.1-0.',
          'Updated project Node.js engine target to 24.22.1.',
          'Synchronized documentation across README, Architecture, API, and Tutorial for multi-platform support.',
        ],
      },
      {
        category: 'Fixed',
        items: [
          'Standardized asset naming and URL casing across website download targets.',
          'Scoped Vitest test runner include paths to src/ to prevent running non-test scripts.',
        ],
      },
    ],
  },
  {
    version: 'v4.3.0',
    date: 'October 2, 2026',
    title: 'In-App What\'s New Changelog & Brand Identity Polish',
    highlights: [
      {
        title: 'In-App "What\'s New" Changelog',
        description: 'Stay up to date after every release with an accessible startup changelog modal, full version history, and on-demand review in Preferences.',
      },
      {
        title: 'Brand Identity & Header Icon Refresh',
        description: 'Integrated the official WriteIn crest icon into the desktop header and splashscreen, pairing with our distraction-free Warm Paper and Midnight Ink themes.',
      },
    ],
    details: [
      {
        category: 'Added',
        items: [
          'Interactive What\'s New modal displayed automatically on startup when launching a newly installed version.',
          'Release Notes & What\'s New preferences card to review version highlights anytime.',
          'Accessible dialog implementation featuring full keyboard focus trapping, trigger focus restoration, and Escape dismissal.',
          'Official WriteIn brand icon in header navigation and splashscreen.',
        ],
      },
      {
        category: 'Changed',
        items: [
          'Updated application and installer versions to v4.3.0 across desktop manifests and website.',
          'Refined modal presentation with clean editorial typography matching our distraction-free aesthetic.',
          'Streamlined website features showcase with expandable cards and end-to-end device transfer FAQ.',
        ],
      },
    ],
  },
  {
    version: 'v4.2.1',
    date: 'September 30, 2026',
    title: 'Desktop Environment Detection & Installer Polish',
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