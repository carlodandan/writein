import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type {
  CreateProjectInput,
  Project,
  ProjectSummary,
  UpdateProjectInput,
} from '../types/project';
import { projectService } from '../services/projectService';

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  summary: ProjectSummary | null;
  isLoading: boolean;
  error: string | null;
  selectProject: (id: string) => Promise<void>;
  createProject: (input: CreateProjectInput) => Promise<Project>;
  updateProject: (id: string, input: UpdateProjectInput) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async (projectId: string) => {
    try {
      const s = await projectService.getProjectSummary(projectId);
      setSummary(s);
    } catch (err: any) {
      console.warn('Could not load summary for project', projectId, err);
      setSummary(null);
    }
  }, []);

  const selectProject = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const proj = await projectService.getProject(id);
        setCurrentProject(proj);
        await loadSummary(id);
        localStorage.setItem('writein_last_project_id', id);
      } catch (err: any) {
        setError(err.message || 'Failed to load project');
      } finally {
        setIsLoading(false);
      }
    },
    [loadSummary]
  );

  const refreshProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await projectService.getProjects();
      setProjects(list);

      if (list.length > 0) {
        const savedId = localStorage.getItem('writein_last_project_id');
        const toSelect = list.find((p) => p.id === savedId) || list[0];
        setCurrentProject(toSelect);
        await loadSummary(toSelect.id);
      } else {
        setCurrentProject(null);
        setSummary(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch projects');
    } finally {
      setIsLoading(false);
    }
  }, [loadSummary]);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const handleCreateProject = async (input: CreateProjectInput): Promise<Project> => {
    setIsLoading(true);
    setError(null);
    try {
      const created = await projectService.createProject(input);
      await refreshProjects();
      await selectProject(created.id);
      return created;
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProject = async (
    id: string,
    input: UpdateProjectInput
  ): Promise<Project> => {
    try {
      const updated = await projectService.updateProject(id, input);
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      if (currentProject?.id === id) {
        setCurrentProject(updated);
        await loadSummary(id);
      }
      return updated;
    } catch (err: any) {
      setError(err.message || 'Failed to update project');
      throw err;
    }
  };

  const handleDeleteProject = async (id: string): Promise<void> => {
    try {
      await projectService.deleteProject(id);
      await refreshProjects();
    } catch (err: any) {
      setError(err.message || 'Failed to delete project');
      throw err;
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        summary,
        isLoading,
        error,
        selectProject,
        createProject: handleCreateProject,
        updateProject: handleUpdateProject,
        deleteProject: handleDeleteProject,
        refreshProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
