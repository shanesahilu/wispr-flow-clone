import { useState, useEffect, useCallback } from "react";

/**
 * Interface: AppSettings
 * Defines all configurable settings for the app.
 */
export interface AppSettings {
  shortcutEnabled: boolean;
  shortcut: string;
  autoCopyPaste: boolean;
  silenceTimeout: number; // seconds of silence before auto-stop (0 = disabled)
}

/**
 * Default settings
 */
const DEFAULT_SETTINGS: AppSettings = {
  shortcutEnabled: true,
  shortcut: "Ctrl+Shift+R",
  autoCopyPaste: false,
  silenceTimeout: 2,
};

const STORAGE_KEY = "wispr-settings";

/**
 * Interface: UseSettingsReturn
 * Defines the public API for settings management.
 */
interface UseSettingsReturn {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

/**
 * Hook: useSettings
 * Responsibility: Manages app settings with localStorage persistence.
 */
export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  /**
   * Effect: Load settings from localStorage on mount
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  }, []);

  /**
   * Function: updateSettings
   * Updates specific settings and persists to localStorage.
   */
  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      } catch (err) {
        console.error("Failed to save settings:", err);
      }
      return newSettings;
    });
  }, []);

  /**
   * Function: resetSettings
   * Resets all settings to defaults.
   */
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error("Failed to clear settings:", err);
    }
  }, []);

  return {
    settings,
    updateSettings,
    resetSettings,
  };
}
