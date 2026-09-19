import { describe, it, expect } from 'vitest';
import { worldbuildingService } from '../services/worldbuildingService';

describe('Worldbuilding Service Client Operations', () => {
  it('loads entries and filters by category', async () => {
    const all = await worldbuildingService.getEntries('demo-novel-1');
    expect(all.length).toBeGreaterThanOrEqual(3);

    const historyOnly = await worldbuildingService.getEntries('demo-novel-1', 'History');
    expect(historyOnly.length).toBeGreaterThanOrEqual(1);
    expect(historyOnly.every((e) => e.category.toLowerCase() === 'history')).toBe(true);
  });

  it('creates, updates, and deletes an entry', async () => {
    const created = await worldbuildingService.createEntry({
      project_id: 'demo-novel-1',
      category: 'Culture',
      title: 'The Fishermen’s Wake Ceremony',
      content: 'A tradition where families light floating lanterns during the first new moon of autumn.',
      tags: 'tradition,maritime',
    });

    expect(created.id).toBeDefined();
    expect(created.title).toBe('The Fishermen’s Wake Ceremony');
    expect(created.category).toBe('Culture');

    const fetched = await worldbuildingService.getEntry(created.id);
    expect(fetched.content).toContain('floating lanterns');

    const updated = await worldbuildingService.updateEntry(created.id, {
      title: 'The Floating Lantern Wake',
    });
    expect(updated.title).toBe('The Floating Lantern Wake');

    const deleted = await worldbuildingService.deleteEntry(created.id);
    expect(deleted).toBe(true);

    const listAfter = await worldbuildingService.getEntries('demo-novel-1');
    expect(listAfter.some((e) => e.id === created.id)).toBe(false);
  });
});
