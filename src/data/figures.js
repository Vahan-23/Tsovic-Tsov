import yandexMonumentsStatic from './yandexMonuments.static.json';
import monumentTitleOverrides from './monumentTitleOverrides.json';

/**
 * Offline fallback catalog. Coordinates and names cross-checked against
 * OpenStreetMap objects in central Yerevan (verified via Overpass, node/way center).
 *
 * | slug       | OSM id    | OSM primary EN name              |
 * |------------|-----------|----------------------------------|
 * | abovyan    | 703798666 | Khachatur Abovyan monument       |
 * | komitas    | 614350861 | Komitas statue                   |
 * | tumanyan   | 614334700 | Hovhannes Tumanyan monument      |
 * | sayat-nova | 614352792 | Sayat Nova monument              |
 * | charents   | 974787078 | Yeghishe Charents Monument       |
 */
export const FALLBACK_FIGURES = [
  {
    id: 'abovyan',
    osmId: 703798666,
    displayName: 'Khachatur Abovyan monument',
    name: 'Khachatur Abovyan monument',
    name_en: 'Khachatur Abovyan monument',
    name_hy: 'Խաչատուր Աբովյանի արձան',
    name_ru: 'Памятник Хачатуру Абовяну',
    description: '',
    image: null,
    latitude: 40.1916418,
    longitude: 44.5281451,
    sortOrder: 0,
  },
  {
    id: 'komitas',
    osmId: 614350861,
    displayName: 'Komitas statue',
    name: 'Komitas statue',
    name_en: 'Komitas statue',
    name_hy: 'Կոմիտասի արձան',
    name_ru: 'Памятник Комитасу',
    description: '',
    image: null,
    latitude: 40.1871993,
    longitude: 44.5162449,
    sortOrder: 1,
  },
  {
    id: 'tumanyan',
    osmId: 614334700,
    displayName: 'Hovhannes Tumanyan monument',
    name: 'Hovhannes Tumanyan monument',
    name_en: 'Hovhannes Tumanyan monument',
    name_hy: 'Հովհաննես Թումանյանի արձան',
    name_ru: 'Памятник Ованесу Туманяну',
    description: '',
    image: null,
    latitude: 40.1854189,
    longitude: 44.5147058,
    sortOrder: 2,
  },
  {
    id: 'sayat-nova',
    osmId: 614352792,
    displayName: 'Sayat-Nova monument',
    name: 'Sayat-Nova monument',
    name_en: 'Sayat-Nova monument',
    name_hy: 'Սայաթ Նովայի հուշարձան',
    name_ru: 'Памятник Саят-Нове',
    description: '',
    image: null,
    latitude: 40.1878591,
    longitude: 44.5164671,
    sortOrder: 3,
  },
  {
    id: 'charents',
    osmId: 974787078,
    displayName: 'Yeghishe Charents Monument',
    name: 'Yeghishe Charents Monument',
    name_en: 'Yeghishe Charents Monument',
    name_hy: 'Եղիշե Չարենցի արձան',
    name_ru: 'Памятник Егише Чаренцу',
    description: '',
    image: null,
    latitude: 40.1797924,
    longitude: 44.5246095,
    sortOrder: 4,
  },
];

/** @deprecated use FALLBACK_FIGURES */
export const BASE_FIGURES = FALLBACK_FIGURES;

export function sortFiguresList(list) {
  return [...list].sort(
    (a, b) =>
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
      String(a.id).localeCompare(String(b.id))
  );
}

/**
 * Bulk Yandex/Apify monuments: `yandexMonuments.static.json`.
 * Regenerate: `npm run import:apify` (API) or `npm run convert:all` (scrape ll= from org URLs).
 */
export const YANDEX_COLLECTED_FIGURES = Array.isArray(yandexMonumentsStatic)
  ? yandexMonumentsStatic
  : [];

function roundCoordKey(lat, lon) {
  return `${Math.round(lat * 10000) / 10000},${Math.round(lon * 10000) / 10000}`;
}

function overrideForPlace(placeId) {
  if (placeId == null || monumentTitleOverrides == null) return null;
  const key = String(placeId);
  return monumentTitleOverrides[key] ?? null;
}

function mapYandexRecordToFigure(row) {
  const primary = (row.name || '').trim() || 'Monument';
  let name_en = (row.name_en || primary).trim();
  let name_ru = (row.name_ru || primary).trim();
  let name_hy = (row.name_hy || primary).trim();
  const ov = overrideForPlace(row.place_id);
  if (ov) {
    if (ov.name_hy) name_hy = String(ov.name_hy).trim();
    if (ov.name_en) name_en = String(ov.name_en).trim();
    name_ru = name_ru || primary;
  }
  return {
    id: row.id,
    displayName: primary,
    name: name_en,
    name_hy,
    name_ru,
    name_en,
    description: row.description ?? '',
    image: row.image ?? null,
    latitude: row.latitude,
    longitude: row.longitude,
    sortOrder: row.sortOrder ?? 500,
    place_id: row.place_id ?? null,
    category: row.category ?? 'monument',
    city: row.city ?? null,
    address: row.address ?? null,
    collectedSource: 'yandex',
    hasQR: row.hasQR === true,
    collectedAt: row.collectedAt ?? null,
    rating: Number.isFinite(Number(row.rating)) ? Number(row.rating) : null,
    rating_count: Number.isFinite(Number(row.rating_count))
      ? Number(row.rating_count)
      : null,
  };
}

/**
 * After curated Overpass list is finalized, append Yandex static monuments
 * (no duplicates by place_id or rounded coords; never removes curated rows).
 */
export function mergeYandexIntoCuratedStatues(curatedList) {
  if (!Array.isArray(curatedList)) return [];
  const byId = new Set(curatedList.map((s) => String(s.id)));
  const byCoord = new Set(
    curatedList.map((s) => roundCoordKey(s.latitude, s.longitude))
  );
  const extras = [];
  for (const raw of YANDEX_COLLECTED_FIGURES) {
    if (!raw || !Number.isFinite(raw.latitude) || !Number.isFinite(raw.longitude)) {
      continue;
    }
    const id = String(raw.id ?? '');
    const ck = roundCoordKey(raw.latitude, raw.longitude);
    if (byId.has(id) || byCoord.has(ck)) continue;
    if (raw.place_id && byId.has(`yandex_${raw.place_id}`)) continue;
    byId.add(id);
    byCoord.add(ck);
    extras.push(mapYandexRecordToFigure(raw));
  }
  return sortFiguresList([...curatedList, ...extras]);
}

function dedupeFiguresByIdAndCoord(rows) {
  const byId = new Set();
  const byCoord = new Set();
  const out = [];
  for (const r of rows) {
    if (!r || !Number.isFinite(r.latitude) || !Number.isFinite(r.longitude)) continue;
    const id = String(r.id);
    const ck = roundCoordKey(r.latitude, r.longitude);
    if (byId.has(id) || byCoord.has(ck)) continue;
    byId.add(id);
    byCoord.add(ck);
    out.push(r);
  }
  return out;
}

/** Curated OSM fallback + static Yandex catalog (offline bundle). */
export const figures = sortFiguresList(
  dedupeFiguresByIdAndCoord([
    ...FALLBACK_FIGURES,
    ...YANDEX_COLLECTED_FIGURES.map(mapYandexRecordToFigure),
  ])
);

export function getFigureByIdFromList(list, id) {
  const trimmed = typeof id === 'string' ? id.trim() : '';
  return list.find((f) => f.id === trimmed) ?? null;
}
