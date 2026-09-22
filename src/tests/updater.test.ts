import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Update } from '@tauri-apps/plugin-updater';

const mocks = vi.hoisted(() => ({
  check: vi.fn(),
  isDesktopTauri: vi.fn(),
  relaunch: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-updater', () => ({ check: mocks.check }));
vi.mock('@tauri-apps/plugin-process', () => ({ relaunch: mocks.relaunch }));
vi.mock('../services/tauriIpc', () => ({
  isDesktopTauri: mocks.isDesktopTauri,
}));

import { checkForUpdate, installUpdate } from '../lib/updater';

function makeUpdate() {
  return {
    version: '1.1.0',
    body: 'Release notes',
    downloadAndInstall: vi.fn(),
  } as unknown as Update;
}

describe('updater desktop guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skips updater and process plugin calls outside desktop Tauri', async () => {
    mocks.isDesktopTauri.mockReturnValue(false);
    const update = makeUpdate();

    await expect(checkForUpdate(true)).resolves.toBeNull();
    await installUpdate(update, vi.fn());

    expect(mocks.check).not.toHaveBeenCalled();
    expect(update.downloadAndInstall).not.toHaveBeenCalled();
    expect(mocks.relaunch).not.toHaveBeenCalled();
  });

  it('checks, installs, and relaunches on desktop Tauri', async () => {
    mocks.isDesktopTauri.mockReturnValue(true);
    const update = makeUpdate();
    mocks.check.mockResolvedValue(update);

    await expect(checkForUpdate(true)).resolves.toBe(update);
    await installUpdate(update, vi.fn());

    expect(mocks.check).toHaveBeenCalledOnce();
    expect(update.downloadAndInstall).toHaveBeenCalledOnce();
    expect(mocks.relaunch).toHaveBeenCalledOnce();
  });
});
