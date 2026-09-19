import { describe, it, expect } from 'vitest';
import { attachmentService } from '../services/attachmentService';

describe('Cross-Link & Backlinks Service Operations', () => {
  const projectId = 'demo-novel-1';

  it('aggregates related content for a character', async () => {
    // char-1 is Vance Marlowe
    const res = await attachmentService.getRelatedContent(projectId, 'character', 'char-1');
    expect(res.entity_type).toBe('character');
    expect(res.entity_id).toBe('char-1');

    // Timeline events involving Vance
    expect(res.timeline_events.length).toBeGreaterThan(0);
    expect(res.timeline_events.some((t) => t.target_tab === 'timeline')).toBe(true);

    // Relationships (partner characters)
    expect(res.characters.length).toBeGreaterThan(0);
    expect(res.characters.some((c) => c.target_tab === 'characters')).toBe(true);

    // Chapters Vance appears in
    expect(res.chapters.length).toBeGreaterThan(0);
    expect(res.chapters.some((ch) => ch.target_tab === 'manuscript')).toBe(true);

    // Locations Vance visits
    expect(res.locations.length).toBeGreaterThan(0);
    expect(res.locations.some((l) => l.target_tab === 'locations')).toBe(true);

    // Notes mentioning Vance
    expect(res.notes.length).toBeGreaterThan(0);
    expect(res.notes.some((n) => n.target_tab === 'notes')).toBe(true);
  });

  it('aggregates related content for a location', async () => {
    // loc-1 is Pier 14 & The Fog Docks
    const res = await attachmentService.getRelatedContent(projectId, 'location', 'loc-1');
    expect(res.entity_type).toBe('location');
    expect(res.entity_id).toBe('loc-1');

    // Timeline events at location
    expect(res.timeline_events.length).toBeGreaterThan(0);

    // Characters present at location
    expect(res.characters.length).toBeGreaterThan(0);

    // Chapters set at location
    expect(res.chapters.length).toBeGreaterThan(0);
  });

  it('aggregates related content for a manuscript chapter/scene', async () => {
    // scene-1 is Scene 01: Footsteps in the Salt
    const res = await attachmentService.getRelatedContent(projectId, 'chapter', 'scene-1');
    expect(res.entity_type).toBe('chapter');
    expect(res.entity_id).toBe('scene-1');

    // Timeline events tied to this scene
    expect(res.timeline_events.length).toBeGreaterThan(0);

    // Characters in this scene
    expect(res.characters.length).toBeGreaterThan(0);

    // Locations in this scene
    expect(res.locations.length).toBeGreaterThan(0);
  });

  it('returns empty lists for entities without connections', async () => {
    const res = await attachmentService.getRelatedContent(projectId, 'character', 'nonexistent-id');
    expect(res.chapters).toHaveLength(0);
    expect(res.characters).toHaveLength(0);
    expect(res.locations).toHaveLength(0);
    expect(res.timeline_events).toHaveLength(0);
    expect(res.notes).toHaveLength(0);
    expect(res.attachments).toHaveLength(0);
  });
});
