import { describe, it, expect } from 'vitest';
import { attachmentService } from '../services/attachmentService';

describe('Attachment Service Client Operations', () => {
  const projectId = 'demo-novel-1';

  it('loads attachments for a project', async () => {
    const list = await attachmentService.getAttachments(projectId);
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toHaveProperty('file_name');
    expect(list[0]).toHaveProperty('file_type');
  });

  it('creates and retrieves a new attachment', async () => {
    const created = await attachmentService.createAttachment({
      project_id: projectId,
      file_name: 'cast_wardrobe_sheet.docx',
      file_path: 'C:/mock/path/cast_wardrobe_sheet.docx',
      relative_path: 'cast_wardrobe_sheet.docx',
      file_type: 'document',
      mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      file_size: 45000,
      entity_type: 'character',
      entity_id: 'char-1',
      description: 'Costume notes for Vance',
    });

    expect(created.id).toBeDefined();
    expect(created.file_name).toBe('cast_wardrobe_sheet.docx');
    expect(created.entity_type).toBe('character');
    expect(created.entity_id).toBe('char-1');

    // Filter by entity
    const charAttachments = await attachmentService.getAttachments(projectId, 'character', 'char-1');
    expect(charAttachments.some((a) => a.id === created.id)).toBe(true);
  });

  it('saves an attachment file with base64 data', async () => {
    const saved = await attachmentService.saveAttachmentFile({
      project_id: projectId,
      file_name: 'clocktower_map.png',
      base64_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      entity_type: 'location',
      entity_id: 'loc-1',
      description: 'Historical blueprint of the tower',
    });

    expect(saved.id).toBeDefined();
    expect(saved.file_type).toBe('image');
    expect(saved.entity_type).toBe('location');
    expect(saved.entity_id).toBe('loc-1');
  });

  it('updates attachment metadata and entity association', async () => {
    const created = await attachmentService.createAttachment({
      project_id: projectId,
      file_name: 'temporary_sketch.png',
      file_path: 'temp.png',
      file_type: 'image',
      file_size: 12000,
    });

    const updated = await attachmentService.updateAttachment(created.id, {
      file_name: 'final_sketch.png',
      description: 'Polished vector version',
      entity_type: 'character',
      entity_id: 'char-2',
    });

    expect(updated.file_name).toBe('final_sketch.png');
    expect(updated.description).toBe('Polished vector version');
    expect(updated.entity_type).toBe('character');
    expect(updated.entity_id).toBe('char-2');
  });

  it('deletes an attachment cleanly', async () => {
    const created = await attachmentService.createAttachment({
      project_id: projectId,
      file_name: 'to_be_deleted.txt',
      file_path: 'delete.txt',
      file_type: 'document',
      file_size: 100,
    });

    const success = await attachmentService.deleteAttachment(created.id);
    expect(success).toBe(true);

    const list = await attachmentService.getAttachments(projectId);
    expect(list.some((a) => a.id === created.id)).toBe(false);
  });

  it('simulates opening attachment and revealing folder', async () => {
    const list = await attachmentService.getAttachments(projectId);
    const first = list[0];
    expect(first).toBeDefined();

    const openResult = await attachmentService.openAttachment(first.id);
    expect(openResult).toBe(true);

    const revealResult = await attachmentService.revealAttachmentFolder(first.id);
    expect(revealResult).toBe(true);
  });

  it('prevents directory path traversal attacks on file names', async () => {
    const malicious = await attachmentService.saveAttachmentFile({
      project_id: projectId,
      file_name: '../../../../etc/passwd',
      base64_data: 'dGVzdA==',
    });

    // Verify sanitized name does not contain .. or slashes
    expect(malicious.file_name).not.toContain('..');
    expect(malicious.file_name).not.toContain('/');
    expect(malicious.file_name).not.toContain('\\');
    expect(malicious.file_name).toBe('passwd');

    const windowsMalicious = await attachmentService.saveAttachmentFile({
      project_id: projectId,
      file_name: '..\\..\\Windows\\System32\\cmd.exe',
      base64_data: 'dGVzdA==',
    });

    expect(windowsMalicious.file_name).not.toContain('..');
    expect(windowsMalicious.file_name).not.toContain('\\');
    expect(windowsMalicious.file_name).toBe('cmd.exe');
  });
});
