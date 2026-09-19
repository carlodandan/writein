import { describe, it, expect } from 'vitest';
import { manuscriptService } from '../services/manuscriptService';

describe('Manuscript Service Client Operations', () => {
  it('loads manuscript tree for project', async () => {
    const nodes = await manuscriptService.getManuscriptTree('demo-novel-1');
    expect(Array.isArray(nodes)).toBe(true);
    expect(nodes.length).toBeGreaterThan(0);
  });

  it('creates and updates a manuscript node', async () => {
    const created = await manuscriptService.createNode({
      project_id: 'demo-novel-1',
      parent_id: null,
      node_type: 'chapter',
      title: 'Chapter 03: The Midnight Bell',
      synopsis: 'Clock strikes twelve.',
    });

    expect(created.id).toBeDefined();
    expect(created.title).toBe('Chapter 03: The Midnight Bell');

    const updated = await manuscriptService.updateNode(created.id, {
      title: 'Chapter 03: The Iron Bell',
    });
    expect(updated.title).toBe('Chapter 03: The Iron Bell');
  });

  it('saves and retrieves document content with word count', async () => {
    const nodes = await manuscriptService.getManuscriptTree('demo-novel-1');
    const targetNode = nodes[0];

    const saved = await manuscriptService.saveDocument({
      node_id: targetNode.id,
      content_json: '{"type":"doc"}',
      content_text: 'It was a cold and windy evening on the cliffs.',
      word_count: 10,
      character_count: 47,
    });

    expect(saved.word_count).toBe(10);
    expect(saved.content_text).toContain('cliffs');

    const fetched = await manuscriptService.getDocument(targetNode.id);
    expect(fetched.word_count).toBe(10);
  });

  it('duplicates a manuscript node', async () => {
    const nodes = await manuscriptService.getManuscriptTree('demo-novel-1');
    const toDuplicate = nodes[0];

    const duplicated = await manuscriptService.duplicateNode(toDuplicate.id);
    expect(duplicated.title).toBe(`${toDuplicate.title} (Copy)`);
    expect(duplicated.id).not.toBe(toDuplicate.id);
  });
});
