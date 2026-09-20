import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  BookOpen,
  Clock,
  FileText,
  Layers,
  Users,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import { useManuscript } from '../../../context/ManuscriptContext';
import { sessionService } from '../../../services/sessionService';
import type { SessionStats, WritingSession } from '../../../types/phase5';

export const StatisticsWorkspace: React.FC = () => {
  const { currentProject, summary } = useProject();
  const { nodes } = useManuscript();
  const [sessions, setSessions] = useState<WritingSession[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);

  useEffect(() => {
    if (currentProject) {
      sessionService
        .listWritingSessions(currentProject.id, 20)
        .then(setSessions)
        .catch(() => {});
      sessionService
        .getSessionStats(currentProject.id)
        .then(setSessionStats)
        .catch(() => {});
    }
  }, [currentProject?.id]);

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-[var(--ink-muted)]">
        <p className="text-sm">Select a project to view manuscript statistics.</p>
      </div>
    );
  }

  const totalWords = currentProject.current_word_count || 0;
  const targetWords = currentProject.target_word_count || 50000;
  const percentComplete = Math.min(100, Math.round((totalWords / targetWords) * 100));
  const readingTimeMin = Math.ceil(totalWords / 250);

  // Filter chapters and scenes
  const chapters = nodes.filter((n) => n.node_type === 'chapter' && !n.archived_at);
  const scenes = nodes.filter((n) => n.node_type === 'scene' && !n.archived_at);
  const avgChapterWords = chapters.length > 0 ? Math.round(totalWords / chapters.length) : 0;
  const avgSceneWords = scenes.length > 0 ? Math.round(totalWords / scenes.length) : 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--paper-bg)] overflow-y-auto">
      {/* Header */}
      <div className="border-b border-[var(--paper-border)] bg-[var(--paper-surface)] px-8 py-6">
        <div className="flex items-center space-x-3 mb-1">
          <BarChart2 className="w-6 h-6 text-[var(--amber-accent)]" />
          <h1 className="font-serif-novel text-2xl font-bold text-[var(--ink-primary)]">
            Manuscript Analytics & Statistics
          </h1>
        </div>
        <p className="text-xs text-[var(--ink-muted)] max-w-xl">
          Comprehensive breakdown of your manuscript word counts, reading times, section lengths, and writing history.
        </p>
      </div>

      <div className="p-8 max-w-5xl space-y-8">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-xl p-4 shadow-xs">
            <div className="flex items-center space-x-2 text-[var(--ink-muted)] text-xs mb-1">
              <FileText className="w-3.5 h-3.5 text-[var(--amber-accent)]" />
              <span>Total Words</span>
            </div>
            <div className="font-mono text-2xl font-bold text-[var(--ink-primary)]">
              {totalWords.toLocaleString()}
            </div>
            <div className="text-[11px] text-[var(--ink-muted)] mt-0.5">
              {percentComplete}% of {targetWords.toLocaleString()} target
            </div>
          </div>

          <div className="bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-xl p-4 shadow-xs">
            <div className="flex items-center space-x-2 text-[var(--ink-muted)] text-xs mb-1">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>Est. Reading Time</span>
            </div>
            <div className="font-mono text-2xl font-bold text-[var(--ink-primary)]">
              {readingTimeMin >= 60
                ? `${Math.floor(readingTimeMin / 60)}h ${readingTimeMin % 60}m`
                : `${readingTimeMin} min`}
            </div>
            <div className="text-[11px] text-[var(--ink-muted)] mt-0.5">
              Based on 250 words/minute
            </div>
          </div>

          <div className="bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-xl p-4 shadow-xs">
            <div className="flex items-center space-x-2 text-[var(--ink-muted)] text-xs mb-1">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>Avg. Chapter Size</span>
            </div>
            <div className="font-mono text-2xl font-bold text-[var(--ink-primary)]">
              {avgChapterWords.toLocaleString()}
            </div>
            <div className="text-[11px] text-[var(--ink-muted)] mt-0.5">
              Across {chapters.length} chapter(s)
            </div>
          </div>

          <div className="bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-xl p-4 shadow-xs">
            <div className="flex items-center space-x-2 text-[var(--ink-muted)] text-xs mb-1">
              <Layers className="w-3.5 h-3.5 text-purple-500" />
              <span>Avg. Scene Size</span>
            </div>
            <div className="font-mono text-2xl font-bold text-[var(--ink-primary)]">
              {avgSceneWords.toLocaleString()}
            </div>
            <div className="text-[11px] text-[var(--ink-muted)] mt-0.5">
              Across {scenes.length} scene(s)
            </div>
          </div>
        </div>

        {/* Story Universe Summary */}
        {summary && (
          <div className="bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold text-[var(--ink-primary)] uppercase tracking-wider">
              Story Bible Overview
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-[var(--paper-desk)] rounded-lg border border-[var(--paper-border-subtle)]">
                <Users className="w-5 h-5 mx-auto text-[var(--amber-accent)] mb-1" />
                <div className="font-mono text-xl font-bold text-[var(--ink-primary)]">
                  {summary.character_count}
                </div>
                <div className="text-[11px] text-[var(--ink-muted)]">Characters</div>
              </div>

              <div className="p-3 bg-[var(--paper-desk)] rounded-lg border border-[var(--paper-border-subtle)]">
                <Compass className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                <div className="font-mono text-xl font-bold text-[var(--ink-primary)]">
                  {summary.location_count}
                </div>
                <div className="text-[11px] text-[var(--ink-muted)]">Locations</div>
              </div>

              <div className="p-3 bg-[var(--paper-desk)] rounded-lg border border-[var(--paper-border-subtle)]">
                <BookOpen className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                <div className="font-mono text-xl font-bold text-[var(--ink-primary)]">
                  {summary.chapter_count + summary.scene_count}
                </div>
                <div className="text-[11px] text-[var(--ink-muted)]">Sections & Scenes</div>
              </div>

              <div className="p-3 bg-[var(--paper-desk)] rounded-lg border border-[var(--paper-border-subtle)]">
                <FileText className="w-5 h-5 mx-auto text-orange-500 mb-1" />
                <div className="font-mono text-xl font-bold text-[var(--ink-primary)]">
                  {summary.note_count}
                </div>
                <div className="text-[11px] text-[var(--ink-muted)]">Notebook Entries</div>
              </div>
            </div>
          </div>
        )}

        {/* Chapter-by-Chapter Breakdown Table */}
        <div className="bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--paper-border)] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--ink-primary)] uppercase tracking-wider">
              Manuscript Breakdown
            </h2>
            <span className="text-xs text-[var(--ink-muted)] font-mono">
              {nodes.filter((n) => !n.archived_at).length} sections
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--paper-desk)] border-b border-[var(--paper-border)] text-[var(--ink-muted)] font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3">Section Title</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Words</th>
                  <th className="px-6 py-3 text-right">% of Manuscript</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--paper-border-subtle)]">
                {nodes.filter((n) => !n.archived_at).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-[var(--ink-muted)]">
                      No manuscript chapters or scenes created yet.
                    </td>
                  </tr>
                ) : (
                  nodes
                    .filter((n) => !n.archived_at)
                    .map((node) => {
                      const share =
                        totalWords > 0 ? ((node.word_count / totalWords) * 100).toFixed(1) : '0.0';
                      return (
                        <tr
                          key={node.id}
                          className="hover:bg-[var(--paper-desk-hover)] transition-colors"
                        >
                          <td className="px-6 py-3 font-medium text-[var(--ink-primary)] flex items-center space-x-2">
                            <BookOpen className="w-3.5 h-3.5 text-[var(--ink-muted)] shrink-0" />
                            <span className="truncate max-w-xs">{node.title}</span>
                          </td>
                          <td className="px-4 py-3 uppercase font-mono text-[10px] text-[var(--ink-muted)]">
                            {node.node_type}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded capitalize ${
                                node.status === 'complete'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                  : node.status === 'in-progress'
                                  ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                              }`}
                            >
                              {node.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-right text-[var(--ink-primary)]">
                            {node.word_count.toLocaleString()}
                          </td>
                          <td className="px-6 py-3 font-mono text-right text-[var(--ink-muted)]">
                            {share}%
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Writing Sessions History */}
        <div className="bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--ink-primary)] uppercase tracking-wider">
              Recent Writing Sessions
            </h2>
            <span className="text-xs text-[var(--ink-muted)] font-mono">
              Total: {sessions.length} sessions
              {sessionStats && ` • Today: ${sessionStats.today_words.toLocaleString()} words`}
            </span>
          </div>

          {sessions.length === 0 ? (
            <p className="text-xs text-[var(--ink-muted)] text-center py-6">
              No recorded writing sessions yet. Open any manuscript chapter to begin your first session!
            </p>
          ) : (
            <div className="space-y-2">
              {sessions.map((sess) => {
                const date = new Date(sess.started_at);
                const durationMin = Math.round(sess.duration_seconds / 60);
                return (
                  <div
                    key={sess.id}
                    className="p-3 rounded-lg border border-[var(--paper-border-subtle)] bg-[var(--paper-desk)] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div className="font-medium text-[var(--ink-primary)]">
                          {sess.words_written.toLocaleString()} words written
                        </div>
                        <div className="text-[10px] text-[var(--ink-muted)]">
                          {date.toLocaleDateString()} at{' '}
                          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono text-[11px] text-[var(--ink-muted)]">
                      <span>{durationMin} min duration</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
