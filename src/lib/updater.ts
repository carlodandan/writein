import { check } from '@tauri-apps/plugin-updater';
import type { DownloadEvent, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { isDesktopTauri } from '../services/tauriIpc';

export interface DownloadProgress {
  received: number;
  total: number | null;
}

/**
 * One shared promise. The startup check and Settings panel both call this.
 * A second call within the same session reuses the first result for free.
 * Failures are NOT cached — a retry always goes back to the network.
 */
let pending: Promise<Update | null> | null = null;

/** Checks for an update, optionally bypassing the session-level cached result. */
export function checkForUpdate(force = false): Promise<Update | null> {
  if (!isDesktopTauri()) {
    return Promise.resolve(null);
  }
  if (force) pending = null;
  pending ??= check().catch((error: unknown) => {
    pending = null; // do not cache failures
    throw error;
  });
  return pending;
}

/**
 * Downloads and installs. Reports progress via callback.
 *
 * On Windows the MSI installer replaces the running process, so the app is
 * killed before downloadAndInstall() resolves — treat everything after it as
 * unreachable on Windows. relaunch() is still called for macOS / Linux.
 */
export async function installUpdate(
  update: Update,
  onProgress: (progress: DownloadProgress) => void
): Promise<void> {
  if (!isDesktopTauri()) {
    return;
  }
  let received = 0;
  let total: number | null = null;

  await update.downloadAndInstall((event: DownloadEvent) => {
    if (event.event === 'Started') {
      total = event.data.contentLength ?? null;
    } else if (event.event === 'Progress') {
      received += event.data.chunkLength;
    }
    onProgress({ received, total });
  });

  // Reached on macOS / Linux. On Windows the process is already gone.
  await relaunch();
}
