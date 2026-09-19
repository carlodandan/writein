export interface GoalProgress {
  target: number;
  current: number;
  remaining: number;
  percentage: number;
  isCompleted: boolean;
  isExceeded: boolean;
}

/**
 * Calculates progress towards a writing goal.
 * Handles zero goals, completed goals, exceeded goals, and negative/invalid numbers safely.
 */
export function calculateGoalProgress(target: number, current: number): GoalProgress {
  const normalizedTarget = Math.max(0, isNaN(target) ? 0 : target);
  const normalizedCurrent = Math.max(0, isNaN(current) ? 0 : current);

  if (normalizedTarget === 0) {
    const hasCurrent = normalizedCurrent > 0;
    return {
      target: 0,
      current: normalizedCurrent,
      remaining: 0,
      percentage: hasCurrent ? 100 : 0,
      isCompleted: hasCurrent,
      isExceeded: hasCurrent,
    };
  }

  const rawPercentage = (normalizedCurrent / normalizedTarget) * 100;
  const percentage = Math.round(rawPercentage * 10) / 10;
  const remaining = Math.max(0, normalizedTarget - normalizedCurrent);
  const isCompleted = normalizedCurrent >= normalizedTarget;
  const isExceeded = normalizedCurrent > normalizedTarget;

  return {
    target: normalizedTarget,
    current: normalizedCurrent,
    remaining,
    percentage,
    isCompleted,
    isExceeded,
  };
}
