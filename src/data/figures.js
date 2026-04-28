/**
 * Fallback figures when the API is unavailable or EXPO_PUBLIC_FIGURES_API_URL is unset.
 */
export const FALLBACK_FIGURES = [
  {
    id: 'abovyan',
    name: 'Khachatur Abovyan',
    description: 'Armenian writer and public figure',
    image: null,
    sortOrder: 0,
  },
  {
    id: 'komitas',
    name: 'Komitas',
    description: 'Armenian composer and ethnomusicologist',
    image: null,
    sortOrder: 1,
  },
  {
    id: 'tumanyan',
    name: 'Hovhannes Tumanyan',
    description: 'Armenian poet and writer',
    image: null,
    sortOrder: 2,
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
