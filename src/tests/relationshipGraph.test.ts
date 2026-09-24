import { describe, it, expect } from 'vitest';
import {
  calculateCircularLayout,
  mapRelationshipsToEdges,
  getRoleColor,
  calculateBoundingBox,
  calculateFitView,
  GraphNode,
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

  it('calculates bounding box correctly for arbitrary node positions', () => {
    const nodes: GraphNode[] = [
      { id: '1', name: 'A', role: 'protagonist', nickname: null, x: -500, y: -200 },
      { id: '2', name: 'B', role: 'antagonist', nickname: null, x: 1500, y: 800 },
    ];
    const bbox = calculateBoundingBox(nodes, 50);
    expect(bbox.minX).toBe(-550);
    expect(bbox.maxX).toBe(1550);
    expect(bbox.minY).toBe(-250);
    expect(bbox.maxY).toBe(850);
    expect(bbox.width).toBe(2100);
    expect(bbox.height).toBe(1100);
    expect(bbox.centerX).toBe(500);
    expect(bbox.centerY).toBe(300);
  });

  it('handles empty nodes in bounding box and fit view', () => {
    const emptyBbox = calculateBoundingBox([]);
    expect(emptyBbox.width).toBe(0);

    const emptyFit = calculateFitView([], 1000, 600);
    expect(emptyFit.zoom).toBe(1);
    expect(emptyFit.pan).toEqual({ x: 0, y: 0 });
  });

  it('calculates optimal fit view framing all nodes into viewport', () => {
    const nodes: GraphNode[] = [
      { id: '1', name: 'A', role: 'protagonist', nickname: null, x: 0, y: 0 },
      { id: '2', name: 'B', role: 'antagonist', nickname: null, x: 1000, y: 600 },
    ];
    const fit = calculateFitView(nodes, 800, 600, 50);
    expect(fit.zoom).toBeGreaterThan(0.2);
    expect(fit.zoom).toBeLessThanOrEqual(1.8);
    // Should center the canvas
    expect(typeof fit.pan.x).toBe('number');
    expect(typeof fit.pan.y).toBe('number');
  });
});
