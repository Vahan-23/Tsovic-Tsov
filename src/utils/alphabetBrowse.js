/** Shared sorting / grouping for alphabet browse (Home grid + letter screen). */

import {
  CYRILLIC_ALPHABET,
  RU_NON_CYRILLIC_BUCKET,
} from '../constants/alphabet';

/**
 * Strip leading monument wording so RU "Памятник Хачатуру…" buckets under Х, not П.
 */
export function labelForBucket(label, locale) {
  let s = (label || '').trim();
  const orig = s;
  if (locale === 'ru') {
    s = s.replace(/^(памятник|мемориал|бюст)\s+/iu, '').trim();
  } else if (locale === 'en') {
    s = s
      .replace(/^monument\s+(?:to|of)\s+/iu, '')
      .replace(/^memorial\s+(?:to|of)\s+/iu, '')
      .replace(/^(monument|memorial|statue)\s+/iu, '')
      .trim();
  }
  return s.length > 0 ? s : orig;
}

export function bucketLetterForItem(item, locale) {
  const shown = labelForBrowseLocale(item, locale);
  const bucketSrc = labelForBucket(shown, locale);
  return bucketLetter(bucketSrc, locale);
}

export function labelForBrowseLocale(item, locale) {
  if (locale === 'hy') {
    return (
      item.name_hy ||
      item.displayName ||
      item.name ||
      item.name_en ||
      String(item.id)
    ).trim();
  }
  if (locale === 'ru') {
    return (
      item.name_ru ||
      item.displayName ||
      item.name ||
      item.name_en ||
      String(item.id)
    ).trim();
  }
  return (
    item.name_en ||
    item.displayName ||
    item.name ||
    item.name_hy ||
    String(item.id)
  ).trim();
}

export function bucketLetter(rawName, localeKey) {
  const s = (rawName || '').trim();
  if (!s) return '#';
  const first = s[0];
  if (/[0-9]/.test(first)) return '#';
  let upper;
  try {
    upper = first.toLocaleUpperCase(
      localeKey === 'hy' ? 'hy' : localeKey === 'ru' ? 'ru' : 'en'
    );
  } catch {
    upper = first.toUpperCase();
  }

  if (localeKey === 'ru') {
    if (CYRILLIC_ALPHABET.includes(upper)) {
      return upper;
    }
    return RU_NON_CYRILLIC_BUCKET;
  }

  return upper;
}

export function sortItemsAlphabetically(items, localeKey, sortLocaleOverride) {
  const loc =
    sortLocaleOverride ??
    (localeKey === 'hy' ? 'hy' : localeKey === 'ru' ? 'ru' : 'en');
  return [...items].sort((a, b) => {
    const na = labelForBrowseLocale(a, localeKey);
    const nb = labelForBrowseLocale(b, localeKey);
    return na.localeCompare(nb, loc, { sensitivity: 'base' });
  });
}

/** Count statues per first-letter bucket (including '#'). */
export function buildLetterCounts(items, locale) {
  const counts = {};
  for (const item of items) {
    const L = bucketLetterForItem(item, locale);
    counts[L] = (counts[L] || 0) + 1;
  }
  return counts;
}

/** Items whose browse label maps to this letter, sorted. */
export function filterItemsForLetter(items, locale, letter) {
  const sortLocale =
    locale === 'ru' && letter === RU_NON_CYRILLIC_BUCKET ? 'en' : undefined;
  return sortItemsAlphabetically(
    items.filter(
      (item) => bucketLetterForItem(item, locale) === letter
    ),
    locale,
    sortLocale
  );
}

export function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}
