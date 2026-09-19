import {
  BookOpen,
  Users,
  StickyNote,
  PenTool,
  Target,
  ArrowRight,
  Bookmark,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { calculateGoalProgress } from '../../utils/writingGoals';

interface ProjectHomeViewProps {
  onNavigateTab: (tab: any) => void;
  onOpenNewProject: () => void;
}

export const ProjectHomeView: React.FC<ProjectHomeViewProps> = ({
  onNavigateTab,
  onOpenNewProject,
}) => {
  const { currentProject, summary, isLoading } = useProject();

  if (isLoading && !currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-2 text-[var(--ink-muted)]">
          <BookOpen className="w-8 h-8 animate-pulse mx-auto text-[var(--amber-accent)]" />
          <p className="text-sm">Preparing your writing desk...</p>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4 bg-[var(--paper-surface)] p-8 rounded-2xl border border-[var(--paper-border)] shadow-xs">
          <BookOpen className="w-12 h-12 mx-auto text-[var(--amber-accent)] opacity-80" />
          <div>
            <h2 className="font-serif-novel text-xl font-semibold text-[var(--ink-primary)]">
              Welcome to WriteIn
            </h2>
            <p className="text-xs text-[var(--ink-muted)] mt-1">
              Your offline personal novel desk and story database.
            </p>
          </div>
          <button
            onClick={onOpenNewProject}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-medium bg-[var(--amber-accent)] hover:bg-[var(--amber-accent-hover)] text-white shadow-xs transition-colors flex items-center justify-center space-x-2"
          >
            <span>Create Your First Novel</span>
          </button>
        </div>
      </div>
    );
  }

  const goal = calculateGoalProgress(
    currentProject.target_word_count,
    currentProject.current_word_count
  );

  return (
    <div className="p-8 max-w-5xl mx-auto w-full space-y-8 animate-in fade-in duration-200">
      {/* Novel Header / Desk Welcome */}
      <section className="bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-2xl p-6 shadow-xs relative overflow-hidden transition-colors">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2.5 text-xs font-mono text-[var(--ink-muted)]">
              <span className="px-2.5 py-0.5 rounded-full bg-[var(--paper-desk)] border border-[var(--paper-border)] text-[var(--ink-secondary)]">
                {currentProject.genre || 'Novel'}
              </span>
              <span className="capitalize px-2 py-0.5 rounded bg-[var(--amber-soft)] border border-[var(--amber-soft-border)] text-[var(--amber-accent)] font-medium">
                {currentProject.status}
              </span>
              {currentProject.author && (
                <span>By {currentProject.author}</span>
              )}
            </div>

            <h1 className="font-serif-novel text-3xl font-bold tracking-tight text-[var(--ink-primary)]">
              {currentProject.title}
            </h1>

            {currentProject.subtitle && (
              <p className="font-serif-novel text-base text-[var(--ink-secondary)] italic">
                {currentProject.subtitle}
              </p>
            )}

            {currentProject.description && (
              <p className="text-sm text-[var(--ink-secondary)] leading-relaxed pt-1">
                {currentProject.description}
              </p>
            )}
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2">
            <button
              onClick={() => onNavigateTab('manuscript')}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-[var(--amber-accent)] hover:bg-[var(--amber-accent-hover)] text-white shadow-xs transition-colors flex items-center justify-center space-x-2"
            >
              <PenTool className="w-4 h-4" />
              <span>Open Manuscript</span>
            </button>
            <button
              onClick={() => onNavigateTab('characters')}
              className="px-4 py-2 rounded-xl text-xs font-medium border border-[var(--paper-border)] bg-[var(--paper-desk)] hover:bg-[var(--paper-desk-hover)] text-[var(--ink-primary)] transition-colors flex items-center justify-center space-x-1.5"
            >
              <Users className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
              <span>Characters Bible</span>
            </button>
          </div>
        </div>

        {/* Goal Progress Banner */}
        <div className="mt-6 pt-6 border-t border-[var(--paper-border-subtle)] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-[var(--amber-accent)]" />
              <span className="font-semibold text-[var(--ink-primary)]">
                Manuscript Progress: {goal.current.toLocaleString()} / {goal.target.toLocaleString()} words
              </span>
            </div>
            <span className="font-bold text-[var(--amber-accent)]">
              {goal.percentage}%
            </span>
          </div>

          <div className="w-full bg-[var(--paper-desk)] h-2.5 rounded-full overflow-hidden border border-[var(--paper-border-subtle)]">
            <div
              className="bg-[var(--amber-accent)] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, goal.percentage)}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-[var(--ink-muted)] font-mono">
            <span>{goal.remaining.toLocaleString()} words remaining to target</span>
            <span>Target: {goal.target.toLocaleString()} words</span>
          </div>
        </div>
      </section>

      {/* Story Sections Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Manuscript Card */}
        <div
          onClick={() => onNavigateTab('manuscript')}
          className="bg-[var(--paper-surface)] border border-[var(--paper-border)] hover:border-[var(--amber-accent)]/50 p-5 rounded-xl shadow-xs transition-all cursor-pointer group flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-[var(--amber-soft)] text-[var(--amber-accent)]">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[var(--paper-desk)] text-[var(--ink-secondary)]">
              {summary?.chapter_count || 0} Chapters
            </span>
          </div>
          <div>
            <h3 className="font-serif-novel text-base font-semibold text-[var(--ink-primary)] group-hover:text-[var(--amber-accent)] transition-colors">
              Manuscript
            </h3>
            <p className="text-xs text-[var(--ink-muted)] mt-1">
              {summary?.last_edited_chapter_title
                ? `Last edit: ${summary.last_edited_chapter_title}`
                : 'Write and organize parts, chapters, and scenes.'}
            </p>
          </div>
          <div className="flex items-center text-xs text-[var(--amber-accent)] font-medium pt-1">
            <span>Continue writing</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Story Bible Card */}
        <div
          onClick={() => onNavigateTab('characters')}
          className="bg-[var(--paper-surface)] border border-[var(--paper-border)] hover:border-[var(--amber-accent)]/50 p-5 rounded-xl shadow-xs transition-all cursor-pointer group flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[var(--paper-desk)] text-[var(--ink-secondary)]">
              {summary?.character_count || 0} Characters
            </span>
          </div>
          <div>
            <h3 className="font-serif-novel text-base font-semibold text-[var(--ink-primary)] group-hover:text-[var(--amber-accent)] transition-colors">
              Story Bible
            </h3>
            <p className="text-xs text-[var(--ink-muted)] mt-1">
              Characters, relationships map, locations, and world lore.
            </p>
          </div>
          <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 font-medium pt-1">
            <span>Explore Bible</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Timeline & Notes Card */}
        <div
          onClick={() => onNavigateTab('notes')}
          className="bg-[var(--paper-surface)] border border-[var(--paper-border)] hover:border-[var(--amber-accent)]/50 p-5 rounded-xl shadow-xs transition-all cursor-pointer group flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <StickyNote className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[var(--paper-desk)] text-[var(--ink-secondary)]">
              {summary?.note_count || 0} Notes
            </span>
          </div>
          <div>
            <h3 className="font-serif-novel text-base font-semibold text-[var(--ink-primary)] group-hover:text-[var(--amber-accent)] transition-colors">
              Notes & Timeline
            </h3>
            <p className="text-xs text-[var(--ink-muted)] mt-1">
              Story timeline chronology, plot ideas, and reference files.
            </p>
          </div>
          <div className="flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium pt-1">
            <span>Open notes</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </section>

      {/* Writing Routine & Quick Desk Info */}
      <section className="bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm font-semibold text-[var(--ink-primary)]">
            <Bookmark className="w-4 h-4 text-[var(--amber-accent)]" />
            <h3 className="font-serif-novel">Writers Desk Notes & Reminders</h3>
          </div>
          <span className="text-xs text-[var(--ink-muted)] font-mono">
            Auto-saved locally
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[var(--paper-desk)] border border-[var(--paper-border-subtle)] text-xs text-[var(--ink-secondary)] leading-relaxed">
          {currentProject.project_notes ? (
            <p className="whitespace-pre-wrap">{currentProject.project_notes}</p>
          ) : (
            <p className="italic text-[var(--ink-muted)]">
              No project notes yet. Use the scratchpad in the Inspector panel or project settings to jot down themes, pacing guidelines, or key reminders for this novel.
            </p>
          )}
        </div>
      </section>
    </div>
  );
};
