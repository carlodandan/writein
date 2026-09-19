import { describe, it, expect } from 'vitest';
import {
  validateHierarchy,
  hasCycle,
  getNextDefaultTitle,
  buildTreeHierarchy,
} from '../utils/manuscriptHierarchy';
import { ManuscriptNode } from '../types/manuscript';

describe('Manuscript Hierarchy Rules', () => {
  it('allows Part at root level only', () => {
    expect(validateHierarchy('part', null).valid).toBe(true);
    expect(validateHierarchy('part', 'chapter').valid).toBe(false);
    expect(validateHierarchy('part', 'scene').valid).toBe(false);
    expect(validateHierarchy('part', 'part').valid).toBe(false);
  });

  it('allows Chapter at root or inside Part', () => {
    expect(validateHierarchy('chapter', null).valid).toBe(true);
    expect(validateHierarchy('chapter', 'part').valid).toBe(true);
    expect(validateHierarchy('chapter', 'chapter').valid).toBe(false);
    expect(validateHierarchy('chapter', 'scene').valid).toBe(false);
  });

  it('requires Scene to be inside a Chapter', () => {
    expect(validateHierarchy('scene', 'chapter').valid).toBe(true);
    expect(validateHierarchy('scene', null).valid).toBe(false);
    expect(validateHierarchy('scene', 'part').valid).toBe(false);
    expect(validateHierarchy('scene', 'scene').valid).toBe(false);
  });

  it('prevents cycles when moving nodes into themselves or descendants', () => {
    const nodes: ManuscriptNode[] = [
      {
        id: 'part-1',
        project_id: 'p1',
        parent_id: null,
        node_type: 'part',
        title: 'Part I',
        synopsis: null,
        sort_order: 1,
        status: 'draft',
        word_count: 0,
        created_at: '',
        updated_at: '',
        archived_at: null,
      },
      {
        id: 'chap-1',
        project_id: 'p1',
        parent_id: 'part-1',
        node_type: 'chapter',
        title: 'Chapter 01',
        synopsis: null,
        sort_order: 1,
        status: 'draft',
        word_count: 0,
        created_at: '',
        updated_at: '',
        archived_at: null,
      },
      {
        id: 'scene-1',
        project_id: 'p1',
        parent_id: 'chap-1',
        node_type: 'scene',
        title: 'Scene 01',
        synopsis: null,
        sort_order: 1,
        status: 'draft',
        word_count: 0,
        created_at: '',
        updated_at: '',
        archived_at: null,
      },
    ];

    // Cannot move into itself
    expect(hasCycle(nodes, 'part-1', 'part-1')).toBe(true);
    // Cannot move part-1 into its child chap-1
    expect(hasCycle(nodes, 'part-1', 'chap-1')).toBe(true);
    // Cannot move part-1 into its grandchild scene-1
    expect(hasCycle(nodes, 'part-1', 'scene-1')).toBe(true);
    // Can move chap-1 to root
    expect(hasCycle(nodes, 'chap-1', null)).toBe(false);
  });

  it('generates sequential default titles', () => {
    const emptyNodes: ManuscriptNode[] = [];
    expect(getNextDefaultTitle(emptyNodes, 'part', null)).toBe('Part I');
    expect(getNextDefaultTitle(emptyNodes, 'chapter', null)).toBe('Chapter 01');
    expect(getNextDefaultTitle(emptyNodes, 'scene', 'chap-1')).toBe('Scene 01');
  });

  it('builds tree hierarchy correctly preserving sort order', () => {
    const nodes: ManuscriptNode[] = [
      {
        id: 'c2',
        project_id: 'p1',
        parent_id: null,
        node_type: 'chapter',
        title: 'Chapter 02',
        synopsis: null,
        sort_order: 2,
        status: 'draft',
        word_count: 0,
        created_at: '',
        updated_at: '',
        archived_at: null,
      },
      {
        id: 'c1',
        project_id: 'p1',
        parent_id: null,
        node_type: 'chapter',
        title: 'Chapter 01',
        synopsis: null,
        sort_order: 1,
        status: 'draft',
        word_count: 0,
        created_at: '',
        updated_at: '',
        archived_at: null,
      },
      {
        id: 's1',
        project_id: 'p1',
        parent_id: 'c1',
        node_type: 'scene',
        title: 'Scene 01',
        synopsis: null,
        sort_order: 1,
        status: 'draft',
        word_count: 0,
        created_at: '',
        updated_at: '',
        archived_at: null,
      },
    ];

    const tree = buildTreeHierarchy(nodes);
    expect(tree.length).toBe(2);
    expect(tree[0].node.id).toBe('c1');
    expect(tree[0].children.length).toBe(1);
    expect(tree[0].children[0].node.id).toBe('s1');
    expect(tree[1].node.id).toBe('c2');
  });
});
