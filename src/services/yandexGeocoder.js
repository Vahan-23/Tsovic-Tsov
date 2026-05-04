import Constants from 'expo-constants';

function getYandexApiKey() {
  return Constants.expoConfig?.extra?.yandexApiKey ?? '';
}

export async function addressToCoords(address) {
  const KEY = getYandexApiKey();
  if (!KEY) return null;
  try {
    const url =
      `https://geocode-maps.yandex.ru/1.x/?apikey=${encodeURIComponent(KEY)}` +
      `&geocode=${encodeURIComponent(address)}&format=json&lang=ru_RU&results=1`;
    const res = await fetch(url);
    const data = await res.json();
    const pos =
      data.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Point
        ?.pos;
    if (!pos || typeof pos !== 'string') return null;
    const [lon, lat] = pos.split(/\s+/).map(Number);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { lat, lon };
  } catch (e) {
    console.warn('Geocoder failed:', e);
    return null;
  }
}

export async function coordsToAddress(lat, lon) {
  const KEY = getYandexApiKey();
  if (!KEY) return null;
  try {
    const url =
      `https://geocode-maps.yandex.ru/1.x/?apikey=${encodeURIComponent(KEY)}` +
      `&geocode=${lon},${lat}&format=json&lang=ru_RU&results=1`;
    const res = await fetch(url);
    const data = await res.json();
    return (
      data.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject
        ?.metaDataProperty?.GeocoderMetaData?.text ?? null
    );
  } catch (e) {
    console.warn('Geocoder failed:', e);
    return null;
  }
}
