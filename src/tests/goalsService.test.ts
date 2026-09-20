import { describe, it, expect } from 'vitest';
import { goalsService } from '../services/goalsService';

describe('Writing Goals Client Service', () => {
  const testProjectId = 'demo-novel-1';

  it('creates, lists, updates, and deletes writing goals', async () => {
    // Create daily goal
    const created = await goalsService.createWritingGoal({
      project_id: testProjectId,
      goal_type: 'daily',
      target_words: 750,
      start_date: '2026-09-19',
      end_date: null,
    });

    expect(created).toBeDefined();
    expect(created.goal_type).toBe('daily');
    expect(created.target_words).toBe(750);
    expect(created.is_active).toBe(true);

    // List
    const goals = await goalsService.getWritingGoals(testProjectId);
    expect(goals.length).toBeGreaterThanOrEqual(1);

    // Update
    const updated = await goalsService.updateWritingGoal(created.id, {
      current_words: 500,
    });
    expect(updated.current_words).toBe(500);

    // Delete
    const deleted = await goalsService.deleteWritingGoal(created.id);
    expect(deleted).toBe(true);
  });
});
