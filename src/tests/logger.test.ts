import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  info: vi.fn().mockResolvedValue(undefined),
  warn: vi.fn().mockResolvedValue(undefined),
  error: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@tauri-apps/plugin-log', () => mocks);
vi.mock('../services/tauriIpc', () => ({ isDesktopTauri: () => true }));

import { logger } from '../utils/logger';

describe('desktop logger context formatting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('preserves Error details in persistent logs', () => {
    const error = new Error('Download failed');
    error.stack = 'Error: Download failed\n  at download';

    logger.info('update', error);
    expect(mocks.info).toHaveBeenCalledWith(`update ${error.stack}`);

    error.stack = undefined;
    logger.error('update', error);
    expect(mocks.error).toHaveBeenCalledWith('update Error: Download failed');
  });

  it('handles circular and empty serialization in each logger method', () => {
    const circular: { self?: unknown } = {};
    circular.self = circular;
    const empty = { toJSON: () => undefined };

    expect(() => logger.info('info', circular)).not.toThrow();
    expect(() => logger.warn('warn', empty)).not.toThrow();
    expect(() => logger.error('error', circular)).not.toThrow();

    expect(mocks.info).toHaveBeenCalledWith('info [unserializable context]');
    expect(mocks.warn).toHaveBeenCalledWith('warn [unserializable context]');
    expect(mocks.error).toHaveBeenCalledWith('error [unserializable context]');
  });
});
