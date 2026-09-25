import { isDesktopTauri } from '../services/tauriIpc';
import { info as tauriInfo, warn as tauriWarn, error as tauriError } from '@tauri-apps/plugin-log';

/**
 * Unified application logger that outputs to both browser/WebView console
 * and persistent Tauri application log files (on desktop).
 */
export const logger = {
  info: (message: string, context?: unknown) => {
    if (context !== undefined) {
      console.info(message, context);
    } else {
      console.info(message);
    }

    if (isDesktopTauri()) {
      const formatted =
        context !== undefined
          ? `${message} ${typeof context === 'object' ? JSON.stringify(context) : String(context)}`
          : message;
      void tauriInfo(formatted).catch(() => {});
    }
  },

  warn: (message: string, context?: unknown) => {
    if (context !== undefined) {
      console.warn(message, context);
    } else {
      console.warn(message);
    }

    if (isDesktopTauri()) {
      const formatted =
        context !== undefined
          ? `${message} ${typeof context === 'object' ? JSON.stringify(context) : String(context)}`
          : message;
      void tauriWarn(formatted).catch(() => {});
    }
  },

  error: (message: string, context?: unknown) => {
    if (context !== undefined) {
      console.error(message, context);
    } else {
      console.error(message);
    }

    if (isDesktopTauri()) {
      const formatted =
        context !== undefined
          ? `${message} ${typeof context === 'object' ? JSON.stringify(context) : String(context)}`
          : message;
      void tauriError(formatted).catch(() => {});
    }
  },
};
