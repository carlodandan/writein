import { describe, it, expect } from 'vitest';
import { trashService } from '../services/trashService';

describe('trashService', () => {
  const projectId = 'demo-novel-1';

  it('moves an entity to trash and lists it', async () => {
    // Move a note to trash
    const item = await trashService.moveToTrash(
      projectId,
      'note',
      'note-1',
      'The Watch Mechanism Clue'
    );

    expect(item).toBeDefined();
    expect(item.id).toMatch(/^trash-/);
    expect(item.title).toBe('The Watch Mechanism Clue');
    expect(item.entity_type).toBe('note');

    // List trash
    const trash = await trashService.listTrash(projectId);
    expect(trash.some((t) => t.id === item.id)).toBe(true);
  });

  it('restores an entity from trash', async () => {
    // Add another item
    const item = await trashService.moveToTrash(
      projectId,
      'character',
      'char-2',
      'Lord Julian Blackwood'
    );

    let trash = await trashService.listTrash(projectId);
    expect(trash.some((t) => t.id === item.id)).toBe(true);

    // Restore it
    const success = await trashService.restoreFromTrash(item.id);
    expect(success).toBe(true);

    trash = await trashService.listTrash(projectId);
    expect(trash.some((t) => t.id === item.id)).toBe(false);
  });

  it('permanently deletes an item from trash', async () => {
    const item = await trashService.moveToTrash(
      projectId,
      'location',
      'loc-1',
      'Pier 14 & The Fog Docks'
    );

    const success = await trashService.deletePermanently(item.id);
    expect(success).toBe(true);

    const trash = await trashService.listTrash(projectId);
    expect(trash.some((t) => t.id === item.id)).toBe(false);
  });

  it('empties all trash for a project', async () => {
    await trashService.moveToTrash(projectId, 'note', 'note-2', 'Clara’s Morgue Banter');
    const count = await trashService.emptyTrash(projectId);
    expect(count).toBeGreaterThanOrEqual(1);

    const trash = await trashService.listTrash(projectId);
    expect(trash.length).toBe(0);
  });
});
