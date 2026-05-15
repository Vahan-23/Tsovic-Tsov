/**
 * Локальные превью для коллекции и экрана объекта — без запросов по URL в сетке.
 * Добавляйте файлы в assets/collection/ и связывайте по id или OSM node id.
 */
import { resolveFigureOsmId } from './curatedStatueProfiles';

/** Общая заглушка до замены на реальные фото в assets/collection/ */
const FALLBACK_MONUMENT = require('../../assets/search_ico/monument.png');

const BY_SLUG = {
  abovyan: FALLBACK_MONUMENT,
  komitas: FALLBACK_MONUMENT,
  tumanyan: FALLBACK_MONUMENT,
  'sayat-nova': FALLBACK_MONUMENT,
  charents: FALLBACK_MONUMENT,
};

const BY_OSM_ID = {
  703798666: FALLBACK_MONUMENT,
  614350861: FALLBACK_MONUMENT,
  614334700: FALLBACK_MONUMENT,
  614352792: FALLBACK_MONUMENT,
  974787078: FALLBACK_MONUMENT,
};

/**
 * @returns {number | null} результат require(...) для <Image source={...} /> или null
 */
export function getStatueCollectionImageSource(figure) {
  if (!figure) return null;
  const slug = String(figure.id ?? '').trim();
  if (slug && BY_SLUG[slug]) return BY_SLUG[slug];

  const osm = resolveFigureOsmId(figure);
  if (Number.isFinite(osm) && BY_OSM_ID[osm]) return BY_OSM_ID[osm];

  return null;
}

export function hasStatueCollectionImage(figure) {
  return getStatueCollectionImageSource(figure) != null;
}
