/**
 * One-off: fetch OSM objects for Yerevan statues (run: node scripts/query-osm-statues.js)
 */
const Q = `
[out:json][timeout:90];
(
  nwr["man_made"="statue"](40.15,44.48,40.22,44.56);
  nwr["historic"="monument"](40.15,44.48,40.22,44.56);
  nwr["historic"="memorial"](40.15,44.48,40.22,44.56);
  nwr["tourism"="artwork"](40.15,44.48,40.22,44.56);
);
out center tags;
`;

async function postOverpass(url) {
  const body = `data=${encodeURIComponent(Q.trim())}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'TsovicTsovApp/1.0 (statue coordinate verification)',
    },
    body,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 400)}`);
  }
  return JSON.parse(text);
}

const NEEDLES = [
  'Komitas',
  'Կոմիտաս',
  'Tumanyan',
  'Թումանյան',
  'Sayat',
  'Սայաթ',
  'Abovyan',
  'Աբովյան',
  'Charents',
  'Չարենց',
];

(async () => {
  let j;
  try {
    j = await postOverpass('https://overpass-api.de/api/interpreter');
  } catch (e) {
    console.error('overpass-api.de failed:', e.message);
    j = await postOverpass('https://overpass.kumi.systems/api/interpreter');
  }
  const rows = [];
  for (const el of j.elements || []) {
    const t = el.tags || {};
    const blob = [t.name, t['name:hy'], t['name:en'], t['name:ru']]
      .filter(Boolean)
      .join(' | ');
    if (!blob) continue;
    const hit = NEEDLES.some((w) => blob.includes(w));
    if (!hit) continue;
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    rows.push({
      type: el.type,
      osmId: el.id,
      lat,
      lon,
      name_hy: t['name:hy'] || '',
      name_en: t['name:en'] || '',
      name: t.name || '',
      description: (t.description || '').slice(0, 300),
      man_made: t.man_made,
      historic: t.historic,
      tourism: t.tourism,
      artwork_type: t.artwork_type,
    });
  }
  rows.sort((a, b) => String(a.osmId).localeCompare(String(b.osmId)));
  console.log(JSON.stringify(rows, null, 2));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
