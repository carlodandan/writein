import { invokeCommand } from './tauriIpc';
import {
  WorldbuildingEntry,
  CreateWorldbuildingInput,
  UpdateWorldbuildingInput,
} from '../types/worldbuilding';

export const worldbuildingService = {
  async getEntries(projectId: string, category?: string): Promise<WorldbuildingEntry[]> {
    return invokeCommand<WorldbuildingEntry[]>('get_worldbuilding_entries', {
      projectId,
      category: category === 'All' ? null : category,
    });
  },

  async getEntry(id: string): Promise<WorldbuildingEntry> {
    return invokeCommand<WorldbuildingEntry>('get_worldbuilding_entry', { id });
  },

  async createEntry(input: CreateWorldbuildingInput): Promise<WorldbuildingEntry> {
    return invokeCommand<WorldbuildingEntry>('create_worldbuilding_entry', { input });
  },

  async updateEntry(id: string, input: UpdateWorldbuildingInput): Promise<WorldbuildingEntry> {
    return invokeCommand<WorldbuildingEntry>('update_worldbuilding_entry', { id, input });
  },

  async deleteEntry(id: string): Promise<boolean> {
    return invokeCommand<boolean>('delete_worldbuilding_entry', { id });
  },
};
