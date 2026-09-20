import { invokeCommand } from './tauriIpc';
import type {
  CompileOptions,
  CompileResult,
  StoryBibleExportResult,
} from '../types/exportImport';

export const exportService = {
  async compileManuscript(
    projectId: string,
    options: CompileOptions
  ): Promise<CompileResult> {
    return invokeCommand<CompileResult>('compile_manuscript', {
      project_id: projectId,
      options,
    });
  },

  async exportStoryBible(
    projectId: string,
    format?: string
  ): Promise<StoryBibleExportResult> {
    return invokeCommand<StoryBibleExportResult>('export_story_bible', {
      project_id: projectId,
      format,
    });
  },

  downloadFile(content: string, fileName: string, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
