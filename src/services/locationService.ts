import { invokeCommand } from './tauriIpc';
import { Location, CreateLocationInput, UpdateLocationInput } from '../types/location';

export const locationService = {
  async getLocations(projectId: string): Promise<Location[]> {
    return invokeCommand<Location[]>('get_locations', { project_id: projectId });
  },

  async getLocation(id: string): Promise<Location> {
    return invokeCommand<Location>('get_location', { id });
  },

  async createLocation(input: CreateLocationInput): Promise<Location> {
    return invokeCommand<Location>('create_location', { input });
  },

  async updateLocation(id: string, input: UpdateLocationInput): Promise<Location> {
    return invokeCommand<Location>('update_location', { id, input });
  },

  async deleteLocation(id: string): Promise<boolean> {
    return invokeCommand<boolean>('delete_location', { id });
  },
};
