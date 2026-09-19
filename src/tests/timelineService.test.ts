import { describe, it, expect } from 'vitest';
import { timelineService } from '../services/timelineService';

describe('Timeline Service Client Operations', () => {
  it('loads timeline events for project', async () => {
    const events = await timelineService.getEvents('demo-novel-1');
    expect(events.length).toBeGreaterThanOrEqual(2);
    expect(events[0].title).toBeDefined();
    expect(events[0].date_label).toBeDefined();
  });

  it('creates, reads, updates, and deletes a timeline event', async () => {
    const created = await timelineService.createEvent({
      project_id: 'demo-novel-1',
      title: 'Midnight Meeting at Highspire',
      date_value: '0012.03.15',
      date_label: 'Year 12 — Month of Thaw, Day 15',
      time_value: 'Midnight',
      importance: 'critical',
      description: 'The secret gathering where the treaty terms were finalized.',
      location_id: 'loc-1',
      related_chapter_id: 'chap-1',
      character_ids: ['char-1', 'char-2'],
      tags: 'clandestine,treaty,climax',
    });

    expect(created.id).toBeDefined();
    expect(created.title).toBe('Midnight Meeting at Highspire');
    expect(created.date_label).toBe('Year 12 — Month of Thaw, Day 15');
    expect(created.importance).toBe('critical');
    expect(created.character_ids).toContain('char-1');
    expect(created.character_ids).toContain('char-2');

    const fetched = await timelineService.getEvent(created.id);
    expect(fetched.title).toBe('Midnight Meeting at Highspire');
    expect(fetched.time_value).toBe('Midnight');

    const updated = await timelineService.updateEvent(created.id, {
      title: 'Midnight Confrontation at Highspire',
      importance: 'high',
    });
    expect(updated.title).toBe('Midnight Confrontation at Highspire');
    expect(updated.importance).toBe('high');

    const deleted = await timelineService.deleteEvent(created.id);
    expect(deleted).toBe(true);

    const afterList = await timelineService.getEvents('demo-novel-1');
    expect(afterList.some((e) => e.id === created.id)).toBe(false);
  });

  it('supports sorting in ascending and descending directions', async () => {
    const asc = await timelineService.getEvents('demo-novel-1', {
      sort_direction: 'asc',
    });
    const desc = await timelineService.getEvents('demo-novel-1', {
      sort_direction: 'desc',
    });

    expect(asc.length).toBeGreaterThanOrEqual(2);
    expect(desc.length).toBe(asc.length);
    expect(asc[0].id).toBe(desc[desc.length - 1].id);
  });
});
