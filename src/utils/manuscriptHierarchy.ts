import { ManuscriptNode, NodeType } from '../types/manuscript';

export interface TreeNode {
  node: ManuscriptNode;
  children: TreeNode[];
}

/**
 * Validates whether a child node of type childType is allowed to be placed inside parentType.
 */
export function validateHierarchy(
  childType: NodeType,
  parentType: NodeType | null
): { valid: boolean; error?: string } {
  if (childType === 'part') {
    if (parentType !== null) {
      return {
        valid: false,
        error: 'A Part must be placed at the root level of the manuscript.',
      };
    }
    return { valid: true };
  }

  if (childType === 'chapter') {
    if (parentType !== null && parentType !== 'part') {
      return {
        valid: false,
        error: 'A Chapter can only be placed at the root level or inside a Part.',
      };
    }
    return { valid: true };
  }

  if (childType === 'scene') {
    if (parentType !== 'chapter') {
      return {
        valid: false,
        error: 'A Scene must be placed inside a Chapter.',
      };
    }
    return { valid: true };
  }

  return { valid: true };
}

/**
 * Detects if moving moveNodeId into targetParentId creates a cycle.
 */
export function hasCycle(
  nodes: ManuscriptNode[],
  moveNodeId: string,
  targetParentId: string | null
): boolean {
  if (!targetParentId) return false;
  if (moveNodeId === targetParentId) return true;

  const nodeMap = new Map<string, ManuscriptNode>();
  for (const n of nodes) {
    nodeMap.set(n.id, n);
  }

  let curr: string | null = targetParentId;
  while (curr) {
    if (curr === moveNodeId) {
      return true;
    }
    const parent = nodeMap.get(curr);
    curr = parent?.parent_id || null;
  }

  return false;
}

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

/**
 * Generates an intuitive default title for newly created parts, chapters, or scenes.
 */
export function getNextDefaultTitle(
  nodes: ManuscriptNode[],
  nodeType: NodeType,
  parentId: string | null
): string {
  const siblings = nodes.filter((n) => n.parent_id === parentId && n.node_type === nodeType);
  const count = siblings.length + 1;

  if (nodeType === 'part') {
    const roman = ROMAN_NUMERALS[count - 1] || `${count}`;
    return `Part ${roman}`;
  }

  if (nodeType === 'chapter') {
    const num = count < 10 ? `0${count}` : `${count}`;
    return `Chapter ${num}`;
  }

  if (nodeType === 'scene') {
    const num = count < 10 ? `0${count}` : `${count}`;
    return `Scene ${num}`;
  }

  return 'Untitled';
}

/**
 * Transforms a flat list of nodes into a nested tree structure preserving sort_order.
 */
export function buildTreeHierarchy(nodes: ManuscriptNode[]): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();
  const rootNodes: TreeNode[] = [];

  // Initialize tree nodes
  for (const node of nodes) {
    nodeMap.set(node.id, { node, children: [] });
  }

  // Connect parents and children
  for (const node of nodes) {
    const treeNode = nodeMap.get(node.id)!;
    if (node.parent_id && nodeMap.has(node.parent_id)) {
      nodeMap.get(node.parent_id)!.children.push(treeNode);
    } else {
      rootNodes.push(treeNode);
    }
  }

  // Sort children by sort_order
  const sortFn = (a: TreeNode, b: TreeNode) => a.node.sort_order - b.node.sort_order;
  const sortRecursively = (items: TreeNode[]) => {
    items.sort(sortFn);
    for (const item of items) {
      sortRecursively(item.children);
    }
  };

  sortRecursively(rootNodes);
  return rootNodes;
}
