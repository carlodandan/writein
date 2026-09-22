import { BookOpen, Users } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useTheme } from '../../context/ThemeContext';

export const ManuscriptPlaceholder: React.FC<{ onOpenNewChapter?: () => void }> = () => {
  const { currentProject } = useProject();
  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-6 animate-in fade-in duration-150">
      <div className="flex items-center justify-between border-b border-[var(--paper-border)] pb-4">
        <div>
          <h2 className="font-serif-novel text-2xl font-bold text-[var(--ink-primary)]">
            Manuscript Outline
          </h2>
          <p className="text-xs text-[var(--ink-muted)]">
            {currentProject?.title} — Parts, Chapters, and Scenes
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded bg-[var(--amber-soft)] border border-[var(--amber-soft-border)] text-[var(--amber-accent)] font-semibold">
          Phase 2 Target
        </span>
      </div>

      <div className="bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-2xl p-8 text-center space-y-4">
        <BookOpen className="w-12 h-12 mx-auto text-[var(--amber-accent)] opacity-80" />
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="font-serif-novel text-lg font-semibold text-[var(--ink-primary)]">
            Rich-Text Writing Workspace
          </h3>
          <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
            The rich-text chapter editor, drag-and-drop hierarchy, autosave, and scene versioning will be implemented next in Phase 2.
          </p>
        </div>
      </div>
    </div>
  );
};

export const CharactersPlaceholder: React.FC = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-6 animate-in fade-in duration-150">
      <div className="flex items-center justify-between border-b border-[var(--paper-border)] pb-4">
        <div>
          <h2 className="font-serif-novel text-2xl font-bold text-[var(--ink-primary)]">
            Characters & Story Cast
          </h2>
          <p className="text-xs text-[var(--ink-muted)]">
            Protagonists, antagonists, relationships graph, and character sheets
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded bg-[var(--paper-desk)] border border-[var(--paper-border)] text-[var(--ink-muted)] font-semibold">
          Phase 3 Target
        </span>
      </div>

      <div className="bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-2xl p-8 text-center space-y-4">
        <Users className="w-12 h-12 mx-auto text-blue-500 opacity-80" />
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="font-serif-novel text-lg font-semibold text-[var(--ink-primary)]">
            Character Relationship Database
          </h3>
          <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
            Manage your character profiles, motivations, fears, and interactive relationship map in Phase 3.
          </p>
        </div>
      </div>
    </div>
  );
};

export const GenericPlaceholder: React.FC<{
  title: string;
  description: string;
  icon: React.ElementType;
  phase: string;
}> = ({ title, description, icon: Icon, phase }) => {
  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-6 animate-in fade-in duration-150">
      <div className="flex items-center justify-between border-b border-[var(--paper-border)] pb-4">
        <div>
          <h2 className="font-serif-novel text-2xl font-bold text-[var(--ink-primary)]">
            {title}
          </h2>
          <p className="text-xs text-[var(--ink-muted)]">{description}</p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded bg-[var(--paper-desk)] border border-[var(--paper-border)] text-[var(--ink-muted)] font-semibold">
          {phase}
        </span>
      </div>

      <div className="bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-2xl p-8 text-center space-y-4">
        <Icon className="w-12 h-12 mx-auto text-[var(--ink-muted)] opacity-80" />
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="font-serif-novel text-lg font-semibold text-[var(--ink-primary)]">
            {title}
          </h3>
          <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
            {description}. Structured and saved directly to your local project database.
          </p>
        </div>
      </div>
    </div>
  );
};

import { UpdateCheck } from '../updater/UpdateCheck';

export const SettingsView: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="p-8 max-w-3xl mx-auto w-full space-y-6 animate-in fade-in duration-150">
      <div className="border-b border-[var(--paper-border)] pb-4">
        <h2 className="font-serif-novel text-2xl font-bold text-[var(--ink-primary)]">
          Preferences & Settings
        </h2>
        <p className="text-xs text-[var(--ink-muted)]">
          Configure your local writing environment and desktop preferences
        </p>
      </div>

      <div className="space-y-6 text-sm">
        {/* Application Updates */}
        <UpdateCheck />

        {/* Appearance */}
        <div className="bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-xl p-5 space-y-4">
          <h3 className="font-serif-novel text-base font-semibold text-[var(--ink-primary)]">
            Appearance
          </h3>
          <div>
            <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-2">
              Theme Mode
            </label>
            <div className="flex space-x-3">
              {(['light', 'dark', 'system'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTheme(mode)}
                  className={`px-4 py-2 rounded-lg text-xs capitalize font-medium border transition-colors ${
                    theme === mode
                      ? 'border-[var(--amber-accent)] bg-[var(--amber-soft)] text-[var(--amber-accent)] font-semibold'
                      : 'border-[var(--paper-border)] bg-[var(--paper-desk)] text-[var(--ink-secondary)] hover:border-[var(--paper-border-subtle)]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Local Storage Info */}
        <div className="bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-xl p-5 space-y-3">
          <h3 className="font-serif-novel text-base font-semibold text-[var(--ink-primary)]">
            Local Data & Offline Sovereignty
          </h3>
          <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
            WriteIn operates entirely on your local machine with SQLite. No telemetry, no cloud sync required, no accounts. All novel databases are stored in your user application directory.
          </p>
          <div className="p-3 bg-[var(--paper-desk)] border border-[var(--paper-border)] rounded-lg font-mono text-xs text-[var(--ink-secondary)]">
            Database Engine: SQLite 3 (WAL mode, foreign keys active)
          </div>
        </div>
      </div>
    </div>
  );
};
