import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { LayoutAnimation, Platform, UIManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FALLBACK_FIGURES, sortFiguresList } from '../data/figures';

const STORAGE_KEY = '@tsovic_tsov/unlocked_figure_ids';

const FiguresContext = createContext(null);

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function FiguresProvider({ children }) {
  const [unlockedIds, setUnlockedIds] = useState(() => new Set());
  const [storageLoaded, setStorageLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setUnlockedIds(new Set(parsed.filter((x) => typeof x === 'string')));
          }
        }
      } catch {
        /* ignore corrupt storage */
      } finally {
        if (!cancelled) setStorageLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!storageLoaded) return;
    const ids = [...unlockedIds];
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids)).catch(() => {});
  }, [unlockedIds, storageLoaded]);

  const figures = useMemo(
    () =>
      sortFiguresList(FALLBACK_FIGURES).map((f) => ({
        ...f,
        unlocked: unlockedIds.has(f.id),
      })),
    [unlockedIds]
  );

  const unlockedCount = useMemo(
    () => figures.filter((f) => f.unlocked).length,
    [figures]
  );

  const totalCount = figures.length;

  const isUnlockableId = useCallback(
    (rawId) => {
      const id = typeof rawId === 'string' ? rawId.trim() : '';
      if (!id) return false;
      return figures.some((f) => f.id === id);
    },
    [figures]
  );

  const unlockById = useCallback(
    (rawId) => {
      const id = typeof rawId === 'string' ? rawId.trim() : '';
      if (!id || !figures.some((f) => f.id === id)) {
        return { ok: false, reason: 'unknown' };
      }

      let added = false;
      setUnlockedIds((prev) => {
        if (prev.has(id)) return prev;
        added = true;
        const next = new Set(prev);
        next.add(id);
        return next;
      });

      if (added) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }

      return { ok: true, alreadyHad: !added };
    },
    [figures]
  );

  const value = useMemo(
    () => ({
      figures,
      unlockedCount,
      totalCount,
      unlockById,
      isUnlockableId,
      storageLoaded,
    }),
    [
      figures,
      unlockedCount,
      totalCount,
      unlockById,
      isUnlockableId,
      storageLoaded,
    ]
  );

  return (
    <FiguresContext.Provider value={value}>{children}</FiguresContext.Provider>
  );
}

export function useFigures() {
  const ctx = useContext(FiguresContext);
  if (!ctx) {
    throw new Error('useFigures must be used within FiguresProvider');
  }
  return ctx;
}
