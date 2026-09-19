import { describe, it, expect } from 'vitest';
import { TimelineEvent } from '../types/timeline';

describe('Timeline Chronological and Reverse Sorting Logic', () => {
  const sampleEvents: TimelineEvent[] = [
    {
      id: 'e-1',
      project_id: 'proj-1',
      title: 'The Great Fire',
      event_date: null,
      date_value: '0012.02.10',
      date_label: 'Year 12 — Winter Mid',
      time_value: 'Midnight',
      order_index: 2,
      description: null,
      location_id: null,
      location_name: null,
      importance: 'critical',
      related_chapter_id: null,
      chapter_title: null,
      character_ids: [],
      character_names: [],
      tags: null,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'e-2',
      project_id: 'proj-1',
      title: 'Coronation Dawn',
      event_date: null,
      date_value: '0012.01.01',
      date_label: 'Year 12 — New Year',
      time_value: 'Dawn',
      order_index: 1,
      description: null,
      location_id: null,
      location_name: null,
      importance: 'high',
      related_chapter_id: null,
      chapter_title: null,
      character_ids: [],
      character_names: [],
      tags: null,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'e-3',
      project_id: 'proj-1',
      title: 'The Autumn Retreat',
      event_date: null,
      date_value: '0012.09.20',
      date_label: 'Year 12 — Harvest End',
      time_value: 'Dusk',
      order_index: 3,
      description: null,
      location_id: null,
      location_name: null,
      importance: 'normal',
      related_chapter_id: null,
      chapter_title: null,
      character_ids: [],
      character_names: [],
      tags: null,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
  ];

  it('correctly sorts chronological (ascending) by date_value and order_index', () => {
    const sorted = [...sampleEvents].sort((a, b) => {
      const dateA = a.date_value || a.event_date || '';
      const dateB = b.date_value || b.event_date || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return a.order_index - b.order_index;
    });

    expect(sorted.map((e) => e.id)).toEqual(['e-2', 'e-1', 'e-3']);
  });

  it('correctly sorts reverse chronological (descending) for retrospective timeline views', () => {
    const sorted = [...sampleEvents].sort((a, b) => {
      const dateA = a.date_value || a.event_date || '';
      const dateB = b.date_value || b.event_date || '';
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return b.order_index - a.order_index;
    });

    expect(sorted.map((e) => e.id)).toEqual(['e-3', 'e-1', 'e-2']);
  });

  it('preserves fictional date labels alongside structured sorting', () => {
    const event = sampleEvents[0];
    expect(event.date_label).toBe('Year 12 — Winter Mid');
    expect(event.date_value).toBe('0012.02.10');
  });
});
