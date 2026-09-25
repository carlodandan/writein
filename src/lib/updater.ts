import { check } from '@tauri-apps/plugin-updater';
import type { DownloadEvent, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { isDesktopTauri } from '../services/tauriIpc';
import { logger } from '../utils/logger';

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
  const isDesktop = isDesktopTauri();
  logger.info(`[Updater] checkForUpdate initiated (force=${force}, isDesktop=${isDesktop})`);

  if (!isDesktop) {
    logger.info('[Updater] Non-desktop Tauri environment detected; skipping update check.');
    return Promise.resolve(null);
  }
  if (force) {
    logger.info('[Updater] Force check requested; clearing cached pending check.');
    pending = null;
  }
  pending ??= check()
    .then((update) => {
      if (update) {
        logger.info(`[Updater] Update found: v${update.version}`, {
          currentVersion: update.currentVersion,
          targetVersion: update.version,
          date: update.date,
          body: update.body,
        });
      } else {
        logger.info('[Updater] Check completed: application is currently up to date.');
      }
      return update;
    })
    .catch((error: unknown) => {
      logger.error('[Updater] Error during check():', error);
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
    logger.warn('[Updater] installUpdate called outside desktop Tauri; skipping installation.');
    return;
  }
  let received = 0;
  let total: number | null = null;
  let lastLoggedPercent = -1;

  logger.info(`[Updater] Beginning download and installation for v${update.version}...`);

  try {
    await update.downloadAndInstall((event: DownloadEvent) => {
      if (event.event === 'Started') {
        total = event.data.contentLength ?? null;
        logger.info(
          `[Updater] Download started. Content length: ${total !== null ? `${total} bytes` : 'unknown'}`
        );
      } else if (event.event === 'Progress') {
        received += event.data.chunkLength;
        if (total && total > 0) {
          const percent = Math.round((received / total) * 100);
          if (percent >= lastLoggedPercent + 10) {
            lastLoggedPercent = Math.floor(percent / 10) * 10;
            logger.info(`[Updater] Download progress: ${percent}% (${received}/${total} bytes)`);
          }
        }
      } else if (event.event === 'Finished') {
        logger.info('[Updater] Download finished. Applying update payload...');
      }
      onProgress({ received, total });
    });

    logger.info('[Updater] Download & install complete. Requesting process relaunch...');
    // Reached on macOS / Linux. On Windows the process is already replaced.
    await relaunch();
  } catch (error) {
    logger.error(`[Updater] Installation failed for v${update.version}:`, error);
    throw error;
  }
}
