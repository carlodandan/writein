import { describe, it, expect } from 'vitest';
import { exportService } from '../services/exportService';
import { importService } from '../services/importService';

describe('Export & Import Client Services', () => {
  const testProjectId = 'demo-novel-1';

  it('compiles manuscript via exportService IPC', async () => {
    const res = await exportService.compileManuscript(testProjectId, {
      format: 'markdown',
      includeTitlePage: true,
      includeTableOfContents: true,
      chapterHeaderFormat: 'numbered_with_title',
      sceneSeparator: '* * *',
    });

    expect(res).toBeDefined();
    expect(res.fileName.endsWith('.md')).toBe(true);
    expect(res.content.length).toBeGreaterThan(0);
    expect(typeof res.wordCount).toBe('number');
  });

  it('exports story bible via exportService IPC', async () => {
    const res = await exportService.exportStoryBible(testProjectId, 'markdown');
    expect(res).toBeDefined();
    expect(res.fileName).toContain('_story_bible.md');
    expect(res.content).toContain('# Story Bible:');
  });

  it('commits imported items via importService IPC', async () => {
    const preview = importService.previewImport(`Chapter 1: The New Horizon\n\nA fresh beginning for the crew.`);
    expect(preview.detectedNodes.length).toBeGreaterThan(0);

    const created = await importService.commitImport({
      projectId: testProjectId,
      items: preview.detectedNodes,
    });

    expect(Array.isArray(created)).toBe(true);
    expect(created.length).toBeGreaterThanOrEqual(1);
    expect(created[0].title).toBe('Chapter 1: The New Horizon');
  });

  it('exports and saves file using exportAndSaveFile', async () => {
    const textSave = await exportService.exportAndSaveFile({
      fileName: 'test_manuscript.md',
      contentText: '# Test Content',
      mimeType: 'text/markdown',
    });
    expect(textSave.saved).toBe(true);

    const docxSave = await exportService.exportAndSaveFile({
      fileName: 'test_manuscript.docx',
      contentBase64: 'UEsDBBQAAAAIAAA==',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    expect(docxSave.saved).toBe(true);
  });
});
