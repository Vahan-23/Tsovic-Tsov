import Constants from 'expo-constants';

function getYandexApiKey() {
  return Constants.expoConfig?.extra?.yandexApiKey ?? '';
}

/** Google-encoded polyline → [{ latitude, longitude }, ...] */
function decodeEncodedPolyline(encoded) {
  if (!encoded || typeof encoded !== 'string') return [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coords = [];
  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    coords.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }
  return coords;
}

function appendPointsFromStep(out, step) {
  const poly = step?.polyline;
  if (!poly) return;

  if (typeof poly.encoded === 'string') {
    out.push(...decodeEncodedPolyline(poly.encoded));
    return;
  }

  const pts = poly.points;
  if (typeof pts === 'string') {
    out.push(...decodeEncodedPolyline(pts));
    return;
  }
  if (Array.isArray(pts)) {
    for (const p of pts) {
      if (Array.isArray(p) && p.length >= 2) {
        const a = Number(p[0]);
        const b = Number(p[1]);
        if (Number.isFinite(a) && Number.isFinite(b)) {
          out.push({ latitude: a, longitude: b });
        }
      }
    }
  }
}

function dedupeConsecutive(coords) {
  if (coords.length < 2) return coords;
  const out = [coords[0]];
  for (let i = 1; i < coords.length; i += 1) {
    const prev = out[out.length - 1];
    const cur = coords[i];
    if (
      Math.abs(prev.latitude - cur.latitude) > 1e-8 ||
      Math.abs(prev.longitude - cur.longitude) > 1e-8
    ) {
      out.push(cur);
    }
  }
  return out;
}

/**
 * Yandex Router HTTP API v2 — pedestrian/walking route between two WGS84 points.
 * @returns {{ coordinates: { latitude: number, longitude: number }[], distanceMeters: number, durationSeconds: number }}
 */
export async function getWalkingRoute(
  fromLat,
  fromLon,
  toLat,
  toLon,
  options = {}
) {
  const KEY = getYandexApiKey();
  if (!KEY) {
    throw new Error('Yandex API key missing');
  }
  const { signal } = options;
  const waypoints = `${fromLat},${fromLon}|${toLat},${toLon}`;
  const url =
    `https://api.routing.yandex.net/v2/route?apikey=${encodeURIComponent(KEY)}` +
    `&waypoints=${waypoints}&mode=walking&lang=ru_RU`;

  const res = await fetch(url, { signal });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || data?.message || res.statusText;
    throw new Error(`Yandex Router HTTP ${res.status}: ${msg}`);
  }

  const legs = data.route?.legs;
  if (!Array.isArray(legs) || legs.length === 0) {
    throw new Error('No route found');
  }

  const coordinates = [];
  let distanceMeters = 0;
  let durationSeconds = 0;

  for (const leg of legs) {
    const steps = leg?.steps;
    if (!Array.isArray(steps)) continue;
    for (const step of steps) {
      appendPointsFromStep(coordinates, step);
      const len = step.length;
      const dur = step.duration;
      if (typeof len === 'number') distanceMeters += len;
      else if (len && typeof len.value === 'number') distanceMeters += len.value;
      if (typeof dur === 'number') durationSeconds += dur;
      else if (dur && typeof dur.value === 'number') durationSeconds += dur.value;
    }
  }

  const clean = dedupeConsecutive(coordinates);
  if (clean.length < 2) {
    throw new Error('Yandex route has insufficient coordinates');
  }

  return { coordinates: clean, distanceMeters, durationSeconds };
}
