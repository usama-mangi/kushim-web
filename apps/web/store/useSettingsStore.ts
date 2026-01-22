/**
 * Settings Store
 * Manages user preferences and application settings with localStorage persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';
export type DefaultView = 'feed' | 'graph';
export type NotificationLevel = 'all' | 'important' | 'none';

export interface UserSettings {
  // Appearance
  theme: Theme;
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';

  // Behavior
  defaultView: DefaultView;
  autoSyncInterval: number; // minutes, 0 = disabled
  commandHistorySize: number;

  // ML Settings
  mlEnabled: boolean;
  mlThreshold: number; // 0.0 - 1.0
  showMLExplanations: boolean;

  // Notifications
  notificationLevel: NotificationLevel;
  soundEnabled: boolean;

  // Privacy
  analyticsEnabled: boolean;
}

interface SettingsState extends UserSettings {
  // Actions
  setTheme: (theme: Theme) => void;
  setReducedMotion: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  setDefaultView: (view: DefaultView) => void;
  setAutoSyncInterval: (minutes: number) => void;
  setCommandHistorySize: (size: number) => void;
  setMLEnabled: (enabled: boolean) => void;
  setMLThreshold: (threshold: number) => void;
  setShowMLExplanations: (show: boolean) => void;
  setNotificationLevel: (level: NotificationLevel) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setAnalyticsEnabled: (enabled: boolean) => void;
  resetToDefaults: () => void;
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  reducedMotion: false,
  highContrast: false,
  fontSize: 'medium',
  defaultView: 'feed',
  autoSyncInterval: 5,
  commandHistorySize: 50,
  mlEnabled: true,
  mlThreshold: 0.75,
  showMLExplanations: true,
  notificationLevel: 'all',
  soundEnabled: true,
  analyticsEnabled: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setHighContrast: (highContrast) => set({ highContrast }),
      setFontSize: (fontSize) => set({ fontSize }),
      setDefaultView: (defaultView) => set({ defaultView }),
      setAutoSyncInterval: (autoSyncInterval) => set({ autoSyncInterval }),
      setCommandHistorySize: (commandHistorySize) => set({ commandHistorySize }),
      setMLEnabled: (mlEnabled) => set({ mlEnabled }),
      setMLThreshold: (mlThreshold) => set({ mlThreshold }),
      setShowMLExplanations: (showMLExplanations) => set({ showMLExplanations }),
      setNotificationLevel: (notificationLevel) => set({ notificationLevel }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setAnalyticsEnabled: (analyticsEnabled) => set({ analyticsEnabled }),
      resetToDefaults: () => {
        set(DEFAULT_SETTINGS);
        applyTheme(DEFAULT_SETTINGS.theme);
      },
    }),
    {
      name: 'kushim-settings',
    }
  )
);

/**
 * Apply theme to document
 */
function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
    root.classList.toggle('light', !prefersDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
  }
}

/**
 * Initialize theme on app start
 */
export function initializeTheme() {
  if (typeof window === 'undefined') return;

  const stored = localStorage.getItem('kushim-settings');
  if (stored) {
    try {
      const settings = JSON.parse(stored);
      applyTheme(settings.state?.theme || 'dark');
    } catch (e) {
      applyTheme('dark');
    }
  } else {
    applyTheme('dark');
  }

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const stored = localStorage.getItem('kushim-settings');
    if (stored) {
      try {
        const settings = JSON.parse(stored);
        if (settings.state?.theme === 'system') {
          applyTheme('system');
        }
      } catch (e) {
        // Ignore
      }
    }
  });
}
