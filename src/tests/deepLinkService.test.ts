import { describe, it, expect, vi } from 'vitest';
import { deepLinkService, handleDeepLinkUrl } from '../services/deepLinkService';

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

  describe('URL dispatching and security validation', () => {
    it('dispatches valid open project deep link', () => {
      const onOpenProject = vi.fn();
      deepLinkService.handleUrl('writein://open?id=proj_abc-123', { onOpenProject });
      expect(onOpenProject).toHaveBeenCalledWith('proj_abc-123');
    });

    it('rejects invalid project IDs containing path traversal or injection characters', () => {
      const onOpenProject = vi.fn();
      const maliciousIds = [
        '../secret',
        '../../etc/passwd',
        'proj/sub',
        'id;DROP TABLE projects;',
        '<script>alert(1)</script>',
        'id with spaces',
        'a'.repeat(65), // Exceeds 64 chars
        '',
      ];

      for (const badId of maliciousIds) {
        deepLinkService.handleUrl(`writein://open?id=${encodeURIComponent(badId)}`, { onOpenProject });
      }

      expect(onOpenProject).not.toHaveBeenCalled();
    });

    it('dispatches valid new project deep link', () => {
      const onNewProject = vi.fn();
      deepLinkService.handleUrl('writein://new', { onNewProject });
      deepLinkService.handleUrl('writein://new-project', { onNewProject });
      expect(onNewProject).toHaveBeenCalledTimes(2);
    });

    it('dispatches valid tab navigation and rejects malicious tab names', () => {
      const onNavigateTab = vi.fn();
      deepLinkService.handleUrl('writein://tab?tab=settings', { onNavigateTab });
      deepLinkService.handleUrl('writein://navigate?to=editor_v2', { onNavigateTab });
      expect(onNavigateTab).toHaveBeenNthCalledWith(1, 'settings');
      expect(onNavigateTab).toHaveBeenNthCalledWith(2, 'editor_v2');

      onNavigateTab.mockClear();
      deepLinkService.handleUrl('writein://tab?tab=../traversal', { onNavigateTab });
      deepLinkService.handleUrl('writein://tab?tab=<script>', { onNavigateTab });
      deepLinkService.handleUrl(`writein://tab?tab=${'a'.repeat(33)}`, { onNavigateTab });
      expect(onNavigateTab).not.toHaveBeenCalled();
    });

    it('ignores non-writein URLs and malformed inputs safely', () => {
      const onOpenProject = vi.fn();
      handleDeepLinkUrl('https://malicious.com?id=proj_1', { onOpenProject });
      handleDeepLinkUrl('javascript:alert(1)', { onOpenProject });
      handleDeepLinkUrl(null, { onOpenProject });
      handleDeepLinkUrl('writein:invalid url with spaces', { onOpenProject });

      expect(onOpenProject).not.toHaveBeenCalled();
    });
  });
});
