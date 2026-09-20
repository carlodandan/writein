import { invokeCommand } from './tauriIpc';
import type { DocumentContent } from '../types/manuscript';
import type { DocumentVersion } from '../types/phase5';

export const versionService = {
  async listDocumentVersions(nodeId: string): Promise<DocumentVersion[]> {
    return invokeCommand<DocumentVersion[]>('list_document_versions', {
      node_id: nodeId,
    });
  },

  async getDocumentVersion(versionId: string): Promise<DocumentVersion> {
    return invokeCommand<DocumentVersion>('get_document_version', {
      version_id: versionId,
    });
  },

  async createDocumentSnapshot(
    documentId: string,
    nodeId: string,
    snapshotText: string,
    wordCount: number
  ): Promise<DocumentVersion> {
    return invokeCommand<DocumentVersion>('create_document_snapshot', {
      document_id: documentId,
      node_id: nodeId,
      snapshot_text: snapshotText,
      word_count: wordCount,
    });
  },

  async restoreDocumentVersion(
    nodeId: string,
    versionId: string
  ): Promise<DocumentContent> {
    return invokeCommand<DocumentContent>('restore_document_version', {
      node_id: nodeId,
      version_id: versionId,
    });
  },

  async deleteDocumentVersion(versionId: string): Promise<boolean> {
    return invokeCommand<boolean>('delete_document_version', {
      version_id: versionId,
    });
  },
};
