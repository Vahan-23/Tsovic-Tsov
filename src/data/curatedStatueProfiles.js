/**
 * Only these OSM objects appear as collectible statues, with full curated copy
 * (life dates, why the monument exists, etc.). All other Overpass hits are dropped.
 */
import { sortFiguresList } from './figures';

const SLUG_TO_OSM = {
  abovyan: 703798666,
  komitas: 614350861,
  tumanyan: 614334700,
  'sayat-nova': 614352792,
  charents: 974787078,
};

/**
 * @typedef {{ key: string, born: number, died: number, monumentUnveiled: number | null, sortOrder: number }} CuratedProfile
 * @type {Record<number, CuratedProfile>}
 */
export const CURATED_STATUE_PROFILES = {
  703798666: {
    key: 'abovyan',
    born: 1809,
    died: 1848,
    monumentUnveiled: null,
    sortOrder: 0,
  },
  614350861: {
    key: 'komitas',
    born: 1869,
    died: 1935,
    monumentUnveiled: 1969,
    sortOrder: 1,
  },
  614334700: {
    key: 'tumanyan',
    born: 1869,
    died: 1923,
    monumentUnveiled: null,
    sortOrder: 2,
  },
  614352792: {
    key: 'sayat_nova',
    born: 1712,
    died: 1795,
    monumentUnveiled: null,
    sortOrder: 3,
  },
  974787078: {
    key: 'charents',
    born: 1897,
    died: 1937,
    monumentUnveiled: null,
    sortOrder: 4,
  },
};

export const CURATED_OSM_IDS = new Set(
  Object.keys(CURATED_STATUE_PROFILES).map(Number)
);

export function resolveFigureOsmId(figure) {
  if (figure == null) return NaN;
  if (figure.osmId != null && Number.isFinite(Number(figure.osmId))) {
    return Number(figure.osmId);
  }
  const id = figure.id;
  if (typeof id === 'number' && Number.isFinite(id)) return id;
  const s = String(id ?? '');
  if (/^\d+$/.test(s)) return Number(s);
  const mapped = SLUG_TO_OSM[s];
  return mapped != null ? mapped : NaN;
}

/**
 * Attach curated fields or return null if this statue is not in our catalog.
 */
export function enrichFigureIfCurated(figure) {
  const osm = resolveFigureOsmId(figure);
  if (!Number.isFinite(osm)) return null;
  const profile = CURATED_STATUE_PROFILES[osm];
  if (!profile) return null;

  return {
    ...figure,
    curatedKey: profile.key,
    born: profile.born,
    died: profile.died,
    monumentUnveiled: profile.monumentUnveiled,
    sortOrder: profile.sortOrder,
    description: '',
  };
}

/**
 * Map + filter: only curated statues, OSM description replaced (detail screen uses i18n).
 */
export function finalizeCuratedStatueList(rows) {
  if (!Array.isArray(rows)) return [];
  const out = [];
  for (const row of rows) {
    const next = enrichFigureIfCurated(row);
    if (next) out.push(next);
  }
  return sortFiguresList(out);
}
