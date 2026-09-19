import { describe, it, expect } from 'vitest';
import { calculateGoalProgress } from '../utils/writingGoals';

describe('Writing Goals Calculations', () => {
  it('calculates 75% progress correctly for 750 / 1000 words', () => {
    const progress = calculateGoalProgress(1000, 750);
    expect(progress.target).toBe(1000);
    expect(progress.current).toBe(750);
    expect(progress.percentage).toBe(75);
    expect(progress.remaining).toBe(250);
    expect(progress.isCompleted).toBe(false);
    expect(progress.isExceeded).toBe(false);
  });

  it('handles completed goal when target is reached', () => {
    const progress = calculateGoalProgress(5000, 5000);
    expect(progress.percentage).toBe(100);
    expect(progress.remaining).toBe(0);
    expect(progress.isCompleted).toBe(true);
    expect(progress.isExceeded).toBe(false);
  });

  it('handles exceeded goal when current exceeds target', () => {
    const progress = calculateGoalProgress(1000, 1500);
    expect(progress.percentage).toBe(150);
    expect(progress.remaining).toBe(0);
    expect(progress.isCompleted).toBe(true);
    expect(progress.isExceeded).toBe(true);
  });

  it('handles zero goal safely without division by zero', () => {
    const progressZero = calculateGoalProgress(0, 0);
    expect(progressZero.percentage).toBe(0);
    expect(progressZero.remaining).toBe(0);
    expect(progressZero.isCompleted).toBe(false);

    const progressZeroWithWords = calculateGoalProgress(0, 500);
    expect(progressZeroWithWords.percentage).toBe(100);
    expect(progressZeroWithWords.isCompleted).toBe(true);
  });

  it('handles negative or invalid values gracefully', () => {
    const progressNegative = calculateGoalProgress(-1000, -500);
    expect(progressNegative.target).toBe(0);
    expect(progressNegative.current).toBe(0);
    expect(progressNegative.percentage).toBe(0);

    const progressNaN = calculateGoalProgress(NaN, NaN);
    expect(progressNaN.target).toBe(0);
    expect(progressNaN.current).toBe(0);
  });
});
