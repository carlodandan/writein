import { describe, it, expect } from 'vitest';
import { noteService } from '../services/noteService';

describe('Note Service Client Operations', () => {
  it('loads notes list for project with category filtering', async () => {
    const allNotes = await noteService.getNotes('demo-novel-1');
    expect(allNotes.length).toBeGreaterThanOrEqual(2);

    const plotNotes = await noteService.getNotes('demo-novel-1', 'Plot');
    expect(plotNotes.every((n) => n.category.toLowerCase() === 'plot')).toBe(true);
  });

  it('creates, reads, updates, and deletes a note', async () => {
    const created = await noteService.createNote({
      project_id: 'demo-novel-1',
      category: 'Dialogue',
      title: 'Harbor Watch Exchange',
      content: '"You cannot hide what the tide already delivered," Finch muttered.',
      tags: 'dialogue,finch,harbor',
    });

    expect(created.id).toBeDefined();
    expect(created.title).toBe('Harbor Watch Exchange');
    expect(created.category).toBe('Dialogue');

    const fetched = await noteService.getNote(created.id);
    expect(fetched.title).toBe('Harbor Watch Exchange');
    expect(fetched.content).toContain('You cannot hide');

    const updated = await noteService.updateNote(created.id, {
      title: 'Harbor Watch Climax Dialogue',
      category: 'Scene',
    });
    expect(updated.title).toBe('Harbor Watch Climax Dialogue');
    expect(updated.category).toBe('Scene');

    const deleted = await noteService.deleteNote(created.id);
    expect(deleted).toBe(true);

    const afterList = await noteService.getNotes('demo-novel-1');
    expect(afterList.some((n) => n.id === created.id)).toBe(false);
  });

  it('toggles archive status of a note', async () => {
    const created = await noteService.createNote({
      project_id: 'demo-novel-1',
      category: 'Ideas',
      title: 'Discarded Subplot Draft',
      content: 'Early idea about smuggled steam parts.',
    });

    expect(created.archived_at).toBeNull();

    const archived = await noteService.toggleArchive(created.id);
    expect(archived.archived_at).toBeTruthy();

    const restored = await noteService.toggleArchive(created.id);
    expect(restored.archived_at).toBeNull();

    await noteService.deleteNote(created.id);
  });

  it('supports note tags, searching within notes, and pin workflow', async () => {
    // 1. Create a note with tags
    const pinnedNote = await noteService.createNote({
      project_id: 'demo-novel-1',
      category: 'Plot',
      title: 'Grand Conspiracy Clue',
      content: 'The harbormaster received bribes from the eastern syndicate.',
      tags: 'clue,conspiracy,pinned',
    });

    expect(pinnedNote.tags).toContain('pinned');
    expect(pinnedNote.tags).toContain('clue');

    // 2. Search within notes
    const allNotes = await noteService.getNotes('demo-novel-1');
    const matched = allNotes.filter(
      (n) =>
        n.title.toLowerCase().includes('conspiracy') ||
        n.content.toLowerCase().includes('syndicate') ||
        (n.tags && n.tags.toLowerCase().includes('clue')),
    );
    expect(matched.some((n) => n.id === pinnedNote.id)).toBe(true);

    // 3. Pin workflow: update tags to unpin and pin
    const unpinned = await noteService.updateNote(pinnedNote.id, {
      tags: pinnedNote.tags!.replace('pinned', '').replace(/,\s*,/g, ',').trim(),
    });
    expect(unpinned.tags).not.toContain('pinned');

    const repinned = await noteService.updateNote(pinnedNote.id, {
      tags: `${unpinned.tags}, pinned`,
    });
    expect(repinned.tags).toContain('pinned');

    // Clean up
    await noteService.deleteNote(pinnedNote.id);
  });
});
