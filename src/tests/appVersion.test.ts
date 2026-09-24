import { describe, it, expect } from 'vitest';
import { getAppVersion } from '../utils/appVersion';

describe('appVersion Utility', () => {
  it('resolves a valid formatted version string starting with "v"', async () => {
    const version = await getAppVersion();
    expect(version).toBeDefined();
    expect(typeof version).toBe('string');
    expect(version.startsWith('v')).toBe(true);
  });

  it('handles fallback gracefully in non-Tauri environment', async () => {
    const version = await getAppVersion();
    // Default fallback in web/test environment is v2.0.0
    expect(version).toBe('v2.0.0');
  });
});
