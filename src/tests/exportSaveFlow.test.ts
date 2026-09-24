import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exportService } from '../services/exportService';

const { invoke, join } = vi.hoisted(() => ({
  invoke: vi.fn(),
  join: vi.fn(),
}));
vi.mock('@tauri-apps/api/core', () => ({ invoke }));
vi.mock('@tauri-apps/api/path', () => ({ join }));

describe('export save flow', () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  let click: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    invoke.mockReset();
    join.mockReset();
    join.mockImplementation(async (dir: string, name: string) => `${dir}/${name}`);
    URL.createObjectURL = vi.fn(() => 'blob:test');
    URL.revokeObjectURL = vi.fn();
    click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    click.mockRestore();
  });

  it('reports only successful browser downloads', async () => {
    expect(await exportService.exportAndSaveFile({ fileName: 'empty.txt' })).toMatchObject({ saved: false });
    expect(await exportService.exportAndSaveFile({ fileName: 'bad.bin', contentBase64: '!!!' }))
      .toMatchObject({ saved: false });

    URL.createObjectURL = undefined as unknown as typeof URL.createObjectURL;
    expect(await exportService.exportAndSaveFile({ fileName: 'no-url.txt', contentText: 'text' }))
      .toMatchObject({ saved: false });

    URL.createObjectURL = vi.fn(() => 'blob:test');
    click.mockImplementation(() => { throw new Error('download failed'); });
    expect(await exportService.exportAndSaveFile({ fileName: 'failed.txt', contentText: 'text' }))
      .toMatchObject({ saved: false });
    click.mockImplementation(() => {});
    expect(await exportService.exportAndSaveFile({ fileName: 'ok.txt', contentText: 'text' }))
      .toMatchObject({ saved: true });
  });

  it('uses a platform joined dialog default and saves with its token', async () => {
    (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {};
    invoke.mockImplementation(async (cmd: string) => {
      if (cmd === 'get_default_export_dir') return '/downloads';
      if (cmd === 'select_export_path') return { token: 'selected-token', filePath: '/chosen/book.md' };
      if (cmd === 'save_exported_file') return '/chosen/book.md';
    });

    const result = await exportService.exportAndSaveFile({ fileName: 'book.md', contentText: 'text' });
    expect(result).toEqual({ saved: true, filePath: '/chosen/book.md' });
    expect(join).toHaveBeenCalledWith('/downloads', 'book.md');
    expect(invoke).toHaveBeenCalledWith('select_export_path', expect.objectContaining({ defaultPath: '/downloads/book.md' }));
    expect(invoke).toHaveBeenCalledWith('save_exported_file', {
      selectionToken: 'selected-token', contentText: 'text', contentBase64: undefined,
    });
  });

  it('does not download after cancellation or a selected-path save failure', async () => {
    (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {};
    invoke.mockImplementation(async (cmd: string) => {
      if (cmd === 'get_default_export_dir') return '';
      if (cmd === 'select_export_path') return null;
    });
    expect(await exportService.exportAndSaveFile({ fileName: 'book.md', contentText: 'text' }))
      .toEqual({ saved: false, canceled: true });
    expect(join).not.toHaveBeenCalled();
    expect(invoke).toHaveBeenCalledWith('select_export_path', expect.objectContaining({ defaultPath: 'book.md' }));
    expect(URL.createObjectURL).not.toHaveBeenCalled();

    invoke.mockImplementation(async (cmd: string) => {
      if (cmd === 'get_default_export_dir') return '';
      if (cmd === 'select_export_path') return { token: 'selected-token', filePath: '/chosen/book.md' };
      if (cmd === 'save_exported_file') throw new Error('disk full');
    });
    await expect(exportService.exportAndSaveFile({ fileName: 'book.md', contentText: 'text' }))
      .rejects.toThrow('disk full');
    expect(URL.createObjectURL).not.toHaveBeenCalled();

    const blob = new Blob(['content']);
    Object.defineProperty(blob, 'arrayBuffer', {
      value: vi.fn().mockRejectedValue(new Error('conversion failed')),
    });
    await expect(exportService.exportAndSaveFile({ fileName: 'book.md', blob }))
      .rejects.toThrow('conversion failed');
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('downloads when native dialog selection fails before a path is chosen', async () => {
    (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {};
    invoke.mockImplementation(async (cmd: string) => {
      if (cmd === 'get_default_export_dir') return '';
      if (cmd === 'select_export_path') throw new Error('dialog unavailable');
    });
    expect(await exportService.exportAndSaveFile({ fileName: 'book.md', contentText: 'text' }))
      .toMatchObject({ saved: true, filePath: null });
  });
});
