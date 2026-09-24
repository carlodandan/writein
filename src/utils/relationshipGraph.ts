import { Character, CharacterRelationshipWithNames, CharacterRole } from '../types/character';

export interface GraphNode {
  id: string;
  name: string;
  role: CharacterRole;
  nickname: string | null;
  x: number;
  y: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  description: string | null;
}

/**
 * Calculates circular layout coordinates for characters in an SVG canvas.
 */
export function calculateCircularLayout(
  characters: Character[],
  width: number = 800,
  height: number = 600,
  padding: number = 80,
): GraphNode[] {
  if (characters.length === 0) return [];
  if (characters.length === 1) {
    const c = characters[0];
    return [
      {
        id: c.id,
        name: c.name,
        role: c.role,
        nickname: c.nickname,
        x: width / 2,
        y: height / 2,
      },
    ];
  }

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(centerX - padding, centerY - padding);
  const angleStep = (2 * Math.PI) / characters.length;

  return characters.map((c, index) => {
    // Start from top (-PI/2)
    const angle = index * angleStep - Math.PI / 2;
    return {
      id: c.id,
      name: c.name,
      role: c.role,
      nickname: c.nickname,
      x: Math.round(centerX + radius * Math.cos(angle)),
      y: Math.round(centerY + radius * Math.sin(angle)),
    };
  });
}

/**
 * Maps relationships to graph edges.
 */
export function mapRelationshipsToEdges(
  relationships: CharacterRelationshipWithNames[],
): GraphEdge[] {
  return relationships.map((r) => ({
    id: r.id,
    source: r.character_a_id,
    target: r.character_b_id,
    label: r.relation_type,
    description: r.description,
  }));
}

/**
 * Returns role badge styling colors for nodes.
 */
export function getRoleColor(role: CharacterRole | string): {
  badgeBg: string;
  badgeText: string;
  border: string;
  nodeBg: string;
  nodeText: string;
} {
  switch (role.toLowerCase()) {
    case 'protagonist':
      return {
        badgeBg: 'var(--amber-soft)',
        badgeText: 'var(--amber-accent)',
        border: 'var(--amber-accent)',
        nodeBg: '#FFFBEB',
        nodeText: '#92400E',
      };
    case 'antagonist':
      return {
        badgeBg: '#FEE2E2',
        badgeText: '#DC2626',
        border: '#DC2626',
        nodeBg: '#FEF2F2',
        nodeText: '#991B1B',
      };
    case 'supporting':
      return {
        badgeBg: '#EFF6FF',
        badgeText: '#2563EB',
        border: '#3B82F6',
        nodeBg: '#F0F9FF',
        nodeText: '#1E40AF',
      };
    case 'minor':
    default:
      return {
        badgeBg: '#F3F4F6',
        badgeText: '#4B5563',
        border: '#9CA3AF',
        nodeBg: '#F9FAFB',
        nodeText: '#374151',
      };
  }
}

export interface GraphBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

/**
 * Computes the 2D bounding box covering all nodes with optional margin padding.
 */
export function calculateBoundingBox(
  nodes: GraphNode[],
  nodePadding: number = 60,
): GraphBounds {
  if (nodes.length === 0) {
    return {
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
      width: 0,
      height: 0,
      centerX: 0,
      centerY: 0,
    };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    if (node.x < minX) minX = node.x;
    if (node.x > maxX) maxX = node.x;
    if (node.y < minY) minY = node.y;
    if (node.y > maxY) maxY = node.y;
  }

  minX -= nodePadding;
  maxX += nodePadding;
  minY -= nodePadding;
  maxY += nodePadding;

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);

  return {
    minX,
    maxX,
    minY,
    maxY,
    width,
    height,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

/**
 * Calculates pan and zoom coordinates to frame all nodes inside the viewport.
 */
export function calculateFitView(
  nodes: GraphNode[],
  viewportWidth: number,
  viewportHeight: number,
  padding: number = 80,
  minZoom: number = 0.25,
  maxZoom: number = 1.8,
): { pan: { x: number; y: number }; zoom: number } {
  if (nodes.length === 0 || viewportWidth <= 0 || viewportHeight <= 0) {
    return { pan: { x: 0, y: 0 }, zoom: 1 };
  }

  const bounds = calculateBoundingBox(nodes, 60);
  const availableWidth = Math.max(100, viewportWidth - padding * 2);
  const availableHeight = Math.max(100, viewportHeight - padding * 2);

  const scaleX = availableWidth / bounds.width;
  const scaleY = availableHeight / bounds.height;
  const rawZoom = Math.min(scaleX, scaleY);
  const targetZoom = Math.min(Math.max(rawZoom, minZoom), maxZoom);

  const panX = viewportWidth / 2 - bounds.centerX * targetZoom;
  const panY = viewportHeight / 2 - bounds.centerY * targetZoom;

  return {
    pan: { x: Math.round(panX), y: Math.round(panY) },
    zoom: Number(targetZoom.toFixed(2)),
  };
}
