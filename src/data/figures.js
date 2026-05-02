/**
 * Offline fallback catalog. Coordinates and names cross-checked against
 * OpenStreetMap objects in central Yerevan (verified via Overpass, node/way center).
 *
 * | slug       | OSM id    | OSM primary EN name              |
 * |------------|-----------|----------------------------------|
 * | abovyan    | 703798666 | Khachatur Abovyan monument       |
 * | komitas    | 614350861 | Komitas statue                   |
 * | tumanyan   | 614334700 | Hovhannes Tumanyan monument      |
 * | sayat-nova | 614352792 | Sayat Nova monument              |
 * | charents   | 974787078 | Yeghishe Charents Monument       |
 */
export const FALLBACK_FIGURES = [
  {
    id: 'abovyan',
    osmId: 703798666,
    displayName: 'Khachatur Abovyan monument',
    name: 'Khachatur Abovyan monument',
    name_hy: 'Խաչատուր Աբովյանի արձան',
    name_ru: 'Памятник Хачатуру Абовяну',
    description:
      'Bronze monument to writer and educator Khachatur Abovyan (1809–1848) at the foot of Abovyan Street. Same location as OSM node 703798666 (historic=monument). HY: Խաչատուր Աբովյանի արձան. RU: Памятник Хачатуру Абовяну — памятник на этих координатах в Ереване.',
    image: null,
    latitude: 40.1916418,
    longitude: 44.5281451,
    sortOrder: 0,
  },
  {
    id: 'komitas',
    osmId: 614350861,
    displayName: 'Komitas statue',
    name: 'Komitas statue',
    name_hy: 'Կոմիտասի արձան',
    name_ru: 'Памятник Комитасу',
    description:
      'Monument to composer and musicologist Komitas (1869–1935). Mapped as OSM node 614350861 (tourism=artwork, artwork_type=statue). HY: Կոմիտասի արձան. RU: Памятник Комитасу — статуя у Оперного театра, эти координаты.',
    image: null,
    latitude: 40.1871993,
    longitude: 44.5162449,
    sortOrder: 1,
  },
  {
    id: 'tumanyan',
    osmId: 614334700,
    displayName: 'Hovhannes Tumanyan monument',
    name: 'Hovhannes Tumanyan monument',
    name_hy: 'Հովհաննես Թումանյանի արձան',
    name_ru: 'Памятник Ованесу Туманяну',
    description:
      'Memorial to poet Hovhannes Tumanyan (1869–1923). OSM node 614334700 (historic=memorial). HY: Հովհաննես Թումանյանի արձան. RU: Памятник Туманяну на площади у Лебединого озера — точка по картам OSM.',
    image: null,
    latitude: 40.1854189,
    longitude: 44.5147058,
    sortOrder: 2,
  },
  {
    id: 'sayat-nova',
    osmId: 614352792,
    displayName: 'Sayat-Nova monument',
    name: 'Sayat-Nova monument',
    name_hy: 'Սայաթ Նովայի հուշարձան',
    name_ru: 'Памятник Саят-Нове',
    description:
      'Memorial to ashugh Sayat-Nova (1712–1795). OSM node 614352792 (historic=memorial; mapped near the Sayat-Nova music fountain). HY: Սայաթ Նովայի հուշարձան. RU: Мемориал Саят-Новы — отмечен в OSM на этих координатах.',
    image: null,
    latitude: 40.1878591,
    longitude: 44.5164671,
    sortOrder: 3,
  },
  {
    id: 'charents',
    osmId: 974787078,
    displayName: 'Yeghishe Charents Monument',
    name: 'Yeghishe Charents Monument',
    name_hy: 'Եղիշե Չարենցի արձան',
    name_ru: 'Памятник Егише Чаренцу',
    description:
      'Monument to poet Yeghishe Charents (1897–1937) on Mashtots Avenue. OSM node 974787078 (historic=monument); way 1383819206 is the same sculpture mapped as an area. HY: Եղիշե Չարենցի արձան. RU: Памятник Чаренцу — точка центра узла OSM на проспекте Маштоца.',
    image: null,
    latitude: 40.1797924,
    longitude: 44.5246095,
    sortOrder: 4,
  },
];

/** @deprecated use FALLBACK_FIGURES */
export const BASE_FIGURES = FALLBACK_FIGURES;

export function sortFiguresList(list) {
  return [...list].sort(
    (a, b) =>
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
      String(a.id).localeCompare(String(b.id))
  );
}

export function getFigureByIdFromList(list, id) {
  const trimmed = typeof id === 'string' ? id.trim() : '';
  return list.find((f) => f.id === trimmed) ?? null;
}
