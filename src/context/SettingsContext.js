import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorsForScheme } from '../theme/colors';

const STORAGE_SOUNDS = '@tsovic_tsov/settings_sounds_enabled';
const STORAGE_NOTIFICATIONS = '@tsovic_tsov/settings_notifications_enabled';
const STORAGE_THEME = '@tsovic_tsov/settings_theme';

/** @typedef {'light' | 'dark' | 'system'} ThemePreference */

export const THEME_LIGHT = 'light';
export const THEME_DARK = 'dark';
export const THEME_SYSTEM = 'system';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const systemScheme = useColorScheme();
  const [soundsEnabled, setSoundsEnabledState] = useState(true);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
  /** @type {[ThemePreference, React.Dispatch<React.SetStateAction<ThemePreference>>]} */
  const [themePreference, setThemePreferenceState] = useState(
    /** @type {ThemePreference} */ (THEME_SYSTEM)
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [rawSounds, rawNotify, rawTheme] = await AsyncStorage.multiGet([
          STORAGE_SOUNDS,
          STORAGE_NOTIFICATIONS,
          STORAGE_THEME,
        ]);
        if (cancelled) return;
        const s = rawSounds[1];
        const n = rawNotify[1];
        const th = rawTheme[1];
        if (s === '0' || s === '1') {
          setSoundsEnabledState(s === '1');
        }
        if (n === '0' || n === '1') {
          setNotificationsEnabledState(n === '1');
        }
        if (th === THEME_LIGHT || th === THEME_DARK || th === THEME_SYSTEM) {
          setThemePreferenceState(th);
        }
      } catch {
        // keep defaults
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedScheme =
    themePreference === THEME_LIGHT
      ? 'light'
      : themePreference === THEME_DARK
        ? 'dark'
        : systemScheme === 'dark'
          ? 'dark'
          : 'light';

  const colors = useMemo(
    () => colorsForScheme(resolvedScheme),
    [resolvedScheme]
  );

  const setSoundsEnabled = useCallback((value) => {
    setSoundsEnabledState(value);
    AsyncStorage.setItem(STORAGE_SOUNDS, value ? '1' : '0').catch(() => {});
  }, []);

  const setNotificationsEnabled = useCallback((value) => {
    setNotificationsEnabledState(value);
    AsyncStorage.setItem(STORAGE_NOTIFICATIONS, value ? '1' : '0').catch(
      () => {}
    );
  }, []);

  const setThemePreference = useCallback((value) => {
    setThemePreferenceState(value);
    AsyncStorage.setItem(STORAGE_THEME, value).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({
      ready,
      soundsEnabled,
      notificationsEnabled,
      setSoundsEnabled,
      setNotificationsEnabled,
      themePreference,
      setThemePreference,
      resolvedScheme,
      colors,
    }),
    [
      ready,
      soundsEnabled,
      notificationsEnabled,
      setSoundsEnabled,
      setNotificationsEnabled,
      themePreference,
      setThemePreference,
      resolvedScheme,
      colors,
    ]
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return ctx;
}
