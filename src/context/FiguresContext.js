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
import * as FileSystem from 'expo-file-system';
import { FALLBACK_FIGURES, sortFiguresList } from '../data/figures';
import {
  convertOverpassJsonToStatues,
  fetchOverpassData,
  OVERPASS_CACHE_VERSION,
  getOverpassQuery,
} from '../services/overpassStatues';

const STORAGE_KEY = '@tsovic_tsov/unlocked_figure_ids';
const STATUES_CACHE_VERSION_KEY = '@tsovic_tsov/statues_cache_version';
const STATUES_LAST_UPDATED_KEY = '@tsovic_tsov/statues_last_updated_at';

const STATUES_CACHE_FILE = `${FileSystem.documentDirectory}overpass_statues_cache.json`;
const STATUES_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

const FiguresContext = createContext(null);

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function FiguresProvider({ children }) {
  const [unlockedIds, setUnlockedIds] = useState(() => new Set());
  const [unlockedLoaded, setUnlockedLoaded] = useState(false);
  const [statues, setStatues] = useState([]);
  const [statuesLoaded, setStatuesLoaded] = useState(false);
  const [statuesRefreshing, setStatuesRefreshing] = useState(false);

  const refreshStatues = useCallback(async () => {
    setStatuesRefreshing(true);
    try {
      const overpassJson = await fetchOverpassData(getOverpassQuery());
      const converted = convertOverpassJsonToStatues(overpassJson);
      const nextStatues = converted.length ? converted : FALLBACK_FIGURES;
      setStatues(nextStatues);
      setStatuesLoaded(true);

      try {
        const now = Date.now();
        await FileSystem.writeAsStringAsync(
          STATUES_CACHE_FILE,
          JSON.stringify(converted),
          { encoding: FileSystem.EncodingType.UTF8 }
        );
        await AsyncStorage.multiSet([
          [STATUES_CACHE_VERSION_KEY, String(OVERPASS_CACHE_VERSION)],
          [STATUES_LAST_UPDATED_KEY, String(now)],
        ]);
      } catch {
        // Cache failures shouldn't break the app.
      }
    } catch {
      setStatues(FALLBACK_FIGURES);
      setStatuesLoaded(true);
    } finally {
      setStatuesRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setUnlockedIds(new Set(parsed.map((x) => String(x))));
          }
        }
      } catch {
        /* ignore corrupt storage */
      } finally {
        if (!cancelled) setUnlockedLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!unlockedLoaded) return;
    const ids = [...unlockedIds];
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids)).catch(() => {});
  }, [unlockedIds, unlockedLoaded]);

  const normalizeStatueForDisplay = useCallback((s) => {
    const displayName =
      s?.name_hy ||
      s?.name_en ||
      s?.name_ru ||
      s?.name ||
      (s?.id != null ? String(s.id) : '');
    return { ...s, displayName };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Wait for unlockedIds first, so unlocked markers are correct.
      if (!unlockedLoaded) return;

      try {
        // Check cache freshness.
        const [versionRaw, lastUpdatedRaw] = await Promise.all([
          AsyncStorage.getItem(STATUES_CACHE_VERSION_KEY),
          AsyncStorage.getItem(STATUES_LAST_UPDATED_KEY),
        ]);

        const cachedVersion = Number(versionRaw);
        const now = Date.now();
        const lastUpdated = lastUpdatedRaw ? Number(lastUpdatedRaw) : 0;
        const isCacheValid =
          cachedVersion === OVERPASS_CACHE_VERSION &&
          Array.isArray(statues) &&
          FileSystem.getInfoAsync &&
          lastUpdated > 0 &&
          now - lastUpdated < STATUES_MAX_AGE_MS;

        if (isCacheValid) {
          // We'll still read the file to get the actual dataset.
        }

        // Always try to read cache file first.
        let cachedFromFile = null;
        try {
          const info = await FileSystem.getInfoAsync(STATUES_CACHE_FILE);
          if (info.exists) {
            const raw = await FileSystem.readAsStringAsync(STATUES_CACHE_FILE);
            cachedFromFile = JSON.parse(raw);
          }
        } catch {
          cachedFromFile = null;
        }

        // Use cache if it is fresh.
        if (
          cachedFromFile &&
          cachedVersion === OVERPASS_CACHE_VERSION &&
          lastUpdated > 0 &&
          now - lastUpdated < STATUES_MAX_AGE_MS
        ) {
          if (!cancelled) {
            setStatues(cachedFromFile);
            setStatuesLoaded(true);
          }
          return;
        }

        // Otherwise fetch from Overpass.
        if (!cancelled) {
          await refreshStatues();
        }
      } catch {
        // Network failed -> fallback to bundled sample.
        if (!cancelled) {
          setStatues(FALLBACK_FIGURES);
          setStatuesLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [unlockedLoaded, refreshStatues]);

  const figures = useMemo(() => {
    return sortFiguresList(statues).map((s) => ({
      ...normalizeStatueForDisplay(s),
      unlocked: unlockedIds.has(String(s.id)),
    }));
  }, [statues, unlockedIds, normalizeStatueForDisplay]);

  const figuresForGrid = useMemo(() => {
    // Safety cap to keep FlatList fast with big datasets.
    const MAX = 60;
    const unlocked = figures.filter((f) => f.unlocked);
    if (unlocked.length >= MAX) return unlocked.slice(0, MAX);
    const rest = figures.filter((f) => !f.unlocked);
    return unlocked.concat(rest.slice(0, MAX - unlocked.length));
  }, [figures]);

  const unlockedCount = useMemo(() => figures.filter((f) => f.unlocked).length, [figures]);
  const totalCount = figures.length;

  const isUnlockableId = useCallback(
    (rawId) => {
      const id = rawId == null ? '' : String(rawId).trim();
      if (!id) return false;
      return figures.some((f) => String(f.id) === id);
    },
    [figures]
  );

  const unlockById = useCallback(
    (rawId) => {
      const id = rawId == null ? '' : String(rawId).trim();
      if (!id || !figures.some((f) => String(f.id) === id)) {
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
      figuresForGrid,
      unlockedCount,
      totalCount,
      unlockById,
      isUnlockableId,
      storageLoaded: unlockedLoaded && statuesLoaded,
      statuesRefreshing,
      refreshStatues,
    }),
    [
      figures,
      figuresForGrid,
      unlockedCount,
      totalCount,
      unlockById,
      isUnlockableId,
      unlockedLoaded,
      statuesLoaded,
      statuesRefreshing,
      refreshStatues,
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
