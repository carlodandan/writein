import { invokeCommand } from './tauriIpc';
import type {
  CreateNodeInput,
  DocumentContent,
  ManuscriptNode,
  MoveNodeInput,
  ReorderItem,
  SaveDocumentInput,
  UpdateNodeInput,
} from '../types/manuscript';

export const manuscriptService = {
  async getManuscriptTree(projectId: string): Promise<ManuscriptNode[]> {
    return invokeCommand<ManuscriptNode[]>('get_manuscript_tree', {
      projectId,
    });
  },

  async getNode(id: string): Promise<ManuscriptNode> {
    return invokeCommand<ManuscriptNode>('get_manuscript_node', { id });
  },

  async createNode(input: CreateNodeInput): Promise<ManuscriptNode> {
    return invokeCommand<ManuscriptNode>('create_manuscript_node', { input });
  },

  async updateNode(id: string, input: UpdateNodeInput): Promise<ManuscriptNode> {
    return invokeCommand<ManuscriptNode>('update_manuscript_node', { id, input });
  },

  async deleteNode(id: string): Promise<void> {
    return invokeCommand<void>('delete_manuscript_node', { id });
  },

  async duplicateNode(id: string): Promise<ManuscriptNode> {
    return invokeCommand<ManuscriptNode>('duplicate_manuscript_node', { id });
  },

  async moveNode(input: MoveNodeInput): Promise<ManuscriptNode> {
    return invokeCommand<ManuscriptNode>('move_manuscript_node', { input });
  },

  async reorderNodes(items: ReorderItem[]): Promise<void> {
    return invokeCommand<void>('reorder_manuscript_nodes', { items });
  },

  async getDocument(nodeId: string): Promise<DocumentContent> {
    return invokeCommand<DocumentContent>('get_document', { nodeId });
  },

  async saveDocument(input: SaveDocumentInput): Promise<DocumentContent> {
    return invokeCommand<DocumentContent>('save_document', { input });
  },
};
