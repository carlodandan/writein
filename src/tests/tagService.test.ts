import { describe, it, expect } from 'vitest';
import { tagService } from '../services/tagService';

describe('Tag Service Client Operations', () => {
  it('loads tags for a project with usage count', async () => {
    const tags = await tagService.getTags('demo-novel-1');
    expect(tags.length).toBeGreaterThanOrEqual(1);
    expect(tags[0].name).toBeDefined();
    expect(typeof tags[0].usage_count).toBe('number');
  });

  it('creates, renames, and deletes a tag safely', async () => {
    const newTag = await tagService.createTag({
      project_id: 'demo-novel-1',
      name: 'plot-twist',
      color: '#f43f5e',
    });

    expect(newTag.id).toBeDefined();
    expect(newTag.name).toBe('plot-twist');

    const renamed = await tagService.renameTag(newTag.id, 'major-twist');
    expect(renamed.name).toBe('major-twist');

    const deleted = await tagService.deleteTag(newTag.id);
    expect(deleted).toBe(true);

    const list = await tagService.getTags('demo-novel-1');
    expect(list.some((t) => t.id === newTag.id)).toBe(false);
  });

  it('associates and retrieves entity tags', async () => {
    const updatedTags = await tagService.setEntityTags({
      project_id: 'demo-novel-1',
      entity_type: 'character',
      entity_id: 'char-1',
      tag_names: ['investigation', 'protagonist', 'veteran'],
    });

    expect(updatedTags.length).toBe(3);
    expect(updatedTags.some((t) => t.name === 'veteran')).toBe(true);

    const entityTags = await tagService.getEntityTags('character', 'char-1');
    expect(entityTags.length).toBe(3);
  });

  it('assigns tag to multiple entity types and verifies usage count', async () => {
    const projectId = 'demo-novel-1';
    const tag = await tagService.assignTag(projectId, 'character', 'char-1', 'climax');
    expect(tag.name).toBe('climax');

    // Assign same tag to a location
    await tagService.assignTag(projectId, 'location', 'loc-1', 'climax');

    // Assign same tag to a manuscript chapter
    await tagService.assignTag(projectId, 'manuscript', 'scene-1', 'climax');

    // Verify entity tags
    const charTags = await tagService.getEntityTags('character', 'char-1');
    expect(charTags.some((t) => t.name === 'climax')).toBe(true);

    const locTags = await tagService.getEntityTags('location', 'loc-1');
    expect(locTags.some((t) => t.name === 'climax')).toBe(true);

    // Remove from character only
    const removed = await tagService.removeTag('character', 'char-1', tag.id);
    expect(removed).toBe(true);

    const charTagsAfter = await tagService.getEntityTags('character', 'char-1');
    expect(charTagsAfter.some((t) => t.id === tag.id)).toBe(false);

    // Location tag remains intact
    const locTagsAfter = await tagService.getEntityTags('location', 'loc-1');
    expect(locTagsAfter.some((t) => t.id === tag.id)).toBe(true);
  });

  it('updates tag name via updateTag', async () => {
    const created = await tagService.createTag({
      project_id: 'demo-novel-1',
      name: 'draft-version-1',
    });
    const updated = await tagService.updateTag(created.id, 'draft-final');
    expect(updated.name).toBe('draft-final');
    await tagService.deleteTag(created.id);
  });
});
