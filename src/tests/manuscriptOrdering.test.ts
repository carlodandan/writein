import { describe, it, expect } from 'vitest';
import { ManuscriptNode } from '../types/manuscript';
import { buildTreeHierarchy } from '../utils/manuscriptHierarchy';

describe('Manuscript Ordering and Reordering', () => {
  it('moves Chapter 3 before Chapter 1 and verifies resulting order', () => {
    const chapters: ManuscriptNode[] = [
      {
        id: 'c1',
        project_id: 'p1',
        parent_id: null,
        node_type: 'chapter',
        title: 'Chapter 1',
        synopsis: null,
        sort_order: 1,
        status: 'draft',
        word_count: 100,
        created_at: '',
        updated_at: '',
        archived_at: null,
      },
      {
        id: 'c2',
        project_id: 'p1',
        parent_id: null,
        node_type: 'chapter',
        title: 'Chapter 2',
        synopsis: null,
        sort_order: 2,
        status: 'draft',
        word_count: 200,
        created_at: '',
        updated_at: '',
        archived_at: null,
      },
      {
        id: 'c3',
        project_id: 'p1',
        parent_id: null,
        node_type: 'chapter',
        title: 'Chapter 3',
        synopsis: null,
        sort_order: 3,
        status: 'draft',
        word_count: 300,
        created_at: '',
        updated_at: '',
        archived_at: null,
      },
    ];

    // Initial order check
    const initialTree = buildTreeHierarchy(chapters);
    expect(initialTree.map((t) => t.node.title)).toEqual(['Chapter 1', 'Chapter 2', 'Chapter 3']);

    // Reorder: Move Chapter 3 to position 0 (before Chapter 1)
    const reorderedList = [...chapters];
    const [moved] = reorderedList.splice(2, 1); // remove c3
    reorderedList.unshift(moved); // place at start

    // Update sort_order to be sequential 1, 2, 3
    const updatedWithOrder = reorderedList.map((item, idx) => ({
      ...item,
      sort_order: idx + 1,
    }));

    const resultingTree = buildTreeHierarchy(updatedWithOrder);
    expect(resultingTree.map((t) => t.node.title)).toEqual(['Chapter 3', 'Chapter 1', 'Chapter 2']);
    expect(resultingTree[0].node.sort_order).toBe(1);
    expect(resultingTree[1].node.sort_order).toBe(2);
    expect(resultingTree[2].node.sort_order).toBe(3);
  });
});
