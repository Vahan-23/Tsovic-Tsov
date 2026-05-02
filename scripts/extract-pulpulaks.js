const fs = require('fs');
const path = require('path');
const j = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../src/data/export.geojson'), 'utf8')
);
const out = [];
for (const f of j.features || []) {
  const p = f.properties || {};
  if (p.memorial !== 'pulpulak') continue;
  const g = f.geometry;
  if (!g || g.type !== 'Point') continue;
  const [lon, lat] = g.coordinates;
  if (lat < 40.12 || lat > 40.24 || lon < 44.45 || lon > 44.58) continue;
  const rawId = p['@id'] || f.id || '';
  const id = String(rawId).includes('/') ? String(rawId) : `node/${rawId}`;
  const name = p.name || p['name:hy'] || p['name:en'] || 'Պուլպուլակ';
  out.push({
    id,
    name: String(name),
    latitude: lat,
    longitude: lon,
    sortOrder: out.length,
  });
}
const header = `/** Drinking fountains (pulpulak) around Yerevan — from OSM export.geojson */\n`;
fs.writeFileSync(
  path.join(__dirname, '../src/data/pulpulaks.js'),
  `${header}export const PULPULAK_POINTS = ${JSON.stringify(out, null, 2)};\n`
);
console.log('wrote', out.length, 'pulpulaks');
