import { describe, it, expect } from 'vitest';
import { getAppVersion } from '../utils/appVersion';
import pkg from '../../package.json';

describe('appVersion Utility', () => {
  it('resolves a valid formatted version string starting with "v"', async () => {
    const version = await getAppVersion();
    expect(version).toBeDefined();
    expect(typeof version).toBe('string');
    expect(version.startsWith('v')).toBe(true);
  });

  it('handles fallback gracefully in non-Tauri environment', async () => {
    const version = await getAppVersion();
    // Default fallback in web/test environment aligns with package version
    expect(version).toBe(`v${pkg.version}`);
  });
});
