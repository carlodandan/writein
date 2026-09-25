import { isDesktopTauri } from '../services/tauriIpc';
import { info as tauriInfo, warn as tauriWarn, error as tauriError } from '@tauri-apps/plugin-log';

function formatLogMessage(message: string, context?: unknown): string {
  if (context === undefined) return message;

  try {
    const formatted =
      context instanceof Error
        ? context.stack || `${context.name}: ${context.message}`
        : typeof context === 'object'
          ? JSON.stringify(context)
          : String(context);
    return `${message} ${formatted || '[unserializable context]'}`;
  } catch {
    return `${message} [unserializable context]`;
  }
}

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
      void tauriInfo(formatLogMessage(message, context)).catch(() => {});
    }
  },

  warn: (message: string, context?: unknown) => {
    if (context !== undefined) {
      console.warn(message, context);
    } else {
      console.warn(message);
    }

    if (isDesktopTauri()) {
      void tauriWarn(formatLogMessage(message, context)).catch(() => {});
    }
  },

  error: (message: string, context?: unknown) => {
    if (context !== undefined) {
      console.error(message, context);
    } else {
      console.error(message);
    }

    if (isDesktopTauri()) {
      void tauriError(formatLogMessage(message, context)).catch(() => {});
    }
  },
};
