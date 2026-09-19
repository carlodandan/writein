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
