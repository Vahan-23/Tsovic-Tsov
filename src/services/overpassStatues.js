const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

const OVERPASS_QUERY = `
[out:json][timeout:60];
(
  node["tourism"="artwork"](38.8,43.4,41.3,46.7);
  node["historic"="monument"](38.8,43.4,41.3,46.7);
  node["historic"="memorial"](38.8,43.4,41.3,46.7);
  node["tourism"="attraction"](38.8,43.4,41.3,46.7);
);
out body;
`;

function normalizeString(value) {
  if (value == null) return '';
  return String(value);
}

export function getOverpassQuery() {
  return OVERPASS_QUERY.trim();
}

export async function fetchOverpassData(query = OVERPASS_QUERY) {
  // Overpass interpreter expects POST form field "data".
  const body = `data=${encodeURIComponent(query.trim())}`;
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Overpass HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

export function convertOverpassJsonToStatues(overpassJson) {
  const elements = Array.isArray(overpassJson?.elements)
    ? overpassJson.elements
    : [];

  const byId = new Map();

  for (const el of elements) {
    const tags = el?.tags;
    if (!el || typeof el.id !== 'number' || !tags) continue;
    if (!Number.isFinite(el.lat) || !Number.isFinite(el.lon)) continue;

    const id = el.id;
    const lat = Number(el.lat);
    const lon = Number(el.lon);

    // Name fields are optional in OSM.
    const name = normalizeString(tags?.name);
    const name_ru = normalizeString(tags?.['name:ru']);
    const name_hy = normalizeString(tags?.['name:hy']);
    const name_en = normalizeString(tags?.['name:en']);

    const description = normalizeString(tags?.description);
    const type = normalizeString(tags?.tourism || tags?.historic);

    byId.set(String(id), {
      id,
      lat,
      lon,
      latitude: lat,
      longitude: lon,
      name,
      name_ru,
      name_hy,
      name_en,
      type,
      description: description || '',
      sortOrder: 0,
    });
  }

  return Array.from(byId.values());
}

export const OVERPASS_CACHE_VERSION = 1;

