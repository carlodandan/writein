import { invokeCommand } from './tauriIpc';
import type { DocumentContent } from '../types/manuscript';
import type { DocumentVersion } from '../types/phase5';

export const versionService = {
  async listDocumentVersions(nodeId: string): Promise<DocumentVersion[]> {
    return invokeCommand<DocumentVersion[]>('list_document_versions', {
      nodeId,
    });
  },

  async getDocumentVersion(versionId: string): Promise<DocumentVersion> {
    return invokeCommand<DocumentVersion>('get_document_version', {
      versionId,
    });
  },

  async createDocumentSnapshot(
    documentId: string,
    nodeId: string,
    snapshotText: string,
    wordCount: number
  ): Promise<DocumentVersion> {
    return invokeCommand<DocumentVersion>('create_document_snapshot', {
      documentId,
      nodeId,
      snapshotText,
      wordCount,
    });
  },

  async restoreDocumentVersion(
    nodeId: string,
    versionId: string
  ): Promise<DocumentContent> {
    return invokeCommand<DocumentContent>('restore_document_version', {
      nodeId,
      versionId,
    });
  },

  async deleteDocumentVersion(versionId: string): Promise<boolean> {
    return invokeCommand<boolean>('delete_document_version', {
      versionId,
    });
  },
};
