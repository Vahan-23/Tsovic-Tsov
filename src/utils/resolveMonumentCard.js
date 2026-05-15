import {
  getMonumentCardDef,
  resolveMonumentCardId,
} from '../data/monumentCards';
import { RARITY_TIER1, RARITY_TIER2 } from './statueRarity';

/**
 * @typedef {{ icon: string, label: string, value: string }} MonumentFact
 * @typedef {{
 *   lead: string | null,
 *   whyHere: string | null,
 *   story: string | null,
 *   personBio: string | null,
 *   locationLine: string | null,
 *   facts: MonumentFact[],
 * }} MonumentCardContent
 */

function tKey(t, key) {
  const text = t(key);
  return text && text !== key ? text : null;
}

function cardPrefix(cardId) {
  return `card_${cardId}`;
}

function buildFactsFromCard(cardId, def, t) {
  const prefix = cardPrefix(cardId);
  const slots = def.factSlots ?? [];
  const iconBySlot = {
    unveiled: 'calendar-outline',
    author: 'brush-outline',
    commissioned: 'ribbon-outline',
    scale: 'resize-outline',
    life: 'person-outline',
  };
  const labelBySlot = {
    unveiled: t('cardFactLabelUnveiled'),
    author: t('cardFactLabelAuthor'),
    commissioned: t('cardFactLabelCommissioned'),
    scale: t('cardFactLabelScale'),
    life: t('cardFactLabelLife'),
  };

  const facts = [];
  for (const slot of slots) {
    const valueKey = `${prefix}_fact_${slot}`;
    let value = tKey(t, valueKey);
    if (slot === 'unveiled' && def.unveiledYear != null && !value) {
      value = String(def.unveiledYear);
    }
    if (!value) continue;
    facts.push({
      icon: iconBySlot[slot] ?? 'information-circle-outline',
      label: labelBySlot[slot] ?? slot,
      value,
    });
  }
  return facts;
}

function buildCuratedPersonBio(figure, t) {
  if (!figure?.curatedKey) return null;
  const bioKey = `curatedBio_${figure.curatedKey}`;
  return tKey(t, bioKey);
}

function buildFromFullCard(cardId, def, figure, t) {
  const prefix = cardPrefix(cardId);
  const story = tKey(t, `${prefix}_story`);
  const whyHere = tKey(t, `${prefix}_why`);
  const lead = tKey(t, `${prefix}_lead`);
  const personBio = def.factSlots?.includes('life')
    ? buildCuratedPersonBio(figure, t)
    : null;

  return {
    lead,
    whyHere,
    story,
    personBio,
    locationLine: figure?.address?.trim() || figure?.city?.trim() || null,
    facts: buildFactsFromCard(cardId, def, t),
  };
}

function buildTier2Card(figure, title, t) {
  const address = figure?.address?.trim() || figure?.city?.trim() || '';
  const desc =
    typeof figure?.description === 'string' ? figure.description.trim() : '';
  const story =
    desc ||
    (address
      ? t('cardTier2StoryAddress', { name: title, address })
      : t('cardTier2Story', { name: title }));
  return {
    lead: t('cardTier2Lead'),
    whyHere: t('cardTier2Why'),
    story,
    personBio: null,
    locationLine: address || null,
    facts: [
      address
        ? {
            icon: 'location-outline',
            label: t('cardFactLabelPlace'),
            value: address,
          }
        : null,
      figure?.category
        ? {
            icon: 'pricetag-outline',
            label: t('cardFactLabelType'),
            value: figure.category,
          }
        : null,
    ].filter(Boolean),
  };
}

function buildTier1Card(figure, title, t) {
  const address = figure?.address?.trim() || figure?.city?.trim() || '';
  return {
    lead: t('cardTier1Lead'),
    whyHere: t('cardTier1Why'),
    story: t('cardTier1Story', { name: title }),
    personBio: null,
    locationLine: address || null,
    facts: address
      ? [
          {
            icon: 'location-outline',
            label: t('cardFactLabelPlace'),
            value: address,
          },
        ]
      : [],
  };
}

/**
 * @param {object} figure
 * @param {string} title — localized display name
 * @param {(key: string, vars?: object) => string} t
 * @returns {MonumentCardContent}
 */
export function resolveMonumentCardContent(figure, title, t) {
  const cardId = resolveMonumentCardId(figure);
  const def = getMonumentCardDef(cardId);
  if (cardId && def) {
    return buildFromFullCard(cardId, def, figure, t);
  }

  if (figure?.curatedKey) {
    const storyKey = `curatedMonumentStory_${figure.curatedKey}`;
    const story = tKey(t, storyKey);
    const facts = [];
    if (figure.born != null && figure.died != null) {
      facts.push({
        icon: 'person-outline',
        label: t('cardFactLabelLife'),
        value: t('statueMetaLife', { born: figure.born, died: figure.died }),
      });
    }
    if (figure.monumentUnveiled != null) {
      facts.push({
        icon: 'calendar-outline',
        label: t('cardFactLabelUnveiled'),
        value: String(figure.monumentUnveiled),
      });
    }
    return {
      lead: null,
      whyHere: story,
      story: buildCuratedPersonBio(figure, t),
      personBio: null,
      locationLine: null,
      facts,
    };
  }

  const rarity = figure?.rarity ?? RARITY_TIER2;
  if (rarity === RARITY_TIER1) {
    return buildTier1Card(figure, title, t);
  }
  return buildTier2Card(figure, title, t);
}
