import React from 'react';
import {
  BookOpen,
  ChevronDown,
  Plus,
  Search,
  Maximize2,
  Sun,
  Moon,
  Settings,
  ShieldCheck,
  BookDown,
  Upload,
  Archive,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useTheme } from '../../context/ThemeContext';

interface HeaderBarProps {
  onOpenProjectList: () => void;
  onOpenNewProject: () => void;
  onToggleDistractionFree: () => void;
  isDistractionFree: boolean;
  onOpenSettings: () => void;
  onOpenSearch?: () => void;
  onOpenCompile?: () => void;
  onOpenImport?: () => void;
  onOpenBackup?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  onOpenProjectList,
  onOpenNewProject,
  onToggleDistractionFree,
  isDistractionFree,
  onOpenSettings,
  onOpenSearch,
  onOpenCompile,
  onOpenImport,
  onOpenBackup,
}) => {
  const { currentProject } = useProject();
  const { isDark, setTheme } = useTheme();

  return (
    <header className="h-12 border-b border-[var(--paper-border)] bg-[var(--paper-surface)] flex items-center justify-between px-4 select-none shrink-0 z-10 transition-colors">
      {/* Left: Brand & Project Switcher */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-[var(--amber-accent)] font-semibold text-base tracking-tight">
          <BookOpen className="w-5 h-5 stroke-[2.2]" />
          <span className="font-serif-novel text-lg tracking-normal text-[var(--ink-primary)]">WriteIn</span>
        </div>

        <span className="text-[var(--paper-border)]">|</span>

        {currentProject ? (
          <button
            onClick={onOpenProjectList}
            className="flex items-center space-x-2 px-2.5 py-1 rounded-md text-sm font-medium text-[var(--ink-primary)] hover:bg-[var(--paper-desk)] transition-colors border border-transparent hover:border-[var(--paper-border)]"
            title="Switch or manage projects"
          >
            <span className="truncate max-w-[220px]">{currentProject.title}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
          </button>
        ) : (
          <button
            onClick={onOpenNewProject}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-md text-sm font-medium text-[var(--amber-accent)] hover:bg-[var(--paper-desk)] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Center: Search trigger */}
      <div className="flex items-center">
        <button
          onClick={onOpenSearch}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[var(--paper-desk)] hover:bg-[var(--paper-desk-hover)] text-xs text-[var(--ink-muted)] transition-colors border border-[var(--paper-border-subtle)] w-64 justify-between"
          title="Global Project Search (Ctrl + K)"
        >
          <div className="flex items-center space-x-2">
            <Search className="w-3.5 h-3.5" />
            <span>Search project...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded text-[var(--ink-secondary)]">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-1 text-[var(--ink-secondary)]">
        {onOpenCompile && (
          <button
            onClick={onOpenCompile}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-[var(--ink-secondary)] hover:bg-[var(--paper-desk)] hover:text-[var(--ink-primary)] transition-colors"
            title="Compile & Export Manuscript"
          >
            <BookDown className="w-3.5 h-3.5 text-[var(--amber-accent)]" />
            <span className="hidden sm:inline">Compile</span>
          </button>
        )}

        {onOpenImport && (
          <button
            onClick={onOpenImport}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-[var(--ink-secondary)] hover:bg-[var(--paper-desk)] hover:text-[var(--ink-primary)] transition-colors"
            title="Import Manuscript Draft"
          >
            <Upload className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
            <span className="hidden sm:inline">Import</span>
          </button>
        )}

        {onOpenBackup && (
          <button
            onClick={onOpenBackup}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-[var(--ink-secondary)] hover:bg-[var(--paper-desk)] hover:text-[var(--ink-primary)] transition-colors"
            title="Project Backups & Recovery"
          >
            <Archive className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
            <span className="hidden sm:inline">Backup</span>
          </button>
        )}

        <span className="text-[var(--paper-border)] mx-1">|</span>

        <button
          onClick={onToggleDistractionFree}
          className={`p-1.5 rounded-md hover:bg-[var(--paper-desk)] hover:text-[var(--ink-primary)] transition-colors ${
            isDistractionFree ? 'bg-[var(--paper-desk)] text-[var(--amber-accent)]' : ''
          }`}
          title="Distraction-Free Mode"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="p-1.5 rounded-md hover:bg-[var(--paper-desk)] hover:text-[var(--ink-primary)] transition-colors"
          title={`Switch to ${isDark ? 'Light' : 'Dark'} theme`}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-md hover:bg-[var(--paper-desk)] hover:text-[var(--ink-primary)] transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        <div className="ml-2 pl-2 border-l border-[var(--paper-border)] flex items-center space-x-1.5 text-xs text-[var(--ink-muted)]">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-[11px] font-medium hidden md:inline">Offline</span>
        </div>
      </div>
    </header>
  );
};
