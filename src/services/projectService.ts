import { invokeCommand } from './tauriIpc';
import type {
  CreateProjectInput,
  Project,
  ProjectSummary,
  UpdateProjectInput,
} from '../types/project';

export const projectService = {
  async getProjects(): Promise<Project[]> {
    return invokeCommand<Project[]>('get_projects');
  },

  async getProject(id: string): Promise<Project> {
    return invokeCommand<Project>('get_project', { id });
  },

  async createProject(input: CreateProjectInput): Promise<Project> {
    return invokeCommand<Project>('create_project', { input });
  },

  async updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
    return invokeCommand<Project>('update_project', { id, input });
  },

  async deleteProject(id: string): Promise<void> {
    return invokeCommand<void>('delete_project', { id });
  },

  async getProjectSummary(id: string): Promise<ProjectSummary> {
    return invokeCommand<ProjectSummary>('get_project_summary', { id });
  },
};
