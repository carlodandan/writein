import React, { useState, useEffect } from 'react';
import {
  Target,
  Flame,
  Clock,
  CheckCircle2,
  Edit2,
  Trophy,
} from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import { goalsService } from '../../../services/goalsService';
import { sessionService } from '../../../services/sessionService';
import { calculateGoalProgress } from '../../../utils/writingGoals';
import type { SessionStats, WritingGoal } from '../../../types/phase5';

export const WritingGoalsWorkspace: React.FC = () => {
  const { currentProject, updateProject } = useProject();
  const [goals, setGoals] = useState<WritingGoal[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [isEditingNovelTarget, setIsEditingNovelTarget] = useState(false);
  const [novelTargetInput, setNovelTargetInput] = useState('50000');
  const [isEditingDailyTarget, setIsEditingDailyTarget] = useState(false);
  const [dailyTargetInput, setDailyTargetInput] = useState('500');

  useEffect(() => {
    if (currentProject) {
      setNovelTargetInput(currentProject.target_word_count.toString());
      loadGoals();
      loadStats();
    }
  }, [currentProject?.id]);

  const loadGoals = async () => {
    if (!currentProject) return;
    try {
      const list = await goalsService.getWritingGoals(currentProject.id);
      setGoals(list);
      const activeDaily = list.find((g) => g.goal_type === 'daily' && g.is_active);
      if (activeDaily) {
        setDailyTargetInput(activeDaily.target_words.toString());
      }
    } catch (err) {
      console.warn('Failed to load goals:', err);
    }
  };

  const loadStats = async () => {
    if (!currentProject) return;
    try {
      const stats = await sessionService.getSessionStats(currentProject.id);
      setSessionStats(stats);
    } catch (err) {
      console.warn('Failed to load session stats:', err);
    }
  };

  const handleSaveNovelTarget = async () => {
    if (!currentProject) return;
    const target = parseInt(novelTargetInput, 10);
    if (!isNaN(target) && target > 0) {
      await updateProject(currentProject.id, { target_word_count: target });
      setIsEditingNovelTarget(false);
    }
  };

  const handleSaveDailyTarget = async () => {
    if (!currentProject) return;
    const target = parseInt(dailyTargetInput, 10);
    if (!isNaN(target) && target > 0) {
      try {
        await goalsService.createWritingGoal({
          project_id: currentProject.id,
          goal_type: 'daily',
          target_words: target,
          start_date: new Date().toISOString().split('T')[0],
          end_date: null,
        });
        await loadGoals();
        setIsEditingDailyTarget(false);
      } catch (err) {
        console.warn('Failed to save daily goal:', err);
      }
    }
  };

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-[var(--ink-muted)]">
        <p className="text-sm">Select a project to view and set writing goals.</p>
      </div>
    );
  }

  // Calculate Novel progress
  const novelProgress = calculateGoalProgress(
    currentProject.target_word_count,
    currentProject.current_word_count
  );

  // Calculate Daily progress
  const activeDailyGoal = goals.find((g) => g.goal_type === 'daily' && g.is_active);
  const dailyTarget = activeDailyGoal ? activeDailyGoal.target_words : 500;
  const todayWords = sessionStats?.today_words || 0;
  const dailyProgress = calculateGoalProgress(dailyTarget, todayWords);

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--paper-bg)] overflow-y-auto">
      {/* Header */}
      <div className="border-b border-[var(--paper-border)] bg-[var(--paper-surface)] px-8 py-6">
        <div className="flex items-center space-x-3 mb-1">
          <Target className="w-6 h-6 text-[var(--amber-accent)]" />
          <h1 className="font-serif-novel text-2xl font-bold text-[var(--ink-primary)]">
            Writing Goals & Target Tracker
          </h1>
        </div>
        <p className="text-xs text-[var(--ink-muted)] max-w-xl">
          Set ambitious targets for your novel, maintain daily writing streaks, and celebrate words on the page.
        </p>
      </div>

      <div className="p-8 max-w-5xl space-y-8">
        {/* Top 3 Goal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Novel Goal */}
          <div className="bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-[var(--amber-accent)]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                  Novel Target
                </span>
              </div>
              <button
                onClick={() => setIsEditingNovelTarget(!isEditingNovelTarget)}
                className="p-1 rounded hover:bg-[var(--paper-desk-hover)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition-colors"
                title="Edit Target"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {isEditingNovelTarget ? (
              <div className="space-y-2">
                <input
                  type="number"
                  value={novelTargetInput}
                  onChange={(e) => setNovelTargetInput(e.target.value)}
                  className="w-full font-mono text-sm px-2.5 py-1.5 rounded border border-[var(--amber-accent)] bg-[var(--paper-desk)] text-[var(--ink-primary)] focus:outline-hidden"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveNovelTarget}
                    className="px-3 py-1 bg-[var(--amber-accent)] text-white text-xs font-medium rounded hover:opacity-90"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingNovelTarget(false)}
                    className="px-3 py-1 border border-[var(--paper-border)] text-xs text-[var(--ink-muted)] rounded hover:bg-[var(--paper-desk-hover)]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="font-mono text-3xl font-bold text-[var(--ink-primary)]">
                    {novelProgress.percentage}%
                  </span>
                  <span className="text-xs text-[var(--ink-muted)]">completed</span>
                </div>
                <div className="text-xs font-mono text-[var(--ink-secondary)] mt-1">
                  {novelProgress.current.toLocaleString()} / {novelProgress.target.toLocaleString()} words
                </div>
              </div>
            )}

            <div className="space-y-1">
              <div className="w-full bg-[var(--paper-desk)] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[var(--amber-accent)] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, novelProgress.percentage)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-[var(--ink-muted)] font-mono">
                <span>{novelProgress.remaining.toLocaleString()} words remaining</span>
                {novelProgress.isCompleted && (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Reached!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Daily Target */}
          <div className="bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                  Today's Goal
                </span>
              </div>
              <button
                onClick={() => setIsEditingDailyTarget(!isEditingDailyTarget)}
                className="p-1 rounded hover:bg-[var(--paper-desk-hover)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition-colors"
                title="Edit Daily Target"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {isEditingDailyTarget ? (
              <div className="space-y-2">
                <input
                  type="number"
                  value={dailyTargetInput}
                  onChange={(e) => setDailyTargetInput(e.target.value)}
                  className="w-full font-mono text-sm px-2.5 py-1.5 rounded border border-[var(--amber-accent)] bg-[var(--paper-desk)] text-[var(--ink-primary)] focus:outline-hidden"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveDailyTarget}
                    className="px-3 py-1 bg-[var(--amber-accent)] text-white text-xs font-medium rounded hover:opacity-90"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingDailyTarget(false)}
                    className="px-3 py-1 border border-[var(--paper-border)] text-xs text-[var(--ink-muted)] rounded hover:bg-[var(--paper-desk-hover)]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="font-mono text-3xl font-bold text-[var(--ink-primary)]">
                    {dailyProgress.percentage}%
                  </span>
                  <span className="text-xs text-[var(--ink-muted)]">of daily target</span>
                </div>
                <div className="text-xs font-mono text-[var(--ink-secondary)] mt-1">
                  {dailyProgress.current.toLocaleString()} / {dailyProgress.target.toLocaleString()} words today
                </div>
              </div>
            )}

            <div className="space-y-1">
              <div className="w-full bg-[var(--paper-desk)] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-orange-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, dailyProgress.percentage)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-[var(--ink-muted)] font-mono">
                <span>{dailyProgress.remaining.toLocaleString()} words left today</span>
                {dailyProgress.isCompleted && (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Met!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card 3: Writing Rhythm / Weekly Overview */}
          <div className="bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                7-Day Velocity
              </span>
            </div>

            <div>
              <div className="font-mono text-3xl font-bold text-[var(--ink-primary)]">
                {(sessionStats?.week_words || 0).toLocaleString()}
              </div>
              <div className="text-xs text-[var(--ink-muted)] mt-1">
                words written in the last 7 days
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--paper-border-subtle)] flex items-center justify-between text-[11px] font-mono text-[var(--ink-muted)]">
              <span>Today: {sessionStats?.today_sessions || 0} session(s)</span>
              <span>Avg: {sessionStats?.avg_session_words || 0} w/session</span>
            </div>
          </div>
        </div>

        {/* Milestone Projections */}
        <div className="bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-sm font-semibold text-[var(--ink-primary)]">
            <span>Milestone Projections</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-[var(--paper-desk)] border border-[var(--paper-border-subtle)] space-y-1">
              <span className="text-[var(--ink-muted)]">At 500 words/day</span>
              <div className="font-mono text-base font-bold text-[var(--ink-primary)]">
                {Math.max(1, Math.ceil(novelProgress.remaining / 500))} days
              </div>
              <p className="text-[10px] text-[var(--ink-muted)]">to reach novel target</p>
            </div>

            <div className="p-3.5 rounded-lg bg-[var(--paper-desk)] border border-[var(--paper-border-subtle)] space-y-1">
              <span className="text-[var(--ink-muted)]">At 1,000 words/day</span>
              <div className="font-mono text-base font-bold text-[var(--ink-primary)]">
                {Math.max(1, Math.ceil(novelProgress.remaining / 1000))} days
              </div>
              <p className="text-[10px] text-[var(--ink-muted)]">to reach novel target</p>
            </div>

            <div className="p-3.5 rounded-lg bg-[var(--paper-desk)] border border-[var(--paper-border-subtle)] space-y-1">
              <span className="text-[var(--ink-muted)]">At 2,000 words/day (NaNoWriMo)</span>
              <div className="font-mono text-base font-bold text-[var(--ink-primary)]">
                {Math.max(1, Math.ceil(novelProgress.remaining / 2000))} days
              </div>
              <p className="text-[10px] text-[var(--ink-muted)]">to reach novel target</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
