/**
 * Local-only statue catalog used by the Expo app.
 * Replace latitude/longitude with the real statue coordinates you need.
 */
export const FALLBACK_FIGURES = [
  {
    id: 'abovyan',
    name: 'Khachatur Abovyan',
    description: 'Armenian writer and public figure',
    image: null,
    latitude: 40.18106,
    longitude: 44.51308,
    sortOrder: 0,
  },
  {
    id: 'komitas',
    name: 'Komitas',
    description: 'Armenian composer and ethnomusicologist',
    image: null,
    latitude: 40.18647,
    longitude: 44.51512,
    sortOrder: 1,
  },
  {
    id: 'tumanyan',
    name: 'Hovhannes Tumanyan',
    description: 'Armenian poet and writer',
    image: null,
    latitude: 40.17928,
    longitude: 44.50994,
    sortOrder: 2,
  },
  {
    id: 'sayat-nova',
    name: 'Sayat-Nova',
    description: 'Armenian poet, musician, and ashugh',
    image: null,
    latitude: 40.18331,
    longitude: 44.5204,
    sortOrder: 3,
  },
  {
    id: 'charents',
    name: 'Yeghishe Charents',
    description: 'Armenian poet and public intellectual',
    image: null,
    latitude: 40.17812,
    longitude: 44.51695,
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

export function getFigureByIdFromList(list, id) {
  const trimmed = typeof id === 'string' ? id.trim() : '';
  return list.find((f) => f.id === trimmed) ?? null;
}
