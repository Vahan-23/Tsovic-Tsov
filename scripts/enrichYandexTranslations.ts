/**
 * Fill name_ru / name_hy / name_en for yandexMonuments.static.json using machine
 * translation (ru → hy, ru → en). Caches by place_id under scripts/output/.
 *
 * Run: npx tsx scripts/enrichYandexTranslations.ts
 *      npx tsx scripts/enrichYandexTranslations.ts --limit 20   (smoke test)
 *      npx tsx scripts/enrichYandexTranslations.ts --force       (retranslate all)
 *
 * Uses LibreTranslate public mirrors first, then MyMemory as fallback.
 * Quality is MT-only — edit src/data/monumentTitleOverrides.json to fix important names.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const STATIC = path.join(ROOT, 'src', 'data', 'yandexMonuments.static.json');
const CACHE_PATH = path.join(ROOT, 'scripts', 'output', 'translation_place_cache.json');
const OVERRIDES_PATH = path.join(ROOT, 'src', 'data', 'monumentTitleOverrides.json');

const LIBRE_ENDPOINTS = [
  'https://libretranslate.com/translate',
  'https://translate.argosopentech.com/translate',
];

const MYMEMORY = 'https://api.mymemory.translated.net/get';

type Row = Record<string, unknown> & {
  id?: string;
  place_id?: string | null;
  name?: string;
  name_en?: string;
  name_ru?: string;
  name_hy?: string;
};

type CacheMap = Record<string, { hy: string; en: string }>;

type OverridesMap = Record<string, { name_hy?: string; name_en?: string }>;

const ARMENIAN_RE = /[\u0530-\u058F\uFB10-\uFB17]/;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseArgs() {
  const argv = process.argv.slice(2);
  let limit: number | null = null;
  let force = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--limit' && argv[i + 1]) {
      limit = Number(argv[i + 1]);
      i++;
    } else if (argv[i] === '--force') {
      force = true;
    }
  }
  return { limit: limit != null && Number.isFinite(limit) ? limit : null, force };
}

async function loadJson<T>(p: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(p, 'utf8');
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

async function libreTranslate(
  text: string,
  target: 'hy' | 'en'
): Promise<string | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const body = JSON.stringify({
    q: trimmed,
    source: 'ru',
    target,
    format: 'text',
  });
  for (const url of LIBRE_ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      if (!res.ok) continue;
      const data = (await res.json()) as { translatedText?: string };
      if (data.translatedText && data.translatedText.trim()) {
        return data.translatedText.trim();
      }
    } catch {
      /* try next endpoint */
    }
  }
  return null;
}

async function mymemoryTranslate(
  text: string,
  target: 'hy' | 'en'
): Promise<string | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const pair = target === 'hy' ? 'ru|hy' : 'ru|en';
  const q = encodeURIComponent(trimmed.slice(0, 450));
  const email = process.env.MYMEMORY_EMAIL
    ? `&de=${encodeURIComponent(process.env.MYMEMORY_EMAIL)}`
    : '';
  try {
    const url = `${MYMEMORY}?q=${q}&langpair=${pair}${email}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      responseData?: { translatedText?: string };
      responseStatus?: number;
    };
    const t = data.responseData?.translatedText?.trim();
    if (t && data.responseStatus !== 403) return t;
  } catch {
    return null;
  }
  return null;
}

async function translatePair(ru: string): Promise<{ hy: string; en: string }> {
  let hy = (await libreTranslate(ru, 'hy')) ?? (await mymemoryTranslate(ru, 'hy'));
  await sleep(450);
  let en = (await libreTranslate(ru, 'en')) ?? (await mymemoryTranslate(ru, 'en'));
  await sleep(450);
  const src = ru.trim();
  return {
    hy: hy || src,
    en: en || src,
  };
}

function rowNeedsWork(row: Row, ru: string, force: boolean): boolean {
  if (force) return true;
  const hy = String(row.name_hy ?? '').trim();
  const en = String(row.name_en ?? '').trim();
  if (!ARMENIAN_RE.test(hy)) return true;
  if (!en || en === ru) return true;
  return false;
}

async function main() {
  const { limit, force } = parseArgs();
  const rows = (await loadJson<Row[]>(STATIC, [])) as Row[];
  if (!Array.isArray(rows) || rows.length === 0) {
    console.error('No data at', STATIC);
    process.exit(1);
  }

  await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true });
  const cache = await loadJson<CacheMap>(CACHE_PATH, {});
  const overrides = await loadJson<OverridesMap>(OVERRIDES_PATH, {});

  const byPlace = new Map<string, Row[]>();
  for (const row of rows) {
    const pid = row.place_id != null ? String(row.place_id).trim() : '';
    if (!pid) continue;
    if (!byPlace.has(pid)) byPlace.set(pid, []);
    byPlace.get(pid)!.push(row);
  }

  const uniqueIds = [...byPlace.keys()];
  const toProcess = uniqueIds.filter((pid) => {
    const sample = byPlace.get(pid)![0];
    const ru = String(sample.name_ru || sample.name || '').trim() || 'Monument';
    const ov = overrides[pid];
    if (ov?.name_hy && ov?.name_en) return false;
    return rowNeedsWork(sample, ru, force);
  });

  let todo = toProcess;
  if (limit != null) {
    todo = toProcess.slice(0, limit);
    console.log(`Limit ${limit}: processing ${todo.length} / ${toProcess.length} place_ids needing work.`);
  } else {
    console.log(`Place_ids to translate: ${todo.length} (of ${uniqueIds.length} unique ids).`);
  }

  let done = 0;
  for (const pid of todo) {
    const sample = byPlace.get(pid)![0];
    const ru = String(sample.name_ru || sample.name || '').trim() || 'Monument';
    const ov = overrides[pid];

    let hy = ov?.name_hy?.trim();
    let en = ov?.name_en?.trim();

    if (cache[pid] && !force) {
      hy = hy || cache[pid].hy;
      en = en || cache[pid].en;
    }

    const needMtHy = force || !hy || !ARMENIAN_RE.test(hy || '');
    const needMtEn = force || !en || en.trim() === ru;

    if (needMtHy || needMtEn) {
      const pair = await translatePair(ru);
      if (needMtHy) hy = pair.hy;
      if (needMtEn) en = pair.en;
      hy = hy || pair.hy;
      en = en || pair.en;
      cache[pid] = { hy: hy || ru, en: en || ru };
      await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf8');
    }

    const name_ru = ru;
    const name_hy = hy || ru;
    const name_en = en || ru;

    for (const row of byPlace.get(pid)!) {
      row.name_ru = name_ru;
      row.name_hy = name_hy;
      row.name_en = name_en;
      row.name = name_en;
    }

    done += 1;
    console.log(`[${done}/${todo.length}] ${pid} → HY: ${name_hy.slice(0, 48)}`);
  }

  await fs.writeFile(STATIC, JSON.stringify(rows, null, 2), 'utf8');
  console.log(`\nWritten ${STATIC}`);
  console.log(`Cache: ${path.relative(ROOT, CACHE_PATH)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
