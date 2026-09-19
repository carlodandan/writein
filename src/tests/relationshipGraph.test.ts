import { describe, it, expect } from 'vitest';
import {
  calculateCircularLayout,
  mapRelationshipsToEdges,
  getRoleColor,
} from '../utils/relationshipGraph';
import { Character, CharacterRelationshipWithNames } from '../types/character';

describe('Relationship Graph Calculations & Styling', () => {
  const mockCharacters: Character[] = [
    {
      id: 'char-1',
      project_id: 'p1',
      name: 'Vance Marlowe',
      nickname: 'Vance',
      role: 'protagonist',
      age: '38',
      description: null,
      personality: null,
      appearance: null,
      background: null,
      motivations: null,
      fears: null,
      goals: null,
      notes: null,
      avatar_path: null,
      tags: null,
      custom_fields_json: null,
      created_at: '',
      updated_at: '',
    },
    {
      id: 'char-2',
      project_id: 'p1',
      name: 'Julian Blackwood',
      nickname: null,
      role: 'antagonist',
      age: '54',
      description: null,
      personality: null,
      appearance: null,
      background: null,
      motivations: null,
      fears: null,
      goals: null,
      notes: null,
      avatar_path: null,
      tags: null,
      custom_fields_json: null,
      created_at: '',
      updated_at: '',
    },
  ];

  it('calculates symmetrical circular layout for nodes', () => {
    const nodes = calculateCircularLayout(mockCharacters, 800, 600, 100);
    expect(nodes.length).toBe(2);
    // Node 0 should be at top (angle -PI/2 -> cos=0, sin=-1 -> y < 300)
    expect(nodes[0].x).toBe(400);
    expect(nodes[0].y).toBeLessThan(300);

    // Node 1 should be at bottom (angle PI/2 -> cos=0, sin=1 -> y > 300)
    expect(nodes[1].x).toBe(400);
    expect(nodes[1].y).toBeGreaterThan(300);
  });

  it('handles single node by centering it', () => {
    const single = calculateCircularLayout([mockCharacters[0]], 800, 600);
    expect(single.length).toBe(1);
    expect(single[0].x).toBe(400);
    expect(single[0].y).toBe(300);
  });

  it('handles empty characters list', () => {
    const empty = calculateCircularLayout([], 800, 600);
    expect(empty).toEqual([]);
  });

  it('maps relationships to graph edges', () => {
    const rels: CharacterRelationshipWithNames[] = [
      {
        id: 'rel-1',
        project_id: 'p1',
        character_a_id: 'char-1',
        character_a_name: 'Vance Marlowe',
        character_b_id: 'char-2',
        character_b_name: 'Julian Blackwood',
        relation_type: 'Nemesis',
        description: 'Lifelong hatred',
        created_at: '',
      },
    ];

    const edges = mapRelationshipsToEdges(rels);
    expect(edges.length).toBe(1);
    expect(edges[0].source).toBe('char-1');
    expect(edges[0].target).toBe('char-2');
    expect(edges[0].label).toBe('Nemesis');
  });

  it('provides distinct colors for protagonist, antagonist, supporting, minor', () => {
    const prot = getRoleColor('protagonist');
    const ant = getRoleColor('antagonist');
    const supp = getRoleColor('supporting');
    const min = getRoleColor('minor');

    expect(prot.nodeBg).not.toBe(ant.nodeBg);
    expect(ant.nodeBg).not.toBe(supp.nodeBg);
    expect(supp.nodeBg).not.toBe(min.nodeBg);
  });
});
