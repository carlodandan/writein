import { invokeCommand } from './tauriIpc';
import type { TrashItem } from '../types/backupTrash';

export const trashService = {
  async listTrash(projectId: string): Promise<TrashItem[]> {
    return invokeCommand<TrashItem[]>('list_trash', {
      project_id: projectId,
    });
  },

  async moveToTrash(
    projectId: string,
    entityType: 'manuscript' | 'character' | 'location' | 'note',
    entityId: string,
    title: string
  ): Promise<TrashItem> {
    return invokeCommand<TrashItem>('move_to_trash', {
      project_id: projectId,
      entity_type: entityType,
      entity_id: entityId,
      title,
    });
  },

  async restoreFromTrash(trashId: string): Promise<boolean> {
    return invokeCommand<boolean>('restore_from_trash', {
      trash_id: trashId,
    });
  },

  async deletePermanently(trashId: string): Promise<boolean> {
    return invokeCommand<boolean>('delete_permanently', {
      trash_id: trashId,
    });
  },

  async emptyTrash(projectId: string): Promise<number> {
    return invokeCommand<number>('empty_trash', {
      project_id: projectId,
    });
  },
};
