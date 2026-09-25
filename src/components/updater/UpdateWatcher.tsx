import { useEffect } from 'react';
import { checkForUpdate } from '../../lib/updater';
import { logger } from '../../utils/logger';

/** One announcement per process even when StrictMode mounts twice in dev. */
let announced = false;

/** Delay (ms) before the first background check. */
const DELAY = 4000;

export interface UpdateWatcherProps {
  onAvailable: (version: string, notes?: string | null) => void;
}

/** Checks once after startup and announces an available update. */
export function UpdateWatcher({ onAvailable }: UpdateWatcherProps) {
  useEffect(() => {
    if (announced) return;

    logger.info(`[UpdateWatcher] Startup check scheduled in ${DELAY}ms`);

    const timer = window.setTimeout(() => {
      logger.info('[UpdateWatcher] Executing scheduled startup check...');
      void checkForUpdate()
        .then((update) => {
          if (!update || announced) {
            logger.info('[UpdateWatcher] Startup check complete: No unannounced update.');
            return;
          }
          announced = true;
          logger.info(`[UpdateWatcher] Discovered update v${update.version}. Triggering notification dialog.`);
          onAvailable(update.version, update.body?.trim() || null);
        })
        .catch((err) => {
          logger.warn('[UpdateWatcher] Background startup check failed silently:', err);
        });
    }, DELAY);

    return () => window.clearTimeout(timer);
  }, [onAvailable]);

  return null;
}
