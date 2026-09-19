import { invokeCommand } from './tauriIpc';
import { SearchResponse } from '../types/search';

export const searchService = {
  async search(projectId: string, query: string): Promise<SearchResponse> {
    return invokeCommand<SearchResponse>('global_search', {
      project_id: projectId,
      query,
    });
  },
};
