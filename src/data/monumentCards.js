/**
 * Rich monument “cards” — match by figure id, place_id, or curatedKey.
 * Copy lives in i18n: card_<id>_story, _why, _fact_* , etc.
 */

/** @typedef {{ figureIds?: string[], placeIds?: string[], curatedKeys?: string[], unveiledYear?: number | null, factSlots?: string[] }} MonumentCardDef */

/** @type {Record<string, MonumentCardDef>} */
export const MONUMENT_CARDS = {
  mother_armenia: {
    figureIds: ['yandex_168482256368', 'yandex_151541075321'],
    placeIds: ['168482256368', '151541075321'],
    unveiledYear: 1967,
    factSlots: ['unveiled', 'author', 'commissioned', 'scale'],
  },
  sasuntsi_davit: {
    figureIds: ['yandex_227358283197'],
    placeIds: ['227358283197'],
    unveiledYear: 1959,
    factSlots: ['unveiled', 'author', 'commissioned', 'scale'],
  },
  tsitsernakaberd: {
    figureIds: ['yandex_59413050059'],
    placeIds: ['59413050059'],
    unveiledYear: 1967,
    factSlots: ['unveiled', 'author', 'commissioned', 'scale'],
  },
  republic_square: {
    figureIds: ['yandex_214668502956'],
    placeIds: ['214668502956'],
    unveiledYear: 1977,
    factSlots: ['unveiled', 'author', 'commissioned', 'scale'],
  },
  revived_armenia: {
    figureIds: ['yandex_40181359886'],
    placeIds: ['40181359886'],
    unveiledYear: 1967,
    factSlots: ['unveiled', 'author', 'commissioned', 'scale'],
  },
  iron_fountain: {
    figureIds: ['yandex_63392025661'],
    placeIds: ['63392025661'],
    unveiledYear: 1982,
    factSlots: ['unveiled', 'author', 'commissioned', 'scale'],
  },
  vardan_mamikonyan: {
    figureIds: ['yandex_238553220746'],
    placeIds: ['238553220746'],
    unveiledYear: 1975,
    factSlots: ['unveiled', 'author', 'commissioned', 'scale'],
  },
  abovyan: {
    curatedKeys: ['abovyan'],
    unveiledYear: 1950,
    factSlots: ['unveiled', 'author', 'commissioned', 'life'],
  },
  komitas: {
    curatedKeys: ['komitas'],
    unveiledYear: 1988,
    factSlots: ['unveiled', 'author', 'commissioned', 'life'],
  },
  tumanyan: {
    curatedKeys: ['tumanyan'],
    unveiledYear: 1957,
    factSlots: ['unveiled', 'author', 'commissioned', 'life'],
  },
  sayat_nova: {
    curatedKeys: ['sayat_nova'],
    unveiledYear: 1963,
    factSlots: ['unveiled', 'author', 'commissioned', 'life'],
  },
  charents: {
    curatedKeys: ['charents'],
    unveiledYear: 1985,
    factSlots: ['unveiled', 'author', 'commissioned', 'life'],
  },
};

const INDEX = (() => {
  /** @type {Map<string, string>} */
  const byFigureId = new Map();
  /** @type {Map<string, string>} */
  const byPlaceId = new Map();
  /** @type {Map<string, string>} */
  const byCurated = new Map();

  for (const [cardId, def] of Object.entries(MONUMENT_CARDS)) {
    for (const id of def.figureIds ?? []) byFigureId.set(String(id), cardId);
    for (const id of def.placeIds ?? []) byPlaceId.set(String(id), cardId);
    for (const k of def.curatedKeys ?? []) byCurated.set(String(k), cardId);
  }
  return { byFigureId, byPlaceId, byCurated };
})();

/**
 * @param {object | null | undefined} figure
 * @returns {string | null}
 */
export function resolveMonumentCardId(figure) {
  if (!figure) return null;
  const fid = String(figure.id ?? '').trim();
  if (fid && INDEX.byFigureId.has(fid)) return INDEX.byFigureId.get(fid);
  if (figure.place_id != null && INDEX.byPlaceId.has(String(figure.place_id))) {
    return INDEX.byPlaceId.get(String(figure.place_id));
  }
  if (figure.curatedKey && INDEX.byCurated.has(String(figure.curatedKey))) {
    return INDEX.byCurated.get(String(figure.curatedKey));
  }
  return null;
}

/**
 * @param {string | null} cardId
 * @returns {MonumentCardDef | null}
 */
export function getMonumentCardDef(cardId) {
  if (!cardId) return null;
  return MONUMENT_CARDS[cardId] ?? null;
}
