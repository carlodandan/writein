import { describe, it, expect } from 'vitest';
import { compileManuscript } from '../utils/manuscriptCompiler';
import type { Project } from '../types/project';
import type { ManuscriptNode } from '../types/manuscript';

describe('Manuscript Compiler Utility', () => {
  const mockProject: Project = {
    id: 'proj-comp-1',
    title: 'The Silent Compass',
    subtitle: 'A Voyage to the Edge',
    author: 'Eleanor Vance',
    description: 'An expedition into uncharted fog.',
    genre: 'Maritime Fantasy',
    status: 'writing',
    target_word_count: 75000,
    current_word_count: 500,
    cover_image: null,
    project_notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    archived_at: null,
  };

  const mockNodes: ManuscriptNode[] = [
    {
      id: 'part-1',
      project_id: 'proj-comp-1',
      parent_id: null,
      node_type: 'part',
      title: 'Part I: Departure',
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
      project_id: 'proj-comp-1',
      parent_id: 'part-1',
      node_type: 'chapter',
      title: 'The Iron Docks',
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
      project_id: 'proj-comp-1',
      parent_id: 'chap-1',
      node_type: 'scene',
      title: 'Boarding the Ketch',
      synopsis: null,
      sort_order: 1,
      status: 'draft',
      word_count: 150,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      archived_at: null,
    },
  ];

  const mockDocuments: Record<string, { content_text: string; word_count: number }> = {
    'part-1': { content_text: 'Opening epigraph for Part I.', word_count: 5 },
    'chap-1': { content_text: 'The bells rang five times across the iron harbor.', word_count: 9 },
    'scene-1': { content_text: 'Captain Vance stepped onto the wet salt-bleached deck.', word_count: 8 },
  };

  it('compiles manuscript to Markdown with title page, TOC, and scene breaks', () => {
    const res = compileManuscript(mockProject, mockNodes, mockDocuments, {
      format: 'markdown',
      includeTitlePage: true,
      includeTableOfContents: true,
      chapterHeaderFormat: 'numbered_with_title',
      sceneSeparator: '* * *',
    });

    expect(res.fileName).toBe('the_silent_compass.md');
    expect(res.content).toContain('# The Silent Compass');
    expect(res.content).toContain('*A Voyage to the Edge*');
    expect(res.content).toContain('**By Eleanor Vance**');
    expect(res.content).toContain('Table of Contents');
    expect(res.content).toContain('1. The Iron Docks');
    expect(res.content).toContain('# Part I: Departure');
    expect(res.content).toContain('## Chapter 1: The Iron Docks');
    expect(res.content).toContain('* * *');
    expect(res.content).toContain('Captain Vance stepped onto the wet salt-bleached deck.');
    expect(res.wordCount).toBeGreaterThan(20);
  });

  it('compiles manuscript to Plain Text standard format', () => {
    const res = compileManuscript(mockProject, mockNodes, mockDocuments, {
      format: 'text',
      includeTitlePage: true,
      includeTableOfContents: false,
      chapterHeaderFormat: 'numbered_only',
      sceneSeparator: '---',
    });

    expect(res.fileName).toBe('the_silent_compass.txt');
    expect(res.content).toContain('THE SILENT COMPASS');
    expect(res.content).toContain('By Eleanor Vance');
    expect(res.content).toContain('CHAPTER 1');
  });

  it('compiles manuscript to Printable HTML format with styled containers and page breaks', () => {
    const res = compileManuscript(mockProject, mockNodes, mockDocuments, {
      format: 'html',
      includeTitlePage: true,
      includeTableOfContents: true,
      chapterHeaderFormat: 'title_only',
      sceneSeparator: '* * *',
    });

    expect(res.fileName).toBe('the_silent_compass.html');
    expect(res.content).toContain('<!DOCTYPE html>');
    expect(res.content).toContain('<h1 class="book-title">The Silent Compass</h1>');
    expect(res.content).toContain('<div class="page-break"></div>');
    expect(res.content).toContain('<h2 class="chapter-title">The Iron Docks</h2>');
  });

  it('filters by selected node IDs when provided', () => {
    const res = compileManuscript(mockProject, mockNodes, mockDocuments, {
      format: 'markdown',
      includeTitlePage: false,
      includeTableOfContents: false,
      chapterHeaderFormat: 'title_only',
      sceneSeparator: '* * *',
      selectedNodeIds: ['chap-1'],
    });

    expect(res.content).not.toContain('# Part I: Departure');
    expect(res.content).toContain('## The Iron Docks');
  });
});
