import { fetchOsrmFootRoute } from './osrmRouter';
import { getWalkingRoute } from './yandexRouter';
import { haversineDistanceMeters } from '../utils/haversine';

function sumPolylineLengthMeters(coords) {
  if (!coords || coords.length < 2) return 0;
  let sum = 0;
  for (let i = 0; i < coords.length - 1; i += 1) {
    sum += haversineDistanceMeters(coords[i], coords[i + 1]);
  }
  return sum;
}

/**
 * Walking route from origin to target: Yandex Router, then OSRM fallback.
 * @returns {Promise<{ coordinates: { latitude: number, longitude: number }[], distanceMeters: number, durationSeconds: number }>}
 */
export async function fetchWalkingRouteToTarget(
  origin,
  targetLat,
  targetLon,
  signal
) {
  try {
    return await getWalkingRoute(
      origin.latitude,
      origin.longitude,
      targetLat,
      targetLon,
      { signal }
    );
  } catch (yandexErr) {
    if (yandexErr?.name === 'AbortError') throw yandexErr;
    const coordinates = await fetchOsrmFootRoute(
      origin,
      targetLat,
      targetLon,
      signal
    );
    const distanceMeters = sumPolylineLengthMeters(coordinates);
    const durationSeconds = Math.max(
      60,
      Math.round(distanceMeters / 1.35)
    );
    return { coordinates, distanceMeters, durationSeconds };
  }
}
