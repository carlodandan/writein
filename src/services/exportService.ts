import { invokeCommand, isTauri } from './tauriIpc';
import type {
  CompileOptions,
  CompileResult,
  StoryBibleExportResult,
} from '../types/exportImport';

export interface SaveFileOptions {
  fileName: string;
  contentText?: string;
  contentBase64?: string;
  blob?: Blob;
  mimeType?: string;
  extensions?: string[];
  filterName?: string;
}

export interface SaveFileResult {
  saved: boolean;
  filePath?: string | null;
  canceled?: boolean;
}

export const exportService = {
  async compileManuscript(
    projectId: string,
    options: CompileOptions
  ): Promise<CompileResult> {
    return invokeCommand<CompileResult>('compile_manuscript', {
      projectId,
      options,
    });
  },

  async exportStoryBible(
    projectId: string,
    format?: string
  ): Promise<StoryBibleExportResult> {
    return invokeCommand<StoryBibleExportResult>('export_story_bible', {
      projectId,
      format,
    });
  },

  /**
   * Saves a compiled manuscript or export file directly using native OS save dialog when in Tauri,
   * or falls back to browser download when in web/mock environments.
   */
  async exportAndSaveFile(options: SaveFileOptions): Promise<SaveFileResult> {
    if (isTauri()) {
      try {
        const { save } = await import('@tauri-apps/plugin-dialog');
        let defaultDir = '';
        try {
          defaultDir = await invokeCommand<string>('get_default_export_dir');
        } catch {
          // fallback if directory lookup fails
        }

        const ext = options.fileName.split('.').pop() || '*';
        const defaultPath = defaultDir ? `${defaultDir}\\${options.fileName}` : options.fileName;

        const chosenPath = await save({
          defaultPath,
          filters: [
            {
              name: options.filterName || `${ext.toUpperCase()} File`,
              extensions: options.extensions || [ext],
            },
            {
              name: 'All Files',
              extensions: ['*'],
            },
          ],
        });

        if (!chosenPath) {
          return { saved: false, canceled: true };
        }

        let contentBase64 = options.contentBase64;
        if (!contentBase64 && options.blob) {
          const buffer = await options.blob.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          contentBase64 = btoa(binary);
        }

        await invokeCommand<string>('save_exported_file', {
          filePath: chosenPath,
          contentText: options.contentText,
          contentBase64,
        });

        return { saved: true, filePath: chosenPath };
      } catch (err) {
        console.warn('Native save dialog failed, falling back to download:', err);
      }
    }

    // Fallback: browser download
    if (options.blob) {
      this.downloadBlob(options.blob, options.fileName);
    } else if (options.contentText !== undefined) {
      this.downloadFile(options.contentText, options.fileName, options.mimeType);
    } else if (options.contentBase64) {
      try {
        const cleanB64 = options.contentBase64.replace(/[^A-Za-z0-9+/=]/g, '');
        const byteCharacters = atob(cleanB64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: options.mimeType || 'application/octet-stream' });
        this.downloadBlob(blob, options.fileName);
      } catch (err) {
        console.warn('Failed to decode base64 for fallback download:', err);
      }
    }

    return { saved: true, filePath: null };
  },

  async revealInFolder(filePath: string): Promise<boolean> {
    if (isTauri() && filePath) {
      try {
        return await invokeCommand<boolean>('reveal_in_folder', { filePath });
      } catch (err) {
        console.warn('Failed to reveal file in folder:', err);
      }
    }
    return false;
  },

  downloadFile(content: string | Blob, fileName: string, mimeType = 'text/plain') {
    const blob =
      content instanceof Blob
        ? content
        : new Blob([content], { type: `${mimeType};charset=utf-8` });
    this.downloadBlob(blob, fileName);
  },

  downloadBlob(blob: Blob, fileName: string) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    try {
      const url =
        typeof URL.createObjectURL === 'function'
          ? URL.createObjectURL(blob)
          : 'blob:mock-url';
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (typeof URL.revokeObjectURL === 'function' && url !== 'blob:mock-url') {
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
    } catch (e) {
      console.warn('downloadBlob fallback:', e);
    }
  },
};
