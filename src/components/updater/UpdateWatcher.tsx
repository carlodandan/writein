import { useEffect } from 'react';
import { checkForUpdate } from '../../lib/updater';

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

    const timer = window.setTimeout(() => {
      void checkForUpdate()
        .then((update) => {
          if (!update || announced) return;
          announced = true;
          onAvailable(update.version, update.body?.trim() || null);
        })
        .catch(() => {}); // silent on error — user did not ask
    }, DELAY);

    return () => window.clearTimeout(timer);
  }, [onAvailable]);

  return null;
}
