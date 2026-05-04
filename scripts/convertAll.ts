/**
 * Resolve coordinates for every Apify row by opening each Yandex Maps org URL
 * in Chromium (Playwright), waiting for JS-driven map state, then reading ll=
 * from the URL or embedded coordinates in HTML / window state.
 *
 * Input:  src/data/apify_export.json
 * Coords: Prefer src/data/STATUES.json — match by placeId (= org id from URL). Same source
 *          Apify uses; location.lat/lng is the POI pin (accurate). Playwright only for gaps.
 * Output: src/data/yandexMonuments.static.json (full replace — one entry per Apify row)
 *         scripts/output/convert_all_backup_YYYY-MM-DD.json
 *
 * Run: npx tsx scripts/convertAll.ts
 *      npm run convert:all
 *
 * First-time setup: npx playwright install chromium
 */
import fs from 'node:fs/promises';
import path from 'node:path';

import type { BrowserContext, Page } from 'playwright';
import { chromium } from 'playwright';
import pLimit from 'p-limit';

const ROOT = process.cwd();

const INPUT = path.join(ROOT, 'src', 'data', 'apify_export.json');
const STATUES_PATH = path.join(ROOT, 'src', 'data', 'STATUES.json');
const STATIC_OUT = path.join(ROOT, 'src', 'data', 'yandexMonuments.static.json');
const OUTPUT_DIR = path.join(ROOT, 'scripts', 'output');

/** Concurrent org pages (shared browser context). */
const CONCURRENCY = 3;

const GOTO_OPTS = {
  waitUntil: 'domcontentloaded' as const,
  timeout: 30_000,
};

/** Poll URL/HTML while the SPA applies ll= to the location bar. */
const POLL_MS = 400;
const POLL_ATTEMPTS = 28;

type ApifyItem = {
  title: string;
  mainPhotoUrl?: string;
  categoryName?: string;
  totalScore?: number;
  reviewsCount?: number;
  address?: string;
  url: string;
};

type FigureRow = {
  id: string;
  name: string;
  name_en: string;
  name_ru: string;
  name_hy: string;
  latitude: number | null;
  longitude: number | null;
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

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractOrgId(url: string): string | null {
  const m = url.match(/\/org\/(\d+)/);
  return m?.[1] ?? null;
}

function normalizeMapsUrl(url: string): string {
  let u = url.trim();
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  return u;
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

function round1(n: number | undefined): number | null {
  if (n == null || !Number.isFinite(Number(n))) return null;
  return Math.round(Number(n) * 10) / 10;
}

/** Yerevan area — detect order when JSON uses [lat,lon] vs [lon,lat]. */
function isArmeniaLatLon(lat: number, lon: number): boolean {
  return lat >= 38.5 && lat <= 41.65 && lon >= 43.35 && lon <= 46.85;
}

/** Interpret two numbers as either (lon,lat) or (lat,lon) if they fall in Armenia. */
function pairFromLlParts(a: number, b: number): { lon: number; lat: number } | null {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  if (isArmeniaLatLon(b, a)) return { lon: a, lat: b };
  if (isArmeniaLatLon(a, b)) return { lon: b, lat: a };
  return null;
}

function parseLlFromUrlString(urlString: string): { lon: number; lat: number } | null {
  try {
    const u = new URL(urlString);
    let ll = u.searchParams.get('ll');
    if (!ll) {
      const m = urlString.match(/[?&#]ll=([^&]+)/);
      if (m) ll = decodeURIComponent(m[1]);
    }
    if (!ll) return null;
    const normalized = decodeURIComponent(ll);
    const parts = normalized.split(/[,~]/).map((s) => parseFloat(s.trim()));
    if (
      parts.length >= 2 &&
      Number.isFinite(parts[0]) &&
      Number.isFinite(parts[1])
    ) {
      const p = pairFromLlParts(parts[0], parts[1]);
      if (p) return p;
      return { lon: parts[0], lat: parts[1] };
    }
  } catch {
    return null;
  }
  return null;
}

/** Find every ll=… in a long string (HTML or URL). */
function parseLlFromAnyText(text: string): { lon: number; lat: number } | null {
  const re = /[?&#]ll=([\d.,%~+-]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const raw = decodeURIComponent(m[1].replace(/\+/g, ' '));
    const parts = raw.split(/[,~]/).map((s) => parseFloat(s.trim()));
    if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
      const p = pairFromLlParts(parts[0], parts[1]);
      if (p) return p;
      const q = pairFromLlParts(parts[1], parts[0]);
      if (q) return q;
    }
  }
  return null;
}

function parseCoordsFromHtml(html: string): { lon: number; lat: number } | null {
  const fromLl = parseLlFromAnyText(html);
  if (fromLl) return fromLl;

  const patterns = [
    /"coordinates"\s*:\s*\[\s*([\d.+-]+)\s*,\s*([\d.+-]+)\s*\]/g,
    /"center"\s*:\s*\[\s*([\d.+-]+)\s*,\s*([\d.+-]+)\s*\]/g,
    /pos["']?\s*:\s*["']([\d.+-]+)\s+([\d.+-]+)["']/g,
  ];

  const candidates: { lon: number; lat: number }[] = [];

  for (const re of patterns) {
    for (const mm of html.matchAll(re)) {
      const x = Number(mm[1]);
      const y = Number(mm[2]);
      const p = pairFromLlParts(x, y);
      if (p) candidates.push(p);
      else if (Number.isFinite(x) && Number.isFinite(y)) {
        candidates.push({ lon: x, lat: y });
      }
    }
  }

  for (const c of candidates) {
    if (isArmeniaLatLon(c.lat, c.lon)) return c;
  }
  return candidates[0] ?? null;
}

function candidateUrls(original: string, orgId: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (u: string) => {
    const n = normalizeMapsUrl(u);
    if (!seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  };
  add(original);
  add(`https://yandex.ru/maps/org/${orgId}/`);
  add(`https://yandex.com/maps/org/${orgId}/`);
  add(`https://yandex.ru/maps/org/${orgId}/?lang=ru`);
  return out;
}

function llPairToLatLon(p: { lon: number; lat: number }): { lat: number; lon: number } {
  return { lat: p.lat, lon: p.lon };
}

/** Serialize likely global state blobs in page for server-side regex parsing. */
async function scrapeExtraCoordText(page: Page): Promise<string> {
  return page.evaluate(() => {
    const chunks: string[] = [];
    const keys = [
      '__redux_state__',
      '__INITIAL_STATE__',
      '__initialState__',
      '__serverState__',
      '__PRELOADED_STATE__',
    ];
    for (const k of keys) {
      const v = (window as unknown as Record<string, unknown>)[k];
      if (v != null) {
        try {
          chunks.push(JSON.stringify(v));
        } catch {
          /* ignore */
        }
      }
    }
    const canon = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
    if (canon) chunks.push(canon);
    const og = document.querySelector('meta[property="og:url"]')?.getAttribute('content');
    if (og) chunks.push(og);
    return chunks.join('\n');
  });
}

async function extractCoordsFromLoadedPage(
  page: Page
): Promise<{ lat: number; lon: number } | null> {
  for (let i = 0; i < POLL_ATTEMPTS; i++) {
    const u = page.url();
    let p = parseLlFromUrlString(u) ?? parseLlFromAnyText(u);
    if (p) return llPairToLatLon(p);
    await sleep(POLL_MS);
  }

  const html = await page.content();
  let p = parseLlFromAnyText(html) ?? parseCoordsFromHtml(html);
  if (p) return llPairToLatLon(p);

  const extra = await scrapeExtraCoordText(page);
  p = parseLlFromAnyText(extra) ?? parseCoordsFromHtml(extra);
  if (p) return llPairToLatLon(p);

  return null;
}

async function coordsFromMapsUrl(
  context: BrowserContext,
  mapsUrl: string
): Promise<{ lat: number; lon: number } | null> {
  const page = await context.newPage();
  try {
    await page.goto(mapsUrl, GOTO_OPTS);
    return await extractCoordsFromLoadedPage(page);
  } catch {
    return null;
  } finally {
    await page.close();
  }
}

async function getCoordsFromYandexUrl(
  context: BrowserContext,
  originalUrl: string,
  orgId: string
): Promise<{ lat: number; lon: number } | null> {
  const urls = candidateUrls(originalUrl, orgId);

  const runPass = async (): Promise<{ lat: number; lon: number } | null> => {
    for (const u of urls) {
      const c = await coordsFromMapsUrl(context, u);
      if (c) return c;
    }
    return null;
  };

  let out = await runPass();
  if (!out) {
    await sleep(2000);
    out = await runPass();
  }
  return out;
}

function formatCoordShort(lat: number, lon: number): string {
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

function pad(n: number, w: number): string {
  return String(n).padStart(w, ' ');
}

type StatuesJsonRow = {
  placeId?: string;
  location?: { lat?: number; lng?: number };
};

/** placeId → pin from full Apify/STATUES export (authoritative vs map viewport ll=). */
async function loadStatuesCoordIndex(): Promise<
  Map<string, { lat: number; lng: number }>
> {
  const map = new Map<string, { lat: number; lng: number }>();
  let raw: string;
  try {
    raw = await fs.readFile(STATUES_PATH, 'utf8');
  } catch {
    console.warn(
      `No ${path.relative(ROOT, STATUES_PATH)} — using Playwright for all orgs.`
    );
    return map;
  }
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.warn('STATUES.json parse error — ignoring.', e);
    return map;
  }
  if (!Array.isArray(data)) return map;
  for (const row of data as StatuesJsonRow[]) {
    const pid = row.placeId != null ? String(row.placeId).trim() : '';
    const lat = row.location?.lat;
    const lng = row.location?.lng;
    if (!pid || typeof lat !== 'number' || typeof lng !== 'number') continue;
    if (!map.has(pid)) map.set(pid, { lat, lng });
  }
  console.log(
    `Loaded ${map.size} placeId → location pairs from ${path.relative(ROOT, STATUES_PATH)}`
  );
  return map;
}

function mainRow(
  item: ApifyItem,
  orgId: string | null,
  coords: { lat: number; lon: number } | null,
  index1: number
): FigureRow {
  const title = (item.title || '').trim() || 'Monument';
  const base = {
    name: title,
    name_en: title,
    name_ru: title,
    name_hy: title,
    category: detectCategory(item.categoryName, item.title),
    city: detectCity(item.address || ''),
    address: item.address ?? null,
    description: null,
    rating: round1(item.totalScore),
    rating_count:
      item.reviewsCount != null ? Number(item.reviewsCount) : null,
    image: item.mainPhotoUrl ?? null,
    hasQR: false,
    collectedAt: new Date().toISOString(),
  };

  if (!orgId) {
    return {
      ...base,
      id: `yandex_unknown_${index1}`,
      latitude: null,
      longitude: null,
      place_id: null,
    };
  }

  return {
    ...base,
    id: `yandex_${orgId}`,
    latitude: coords?.lat ?? null,
    longitude: coords?.lon ?? null,
    place_id: orgId,
  };
}

async function main() {
  const raw = await fs.readFile(INPUT, 'utf8');
  const items = JSON.parse(raw) as ApifyItem[];
  if (!Array.isArray(items)) {
    console.error('Expected JSON array at', INPUT);
    process.exit(1);
  }

  const statuesCoords = await loadStatuesCoordIndex();

  const total = items.length;
  const outRows: FigureRow[] = new Array(total);

  const needsBrowser = items.some((item) => {
    const id = extractOrgId(item.url);
    return Boolean(id && !statuesCoords.has(id));
  });

  const browser = needsBrowser
    ? await chromium.launch({
        headless: true,
        args: ['--disable-dev-shm-usage'],
      })
    : null;
  const context = browser
    ? await browser.newContext({
        userAgent: UA,
        locale: 'ru-RU',
      })
    : null;

  if (!needsBrowser) {
    console.log('All org ids found in STATUES.json — skipping Chromium.\n');
  }

  const limit = pLimit(CONCURRENCY);

  try {
    await Promise.all(
      items.map((item, idx) =>
        limit(async () => {
          const i = idx + 1;
          const orgId = extractOrgId(item.url);
          const titleShort = (item.title || '').slice(0, 52);

          if (!orgId) {
            outRows[idx] = mainRow(item, null, null, i);
            console.log(
              `[${pad(i, 4)}/${total}] ⚠️  no org id in url → ${titleShort}`
            );
            return;
          }

          const pin = statuesCoords.get(orgId);
          let coords: { lat: number; lon: number } | null = pin
            ? { lat: pin.lat, lon: pin.lng }
            : null;

          if (!coords && context) {
            coords = await getCoordsFromYandexUrl(context, item.url, orgId);
          }

          if (coords) {
            outRows[idx] = mainRow(item, orgId, coords, i);
            const tag = pin ? 'STATUES' : 'maps';
            console.log(
              `[${pad(i, 4)}/${total}] ✅ ${titleShort} → ${tag} ${formatCoordShort(coords.lat, coords.lon)}`
            );
          } else {
            outRows[idx] = mainRow(item, orgId, null, i);
            console.log(
              `[${pad(i, 4)}/${total}] ⚠️  no coords → ${titleShort}`
            );
          }
        })
      )
    );
  } finally {
    if (browser) await browser.close();
  }

  const withCoords = outRows.filter((r) => r.latitude != null).length;
  const withoutCoords = total - withCoords;

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const day = new Date().toISOString().slice(0, 10);
  await fs.writeFile(STATIC_OUT, JSON.stringify(outRows, null, 2), 'utf8');
  await fs.writeFile(
    path.join(OUTPUT_DIR, `convert_all_backup_${day}.json`),
    JSON.stringify(outRows, null, 2),
    'utf8'
  );

  console.log('');
  console.log(
    `✅ ${total} total | ${withCoords} with coords | ${withoutCoords} without`
  );
  console.log(`Written → ${path.relative(ROOT, STATIC_OUT)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
