import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { LayoutAnimation, Platform, UIManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import {
  FALLBACK_FIGURES,
  mergeYandexIntoCuratedStatues,
  sortFiguresList,
} from '../data/figures';
import { labelForBrowseLocale } from '../utils/alphabetBrowse';
import { useLanguage } from './LanguageContext';
import { PULPULAK_POINTS } from '../data/pulpulaks';
import { STATUES_3D_ENTRIES } from '../data/statues3d';
import { finalizeCuratedStatueList } from '../data/curatedStatueProfiles';
import { computeStatueRarity } from '../utils/statueRarity';
import {
  convertOverpassJsonToStatues,
  fetchOverpassData,
  OVERPASS_CACHE_VERSION,
  getOverpassQuery,
} from '../services/overpassStatues';

const STORAGE_KEY = '@tsovic_tsov/unlocked_figure_ids';
const STORAGE_3D_KEY = '@tsovic_tsov/unlocked_statue_3d_ids';
const STORAGE_PULP_KEY = '@tsovic_tsov/unlocked_pulpulak_ids';
const STATUES_CACHE_VERSION_KEY = '@tsovic_tsov/statues_cache_version';
const STATUES_LAST_UPDATED_KEY = '@tsovic_tsov/statues_last_updated_at';

const STATUES_CACHE_FILE = `${FileSystem.documentDirectory}overpass_statues_cache.json`;
const STATUES_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 1 week
const DISCOVERY_HISTORY_KEY = '@tsovic_tsov/discovery_history';
const MAX_DISCOVERY_HISTORY = 80;

const FiguresContext = createContext(null);

/** Resolve statue row for a 3D entry (Overpass uses numeric ids; fallback uses slug ids). */
function resolveLinkedStatue(statuesList, entry) {
  if (entry?.linkedOsmId != null) {
    const byOsm = statuesList.find(
      (s) => String(s.id) === String(entry.linkedOsmId)
    );
    if (byOsm) return byOsm;
  }
  if (entry?.linkedStatueId != null) {
    return statuesList.find(
      (s) => String(s.id) === String(entry.linkedStatueId)
    );
  }
  return null;
}

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function parseIdSet(raw) {
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return new Set(parsed.map((x) => String(x)));
  } catch {
    /* ignore */
  }
  return new Set();
}

function cappedCollectionGrid(items) {
  const MAX = 60;
  const unlocked = items.filter((f) => f.unlocked);
  if (unlocked.length >= MAX) return unlocked.slice(0, MAX);
  const rest = items.filter((f) => !f.unlocked);
  return unlocked.concat(rest.slice(0, MAX - unlocked.length));
}

export function FiguresProvider({ children }) {
  const { locale } = useLanguage();
  const [unlockedIds, setUnlockedIds] = useState(() => new Set());
  const [unlocked3dIds, setUnlocked3dIds] = useState(() => new Set());
  const [unlockedPulpulakIds, setUnlockedPulpulakIds] = useState(() => new Set());
  const [unlockedLoaded, setUnlockedLoaded] = useState(false);
  const [statues, setStatues] = useState([]);
  const [statuesLoaded, setStatuesLoaded] = useState(false);
  const [statuesRefreshing, setStatuesRefreshing] = useState(false);
  const [discoveryHistory, setDiscoveryHistory] = useState([]);
  /** Header chip — updates on load and after celebration «Continue», not on unlock. */
  const [hudUnlockedCount, setHudUnlockedCount] = useState(0);
  const hudInitialSyncedRef = useRef(false);
  /** Sync mirrors for batch unlocks in one event (setState updaters are not sync). */
  const unlockedIdsRef = useRef(unlockedIds);
  const unlocked3dIdsRef = useRef(unlocked3dIds);
  const unlockedPulpulakIdsRef = useRef(unlockedPulpulakIds);

  unlockedIdsRef.current = unlockedIds;
  unlocked3dIdsRef.current = unlocked3dIds;
  unlockedPulpulakIdsRef.current = unlockedPulpulakIds;

  const refreshStatues = useCallback(async () => {
    setStatuesRefreshing(true);
    try {
      const overpassJson = await fetchOverpassData(getOverpassQuery());
      const converted = convertOverpassJsonToStatues(overpassJson);
      const finalized = mergeYandexIntoCuratedStatues(
        finalizeCuratedStatueList(converted)
      );
      const nextStatues =
        finalized.length > 0
          ? finalized
          : mergeYandexIntoCuratedStatues(
              finalizeCuratedStatueList(FALLBACK_FIGURES)
            );
      setStatues(nextStatues);
      setStatuesLoaded(true);

      try {
        const now = Date.now();
        await FileSystem.writeAsStringAsync(
          STATUES_CACHE_FILE,
          JSON.stringify(nextStatues),
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
      setStatues(
        mergeYandexIntoCuratedStatues(
          finalizeCuratedStatueList(FALLBACK_FIGURES)
        )
      );
      setStatuesLoaded(true);
    } finally {
      setStatuesRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await AsyncStorage.multiGet([
          STORAGE_KEY,
          STORAGE_3D_KEY,
          STORAGE_PULP_KEY,
          DISCOVERY_HISTORY_KEY,
        ]);
        if (cancelled) return;
        setUnlockedIds(parseIdSet(rows[0][1]));
        setUnlocked3dIds(parseIdSet(rows[1][1]));
        setUnlockedPulpulakIds(parseIdSet(rows[2][1]));
        try {
          const histRaw = rows[3][1];
          if (histRaw) {
            const parsed = JSON.parse(histRaw);
            if (Array.isArray(parsed)) {
              setDiscoveryHistory(parsed.filter((e) => e && e.id && e.mode));
            }
          }
        } catch {
          /* ignore */
        }
      } catch {
        // ignore
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
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...unlockedIds])).catch(
      () => {}
    );
  }, [unlockedIds, unlockedLoaded]);

  useEffect(() => {
    if (!unlockedLoaded) return;
    AsyncStorage.setItem(STORAGE_3D_KEY, JSON.stringify([...unlocked3dIds])).catch(
      () => {}
    );
  }, [unlocked3dIds, unlockedLoaded]);

  useEffect(() => {
    if (!unlockedLoaded) return;
    AsyncStorage.setItem(
      STORAGE_PULP_KEY,
      JSON.stringify([...unlockedPulpulakIds])
    ).catch(() => {});
  }, [unlockedPulpulakIds, unlockedLoaded]);

  useEffect(() => {
    if (!unlockedLoaded) return;
    AsyncStorage.setItem(
      DISCOVERY_HISTORY_KEY,
      JSON.stringify(discoveryHistory)
    ).catch(() => {});
  }, [discoveryHistory, unlockedLoaded]);

  const resetCollectionProgress = useCallback(async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const empty = new Set();
    unlockedIdsRef.current = empty;
    unlocked3dIdsRef.current = empty;
    unlockedPulpulakIdsRef.current = empty;
    setUnlockedIds(empty);
    setUnlocked3dIds(empty);
    setUnlockedPulpulakIds(empty);
    setDiscoveryHistory([]);
    setHudUnlockedCount(0);
    hudInitialSyncedRef.current = true;
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEY,
        STORAGE_3D_KEY,
        STORAGE_PULP_KEY,
        DISCOVERY_HISTORY_KEY,
      ]);
    } catch {
      /* ignore */
    }
  }, []);

  const appendDiscovery = useCallback((mode, rawId, displayName) => {
    const id = String(rawId);
    const name = displayName || id;
    setDiscoveryHistory((prev) => {
      const entry = { mode, id, name, ts: Date.now() };
      const filtered = prev.filter((e) => !(e.mode === mode && e.id === id));
      return [entry, ...filtered].slice(0, MAX_DISCOVERY_HISTORY);
    });
  }, []);

  const normalizeStatueForDisplay = useCallback(
    (s) => ({
      ...s,
      displayName: labelForBrowseLocale(s, locale),
      rarity: computeStatueRarity(s),
    }),
    [locale]
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!unlockedLoaded) return;

      try {
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

        if (
          cachedFromFile &&
          cachedVersion === OVERPASS_CACHE_VERSION &&
          lastUpdated > 0 &&
          now - lastUpdated < STATUES_MAX_AGE_MS
        ) {
          if (!cancelled) {
            setStatues(
              mergeYandexIntoCuratedStatues(
                finalizeCuratedStatueList(cachedFromFile)
              )
            );
            setStatuesLoaded(true);
          }
          return;
        }

        if (!cancelled) {
          await refreshStatues();
        }
      } catch {
        if (!cancelled) {
          setStatues(
            mergeYandexIntoCuratedStatues(
              finalizeCuratedStatueList(FALLBACK_FIGURES)
            )
          );
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

  const figures3d = useMemo(() => {
    const sorted = sortFiguresList(statues);
    return STATUES_3D_ENTRIES.map((entry) => {
      const linked = resolveLinkedStatue(sorted, entry);
      if (!linked) return null;
      const norm = normalizeStatueForDisplay(linked);
      return {
        ...norm,
        id: entry.id,
        linkedStatueId: entry.linkedStatueId,
        latitude: linked.latitude,
        longitude: linked.longitude,
        unlocked: unlocked3dIds.has(String(entry.id)),
      };
    }).filter(Boolean);
  }, [statues, unlocked3dIds, normalizeStatueForDisplay]);

  const pulpulaks = useMemo(() => {
    return PULPULAK_POINTS.map((p) => ({
      ...p,
      displayName: p.name,
      unlocked: unlockedPulpulakIds.has(String(p.id)),
    }));
  }, [unlockedPulpulakIds]);

  const figuresForGrid = useMemo(() => cappedCollectionGrid(figures), [figures]);

  const figures3dForGrid = useMemo(
    () => cappedCollectionGrid(figures3d),
    [figures3d]
  );

  const pulpulaksForGrid = useMemo(
    () => cappedCollectionGrid(pulpulaks),
    [pulpulaks]
  );

  const unlockedCount = useMemo(
    () => figures.filter((f) => f.unlocked).length,
    [figures]
  );
  const totalCount = figures.length;
  const storageLoaded = unlockedLoaded && statuesLoaded;

  useEffect(() => {
    if (!storageLoaded || hudInitialSyncedRef.current) return;
    hudInitialSyncedRef.current = true;
    setHudUnlockedCount(unlockedCount);
  }, [storageLoaded, unlockedCount]);

  const commitHudCollectionProgress = useCallback(() => {
    setHudUnlockedCount(figures.filter((f) => f.unlocked).length);
  }, [figures]);

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

      if (unlockedIdsRef.current.has(id)) {
        return { ok: true, alreadyHad: true };
      }

      const next = new Set(unlockedIdsRef.current);
      next.add(id);
      unlockedIdsRef.current = next;
      setUnlockedIds(next);

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      const fig = figures.find((f) => String(f.id) === id);
      appendDiscovery('statues', id, fig?.displayName ?? fig?.name ?? '');

      return { ok: true, alreadyHad: false };
    },
    [figures, appendDiscovery]
  );

  const unlockById3d = useCallback(
    (rawId) => {
      const id = rawId == null ? '' : String(rawId).trim();
      const entry = STATUES_3D_ENTRIES.find((e) => String(e.id) === id);
      if (!id || !entry) {
        return { ok: false, reason: 'unknown' };
      }

      if (unlocked3dIdsRef.current.has(id)) {
        return { ok: true, alreadyHad: true };
      }

      const next = new Set(unlocked3dIdsRef.current);
      next.add(id);
      unlocked3dIdsRef.current = next;
      setUnlocked3dIds(next);

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      const fig = resolveLinkedStatue(figures, entry);
      const label = fig?.displayName ?? fig?.name ?? id;
      appendDiscovery('statues3d', id, label);

      return { ok: true, alreadyHad: false };
    },
    [figures, appendDiscovery]
  );

  const unlockPulpulakById = useCallback((rawId) => {
    const id = rawId == null ? '' : String(rawId).trim();
    if (!id || !PULPULAK_POINTS.some((p) => String(p.id) === id)) {
      return { ok: false, reason: 'unknown' };
    }

    if (unlockedPulpulakIdsRef.current.has(id)) {
      return { ok: true, alreadyHad: true };
    }

    const next = new Set(unlockedPulpulakIdsRef.current);
    next.add(id);
    unlockedPulpulakIdsRef.current = next;
    setUnlockedPulpulakIds(next);

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const pt = PULPULAK_POINTS.find((p) => String(p.id) === id);
    appendDiscovery('pulpulaks', id, pt?.name ?? '');

    return { ok: true, alreadyHad: false };
  }, [appendDiscovery]);

  const unlockForSearchMode = useCallback(
    (mode, rawId) => {
      if (mode === 'statues') return unlockById(rawId);
      if (mode === 'statues3d') return unlockById3d(rawId);
      if (mode === 'pulpulaks') return unlockPulpulakById(rawId);
      return { ok: false, reason: 'unknown' };
    },
    [unlockById, unlockById3d, unlockPulpulakById]
  );

  const radarTargetsForMode = useCallback(
    (mode) => {
      if (mode === 'statues') return figures;
      if (mode === 'statues3d') return figures3d;
      if (mode === 'pulpulaks') return pulpulaks;
      return figures;
    },
    [figures, figures3d, pulpulaks]
  );

  const collectionGridForMode = useCallback(
    (mode) => {
      if (mode === 'statues') return figuresForGrid;
      if (mode === 'statues3d') return figures3dForGrid;
      if (mode === 'pulpulaks') return pulpulaksForGrid;
      return figuresForGrid;
    },
    [figuresForGrid, figures3dForGrid, pulpulaksForGrid]
  );

  const unlockedOnlyGridForMode = useCallback(
    (mode) => {
      const source =
        mode === 'statues'
          ? figures
          : mode === 'statues3d'
            ? figures3d
            : mode === 'pulpulaks'
              ? pulpulaks
              : figures;
      const opened = source.filter((x) => x.unlocked);
      return cappedCollectionGrid(opened);
    },
    [figures, figures3d, pulpulaks]
  );

  const countsForSearchMode = useCallback(
    (mode) => {
      if (mode === 'statues') {
        return {
          unlockedCount: figures.filter((f) => f.unlocked).length,
          totalCount: figures.length,
        };
      }
      if (mode === 'statues3d') {
        return {
          unlockedCount: figures3d.filter((f) => f.unlocked).length,
          totalCount: figures3d.length,
        };
      }
      if (mode === 'pulpulaks') {
        return {
          unlockedCount: pulpulaks.filter((p) => p.unlocked).length,
          totalCount: pulpulaks.length,
        };
      }
      return { unlockedCount: 0, totalCount: 0 };
    },
    [figures, figures3d, pulpulaks]
  );

  const resolveCollectionItem = useCallback(
    (kind, rawId) => {
      const id = String(rawId);
      if (kind === 'pulpulaks') {
        return pulpulaks.find((p) => String(p.id) === id) ?? null;
      }
      if (kind === 'statues3d') {
        return figures3d.find((f) => String(f.id) === id) ?? null;
      }
      return figures.find((f) => String(f.id) === id) ?? null;
    },
    [figures, figures3d, pulpulaks]
  );

  const value = useMemo(
    () => ({
      figures,
      figures3d,
      pulpulaks,
      figuresForGrid,
      figuresForGrid3d: figures3dForGrid,
      pulpulaksForGrid,
      unlockedCount,
      totalCount,
      hudUnlockedCount,
      commitHudCollectionProgress,
      unlockById,
      unlockById3d,
      unlockPulpulakById,
      unlockForSearchMode,
      radarTargetsForMode,
      collectionGridForMode,
      countsForSearchMode,
      resolveCollectionItem,
      isUnlockableId,
      discoveryHistory,
      unlockedOnlyGridForMode,
      storageLoaded,
      statuesRefreshing,
      refreshStatues,
      resetCollectionProgress,
    }),
    [
      figures,
      figures3d,
      pulpulaks,
      figuresForGrid,
      figures3dForGrid,
      pulpulaksForGrid,
      unlockedCount,
      totalCount,
      hudUnlockedCount,
      commitHudCollectionProgress,
      unlockById,
      unlockById3d,
      unlockPulpulakById,
      unlockForSearchMode,
      radarTargetsForMode,
      collectionGridForMode,
      unlockedOnlyGridForMode,
      countsForSearchMode,
      resolveCollectionItem,
      isUnlockableId,
      discoveryHistory,
      storageLoaded,
      statuesRefreshing,
      refreshStatues,
      resetCollectionProgress,
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
