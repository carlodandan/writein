import React, { useState, useEffect } from 'react';
import {
  PanelRightClose,
  PanelRightOpen,
  Target,
  FileText,
  Calendar,
  Bookmark,
  BookOpen,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useManuscript } from '../../context/ManuscriptContext';
import { calculateGoalProgress } from '../../utils/writingGoals';
import { ActiveNavTab } from './Sidebar';
import { RelatedContentPanel } from '../common/RelatedContentPanel';
import { useAppVersion } from '../../utils/appVersion';

interface InspectorProps {
  isOpen: boolean;
  onToggle: () => void;
  onNavigate?: (tab: ActiveNavTab, entityId?: string) => void;
}

export const Inspector: React.FC<InspectorProps> = ({ isOpen, onToggle, onNavigate }) => {
  const { currentProject, summary } = useProject();
  const { activeNode, updateNodeSynopsis, updateNodeStatus } = useManuscript();
  const appVersion = useAppVersion();

  const [synopsisInput, setSynopsisInput] = useState('');

  useEffect(() => {
    if (activeNode) {
      setSynopsisInput(activeNode.synopsis || '');
    }
  }, [activeNode]);

  if (!isOpen) {
    return (
      <div className="border-l border-[var(--paper-border)] bg-[var(--paper-desk)] flex flex-col items-center py-3 select-none shrink-0 w-10">
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-[var(--paper-desk-hover)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition-colors"
          title="Open Inspector Panel"
        >
          <PanelRightOpen className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const goal = currentProject
    ? calculateGoalProgress(
        currentProject.target_word_count,
        currentProject.current_word_count
      )
    : null;

  return (
    <aside className="w-72 border-l border-[var(--paper-border)] bg-[var(--paper-desk)] flex flex-col justify-between select-none shrink-0 transition-colors">
      {/* Header */}
      <div className="h-11 border-b border-[var(--paper-border)] px-4 flex items-center justify-between text-xs font-semibold text-[var(--ink-secondary)]">
        <div className="flex items-center space-x-2">
          <Bookmark className="w-3.5 h-3.5 text-[var(--amber-accent)]" />
          <span>Inspector</span>
        </div>
        <button
          onClick={onToggle}
          className="p-1 rounded hover:bg-[var(--paper-desk-hover)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition-colors"
          title="Collapse Inspector"
        >
          <PanelRightClose className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 text-sm">
        {/* Active Section Info (if in manuscript mode) */}
        {activeNode && (
          <div className="bg-[var(--paper-surface)] p-3.5 rounded-lg border border-[var(--paper-border-subtle)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-[var(--ink-primary)]">
                <BookOpen className="w-3.5 h-3.5 text-[var(--amber-accent)]" />
                <span className="capitalize">{activeNode.node_type} Info</span>
              </div>
              <select
                value={activeNode.status}
                onChange={(e) => updateNodeStatus(activeNode.id, e.target.value)}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--paper-desk)] text-[var(--ink-secondary)] border border-[var(--paper-border-subtle)] focus:outline-hidden cursor-pointer capitalize"
              >
                <option value="draft">Draft</option>
                <option value="in-progress">In Progress</option>
                <option value="complete">Complete</option>
                <option value="needs-revision">Needs Revision</option>
              </select>
            </div>

            <div>
              <div className="font-serif-novel text-sm font-semibold text-[var(--ink-primary)] truncate">
                {activeNode.title}
              </div>
              <div className="text-[11px] font-mono text-[var(--ink-muted)] mt-0.5">
                {activeNode.word_count.toLocaleString()} words
              </div>
            </div>

            {/* Metadata Timestamps */}
            <div className="pt-2 border-t border-[var(--paper-border-subtle)] space-y-1 text-[11px] font-mono text-[var(--ink-muted)]">
              <div className="flex justify-between items-center">
                <span>Created:</span>
                <span className="text-[var(--ink-secondary)]">
                  {new Date(activeNode.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Modified:</span>
                <span className="text-[var(--ink-secondary)]">
                  {new Date(activeNode.updated_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Synopsis Field */}
            <div className="space-y-1 pt-1">
              <label className="block text-[11px] font-medium text-[var(--ink-secondary)]">
                Scene Synopsis / Goal
              </label>
              <textarea
                rows={3}
                value={synopsisInput}
                onChange={(e) => setSynopsisInput(e.target.value)}
                onBlur={() => {
                  if (activeNode && synopsisInput !== (activeNode.synopsis || '')) {
                    updateNodeSynopsis(activeNode.id, synopsisInput);
                  }
                }}
                placeholder="What happens in this scene? Central conflict or goal..."
                className="w-full bg-[var(--paper-desk)] border border-[var(--paper-border-subtle)] rounded p-2 text-xs text-[var(--ink-primary)] placeholder-[var(--ink-muted)] focus:outline-hidden focus:ring-1 focus:ring-[var(--amber-accent)] resize-none"
              />
            </div>
          </div>
        )}

        {/* Connected Story Content & Backlinks */}
        {activeNode && currentProject && (
          <RelatedContentPanel
            projectId={currentProject.id}
            entityType={activeNode.node_type === 'scene' ? 'chapter' : activeNode.node_type}
            entityId={activeNode.id}
            entityTitle={activeNode.title}
            onNavigate={onNavigate}
            compact={true}
          />
        )}

        {/* Writing Target Progress */}
        {goal && (
          <div className="bg-[var(--paper-surface)] p-3.5 rounded-lg border border-[var(--paper-border-subtle)] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-medium text-[var(--ink-secondary)]">
                <Target className="w-3.5 h-3.5 text-[var(--amber-accent)]" />
                <span>Novel Target</span>
              </div>
              <span className="text-xs font-mono font-semibold text-[var(--amber-accent)]">
                {goal.percentage}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-[var(--paper-desk)] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[var(--amber-accent)] h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, goal.percentage)}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-[var(--ink-muted)] font-mono">
              <span>{goal.current.toLocaleString()} words</span>
              <span>{goal.target.toLocaleString()} target</span>
            </div>
          </div>
        )}

        {/* Project Meta */}
        {currentProject && (
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
              Project Details
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[var(--paper-border-subtle)]">
                <span className="text-[var(--ink-muted)]">Genre</span>
                <span className="font-medium text-[var(--ink-primary)]">
                  {currentProject.genre || 'Unassigned'}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-[var(--paper-border-subtle)]">
                <span className="text-[var(--ink-muted)]">Status</span>
                <span className="capitalize font-medium text-[var(--amber-accent)]">
                  {currentProject.status}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-[var(--paper-border-subtle)]">
                <span className="text-[var(--ink-muted)]">Author</span>
                <span className="font-medium text-[var(--ink-primary)]">
                  {currentProject.author || 'Anonymous'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {summary && (
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
              Manuscript & World
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-[var(--paper-surface)] p-2 rounded border border-[var(--paper-border-subtle)]">
                <div className="text-base font-semibold font-mono text-[var(--ink-primary)]">
                  {summary.chapter_count}
                </div>
                <div className="text-[10px] text-[var(--ink-muted)]">Chapters</div>
              </div>

              <div className="bg-[var(--paper-surface)] p-2 rounded border border-[var(--paper-border-subtle)]">
                <div className="text-base font-semibold font-mono text-[var(--ink-primary)]">
                  {summary.scene_count}
                </div>
                <div className="text-[10px] text-[var(--ink-muted)]">Scenes</div>
              </div>

              <div className="bg-[var(--paper-surface)] p-2 rounded border border-[var(--paper-border-subtle)]">
                <div className="text-base font-semibold font-mono text-[var(--ink-primary)]">
                  {summary.character_count}
                </div>
                <div className="text-[10px] text-[var(--ink-muted)]">Characters</div>
              </div>

              <div className="bg-[var(--paper-surface)] p-2 rounded border border-[var(--paper-border-subtle)]">
                <div className="text-base font-semibold font-mono text-[var(--ink-primary)]">
                  {summary.note_count}
                </div>
                <div className="text-[10px] text-[var(--ink-muted)]">Notes</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--paper-border)] text-[11px] text-[var(--ink-muted)] flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <Calendar className="w-3 h-3" />
          <span>WriteIn Desktop</span>
        </div>
        <div className="flex items-center space-x-1" title={`WriteIn App Version ${appVersion}`}>
          <FileText className="w-3 h-3" />
          <span>{appVersion}</span>
        </div>
      </div>
    </aside>
  );
};
