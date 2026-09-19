import { describe, it, expect } from 'vitest';
import { projectService } from '../services/projectService';

describe('Project Service Client Operations', () => {
  it('loads projects list', async () => {
    const projects = await projectService.getProjects();
    expect(Array.isArray(projects)).toBe(true);
    expect(projects.length).toBeGreaterThanOrEqual(1);
  });

  it('creates and retrieves a new project', async () => {
    const created = await projectService.createProject({
      title: 'Echoes of the Sea',
      genre: 'Literary Fiction',
      target_word_count: 65000,
    });

    expect(created.id).toBeDefined();
    expect(created.title).toBe('Echoes of the Sea');
    expect(created.target_word_count).toBe(65000);

    const fetched = await projectService.getProject(created.id);
    expect(fetched.title).toBe('Echoes of the Sea');
  });

  it('updates project details and status', async () => {
    const created = await projectService.createProject({
      title: 'Working Title',
    });

    const updated = await projectService.updateProject(created.id, {
      title: 'Final Masterpiece',
      status: 'writing',
    });

    expect(updated.title).toBe('Final Masterpiece');
    expect(updated.status).toBe('writing');
  });

  it('fetches project summary statistics', async () => {
    const projects = await projectService.getProjects();
    const summary = await projectService.getProjectSummary(projects[0].id);
    expect(summary.project.id).toBe(projects[0].id);
    expect(typeof summary.chapter_count).toBe('number');
  });
});
