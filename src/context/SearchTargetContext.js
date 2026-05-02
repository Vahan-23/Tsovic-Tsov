import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SEARCH_MODES = ['statues', 'statues3d', 'pulpulaks'];

const STORAGE_SEARCH_MODE = '@tsovic_tsov/search_mode';

const SearchTargetContext = createContext(null);

export function SearchTargetProvider({ children }) {
  const [searchMode, setSearchModeState] = useState('statues');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_SEARCH_MODE);
        if (cancelled) return;
        if (raw && SEARCH_MODES.includes(raw)) {
          setSearchModeState(raw);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setSearchMode = useCallback((mode) => {
    if (!SEARCH_MODES.includes(mode)) return;
    setSearchModeState(mode);
    AsyncStorage.setItem(STORAGE_SEARCH_MODE, mode).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({
      searchMode,
      setSearchMode,
      ready,
    }),
    [searchMode, setSearchMode, ready]
  );

  return (
    <SearchTargetContext.Provider value={value}>{children}</SearchTargetContext.Provider>
  );
}

export function useSearchTarget() {
  const ctx = useContext(SearchTargetContext);
  if (!ctx) {
    throw new Error('useSearchTarget must be used within SearchTargetProvider');
  }
  return ctx;
}
