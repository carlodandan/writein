import { describe, it, expect } from 'vitest';
import { locationService } from '../services/locationService';

describe('Location Service Client Operations', () => {
  it('loads locations list for project', async () => {
    const locs = await locationService.getLocations('demo-novel-1');
    expect(locs.length).toBeGreaterThanOrEqual(2);
    expect(locs.some((l) => l.name.includes('Pier 14'))).toBe(true);
  });

  it('creates, updates, and deletes a location', async () => {
    const created = await locationService.createLocation({
      project_id: 'demo-novel-1',
      name: 'St. Jude’s Bell Tower',
      location_type: 'Church / Overlook',
      description: 'The highest stone spire in the old quarter overlooking the harbor.',
      appearance: 'Crumbling gargoyles, green copper roof, rusted bells.',
      atmosphere: 'Wind whipping off the channel, tolling every quarter-hour.',
      inhabitants: 'Father Gregory, town ravens.',
      tags: 'church,vantage-point,bells',
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe('St. Jude’s Bell Tower');

    const fetched = await locationService.getLocation(created.id);
    expect(fetched.atmosphere).toContain('Wind whipping');

    const updated = await locationService.updateLocation(created.id, {
      name: 'St. Jude’s Belfry & Catacombs',
    });
    expect(updated.name).toBe('St. Jude’s Belfry & Catacombs');

    const deleted = await locationService.deleteLocation(created.id);
    expect(deleted).toBe(true);

    const list = await locationService.getLocations('demo-novel-1');
    expect(list.some((l) => l.id === created.id)).toBe(false);
  });
});
