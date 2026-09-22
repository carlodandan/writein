import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Update } from '@tauri-apps/plugin-updater';

const mocks = vi.hoisted(() => ({
  checkForUpdate: vi.fn(),
  installUpdate: vi.fn(),
}));

vi.mock('../lib/updater', () => mocks);

import { useUpdater } from '../hooks/useUpdater';

describe('useUpdater installation coordination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shares one active installation promise across hook instances', async () => {
    const update = {
      version: '1.1.0',
      body: 'Release notes',
    } as Update;
    let finishInstallation!: () => void;
    mocks.checkForUpdate.mockResolvedValue(update);
    mocks.installUpdate.mockImplementation(
      () => new Promise<void>((resolve) => {
        finishInstallation = resolve;
      })
    );

    const firstHook = renderHook(() => useUpdater());
    const secondHook = renderHook(() => useUpdater());
    await waitFor(() => {
      expect(firstHook.result.current.state.stage).toBe('available');
      expect(secondHook.result.current.state.stage).toBe('available');
    });

    let first!: ReturnType<typeof firstHook.result.current.install>;
    let second!: ReturnType<typeof secondHook.result.current.install>;
    act(() => {
      first = firstHook.result.current.install();
      second = secondHook.result.current.install();
    });

    expect(second).toBe(first);
    expect(mocks.installUpdate).toHaveBeenCalledOnce();

    await act(async () => {
      finishInstallation();
      await first;
    });

    mocks.installUpdate.mockResolvedValue(undefined);
    await act(async () => {
      await firstHook.result.current.install();
    });
    expect(mocks.installUpdate).toHaveBeenCalledTimes(2);
  });
});
