import {
  CURATED_STATUE_PROFILES,
  resolveFigureOsmId,
} from '../data/curatedStatueProfiles';
import {
  TIER3_MIN_RATING,
  TIER3_MIN_RATING_COUNT,
} from '../constants/statueRarity';

/** @typedef {1 | 2 | 3} StatueRarity */

export const RARITY_TIER1 = 1;
export const RARITY_TIER2 = 2;
export const RARITY_TIER3 = 3;

/** Single-word / phrase labels with no specific subject. */
const GENERIC_TOKENS = new Set([
  'monument',
  'memorial',
  'statue',
  'sculpture',
  'artwork',
  'historic',
  'memorial plaque',
  'monument memorial',
  'հուշարձան',
  'արձան',
  'հուշանշան',
  'քանդակ',
  'հուշապատ',
  'հուշահամալիր',
  'памятник',
  'мемориал',
  'скульптура',
  'статуя',
  'мемориальная доска',
  'достопримечательность',
]);

function normalizeNameToken(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ',');
}

function splitLabelParts(normalized) {
  return normalized
    .split(/[,;|/·]+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function isGenericToken(part) {
  const p = part.trim();
  if (!p) return true;
  if (GENERIC_TOKENS.has(p)) return true;
  if (/^(monument|memorial|statue|sculpture|памятник|мемориал|հուշարձան|արձան|հուշահամալիր)\s*\d*$/i.test(p)) {
    return true;
  }
  return false;
}

/**
 * True when the label is only generic words, e.g. "Памятник, мемориал" / "Հուշարձան, հուշահամալիր".
 */
function isGenericMonumentLabel(normalized) {
  if (!normalized) return true;
  if (normalized.length < 3) return true;
  if (/^\d+$/.test(normalized)) return true;
  if (GENERIC_TOKENS.has(normalized)) return true;

  const parts = splitLabelParts(normalized);
  if (parts.length > 1) {
    return parts.every(isGenericToken);
  }

  if (isGenericToken(normalized)) return true;

  /** "Monument to …" / "Памятник …" — generic prefix + specific subject. */
  const prefixMatch = normalized.match(
    /^(monument|memorial|statue|sculpture|памятник|мемориал|հուշարձան|արձան|քանդակ)\s+(?:to|dedicated to|in honor of|посвященный|посвящённый|նվիրված)?\s*(.+)$/i
  );
  if (prefixMatch) {
    const subject = prefixMatch[2].trim();
    return !subject || isGenericToken(subject) || subject.length < 3;
  }

  /** "Памятник Гарегину Нжде" — one generic word + real name. */
  const stripped = normalized.replace(
    /^(monument|memorial|statue|памятник|мемориал|հուշարձան|արձան)\s+/i,
    ''
  );
  if (stripped !== normalized) {
    return !stripped || isGenericToken(stripped) || stripped.length < 3;
  }

  return false;
}

const NAME_FIELDS = ['name_hy', 'name_ru', 'name_en', 'name', 'displayName'];

/**
 * Tier 2: at least one locale has a specific name (not only "памятник / monument").
 */
export function hasPreciseName(figure) {
  if (!figure) return false;
  for (const key of NAME_FIELDS) {
    const raw = figure[key];
    const t = String(raw ?? '').trim();
    if (!t) continue;
    if (!isGenericMonumentLabel(normalizeNameToken(t))) return true;
  }
  return false;
}

function isCuratedFamous(figure) {
  if (figure?.curatedKey) return true;
  const osm = resolveFigureOsmId(figure);
  return Number.isFinite(osm) && Object.hasOwn(CURATED_STATUE_PROFILES, osm);
}

export function isTier3Figure(figure) {
  if (!figure) return false;
  if (isCuratedFamous(figure)) return true;

  const rating = Number(figure.rating);
  const ratingCount = Number(figure.rating_count);
  if (
    Number.isFinite(rating) &&
    Number.isFinite(ratingCount) &&
    rating >= TIER3_MIN_RATING &&
    ratingCount >= TIER3_MIN_RATING_COUNT
  ) {
    return true;
  }

  return false;
}

/**
 * @param {object | null | undefined} figure
 * @returns {StatueRarity}
 */
export function computeStatueRarity(figure) {
  if (!figure) return RARITY_TIER1;
  if (isTier3Figure(figure)) return RARITY_TIER3;
  if (hasPreciseName(figure)) return RARITY_TIER2;
  return RARITY_TIER1;
}

export function rarityI18nKey(tier) {
  if (tier === RARITY_TIER3) return 'rarityTier3';
  if (tier === RARITY_TIER2) return 'rarityTier2';
  return 'rarityTier1';
}

export function rarityShortLabel(tier) {
  if (tier === RARITY_TIER3) return 'III';
  if (tier === RARITY_TIER2) return 'II';
  return 'I';
}

export function rarityBorderColor(tier, colors) {
  if (tier === RARITY_TIER3) return '#C9A020';
  if (tier === RARITY_TIER2) return colors.primary ?? '#5B63E8';
  return colors.borderMuted ?? '#94A3B8';
}

export function rarityAccentColor(tier) {
  if (tier === RARITY_TIER3) return '#C9A020';
  if (tier === RARITY_TIER2) return '#60A5FA';
  return '#94A3B8';
}
