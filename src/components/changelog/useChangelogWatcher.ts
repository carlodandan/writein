import { useEffect, useRef } from 'react';
import { getAppVersion } from '../../utils/appVersion';
import { logger } from '../../utils/logger';

const STORAGE_KEY_LAST_SEEN = 'writein_last_seen_changelog_version';
const STORAGE_KEY_DONT_SHOW = 'writein_dont_show_changelog_on_startup';

interface ChangelogWatcherOptions {
  onOpen: () => void;
  delayMs?: number;
}

/**
 * Checks on startup whether the user has seen the changelog for the current version.
 * If not seen (and not marked as "don't show"), triggers onOpen after a brief delay
 * allowing the splashscreen closing sequence to conclude.
 */
export function useChangelogWatcher({ onOpen, delayMs = 900 }: ChangelogWatcherOptions): void {
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    const timer = setTimeout(async () => {
      try {
        const currentVersion = await getAppVersion();
        const lastSeen = localStorage.getItem(STORAGE_KEY_LAST_SEEN);
        const dontShow = localStorage.getItem(STORAGE_KEY_DONT_SHOW);

        if (dontShow === currentVersion) {
          logger.info(`[ChangelogWatcher] Startup changelog suppressed by user for ${currentVersion}`);
          return;
        }

        if (lastSeen !== currentVersion) {
          logger.info(`[ChangelogWatcher] New version detected (${currentVersion}, last seen: ${lastSeen}). Displaying changelog.`);
          onOpen();
        }
      } catch (err) {
        console.warn('Failed to evaluate changelog startup prompt:', err);
      }
    }, delayMs);

    return () => clearTimeout(timer);
  }, [onOpen, delayMs]);
}
