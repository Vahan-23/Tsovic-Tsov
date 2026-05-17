/**
 * Local GLB assets for monument detail 3D previews (bundled; server later).
 */
export const MONUMENT_GLB_ASSETS = {
  mother_armenia: require('../../assets/3Dmodels/MAYR_HAYASTAN.glb'),
  sasuntsi_davit: require('../../assets/3Dmodels/SASUNCI_DAVIT.glb'),
  tumanyan: require('../../assets/3Dmodels/HOVHANNES_TUMANYAN.glb'),
  komitas: require('../../assets/3Dmodels/KOMITAS.glb'),
  sayat_nova: require('../../assets/3Dmodels/SAYAT_NOVA.glb'),
};

/**
 * Post-fit tuning (fractions of radius unless noted).
 * initialRotationY — extra yaw in radians on top of auto front-facing.
 */
export const MONUMENT_GLB_VIEW_TUNING = {
  mother_armenia: { x: -0.12, y: 0, z: 0, initialRotationY: Math.PI },
};

/**
 * @param {string | null | undefined} cardId
 */
export function getMonumentGlbViewTuning(cardId) {
  if (!cardId) return null;
  return MONUMENT_GLB_VIEW_TUNING[cardId] ?? null;
}

/** @type {Set<string>} */
export const MONUMENT_CARD_IDS_WITH_GLB = new Set(Object.keys(MONUMENT_GLB_ASSETS));

/**
 * @param {string | null | undefined} cardId
 * @returns {number | null}
 */
export function getMonumentGlbAsset(cardId) {
  if (!cardId) return null;
  return MONUMENT_GLB_ASSETS[cardId] ?? null;
}

/**
 * @param {string | null | undefined} cardId
 */
export function monumentHasGlbPreview(cardId) {
  return cardId != null && MONUMENT_CARD_IDS_WITH_GLB.has(cardId);
}
