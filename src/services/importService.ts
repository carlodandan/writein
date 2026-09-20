import { invokeCommand } from './tauriIpc';
import type { ManuscriptNode } from '../types/manuscript';
import type { CommitImportInput, ImportPreview } from '../types/exportImport';
import { parseManuscriptText } from '../utils/manuscriptImporter';

export const importService = {
  previewImport(text: string): ImportPreview {
    return parseManuscriptText(text);
  },

  async commitImport(input: CommitImportInput): Promise<ManuscriptNode[]> {
    return invokeCommand<ManuscriptNode[]>('commit_imported_manuscript', {
      input,
    });
  },
};
