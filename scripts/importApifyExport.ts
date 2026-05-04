/**
 * Import Apify Yandex Maps scraper JSON → yandexMonuments.static.json (merge, dedupe).
 * Resolves coordinates via Yandex Places HTTP API (search-maps.yandex.ru), then address geocode fallback.
 *
 * Input:  src/data/apify_export.json  (copy your Apify export here)
 * Env:    YANDEX_ORG_SEARCH_API_KEY — Places search (same as collect:monuments)
 *         YANDEX_API_KEY — HTTP Geocoder fallback (geocode-maps.yandex.ru)
 * Optional: YANDEX_GEOSEARCH_REFERER — if key has domain restriction in cabinet
 *
 * Usage:
 *   npx tsx scripts/importApifyExport.ts
 *   npx tsx scripts/importApifyExport.ts --limit 50
 *   npx tsx scripts/importApifyExport.ts --input src/data/apify_export.json
 */
import { config as loadEnv } from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
loadEnv({ path: path.join(ROOT, '.env') });

const DEFAULT_INPUT = path.join(ROOT, 'src', 'data', 'apify_export.json');
const STATIC_OUT = path.join(ROOT, 'src', 'data', 'yandexMonuments.static.json');
const OUTPUT_DIR = path.join(ROOT, 'scripts', 'output');

const SEARCH_BASE = 'https://search-maps.yandex.ru/v1/';
const MIN_INTERVAL_MS = 1000;

type ApifyItem = {
  title: string;
  mainPhotoUrl?: string;
  categoryName?: string;
  totalScore?: number;
  reviewsCount?: number;
  address?: string;
  url: string;
};

type StaticMonument = {
  id: string;
  name: string;
  name_en: string;
  latitude: number;
  longitude: number;
  category: string;
  city: string;
  address: string | null;
  description: null;
  rating: number | null;
  rating_count: number | null;
  place_id: string | null;
  image: string | null;
  hasQR: boolean;
  collectedAt: string;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function sanitizeKey(raw: string | undefined): string {
  if (raw == null) return '';
  let s = String(raw).trim().replace(/^\uFEFF/, '');
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s.replace(/\r/g, '').replace(/\s+/g, '');
}

function geoSearchFetchInit(): RequestInit {
  const referer = process.env.YANDEX_GEOSEARCH_REFERER?.trim();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (referer) headers.Referer = referer;
  return { headers };
}

let lastApiAt = 0;
async function rateLimit() {
  const dt = Date.now() - lastApiAt;
  if (dt < MIN_INTERVAL_MS) await sleep(MIN_INTERVAL_MS - dt);
  lastApiAt = Date.now();
}

function extractOrgId(url: string): string | null {
  const m = url.match(/\/org\/(\d+)/);
  return m?.[1] ?? null;
}

function detectCity(address: string): string {
  const a = address || '';
  if (a.includes('Ереван')) return 'Ереван';
  if (a.includes('Гюмри')) return 'Гюмри';
  if (a.includes('Ванадзор')) return 'Ванадзор';
  if (a.includes('Вагаршапат')) return 'Вагаршапат';
  if (a.includes('Абовян')) return 'Абовян';
  if (a.includes('Раздан')) return 'Раздан';
  if (a.includes('Капан')) return 'Капан';
  if (a.includes('Горис')) return 'Горис';
  if (a.includes('Дилижан')) return 'Дилижан';
  return 'Армения';
}

function detectCategory(categoryName: string | undefined, title: string): string {
  const t = title.toLowerCase();
  const c = (categoryName || '').toLowerCase();
  if (t.includes('бюст')) return 'bust';
  if (t.includes('статуя')) return 'statue';
  if (t.includes('скульптур')) return 'sculpture';
  if (t.includes('мемориал') || c.includes('мемориал')) return 'memorial';
  if (t.includes('обелиск')) return 'obelisk';
  if (t.includes('монумент')) return 'monument';
  return 'monument';
}

function parseFeatures(data: unknown): unknown[] {
  if (!data || typeof data !== 'object') return [];
  const d = data as { features?: unknown[] };
  return Array.isArray(d.features) ? d.features : [];
}

function coordsFromFeatures(features: unknown[], orgId: string): { lon: number; lat: number } | null {
  for (const raw of features) {
    if (!raw || typeof raw !== 'object') continue;
    const f = raw as {
      properties?: { CompanyMetaData?: { id?: string | number } };
      geometry?: { coordinates?: number[] };
    };
    const id = f.properties?.CompanyMetaData?.id;
    if (id != null && String(id) === String(orgId)) {
      const c = f.geometry?.coordinates;
      if (Array.isArray(c) && c.length >= 2) {
        const lon = Number(c[0]);
        const lat = Number(c[1]);
        if (Number.isFinite(lat) && Number.isFinite(lon)) return { lon, lat };
      }
    }
  }
  return null;
}

async function placesSearch(apiKey: string, text: string): Promise<unknown[]> {
  await rateLimit();
  const params = new URLSearchParams({
    apikey: apiKey,
    text,
    type: 'biz',
    lang: 'ru_RU',
    results: '10',
    skip: '0',
    ll: '44.5152,40.1872',
    spn: '1.2,1.2',
  });
  const url = `${SEARCH_BASE}?${params.toString()}`;
  const res = await fetch(url, geoSearchFetchInit());
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Places HTTP ${res.status}: ${t.slice(0, 180)}`);
  }
  const data = await res.json();
  return parseFeatures(data);
}

async function resolveCoordsPlaces(
  placesKey: string,
  item: ApifyItem,
  orgId: string
): Promise<{ lon: number; lat: number } | null> {
  const tries = [
    item.title,
    `https://yandex.ru/maps/org/${orgId}/`,
    item.address ? `${item.title} ${item.address}` : '',
    item.address || '',
  ].filter(Boolean);

  for (const text of tries) {
    try {
      const features = await placesSearch(placesKey, text);
      const hit = coordsFromFeatures(features, orgId);
      if (hit) return hit;
    } catch {
      /* try next */
    }
  }
  return null;
}

async function geocodeAddress(
  geocoderKey: string,
  address: string
): Promise<{ lon: number; lat: number } | null> {
  if (!address?.trim()) return null;
  await rateLimit();
  const url =
    `https://geocode-maps.yandex.ru/1.x/?apikey=${encodeURIComponent(geocoderKey)}` +
    `&geocode=${encodeURIComponent(address)}&format=json&lang=ru_RU&results=1`;
  const res = await fetch(url, geoSearchFetchInit());
  if (!res.ok) return null;
  const data = await res.json();
  const pos =
    data.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Point?.pos;
  if (typeof pos !== 'string') return null;
  const parts = pos.trim().split(/\s+/);
  const lon = Number(parts[0]);
  const lat = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lon, lat };
}

function buildRecord(item: ApifyItem, orgId: string, lat: number, lon: number): StaticMonument {
  const rating =
    item.totalScore != null && Number.isFinite(Number(item.totalScore))
      ? Number(item.totalScore)
      : null;
  const rating_count =
    item.reviewsCount != null && Number.isFinite(Number(item.reviewsCount))
      ? Number(item.reviewsCount)
      : null;

  return {
    id: `yandex_${orgId}`,
    name: item.title,
    name_en: item.title,
    latitude: lat,
    longitude: lon,
    category: detectCategory(item.categoryName, item.title),
    city: detectCity(item.address || ''),
    address: item.address ?? null,
    description: null,
    rating,
    rating_count,
    place_id: orgId,
    image: item.mainPhotoUrl ?? null,
    hasQR: false,
    collectedAt: new Date().toISOString(),
  };
}

function roundCoordKey(lat: number, lon: number): string {
  return `${Math.round(lat * 10000) / 10000},${Math.round(lon * 10000) / 10000}`;
}

function parseArgs(argv: string[]) {
  let limit: number | null = null;
  let inputPath = DEFAULT_INPUT;
  let dryRun = false;
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--limit' && argv[i + 1]) {
      limit = parseInt(argv[i + 1], 10);
      i += 1;
    } else if (a === '--input' && argv[i + 1]) {
      inputPath = path.resolve(ROOT, argv[i + 1]);
      i += 1;
    } else if (a === '--dry-run') {
      dryRun = true;
    }
  }
  return { limit, inputPath, dryRun };
}

async function main() {
  const { limit, inputPath, dryRun } = parseArgs(process.argv);

  const placesKey = sanitizeKey(
    process.env.YANDEX_ORG_SEARCH_API_KEY ||
      process.env.YANDEX_PLACES_API_KEY ||
      process.env.YANDEX_API_KEY
  );
  const geocoderKey = sanitizeKey(process.env.YANDEX_API_KEY);

  if (!placesKey) {
    console.error('Set YANDEX_ORG_SEARCH_API_KEY (Places / org search) in .env');
    process.exit(1);
  }

  const raw = await fs.readFile(inputPath, 'utf8');
  const items = JSON.parse(raw) as ApifyItem[];
  if (!Array.isArray(items)) {
    console.error('Expected JSON array');
    process.exit(1);
  }

  const slice = limit != null && Number.isFinite(limit) ? items.slice(0, limit) : items;

  let existing: StaticMonument[] = [];
  try {
    const j = await fs.readFile(STATIC_OUT, 'utf8');
    const parsed = JSON.parse(j);
    if (Array.isArray(parsed)) existing = parsed as StaticMonument[];
  } catch {
    existing = [];
  }

  const byPlaceId = new Set<string>();
  const byCoord = new Set<string>();
  for (const row of existing) {
    if (row.place_id) byPlaceId.add(String(row.place_id));
    if (Number.isFinite(row.latitude) && Number.isFinite(row.longitude)) {
      byCoord.add(roundCoordKey(row.latitude, row.longitude));
    }
  }

  const merged: StaticMonument[] = [...existing];
  let added = 0;
  let skipped = 0;
  const failed: { title: string; url: string; reason: string }[] = [];

  let idx = 0;
  for (const item of slice) {
    idx += 1;
    const orgId = extractOrgId(item.url);
    if (!orgId) {
      failed.push({ title: item.title, url: item.url, reason: 'no org id in url' });
      continue;
    }
    if (byPlaceId.has(orgId)) {
      skipped += 1;
      continue;
    }

    process.stdout.write(`\r[${idx}/${slice.length}] ${item.title.slice(0, 46)}…`);

    let coords = await resolveCoordsPlaces(placesKey, item, orgId);
    if (!coords && geocoderKey && item.address) {
      coords = await geocodeAddress(geocoderKey, item.address);
    }

    if (!coords) {
      failed.push({
        title: item.title,
        url: item.url,
        reason: 'no coordinates from Places or Geocoder',
      });
      continue;
    }

    const lat = coords.lat;
    const lon = coords.lon;
    const ck = roundCoordKey(lat, lon);
    if (byCoord.has(ck)) {
      skipped += 1;
      byPlaceId.add(orgId);
      continue;
    }

    const rec = buildRecord(item, orgId, lat, lon);
    merged.push(rec);
    byPlaceId.add(orgId);
    byCoord.add(ck);
    added += 1;
  }

  console.log('');

  const day = new Date().toISOString().slice(0, 10);
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(
    path.join(OUTPUT_DIR, `apify_import_failed_${day}.json`),
    JSON.stringify(failed, null, 2),
    'utf8'
  );

  if (!dryRun) {
    await fs.writeFile(STATIC_OUT, JSON.stringify(merged, null, 2), 'utf8');
    await fs.writeFile(
      path.join(OUTPUT_DIR, `apify_import_backup_${day}.json`),
      JSON.stringify(merged, null, 2),
      'utf8'
    );
  }

  console.log(`Done. processed=${slice.length} added=${added} skipped_dup=${skipped} failed=${failed.length}`);
  console.log(`Failures → scripts/output/apify_import_failed_${day}.json`);
  if (dryRun) {
    console.log('Dry run: did not write yandexMonuments.static.json');
  } else {
    console.log(`Written → ${path.relative(ROOT, STATIC_OUT)}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
