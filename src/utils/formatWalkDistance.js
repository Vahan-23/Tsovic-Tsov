/**
 * Human-readable distance for walk bank UI.
 * @param {number} meters
 * @param {(key: string, params?: object) => string} t
 */
export function formatWalkDistance(meters, t) {
  const m = Math.max(0, Math.round(Number(meters) || 0));
  if (m >= 1000) {
    const km = m / 1000;
    const value = km >= 10 ? Math.round(km) : Math.round(km * 10) / 10;
    return t('walkDistanceKm', { value });
  }
  return t('walkDistanceM', { n: m });
}
