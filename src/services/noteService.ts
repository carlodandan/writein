import { invokeCommand } from './tauriIpc';
import { CreateNoteInput, Note, UpdateNoteInput } from '../types/note';

export const noteService = {
  async getNotes(
    projectId: string,
    category?: string,
    includeArchived: boolean = false,
  ): Promise<Note[]> {
    return invokeCommand<Note[]>('get_notes', {
      projectId,
      category: category === 'All' ? null : category,
      includeArchived,
    });
  },

  async getNote(id: string): Promise<Note> {
    return invokeCommand<Note>('get_note', { id });
  },

  async createNote(input: CreateNoteInput): Promise<Note> {
    return invokeCommand<Note>('create_note', { input });
  },

  async updateNote(id: string, input: UpdateNoteInput): Promise<Note> {
    return invokeCommand<Note>('update_note', { id, input });
  },

  async toggleArchive(id: string): Promise<Note> {
    return invokeCommand<Note>('toggle_archive_note', { id });
  },

  async deleteNote(id: string): Promise<boolean> {
    return invokeCommand<boolean>('delete_note', { id });
  },
};
