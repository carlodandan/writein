import { describe, it, expect } from 'vitest';
import { searchService } from '../services/searchService';

describe('Search Service Client Operations', () => {
  it('searches across entities for a query keyword', async () => {
    const res = await searchService.search('demo-novel-1', 'Clara');
    expect(res.query.toLowerCase()).toBe('clara');
    expect(res.items.length).toBeGreaterThan(0);

    const charItem = res.items.find((item) => item.entity_type === 'character');
    expect(charItem).toBeDefined();
    expect(charItem?.title).toContain('Clara');
    expect(charItem?.target_tab).toBe('characters');
  });

  it('searches for location or worldbuilding entries', async () => {
    const res = await searchService.search('demo-novel-1', 'Harbor');
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.items.some((i) => i.target_tab === 'locations' || i.target_tab === 'notes')).toBe(true);
  });

  it('handles empty or whitespace query gracefully', async () => {
    const resEmpty = await searchService.search('demo-novel-1', '');
    expect(resEmpty.items.length).toBe(0);
    expect(resEmpty.total_count).toBe(0);

    const resWhitespace = await searchService.search('demo-novel-1', '   ');
    expect(resWhitespace.items.length).toBe(0);
    expect(resWhitespace.total_count).toBe(0);
  });

  it('handles nonexistent queries with zero results', async () => {
    const res = await searchService.search('demo-novel-1', 'nonexistenttermxyz999');
    expect(res.items.length).toBe(0);
    expect(res.total_count).toBe(0);
  });

  it('performs case-insensitive searches', async () => {
    const lower = await searchService.search('demo-novel-1', 'clara');
    const upper = await searchService.search('demo-novel-1', 'CLARA');
    const mixed = await searchService.search('demo-novel-1', 'cLaRa');

    expect(lower.items.length).toBeGreaterThan(0);
    expect(upper.items.length).toBe(lower.items.length);
    expect(mixed.items.length).toBe(lower.items.length);
  });

  it('performs partial match searches', async () => {
    const full = await searchService.search('demo-novel-1', 'Harbor');
    const partial = await searchService.search('demo-novel-1', 'Harb');

    expect(partial.items.length).toBeGreaterThan(0);
    expect(full.items.length).toBeGreaterThan(0);
    expect(partial.items.length).toBeGreaterThanOrEqual(full.items.length);
  });

  it('safely handles special characters without crashing or malformed queries', async () => {
    const specialChars = ['%', '_', '!', '"quotes"', "it's", '(parens)', '[]', ';--'];
    for (const chars of specialChars) {
      const res = await searchService.search('demo-novel-1', chars);
      expect(res).toBeDefined();
      expect(Array.isArray(res.items)).toBe(true);
      expect(typeof res.total_count).toBe('number');
    }
  });
});
