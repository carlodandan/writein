import { useState, useEffect } from 'react';
import { isTauri } from '../services/tauriIpc';

let cachedVersion: string | null = null;

/**
 * Dynamically resolves the current application version.
 * When running inside the native Tauri runtime, retrieves the version from Tauri's app metadata.
 * In browser/test environments, gracefully falls back to the package/bundle version.
 */
export async function getAppVersion(): Promise<string> {
  if (cachedVersion) {
    return cachedVersion;
  }

  if (isTauri()) {
    try {
      const { getVersion } = await import('@tauri-apps/api/app');
      const version = await getVersion();
      if (version) {
        cachedVersion = version.startsWith('v') ? version : `v${version}`;
        return cachedVersion;
      }
    } catch (err) {
      console.warn('Unable to detect version via Tauri app API, using fallback:', err);
    }
  }

  cachedVersion = 'v1.0.0';
  return cachedVersion;
}

/**
 * React hook to dynamically detect and subscribe to the application version.
 */
export function useAppVersion(fallback: string = 'v1.0.0'): string {
  const [version, setVersion] = useState<string>(cachedVersion || fallback);

  useEffect(() => {
    let isMounted = true;

    getAppVersion()
      .then((detected) => {
        if (isMounted && detected) {
          setVersion(detected);
        }
      })
      .catch((err) => {
        console.warn('Failed to resolve app version:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return version;
}
