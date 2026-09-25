import { describe, it, expect } from 'vitest';
import { DEFAULT_EDITOR_PREFERENCES } from '../types/phase5';
import { settingsService } from '../services/settingsService';

describe('Editor Preferences & Settings Client Operations', () => {
  it('verifies default editor preferences structure', () => {
    expect(DEFAULT_EDITOR_PREFERENCES.fontSize).toBe(16);
    expect(DEFAULT_EDITOR_PREFERENCES.fontFamily).toBe('serif');
    expect(DEFAULT_EDITOR_PREFERENCES.lineHeight).toBe('relaxed');
    expect(DEFAULT_EDITOR_PREFERENCES.editorWidth).toBe('medium');
    expect(DEFAULT_EDITOR_PREFERENCES.typewriterMode).toBe(false);
    expect(DEFAULT_EDITOR_PREFERENCES.pasteBehavior).toBe('match-style');
  });

  it('persists and retrieves custom preferences via settings service', async () => {
    const customPrefs = {
      ...DEFAULT_EDITOR_PREFERENCES,
      fontSize: 20,
      fontFamily: 'mono' as const,
      lineHeight: 'loose' as const,
      pasteBehavior: 'keep-format' as const,
    };

    const serialized = JSON.stringify(customPrefs);
    const saved = await settingsService.saveSetting('editor_preferences', serialized);
    expect(saved.key).toBe('editor_preferences');
    expect(saved.value).toBe(serialized);

    const retrieved = await settingsService.getSetting('editor_preferences');
    expect(retrieved).toBe(serialized);
    if (retrieved) {
      const parsed = JSON.parse(retrieved);
      expect(parsed.fontSize).toBe(20);
      expect(parsed.fontFamily).toBe('mono');
      expect(parsed.pasteBehavior).toBe('keep-format');
    }
  });

  it('retrieves all settings map', async () => {
    await settingsService.saveSetting('test_key_1', 'test_val_1');
    const all = await settingsService.getAllSettings();
    expect(all).toBeDefined();
    expect(all['test_key_1']).toBe('test_val_1');

    const deleted = await settingsService.deleteSetting('test_key_1');
    expect(deleted).toBe(true);
  });
});
