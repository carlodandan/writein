export type ExportFormat = 'markdown' | 'text' | 'html' | 'json';
export type ChapterHeaderFormat = 'numbered_with_title' | 'numbered_only' | 'title_only';
export type SceneSeparator = '* * *' | '###' | '---' | 'blank_line';

export interface CompileOptions {
  format: ExportFormat;
  includeTitlePage: boolean;
  includeTableOfContents: boolean;
  chapterHeaderFormat: ChapterHeaderFormat;
  sceneSeparator: SceneSeparator;
  selectedNodeIds?: string[];
}

export interface CompileResult {
  fileName: string;
  filePath?: string | null;
  content: string;
  wordCount: number;
  characterCount: number;
}

export interface StoryBibleExportResult {
  fileName: string;
  filePath?: string | null;
  content: string;
}

export interface ImportDetectedNode {
  nodeType: 'part' | 'chapter' | 'scene';
  title: string;
  contentText: string;
  wordCount: number;
  characterCount: number;
  orderIndex: number;
  children?: ImportDetectedNode[];
}

export interface ImportPreview {
  totalNodes: number;
  totalWords: number;
  detectedNodes: ImportDetectedNode[];
}

export interface CommitImportInput {
  projectId: string;
  items: ImportDetectedNode[];
}
