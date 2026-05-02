const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

const OVERPASS_QUERY = `
[out:json][timeout:60];
(
  nwr["man_made"="statue"](38.8,43.4,41.3,46.7);
  nwr["historic"="monument"](38.8,43.4,41.3,46.7);
  nwr["historic"="memorial"](38.8,43.4,41.3,46.7);
  nwr["tourism"="artwork"](38.8,43.4,41.3,46.7);
);
out center;
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
    const lat = Number(el.lat ?? el.center?.lat);
    const lon = Number(el.lon ?? el.center?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const id = el.id;
    // Name fields are optional in OSM.
    const name_hy = normalizeString(tags?.['name:hy']);
    const name = normalizeString(tags?.name);
    const official_name = normalizeString(
      tags?.official_name ||
        tags?.['official_name:hy'] ||
        tags?.['official_name:en']
    );
    const loc_name = normalizeString(
      tags?.loc_name || tags?.['loc_name:hy'] || tags?.['loc_name:en']
    );
    const ref = normalizeString(tags?.ref);

    const name_ru = normalizeString(tags?.['name:ru']);
    const name_en = normalizeString(tags?.['name:en']);

    const description = normalizeString(tags?.description);

    const tourism = normalizeString(tags?.tourism);
    const historic = normalizeString(tags?.historic);
    const manMade = normalizeString(tags?.man_made);
    const artworkType = normalizeString(tags?.artwork_type);

    // Extra strict filtering to avoid “random attractions” showing up.
    // - historic=monument|memorial are accepted as-is
    // - man_made=statue is accepted as-is
    // - tourism=artwork is accepted only if artwork_type looks statue-like
    const artworkTypeAllowed = new Set([
      'statue',
      'sculpture',
      'monument',
      'bust',
      'memorial',
    ]);
    if (tourism === 'artwork' && artworkType && !artworkTypeAllowed.has(artworkType)) {
      continue;
    }
    if (
      manMade !== 'statue' &&
      historic !== 'monument' &&
      historic !== 'memorial' &&
      tourism !== 'artwork'
    ) {
      continue;
    }

    // Compute best name with strict priority.
    // Priority: name:hy → name → official_name → loc_name → ref
    const humanName =
      name_hy || name || official_name || loc_name || '';

    // If only `ref` exists and it's numeric-only, it tends to look like
    // "TARGET 5013..." which we want to exclude.
    const isRefNumericOnly = ref ? /^[0-9]+$/.test(ref) : false;
    if (!humanName && (!ref || isRefNumericOnly)) {
      continue;
    }

    const displayName =
      name_hy || name || official_name || loc_name || ref || '';

    // Images are optional; we pass through if we find a usable URL.
    const rawImage =
      normalizeString(tags?.image) ||
      normalizeString(tags?.['image:1']) ||
      normalizeString(tags?.['image:url']) ||
      '';
    const imageUrl =
      rawImage && /^https?:\/\//i.test(rawImage) ? rawImage : '';

    const type =
      manMade === 'statue'
        ? 'statue'
        : historic
          ? historic
          : tourism
            ? tourism
            : '';

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
      displayName,
      type,
      description: description || '',
      image: imageUrl,
      sortOrder: 0,
    });
  }

  return Array.from(byId.values());
}

export const OVERPASS_CACHE_VERSION = 5;

