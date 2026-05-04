import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import Database from 'better-sqlite3';

type PlaceLocation = {
  latitude: number;
  longitude: number;
};

type PlaceDisplayName = {
  text?: string;
  languageCode?: string;
};

type EditorialSummary = {
  text?: string;
  languageCode?: string;
};

type PlacePhoto = {
  name?: string;
};

type Place = {
  id?: string;
  types?: string[];
  displayName?: PlaceDisplayName;
  formattedAddress?: string;
  location?: PlaceLocation;
  rating?: number;
  userRatingCount?: number;
  regularOpeningHours?: unknown;
  photos?: PlacePhoto[];
  websiteUri?: string;
  editorialSummary?: EditorialSummary;
};

type SearchResponse = {
  places?: Place[];
  nextPageToken?: string;
};

type MonumentCategory =
  | 'statue'
  | 'monument'
  | 'memorial'
  | 'sculpture'
  | 'obelisk';

type MonumentRecord = {
  place_id: string;
  name: string;
  name_local: string | null;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  category: MonumentCategory;
  rating: number | null;
  rating_count: number | null;
  opening_hours: unknown | null;
  photos: string | null;
  website: string | null;
  description: string | null;
  raw_types: string[];
  created_at: string;
};

const TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const DETAILS_URL_BASE = 'https://places.googleapis.com/v1/places';

const REQUESTS_PER_SECOND = 10;
const MIN_REQUEST_INTERVAL_MS = Math.ceil(1000 / REQUESTS_PER_SECOND);
const MAX_RETRIES = 5;
const INITIAL_BACKOFF_MS = 500;

const SEARCH_LANGUAGE_CODE = 'ru';
const PRIMARY_DETAILS_LANGUAGE = 'en';
const LOCAL_DETAILS_LANGUAGE = 'hy';

const SEARCH_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.types',
  'places.editorialSummary',
  'nextPageToken',
].join(',');

const DETAILS_FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'location',
  'rating',
  'userRatingCount',
  'regularOpeningHours',
  'photos',
  'websiteUri',
  'editorialSummary',
  'types',
].join(',');

const queries = [
  'monuments Yerevan Armenia',
  'statues Yerevan Armenia',
  'sculptures Yerevan Armenia',
  'memorials Yerevan Armenia',
  'памятники Ереван Армения',
  'статуи Ереван Армения',
  'monuments Gyumri Armenia',
  'statues Gyumri Armenia',
  'monuments Vanadzor Armenia',
  'monuments Vagharshapat Armenia',
  'monuments Dilijan Armenia',
  'monuments Abovyan Armenia',
  'monuments Hrazdan Armenia',
  'historical monuments Armenia',
  'war memorials Armenia',
  'genocide memorial Armenia',
  'оbelisk Yerevan',
  'bust statue Yerevan Armenia',
];

const DIRECT_TYPE_SET = new Set([
  'historical_landmark',
  'monument',
  'sculpture',
  'memorial',
]);

const TOURIST_ATTRACTION_TYPE = 'tourist_attraction';

const NAME_KEYWORD_RE =
  /(statue|monument|memorial|sculpture|obelisk|bust|памятник|статуя|мемориал|обелиск|բուշտ|հուշարձան|արձան)/i;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(code: number): boolean {
  return code === 429 || code >= 500;
}

class GooglePlacesClient {
  private readonly apiKey: string;
  private lastRequestAt = 0;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async throttle(): Promise<void> {
    const now = Date.now();
    const waitMs = this.lastRequestAt + MIN_REQUEST_INTERVAL_MS - now;
    if (waitMs > 0) {
      await sleep(waitMs);
    }
    this.lastRequestAt = Date.now();
  }

  private async requestWithRetry(
    url: string,
    init: RequestInit & { headers: Record<string, string> }
  ): Promise<Response> {
    let attempt = 0;
    let backoffMs = INITIAL_BACKOFF_MS;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      attempt += 1;
      await this.throttle();

      const res = await fetch(url, init);
      if (res.ok) return res;

      if (!isRetryableStatus(res.status) || attempt > MAX_RETRIES) {
        const text = await res.text();
        throw new Error(
          `Google Places error ${res.status} on ${url}: ${text || 'no body'}`
        );
      }

      const retryAfter = Number(res.headers.get('retry-after'));
      const retryAfterMs = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : null;

      const jitter = Math.floor(Math.random() * 220);
      await sleep((retryAfterMs ?? backoffMs) + jitter);
      backoffMs *= 2;
    }
  }

  async textSearch(textQuery: string, pageToken?: string): Promise<SearchResponse> {
    const body: Record<string, unknown> = {
      textQuery,
      languageCode: SEARCH_LANGUAGE_CODE,
    };
    if (pageToken) body.pageToken = pageToken;

    const res = await this.requestWithRetry(TEXT_SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': SEARCH_FIELD_MASK,
      },
      body: JSON.stringify(body),
    });
    return (await res.json()) as SearchResponse;
  }

  async placeDetails(placeId: string, languageCode: string): Promise<Place> {
    const url = `${DETAILS_URL_BASE}/${encodeURIComponent(
      placeId
    )}?languageCode=${encodeURIComponent(languageCode)}`;

    const res = await this.requestWithRetry(url, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': DETAILS_FIELD_MASK,
      },
    });

    return (await res.json()) as Place;
  }
}

function normalizeText(value: string | undefined): string {
  return (value ?? '').trim();
}

function isRelevantPlace(place: Place): boolean {
  const types = place.types ?? [];
  if (types.some((t) => DIRECT_TYPE_SET.has(t))) return true;

  const isTouristAttraction = types.includes(TOURIST_ATTRACTION_TYPE);
  if (!isTouristAttraction) return false;

  const name = normalizeText(place.displayName?.text);
  return NAME_KEYWORD_RE.test(name);
}

function pickCategory(types: string[], nameRaw: string): MonumentCategory {
  const name = nameRaw.toLowerCase();
  if (types.includes('memorial') || /memorial|мемориал|հուշահամալիր/.test(name)) {
    return 'memorial';
  }
  if (types.includes('sculpture') || /sculpture|скульптур|քանդակ/.test(name)) {
    return 'sculpture';
  }
  if (/obelisk|обелиск|օբելիսկ/.test(name)) {
    return 'obelisk';
  }
  if (/statue|статуя|արձան|bust|бюст|կիսանդրի/.test(name)) {
    return 'statue';
  }
  return 'monument';
}

function cityFromAddress(address?: string): string | null {
  if (!address) return null;
  const knownCities = [
    'Yerevan',
    'Gyumri',
    'Vanadzor',
    'Vagharshapat',
    'Ejmiatsin',
    'Dilijan',
    'Abovyan',
    'Hrazdan',
    'Երևան',
    'Գյումրի',
    'Վանաձոր',
    'Էջմիածին',
    'Դիլիջան',
    'Абовян',
    'Ереван',
  ];
  const tokens = address.split(',').map((x) => x.trim()).filter(Boolean);

  for (const token of tokens) {
    const found = knownCities.find(
      (city) => token.toLowerCase() === city.toLowerCase()
    );
    if (found) return token;
  }

  if (tokens.length >= 3) {
    return tokens[tokens.length - 3] || null;
  }
  if (tokens.length >= 2) {
    return tokens[tokens.length - 2] || null;
  }
  return tokens[0] ?? null;
}

function toRecord(primary: Place, local: Place | null, createdAtIso: string): MonumentRecord {
  const name = normalizeText(primary.displayName?.text);
  const localName = normalizeText(local?.displayName?.text);
  const types = primary.types ?? [];

  return {
    place_id: normalizeText(primary.id),
    name: name || localName || 'Unnamed monument',
    name_local: localName && localName !== name ? localName : localName || null,
    city: cityFromAddress(primary.formattedAddress),
    address: primary.formattedAddress ?? null,
    latitude: primary.location?.latitude ?? null,
    longitude: primary.location?.longitude ?? null,
    category: pickCategory(types, name || localName),
    rating: Number.isFinite(primary.rating) ? (primary.rating as number) : null,
    rating_count: Number.isFinite(primary.userRatingCount)
      ? (primary.userRatingCount as number)
      : null,
    opening_hours: primary.regularOpeningHours ?? null,
    photos: primary.photos?.[0]?.name ?? null,
    website: primary.websiteUri ?? null,
    description: primary.editorialSummary?.text ?? null,
    raw_types: types,
    created_at: createdAtIso,
  };
}

async function ensureOutputDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

function writeSqlite(dbPath: string, records: MonumentRecord[]): void {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS monuments (
      place_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_local TEXT,
      city TEXT,
      address TEXT,
      latitude REAL,
      longitude REAL,
      category TEXT NOT NULL,
      rating REAL,
      rating_count INTEGER,
      opening_hours TEXT,
      photos TEXT,
      website TEXT,
      description TEXT,
      raw_types TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  const insert = db.prepare(`
    INSERT INTO monuments (
      place_id, name, name_local, city, address, latitude, longitude, category,
      rating, rating_count, opening_hours, photos, website, description,
      raw_types, created_at
    ) VALUES (
      @place_id, @name, @name_local, @city, @address, @latitude, @longitude, @category,
      @rating, @rating_count, @opening_hours, @photos, @website, @description,
      @raw_types, @created_at
    )
    ON CONFLICT(place_id) DO UPDATE SET
      name = excluded.name,
      name_local = excluded.name_local,
      city = excluded.city,
      address = excluded.address,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      category = excluded.category,
      rating = excluded.rating,
      rating_count = excluded.rating_count,
      opening_hours = excluded.opening_hours,
      photos = excluded.photos,
      website = excluded.website,
      description = excluded.description,
      raw_types = excluded.raw_types,
      created_at = excluded.created_at;
  `);

  const tx = db.transaction((rows: MonumentRecord[]) => {
    for (const row of rows) {
      insert.run({
        ...row,
        opening_hours: row.opening_hours ? JSON.stringify(row.opening_hours) : null,
        raw_types: JSON.stringify(row.raw_types ?? []),
      });
    }
  });

  tx(records);
  db.close();
}

async function main(): Promise<void> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GOOGLE_API_KEY is missing. Add it to .env, then re-run: npx ts-node collect.ts'
    );
  }

  const client = new GooglePlacesClient(apiKey);
  const uniqueByPlaceId = new Map<string, Place>();

  for (const query of queries) {
    let pageToken: string | undefined;
    let page = 0;
    do {
      if (pageToken) {
        // Google can require a short delay before page token becomes active.
        await sleep(1300);
      }

      const payload = await client.textSearch(query, pageToken);
      const places = payload.places ?? [];

      for (const place of places) {
        const placeId = normalizeText(place.id);
        if (!placeId) continue;
        if (!isRelevantPlace(place)) continue;
        if (!uniqueByPlaceId.has(placeId)) {
          uniqueByPlaceId.set(placeId, place);
        }
      }

      page += 1;
      pageToken = normalizeText(payload.nextPageToken) || undefined;
      console.log(
        `[search] "${query}" page ${page} -> ${places.length} hits, unique so far: ${uniqueByPlaceId.size}`
      );
    } while (pageToken);
  }

  const createdAtIso = new Date().toISOString();
  const records: MonumentRecord[] = [];
  let skippedNoCoords = 0;

  for (const placeId of uniqueByPlaceId.keys()) {
    const primary = await client.placeDetails(placeId, PRIMARY_DETAILS_LANGUAGE);
    if (!isRelevantPlace(primary)) continue;

    const local = await client.placeDetails(placeId, LOCAL_DETAILS_LANGUAGE);
    const row = toRecord(primary, local, createdAtIso);

    if (row.latitude == null || row.longitude == null) {
      skippedNoCoords += 1;
      continue;
    }
    records.push(row);
  }

  records.sort((a, b) => a.name.localeCompare(b.name, 'en'));

  const outputDir = path.join(process.cwd(), 'output');
  await ensureOutputDir(outputDir);

  const fullJsonPath = path.join(outputDir, 'armenia_monuments.json');
  const geoJsonPath = path.join(outputDir, 'armenia_monuments_geo.json');
  const dbPath = path.join(outputDir, 'monuments.db');

  await fs.writeFile(fullJsonPath, `${JSON.stringify(records, null, 2)}\n`, 'utf8');

  const slim = records.map((x) => ({
    id: x.place_id,
    name: x.name,
    lat: x.latitude,
    lng: x.longitude,
    category: x.category,
    city: x.city,
  }));
  await fs.writeFile(geoJsonPath, `${JSON.stringify(slim, null, 2)}\n`, 'utf8');

  writeSqlite(dbPath, records);

  console.log(
    `Found ${records.length} unique monuments across Armenia (skipped without coordinates: ${skippedNoCoords}).`
  );
  console.log(`Saved:\n- ${fullJsonPath}\n- ${geoJsonPath}\n- ${dbPath}`);
}

main().catch((err) => {
  console.error('[collect] failed:', err);
  process.exitCode = 1;
});

