import { invokeCommand } from './tauriIpc';
import type { BackupFileInfo, BackupResult } from '../types/backupTrash';

export const backupService = {
  async createBackup(projectId: string): Promise<BackupResult> {
    return invokeCommand<BackupResult>('create_project_backup', {
      project_id: projectId,
    });
  },

  async restoreBackup(backupJson: string): Promise<string> {
    return invokeCommand<string>('restore_project_backup', {
      backup_json: backupJson,
    });
  },

  async listBackups(projectId?: string): Promise<BackupFileInfo[]> {
    return invokeCommand<BackupFileInfo[]>('list_backups', {
      project_id: projectId ?? null,
    });
  },

  async deleteBackupFile(fileName: string): Promise<boolean> {
    return invokeCommand<boolean>('delete_backup_file', {
      file_name: fileName,
    });
  },

  downloadBackup(result: BackupResult): void {
    const blob = new Blob([result.contentJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
