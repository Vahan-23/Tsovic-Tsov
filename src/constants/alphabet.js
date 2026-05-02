/** Letters shown in the index strip (locale-specific). */
export const LATIN_ALPHABET = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
];

/** Russian А–Я row used in schools + Ё */
export const CYRILLIC_ALPHABET = [
  'А',
  'Б',
  'В',
  'Г',
  'Д',
  'Е',
  'Ё',
  'Ж',
  'З',
  'И',
  'Й',
  'К',
  'Л',
  'М',
  'Н',
  'О',
  'П',
  'Р',
  'С',
  'Т',
  'У',
  'Ф',
  'Х',
  'Ц',
  'Ч',
  'Ш',
  'Щ',
  'Ъ',
  'Ы',
  'Ь',
  'Э',
  'Ю',
  'Я',
];

/** Armenian մեսրոպյան այբուբեն (Ա … Ֆ) */
export const ARMENIAN_ALPHABET = [
  'Ա',
  'Բ',
  'Գ',
  'Դ',
  'Ե',
  'Զ',
  'Է',
  'Թ',
  'Ժ',
  'Ի',
  'Լ',
  'Խ',
  'Ծ',
  'Կ',
  'Հ',
  'Ձ',
  'Ղ',
  'Ճ',
  'Մ',
  'Յ',
  'Ն',
  'Շ',
  'Ո',
  'Չ',
  'Պ',
  'Ջ',
  'Ռ',
  'Ս',
  'Վ',
  'Տ',
  'Ր',
  'Ց',
  'Ւ',
  'Փ',
  'Ք',
  'Օ',
  'Ֆ',
];

/**
 * When UI is Russian, names that do not start with А–Я/Ё (Latin, Armenian, etc.)
 * are grouped under this bucket.
 */
export const RU_NON_CYRILLIC_BUCKET = 'LAT';

export function alphabetForLocale(locale) {
  if (locale === 'hy') return ARMENIAN_ALPHABET;
  if (locale === 'ru') return [...CYRILLIC_ALPHABET, RU_NON_CYRILLIC_BUCKET];
  return LATIN_ALPHABET;
}
