import { describe, it, expect } from 'vitest';
import { backupService } from '../services/backupService';

describe('backupService', () => {
  const projectId = 'demo-novel-1';

  it('creates a project backup bundle with all entities', async () => {
    const result = await backupService.createBackup(projectId);

    expect(result).toBeDefined();
    expect(result.fileName).toMatch(/\.writein$/);
    expect(result.contentJson).toBeDefined();

    const bundle = JSON.parse(result.contentJson);
    expect(bundle.version).toBe('1.0.0');
    expect(bundle.project.title).toBe('The Silent Hour');
    expect(Array.isArray(bundle.nodes)).toBe(true);
    expect(bundle.nodes.length).toBeGreaterThan(0);
    expect(bundle.characters).toBeDefined();
    expect(bundle.locations).toBeDefined();
    expect(bundle.notes).toBeDefined();
  });

  it('restores a project from a backup bundle', async () => {
    const backup = await backupService.createBackup(projectId);
    const restoredProject = await backupService.restoreBackup(backup.contentJson);

    expect(restoredProject).toBeDefined();
    expect(restoredProject.id).toMatch(/^proj-restored-/);
  });

  it('lists backups and deletes a backup file', async () => {
    const backups = await backupService.listBackups(projectId);
    expect(Array.isArray(backups)).toBe(true);

    const deleted = await backupService.deleteBackupFile('dummy_backup.writein');
    expect(deleted).toBe(true);
  });
});
