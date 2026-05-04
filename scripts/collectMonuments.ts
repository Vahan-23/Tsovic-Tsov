/**
 * One-time / incremental Yandex Maps Places (GeoSearch) collector.
 * Merges into src/data/yandexMonuments.static.json (append-only, deduped).
 * Run from repo root: `npm run collect:monuments`
 */
import { config as loadEnv } from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';

/** Project root — always load `.env` from here (tsx cwd can differ). */
const ROOT = process.cwd();
loadEnv({ path: path.join(ROOT, '.env') });
const OUTPUT_DIR = path.join(ROOT, 'scripts', 'output');
const STATIC_JSON = path.join(ROOT, 'src', 'data', 'yandexMonuments.static.json');

/** Keep in sync with FALLBACK_FIGURES in src/data/figures.js (dedupe only). */
const FALLBACK_MONUMENTS = [
  { id: 'abovyan', latitude: 40.1916418, longitude: 44.5281451 },
  { id: 'komitas', latitude: 40.1871993, longitude: 44.5162449 },
  { id: 'tumanyan', latitude: 40.1854189, longitude: 44.5147058 },
  { id: 'sayat-nova', latitude: 40.1878591, longitude: 44.5164671 },
  { id: 'charents', latitude: 40.1797924, longitude: 44.5246095 },
];

const queries = [
  'памятник Ереван',
  'статуя Ереван',
  'скульптура Ереван',
  'мемориал Ереван',
  'монумент Ереван',
  'бюст Ереван',
  'обелиск Ереван',
  'достопримечательность Ереван',
  'исторический памятник Ереван',
  'памятник Гюмри',
  'статуя Гюмри',
  'памятник Ванадзор',
  'памятник Армения',
  'monument Yerevan Armenia',
  'statue Yerevan Armenia',
  'memorial Yerevan Armenia',
];

const SEARCH_BASE = 'https://search-maps.yandex.ru/v1/';
const MIN_INTERVAL_MS = 210; // ~5 req/sec max
const RESULTS_PAGE = 50;

type YandexMonument = {
  id: string;
  name: string;
  name_en: string;
  latitude: number;
  longitude: number;
  category: string;
  city: string;
  address: string | null;
  description: string | null;
  rating: number | null;
  rating_count: number | null;
  place_id: string | null;
  image: null;
  hasQR: boolean;
  collectedAt: string;
};

function detectCategory(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('статуя') || n.includes('statue')) return 'statue';
  if (n.includes('мемориал') || n.includes('memorial')) return 'memorial';
  if (n.includes('скульптур')) return 'sculpture';
  if (n.includes('монумент') || n.includes('monument')) return 'monument';
  if (n.includes('бюст')) return 'bust';
  if (n.includes('обелиск')) return 'obelisk';
  return 'monument';
}

function detectCity(lat: number, lon: number): string {
  if (lat >= 40.05 && lat <= 40.25 && lon >= 44.35 && lon <= 44.65) return 'Ереван';
  if (lat >= 40.75 && lat <= 40.82 && lon >= 43.82 && lon <= 43.87) return 'Гюмри';
  if (lat >= 40.79 && lat <= 40.83 && lon >= 44.47 && lon <= 44.52) return 'Ванадзор';
  return 'Армения';
}

function roundCoordKey(lat: number, lon: number): string {
  return `${Math.round(lat * 10000) / 10000},${Math.round(lon * 10000) / 10000}`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Normalize key from .env (quotes, BOM, line breaks). */
function sanitizeYandexKey(raw: string | undefined): string {
  if (raw == null) return '';
  let s = String(raw).trim().replace(/^\uFEFF/, '');
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  s = s.replace(/\r/g, '').replace(/\s+/g, '');
  return s;
}

/**
 * GeoSearch `search-maps.yandex.ru` accepts only the **Organization search** product key.
 * The "JavaScript API + HTTP Geocoder" key returns 403 here — use a separate env var.
 */
function pickOrgSearchApiKeyFromEnv(): string {
  return sanitizeYandexKey(
    process.env.YANDEX_ORG_SEARCH_API_KEY ||
      process.env.YANDEX_PLACES_API_KEY ||
      process.env.YANDEX_GEOSEARCH_API_KEY
  );
}

function maskKey(k: string): string {
  if (!k) return '(empty)';
  if (k.length <= 10) return `(${k.length} chars)`;
  return `${k.slice(0, 4)}…${k.slice(-4)} (${k.length} chars)`;
}

function printInvalidKeyHelp(apikey: string, responseSnippet: string) {
  const hasReferer = Boolean(process.env.YANDEX_GEOSEARCH_REFERER?.trim());
  console.error('\n❌ Yandex GeoSearch (search-maps.yandex.ru) returned 403 Invalid API key.\n');
  console.error(
    'Нужен ключ пакета «API поиска по организациям» (Places / GeoSearch), не только «JS API + Геокодер».'
  );
  console.error('В .env: YANDEX_ORG_SEARCH_API_KEY=<UUID из кабинета для поиска по организациям>');
  console.error('');
  console.error('Частая причина 403 — ограничения ключа в https://developer.tech.yandex.com/ → ключ → Изменить:');
  console.error('  • «Домен» — для curl/Node нет Referer; задай в .env полный URL, как в кабинете:');
  console.error('      YANDEX_GEOSEARCH_REFERER=https://твой-домен.ru/');
  console.error('  • «IP» — добавь в кабинет внешний IP этого ПК (или сними ограничение для теста).');
  console.error('');
  console.error(
    `Сейчас Referer в запросах: ${hasReferer ? 'да (YANDEX_GEOSEARCH_REFERER)' : 'нет — если в кабинете указан домен, добавь YANDEX_GEOSEARCH_REFERER'}`
  );
  console.error('После смены ограничений в кабинете подождите до ~15 минут.');
  console.error(`Ключ (маска): ${maskKey(apikey)}`);
  if (responseSnippet) {
    console.error(`Ответ: ${responseSnippet.slice(0, 280)}\n`);
  }
}

/** Node не шлёт Referer; при ограничении «домен» в кабинете задай YANDEX_GEOSEARCH_REFERER. */
function geoSearchFetchInit(): RequestInit {
  const referer = process.env.YANDEX_GEOSEARCH_REFERER?.trim();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (referer) headers.Referer = referer;
  return { headers };
}

let lastReqAt = 0;
async function throttle() {
  const now = Date.now();
  const wait = lastReqAt + MIN_INTERVAL_MS - now;
  if (wait > 0) await sleep(wait);
  lastReqAt = Date.now();
}

async function fetchYandexPage(
  apikey: string,
  text: string,
  skip: number
): Promise<{ features: unknown[]; found?: number }> {
  const params = new URLSearchParams({
    apikey,
    text,
    type: 'biz',
    lang: 'ru_RU',
    ll: '44.5152,40.1872',
    spn: '0.5,0.5',
    results: String(RESULTS_PAGE),
    skip: String(skip),
  });
  const url = `${SEARCH_BASE}?${params.toString()}`;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await throttle();
    const res = await fetch(url, geoSearchFetchInit());
    if (res.status === 429) {
      await sleep(2000);
      continue;
    }
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${t.slice(0, 200)}`);
    }
    const data = (await res.json()) as {
      features?: unknown[];
      properties?: { ResponseMetaData?: { SearchResponse?: { found?: number } } };
    };
    const features = Array.isArray(data.features) ? data.features : [];
    const found = data.properties?.ResponseMetaData?.SearchResponse?.found;
    return { features, found };
  }
  throw new Error('Too many 429 retries');
}

function parseFeature(feature: unknown): YandexMonument | null {
  if (!feature || typeof feature !== 'object') return null;
  const f = feature as {
    properties?: Record<string, unknown>;
    geometry?: { coordinates?: number[] };
  };
  const props = f.properties;
  const coords = f.geometry?.coordinates;
  if (!props || !Array.isArray(coords) || coords.length < 2) return null;
  const lon = Number(coords[0]);
  const lat = Number(coords[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const cmd = (props.CompanyMetaData ?? props.companyMetaData) as
    | {
        id?: string;
        name?: string;
        address?: { formatted_address?: string };
        rating?: { score?: number; ratings?: number };
      }
    | undefined;

  const nameRaw =
    (typeof props.name === 'string' && props.name) ||
    (typeof cmd?.name === 'string' && cmd.name) ||
    'Monument';
  const placeId = cmd?.id != null ? String(cmd.id) : null;
  const id =
    placeId != null && placeId.length > 0
      ? `yandex_${placeId}`
      : `osm_${lat.toFixed(5)}_${lon.toFixed(5)}`;

  const addr = cmd?.address?.formatted_address ?? null;
  const descText =
    typeof props.description === 'string' ? props.description : null;
  const city = descText || detectCity(lat, lon);

  return {
    id,
    name: nameRaw,
    name_en: nameRaw,
    latitude: lat,
    longitude: lon,
    category: detectCategory(nameRaw),
    city,
    address: addr,
    description: null,
    rating:
      cmd?.rating?.score != null && Number.isFinite(Number(cmd.rating.score))
        ? Number(cmd.rating.score)
        : null,
    rating_count:
      cmd?.rating?.ratings != null && Number.isFinite(Number(cmd.rating.ratings))
        ? Number(cmd.rating.ratings)
        : null,
    place_id: placeId,
    image: null,
    hasQR: false,
    collectedAt: new Date().toISOString(),
  };
}

function buildDedupeKeys(existing: YandexMonument[]): {
  byPlace: Set<string>;
  byCoord: Set<string>;
} {
  const byPlace = new Set<string>();
  const byCoord = new Set<string>();
  for (const m of existing) {
    if (m.place_id) byPlace.add(String(m.place_id));
    byCoord.add(roundCoordKey(m.latitude, m.longitude));
  }
  for (const fb of FALLBACK_MONUMENTS) {
    byCoord.add(roundCoordKey(fb.latitude, fb.longitude));
    byPlace.add(String(fb.id));
  }
  return { byPlace, byCoord };
}

function countByCity(list: YandexMonument[]) {
  let y = 0,
    g = 0,
    v = 0,
    o = 0;
  for (const m of list) {
    const c = m.city;
    if (c === 'Ереван') y += 1;
    else if (c === 'Гюмри') g += 1;
    else if (c === 'Ванадзор') v += 1;
    else o += 1;
  }
  return { y, g, v, o };
}

async function probeGeoSearchKey(apikey: string): Promise<boolean> {
  const params = new URLSearchParams({
    apikey,
    text: 'Ереван',
    type: 'biz',
    lang: 'ru_RU',
    ll: '44.5152,40.1872',
    spn: '0.5,0.5',
    results: '1',
    skip: '0',
  });
  const url = `${SEARCH_BASE}?${params.toString()}`;
  await throttle();
  const res = await fetch(url, geoSearchFetchInit());
  const body = await res.text();
  if (res.status === 403) {
    printInvalidKeyHelp(apikey, body);
    return false;
  }
  if (!res.ok) {
    console.error(`Probe request failed: HTTP ${res.status}`, body.slice(0, 200));
    return false;
  }
  try {
    JSON.parse(body);
  } catch {
    console.error('Probe: response is not JSON (first 200 chars):', body.slice(0, 200));
    return false;
  }
  return true;
}

async function main() {
  const apikey = pickOrgSearchApiKeyFromEnv();
  if (!apikey) {
    console.error(
      [
        'Не найден ключ для GeoSearch (поиск организаций).',
        '',
        'В корневой .env добавь (UUID из кабинета «API поиска по организациям»):',
        '  YANDEX_ORG_SEARCH_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        '',
        'Не используй для этого скрипта только YANDEX_API_KEY от «JavaScript API и HTTP Геокодер» — будет 403.',
        `Файл: ${path.join(ROOT, '.env')}`,
      ].join('\n')
    );
    process.exit(1);
  }

  console.log(`🔑 Org-search key ${maskKey(apikey)} (YANDEX_ORG_SEARCH_API_KEY)`);
  console.log('🚀 Starting Yandex Places collection...');

  const keyOk = await probeGeoSearchKey(apikey);
  if (!keyOk) {
    process.exit(1);
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const rawFeatures: unknown[] = [];
  let qi = 0;
  for (const text of queries) {
    qi += 1;
    console.log(`📍 Query ${qi}/${queries.length}: ${text}`);
    let skip = 0;
    let page = 0;
    for (;;) {
      page += 1;
      let pageFeatures: unknown[] = [];
      try {
        const { features } = await fetchYandexPage(apikey, text, skip);
        pageFeatures = features;
      } catch (e) {
        console.warn(`   ⚠ Page ${page} error:`, (e as Error).message);
        break;
      }
      console.log(`   → Page ${page}: ${pageFeatures.length} results`);
      rawFeatures.push(...pageFeatures);
      if (pageFeatures.length === 0) {
        console.log(`   → Page ${page}: 0 results (done)`);
        break;
      }
      skip += pageFeatures.length;
      if (pageFeatures.length < RESULTS_PAGE) break;
    }
  }

  const parsed: YandexMonument[] = [];
  const seen = new Set<string>();
  for (const feat of rawFeatures) {
    const m = parseFeature(feat);
    if (!m) continue;
    const k = m.place_id
      ? `p:${m.place_id}`
      : `c:${roundCoordKey(m.latitude, m.longitude)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    parsed.push(m);
  }

  let existing: YandexMonument[] = [];
  try {
    const raw = await fs.readFile(STATIC_JSON, 'utf8');
    existing = JSON.parse(raw);
    if (!Array.isArray(existing)) existing = [];
  } catch {
    existing = [];
  }

  const { byPlace, byCoord } = buildDedupeKeys(existing);
  const toAdd: YandexMonument[] = [];
  let skipped = 0;
  for (const m of parsed) {
    const ck = roundCoordKey(m.latitude, m.longitude);
    if (m.place_id && byPlace.has(String(m.place_id))) {
      skipped += 1;
      continue;
    }
    if (byCoord.has(ck)) {
      skipped += 1;
      continue;
    }
    if (m.place_id) byPlace.add(String(m.place_id));
    byCoord.add(ck);
    toAdd.push(m);
  }

  const merged = [...existing, ...toAdd];
  await fs.writeFile(
    path.join(OUTPUT_DIR, 'monuments_raw.json'),
    JSON.stringify(rawFeatures, null, 2),
    'utf8'
  );
  await fs.writeFile(
    path.join(OUTPUT_DIR, 'monuments.json'),
    JSON.stringify(parsed, null, 2),
    'utf8'
  );
  await fs.writeFile(STATIC_JSON, JSON.stringify(merged, null, 2), 'utf8');

  const day = new Date().toISOString().slice(0, 10);
  const finalPath = path.join(OUTPUT_DIR, `monuments_final_${day}.json`);
  await fs.writeFile(finalPath, JSON.stringify(merged, null, 2), 'utf8');

  const cc = countByCity(merged);
  console.log('✅ Collection complete!');
  console.log(`📊 Total raw results: ${rawFeatures.length}`);
  console.log(`🔄 After deduplication (this run): ${parsed.length} unique monuments`);
  console.log(
    `🏙  Yerevan: ${cc.y} | Gyumri: ${cc.g} | Vanadzor: ${cc.v} | Other: ${cc.o}`
  );
  console.log(`📁 Existing in static JSON: ${existing.length}`);
  console.log(`➕ New to add: ${toAdd.length}`);
  console.log(`⏭  Skipped (already exist): ${skipped}`);
  console.log(`💾 Saved to ${path.relative(ROOT, STATIC_JSON)} (${merged.length} total entries now)`);
  console.log(`💾 Backup: ${path.relative(ROOT, finalPath)}`);
  console.log(
    `🎉 Done! App bundles offline catalog from yandexMonuments.static.json (${merged.length} monuments).`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
