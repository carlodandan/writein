import { describe, it, expect, vi } from 'vitest';
import { deepLinkService } from '../services/deepLinkService';

describe('Deep Link Client Service', () => {
  it('subscribes to deep link events and unsubscribes cleanly', () => {
    const events: string[] = [];
    const unsubscribe = deepLinkService.subscribe((url) => {
      events.push(url);
    });

    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });

  it('safely initializes in non-Tauri environment without throwing', async () => {
    const onNewProject = vi.fn();
    const onOpenProject = vi.fn();
    const onNavigateTab = vi.fn();

    await expect(
      deepLinkService.initialize({
        onNewProject,
        onOpenProject,
        onNavigateTab,
      })
    ).resolves.not.toThrow();

    expect(onNewProject).not.toHaveBeenCalled();
    expect(onOpenProject).not.toHaveBeenCalled();
    expect(onNavigateTab).not.toHaveBeenCalled();
  });
});
