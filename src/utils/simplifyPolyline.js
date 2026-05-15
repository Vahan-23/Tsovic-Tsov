/** Cap polyline vertices — very long routes can crash react-native-maps on mobile. */
const MAX_ROUTE_VERTICES = 280;

/**
 * Downsample coordinates for map Polyline (keeps first/last).
 * @param {{ latitude: number, longitude: number }[]} coords
 */
export function simplifyPolylineForMap(coords, maxPoints = MAX_ROUTE_VERTICES) {
  if (!Array.isArray(coords) || coords.length <= maxPoints) {
    return coords ?? [];
  }
  const step = Math.ceil(coords.length / maxPoints);
  const out = [];
  for (let i = 0; i < coords.length; i += step) {
    const p = coords[i];
    if (
      p &&
      Number.isFinite(p.latitude) &&
      Number.isFinite(p.longitude)
    ) {
      out.push(p);
    }
  }
  const last = coords[coords.length - 1];
  if (
    last &&
    Number.isFinite(last.latitude) &&
    Number.isFinite(last.longitude)
  ) {
    const tail = out[out.length - 1];
    if (
      !tail ||
      tail.latitude !== last.latitude ||
      tail.longitude !== last.longitude
    ) {
      out.push(last);
    }
  }
  return out.length >= 2 ? out : coords.slice(0, 2);
}
