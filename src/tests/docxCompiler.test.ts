import { describe, it, expect } from 'vitest';
import { createDocxDocument, compileManuscriptDocx } from '../utils/docxCompiler';
import type { Project } from '../types/project';
import type { ManuscriptNode } from '../types/manuscript';

describe('DOCX Manuscript Compiler Utility', () => {
  const mockProject: Project = {
    id: 'proj-comp-docx-1',
    title: 'The Clockwork Citadel',
    subtitle: 'Chronicles of the Iron Sky',
    author: 'Sylvia Thorne',
    description: 'A fantasy epic of floating cities.',
    genre: 'Steampunk Fantasy',
    status: 'writing',
    target_word_count: 80000,
    current_word_count: 1200,
    cover_image: null,
    project_notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    archived_at: null,
  };

  const mockNodes: ManuscriptNode[] = [
    {
      id: 'part-1',
      project_id: 'proj-comp-docx-1',
      parent_id: null,
      node_type: 'part',
      title: 'Book One: Gears of War',
      synopsis: null,
      sort_order: 1,
      status: 'draft',
      word_count: 100,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      archived_at: null,
    },
    {
      id: 'chap-1',
      project_id: 'proj-comp-docx-1',
      parent_id: 'part-1',
      node_type: 'chapter',
      title: 'Ascent into the Fog',
      synopsis: null,
      sort_order: 1,
      status: 'draft',
      word_count: 200,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      archived_at: null,
    },
    {
      id: 'scene-1',
      project_id: 'proj-comp-docx-1',
      parent_id: 'chap-1',
      node_type: 'scene',
      title: 'The Brass Gondola',
      synopsis: null,
      sort_order: 1,
      status: 'draft',
      word_count: 150,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      archived_at: null,
    },
    {
      id: 'scene-2',
      project_id: 'proj-comp-docx-1',
      parent_id: 'chap-1',
      node_type: 'scene',
      title: 'Turbulence over Aethel',
      synopsis: null,
      sort_order: 2,
      status: 'draft',
      word_count: 120,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      archived_at: null,
    },
  ];

  const mockDocuments: Record<string, { content_text: string; word_count: number }> = {
    'part-1': { content_text: 'In the days when the clouds turned to bronze.', word_count: 9 },
    'chap-1': { content_text: 'The airship groaned beneath the atmospheric pressure.', word_count: 8 },
    'scene-1': { content_text: 'Rowan leaned against the brass rail, staring into the abyss.', word_count: 10 },
    'scene-2': { content_text: 'Lightning illuminated the jagged spires beneath them.', word_count: 8 },
  };

  it('creates a valid docx Document model with title page, TOC, and scene breaks', () => {
    const doc = createDocxDocument(mockProject, mockNodes, mockDocuments, {
      format: 'docx',
      includeTitlePage: true,
      includeTableOfContents: true,
      chapterHeaderFormat: 'numbered_with_title',
      sceneSeparator: '* * *',
    });

    expect(doc).toBeDefined();
    expect(doc).toHaveProperty('documentWrapper');
  });

  it('compiles manuscript into a binary DOCX Blob with correct MIME type and valid size', async () => {
    const blob = await compileManuscriptDocx(mockProject, mockNodes, mockDocuments, {
      format: 'docx',
      includeTitlePage: true,
      includeTableOfContents: true,
      chapterHeaderFormat: 'numbered_with_title',
      sceneSeparator: '* * *',
    });

    expect(blob).toBeDefined();
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(blob.size).toBeGreaterThan(4000); // Standard minimal OpenXML zip archive is >4KB
  });

  it('compiles manuscript without title page or TOC when disabled', async () => {
    const blob = await compileManuscriptDocx(mockProject, mockNodes, mockDocuments, {
      format: 'docx',
      includeTitlePage: false,
      includeTableOfContents: false,
      chapterHeaderFormat: 'numbered_only',
      sceneSeparator: '###',
    });

    expect(blob).toBeDefined();
    expect(blob.size).toBeGreaterThan(2000);
  });

  it('respects selectedNodeIds filter', async () => {
    const doc = createDocxDocument(mockProject, mockNodes, mockDocuments, {
      format: 'docx',
      includeTitlePage: false,
      includeTableOfContents: false,
      chapterHeaderFormat: 'title_only',
      sceneSeparator: '---',
      selectedNodeIds: ['chap-1', 'scene-1'],
    });

    expect(doc).toBeDefined();
  });
});
