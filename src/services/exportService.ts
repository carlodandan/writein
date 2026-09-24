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
      let selection: { token: string; filePath: string } | null | undefined;
      try {
        const { join } = await import('@tauri-apps/api/path');
        let defaultDir = '';
        try {
          defaultDir = await invokeCommand<string>('get_default_export_dir');
        } catch {
          // fallback if directory lookup fails
        }

        const ext = options.fileName.split('.').pop() || '*';
        const defaultPath = defaultDir ? await join(defaultDir, options.fileName) : options.fileName;

        selection = await invokeCommand<{ token: string; filePath: string } | null>('select_export_path', {
          defaultPath,
          filterName: options.filterName || `${ext.toUpperCase()} File`,
          extensions: options.extensions || [ext],
        });
      } catch (err) {
        console.warn('Native save dialog failed, falling back to download:', err);
        selection = undefined;
      }

      if (selection) {
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

        const filePath = await invokeCommand<string>('save_exported_file', {
          selectionToken: selection.token,
          contentText: options.contentText,
          contentBase64,
        });

        return { saved: true, filePath };
      }
      if (selection === null) return { saved: false, canceled: true };
    }

    // Fallback: browser download
    let downloaded = false;
    if (options.blob) {
      downloaded = this.downloadBlob(options.blob, options.fileName);
    } else if (options.contentText !== undefined) {
      downloaded = this.downloadFile(options.contentText, options.fileName, options.mimeType);
    } else if (options.contentBase64) {
      try {
        const byteCharacters = atob(options.contentBase64.trim());
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: options.mimeType || 'application/octet-stream' });
        downloaded = this.downloadBlob(blob, options.fileName);
      } catch (err) {
        console.warn('Failed to decode base64 for fallback download:', err);
      }
    }

    return { saved: downloaded, filePath: null };
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

  downloadFile(content: string | Blob, fileName: string, mimeType = 'text/plain'): boolean {
    try {
      const blob =
        content instanceof Blob
          ? content
          : new Blob([content], { type: `${mimeType};charset=utf-8` });
      return this.downloadBlob(blob, fileName);
    } catch (err) {
      console.warn('Failed to prepare file download:', err);
      return false;
    }
  },

  downloadBlob(blob: Blob, fileName: string): boolean {
    if (typeof window === 'undefined' || typeof document === 'undefined') return false;
    try {
      if (typeof URL.createObjectURL !== 'function') return false;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      try {
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
      } finally {
        link.remove();
        if (typeof URL.revokeObjectURL === 'function') {
          setTimeout(() => URL.revokeObjectURL(url), 10000);
        }
      }
      return true;
    } catch (e) {
      console.warn('downloadBlob fallback:', e);
      return false;
    }
  },
};
