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

  it('logs rounded 100% progress only once', async () => {
    mocks.isDesktopTauri.mockReturnValue(true);
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const update = makeUpdate();
    vi.mocked(update.downloadAndInstall).mockImplementation(async (onEvent) => {
      onEvent?.({ event: 'Started', data: { contentLength: 1000 } });
      onEvent?.({ event: 'Progress', data: { chunkLength: 995 } });
      onEvent?.({ event: 'Progress', data: { chunkLength: 1 } });
      onEvent?.({ event: 'Progress', data: { chunkLength: 1 } });
    });

    await installUpdate(update, vi.fn());

    const completedProgressLogs = infoSpy.mock.calls.filter(
      ([message]) => typeof message === 'string' && message.includes('[Updater] Download progress: 100%')
    );
    expect(completedProgressLogs).toHaveLength(1);
    infoSpy.mockRestore();
  });
});
