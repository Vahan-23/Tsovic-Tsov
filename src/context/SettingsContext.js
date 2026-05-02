import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_SOUNDS = '@tsovic_tsov/settings_sounds_enabled';
const STORAGE_NOTIFICATIONS = '@tsovic_tsov/settings_notifications_enabled';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [soundsEnabled, setSoundsEnabledState] = useState(true);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [rawSounds, rawNotify] = await AsyncStorage.multiGet([
          STORAGE_SOUNDS,
          STORAGE_NOTIFICATIONS,
        ]);
        if (cancelled) return;
        const s = rawSounds[1];
        const n = rawNotify[1];
        if (s === '0' || s === '1') {
          setSoundsEnabledState(s === '1');
        }
        if (n === '0' || n === '1') {
          setNotificationsEnabledState(n === '1');
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

  const setSoundsEnabled = useCallback((value) => {
    setSoundsEnabledState(value);
    AsyncStorage.setItem(STORAGE_SOUNDS, value ? '1' : '0').catch(() => {});
  }, []);

  const setNotificationsEnabled = useCallback((value) => {
    setNotificationsEnabledState(value);
    AsyncStorage.setItem(STORAGE_NOTIFICATIONS, value ? '1' : '0').catch(() => {});
  }, []);

  const value = useMemo(
    () => ({
      ready,
      soundsEnabled,
      notificationsEnabled,
      setSoundsEnabled,
      setNotificationsEnabled,
    }),
    [ready, soundsEnabled, notificationsEnabled, setSoundsEnabled, setNotificationsEnabled]
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
