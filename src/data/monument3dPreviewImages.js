/**
 * Cutout PNG previews for 3D monuments (assets/3Dmodels/3DPNG/).
 * Add per-monument files later; until then collection uses DEFAULT_PREVIEW.
 */
import { resolveMonumentCardId } from './monumentCards';

/** Temporary stand-in for every collection tile. */
const DEFAULT_PREVIEW = require('../../assets/3Dmodels/3DPNG/Tumanyan.png');

/** @type {Record<string, number>} */
const BY_CARD_ID = {
  tumanyan: DEFAULT_PREVIEW,
};

/** Slug / linkedStatueId → card id */
const SLUG_TO_CARD_ID = {
  tumanyan: 'tumanyan',
  komitas: 'komitas',
  'sayat-nova': 'sayat_nova',
  sayat_nova: 'sayat_nova',
  abovyan: 'abovyan',
  charents: 'charents',
};

/**
 * @param {object | null | undefined} figure
 * @param {{ fillWithPlaceholder?: boolean }} [options]
 * @returns {number | null} require() for <Image source={...} />
 */
export function getMonument3dPreviewSource(figure, options = {}) {
  const { fillWithPlaceholder = false } = options;
  if (!figure) return null;

  const cardId = resolveMonumentCardId(figure);
  if (cardId && BY_CARD_ID[cardId]) return BY_CARD_ID[cardId];

  let slug = String(figure.linkedStatueId ?? figure.id ?? '').trim();
  if (slug.startsWith('3d-')) slug = slug.slice(3);
  const mapped = SLUG_TO_CARD_ID[slug];
  if (mapped && BY_CARD_ID[mapped]) return BY_CARD_ID[mapped];

  if (fillWithPlaceholder) return DEFAULT_PREVIEW;
  return null;
}

/**
 * @param {object | null | undefined} figure
 * @param {{ fillWithPlaceholder?: boolean }} [options]
 */
export function hasMonument3dPreview(figure, options = {}) {
  return getMonument3dPreviewSource(figure, options) != null;
}
