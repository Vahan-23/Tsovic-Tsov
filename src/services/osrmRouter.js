/**
 * Public OSRM foot routing (no API key). Used as fallback when Yandex Router fails.
 */

export async function fetchOsrmFootRoute(origin, targetLat, targetLon, signal) {
  const url = `https://router.project-osrm.org/route/v1/foot/${origin.longitude},${origin.latitude};${targetLon},${targetLat}?overview=full&geometries=geojson`;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`OSRM HTTP ${response.status}`);
  }
  const data = await response.json();
  if ((data.code && data.code !== 'Ok') || !data.routes?.length) {
    throw new Error(data.code || 'OSRM no route');
  }
  const coordinates = data.routes[0]?.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    throw new Error('OSRM invalid geometry');
  }
  return coordinates
    .filter(
      (coord) =>
        Array.isArray(coord) &&
        coord.length >= 2 &&
        Number.isFinite(coord[0]) &&
        Number.isFinite(coord[1])
    )
    .map((coord) => ({
      latitude: coord[1],
      longitude: coord[0],
    }));
}
