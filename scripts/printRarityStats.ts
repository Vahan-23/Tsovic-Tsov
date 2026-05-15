/**
 * Print tier I/II/III lists for bundled catalog.
 * Run: npx tsx scripts/printRarityStats.ts
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { figures as bundledFigures } from '../src/data/figures';
import {
  computeStatueRarity,
  RARITY_TIER1,
  RARITY_TIER2,
  RARITY_TIER3,
} from '../src/utils/statueRarity';
import {
  TIER3_MIN_RATING,
  TIER3_MIN_RATING_COUNT,
} from '../src/constants/statueRarity';

function label(f: (typeof bundledFigures)[0]) {
  return f.name_hy || f.name_ru || f.name_en || f.displayName || f.id;
}

const byTier = { 1: [] as typeof bundledFigures, 2: [], 3: [] };
for (const f of bundledFigures) {
  const tier = computeStatueRarity(f);
  byTier[tier as 1 | 2 | 3].push(f);
}

console.log('Bundled figures:', bundledFigures.length);
console.log('Tier I (generic name):', byTier[1].length);
console.log('Tier II (named):', byTier[2].length);
console.log('Tier III (famous, auto):', byTier[3].length);
console.log(
  `Tier III rule: curatedKey OR rating≥${TIER3_MIN_RATING} & reviews≥${TIER3_MIN_RATING_COUNT}\n`
);

const tier3Sorted = [...byTier[3]].sort((a, b) => {
  const ca = Number(a.rating_count) || 0;
  const cb = Number(b.rating_count) || 0;
  return cb - ca;
});

console.log('=== TIER III (full list) ===');
for (const f of tier3Sorted) {
  const rc = f.rating_count != null ? ` · ${f.rating_count} отз., ★${f.rating}` : '';
  const src = f.curatedKey ? 'curated' : 'yandex';
  console.log(`- ${label(f)} (${f.id}) [${src}]${rc}`);
}

const lines: string[] = [
  '# Rarity report (bundled catalog)',
  '',
  `Total: ${bundledFigures.length}`,
  `- Tier I: ${byTier[1].length}`,
  `- Tier II: ${byTier[2].length}`,
  `- Tier III: ${byTier[3].length}`,
  '',
  `Tier III: curatedKey OR (rating >= ${TIER3_MIN_RATING} AND rating_count >= ${TIER3_MIN_RATING_COUNT})`,
  '',
  '## Tier III',
  ...tier3Sorted.map((f) => {
    const rc =
      f.rating_count != null ? ` (${f.rating_count} reviews, ${f.rating}★)` : '';
    return `- ${label(f)} — \`${f.id}\`${rc}`;
  }),
  '',
  '## Tier I (sample, first 30)',
  ...byTier[1].slice(0, 30).map((f) => `- ${label(f)} — \`${f.id}\``),
];

const outPath = join(process.cwd(), 'docs', 'rarity-report.md');
writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log(`\nWritten: ${outPath}`);
