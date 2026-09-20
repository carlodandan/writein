import { useState, useEffect, useCallback } from 'react';
import { settingsService } from '../services/settingsService';
import {
  DEFAULT_EDITOR_PREFERENCES,
  type EditorPreferences,
} from '../types/phase5';

const STORAGE_KEY = 'writein_editor_preferences';

/**
 * Loads editor preferences and keeps browser and backend persistence in sync.
 */
export function useEditorPreferences() {
  const [preferences, setPreferences] = useState<EditorPreferences>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        return { ...DEFAULT_EDITOR_PREFERENCES, ...JSON.parse(cached) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_EDITOR_PREFERENCES;
  });

  // Load from backend SQLite settings table on mount
  useEffect(() => {
    let isMounted = true;
    settingsService
      .getSetting('editor_preferences')
      .then((val) => {
        if (isMounted && val) {
          try {
            const parsed = JSON.parse(val);
            setPreferences((prev) => ({ ...prev, ...parsed }));
            localStorage.setItem(STORAGE_KEY, val);
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {
        // ignore
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const updatePreference = useCallback(
    <K extends keyof EditorPreferences>(key: K, value: EditorPreferences[K]) => {
      setPreferences((prev) => {
        const next = { ...prev, [key]: value };
        const serialized = JSON.stringify(next);
        try {
          localStorage.setItem(STORAGE_KEY, serialized);
        } catch {
          // ignore
        }
        // Save to SQLite asynchronously
        settingsService.saveSetting('editor_preferences', serialized).catch(() => {});
        return next;
      });
    },
    []
  );

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_EDITOR_PREFERENCES);
    const serialized = JSON.stringify(DEFAULT_EDITOR_PREFERENCES);
    localStorage.setItem(STORAGE_KEY, serialized);
    settingsService.saveSetting('editor_preferences', serialized).catch(() => {});
  }, []);

  // Compute CSS container classes based on preferences
  const getContainerMaxWidth = () => {
    switch (preferences.editorWidth) {
      case 'narrow':
        return 'max-w-xl';
      case 'wide':
        return 'max-w-4xl';
      case 'medium':
      default:
        return 'max-w-3xl';
    }
  };

  const getFontFamilyClass = () => {
    switch (preferences.fontFamily) {
      case 'sans':
        return 'font-sans';
      case 'mono':
        return 'font-mono';
      case 'serif':
      default:
        return 'font-serif-novel';
    }
  };

  const getLineHeightClass = () => {
    switch (preferences.lineHeight) {
      case 'normal':
        return 'leading-normal';
      case 'loose':
        return 'leading-loose';
      case 'relaxed':
      default:
        return 'leading-relaxed';
    }
  };

  const getParagraphSpacingClass = () => {
    return preferences.paragraphSpacing === 'wide' ? 'space-y-6' : 'space-y-4';
  };

  return {
    preferences,
    updatePreference,
    resetPreferences,
    containerMaxWidth: getContainerMaxWidth(),
    fontFamilyClass: getFontFamilyClass(),
    lineHeightClass: getLineHeightClass(),
    paragraphSpacingClass: getParagraphSpacingClass(),
  };
}
