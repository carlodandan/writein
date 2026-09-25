import { useCallback, useEffect, useRef, useState } from 'react';
import type { Update } from '@tauri-apps/plugin-updater';
import { checkForUpdate, installUpdate } from '../lib/updater';
import { logger } from '../utils/logger';

export type UpdateStage =
  | 'checking'
  | 'current'
  | 'available'
  | 'downloading'
  | 'failed';

export interface UpdaterState {
  stage: UpdateStage;
  version: string | null;
  notes: string | null;
  /** 0-1 once size is known, null for indeterminate. */
  percent: number | null;
  error: string | null;
}

const CHECKING: UpdaterState = {
  stage: 'checking',
  version: null,
  notes: null,
  percent: null,
  error: null,
};

let activeInstallation: Promise<UpdaterState> | null = null;

/** Manages update checks, installation progress, and updater UI state. */
export function useUpdater() {
  const [state, setState] = useState<UpdaterState>(CHECKING);
  const found = useRef<Update | null>(null);
  // Prevents setState after unmount
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

  const settle = useCallback((next: UpdaterState) => {
    if (live.current) {
      logger.info(`[useUpdater] Stage -> "${next.stage}"`, {
        version: next.version,
        percent: next.percent,
        error: next.error,
      });
      setState(next);
    }
    return next;
  }, []);

  const check = useCallback(
    async (force = false): Promise<UpdaterState> => {
      logger.info(`[useUpdater] check() initiated (force=${force})`);
      settle(CHECKING);
      try {
        const update = await checkForUpdate(force);
        found.current = update;
        return settle(
          update
            ? {
                stage: 'available',
                version: update.version,
                notes: update.body?.trim() || null,
                percent: null,
                error: null,
              }
            : { ...CHECKING, stage: 'current' }
        );
      } catch (error) {
        found.current = null;
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error('[useUpdater] check() encountered error:', errorMsg);
        return settle({
          ...CHECKING,
          stage: 'failed',
          error: errorMsg,
        });
      }
    },
    [settle]
  );

  // Run the check automatically on mount (free if startup check already ran)
  useEffect(() => {
    void check();
  }, [check]);

  const install = useCallback((): Promise<UpdaterState> => {
    if (activeInstallation) {
      logger.info('[useUpdater] Joining existing active installation promise.');
      return activeInstallation;
    }

    const update = found.current;
    // No update found or it expired — re-check rather than install stale data
    if (!update) {
      logger.warn('[useUpdater] No update found in ref; re-checking with force=true.');
      return check(true);
    }

    logger.info(`[useUpdater] Preparing installation for update v${update.version}`);
    const installation = (async (): Promise<UpdaterState> => {
      const version = update.version;
      const notes = update.body?.trim() || null;
      settle({ stage: 'downloading', version, notes, percent: null, error: null });

      // Throttle renders: only re-render when the whole-percent value changes
      let announced = 0;
      try {
        await installUpdate(update, ({ received, total }) => {
          if (!total) return;
          const percent = Math.min(received / total, 1);
          const whole = Math.round(percent * 100);
          if (whole === announced) return;
          announced = whole;
          settle({ stage: 'downloading', version, notes, percent, error: null });
        });
        logger.info(`[useUpdater] Successfully installed update v${version}`);
        return settle({ stage: 'downloading', version, notes, percent: 1, error: null });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error(`[useUpdater] Update installation failed for v${version}:`, errorMsg);
        return settle({
          stage: 'failed',
          version,
          notes,
          percent: null,
          error: errorMsg,
        });
      }
    })();

    activeInstallation = installation;
    const clearInstallation = () => {
      if (activeInstallation === installation) activeInstallation = null;
    };
    void installation.then(clearInstallation, clearInstallation);
    return installation;
  }, [check, settle]);

  return { state, check, install };
}
