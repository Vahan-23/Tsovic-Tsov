import { Platform } from 'react-native';

/**
 * Чёрная «база города» под яркий маршрут (полилиния рисуется поверх).
 * Работает на **Android (Google Maps)** через `customMapStyle`.
 *
 * На **iOS** Apple MapKit не применяет `customMapStyle` — остаётся `mutedStandard`
 * (сероватый вид). Для той же чёрной карты на iOS нужен Google Maps + ключ в нативной сборке.
 */
export const BLACK_CITY_ANDROID_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#000000' }] },
  { elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#000000' }],
  },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'landscape.man_made',
    elementType: 'geometry',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'landscape.natural',
    elementType: 'geometry',
    stylers: [{ color: '#000000' }],
  },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.fill',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'road.local',
    elementType: 'geometry',
    stylers: [{ color: '#000000' }],
  },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#000000' }],
  },
];

/** @deprecated используйте BLACK_CITY_ANDROID_STYLE */
export const DARK_MAP_ANDROID_STYLE = BLACK_CITY_ANDROID_STYLE;

/**
 * Google Maps на Android: угол наклона (3D) подсвечивает здания и визуально убивает тёмный customMapStyle
 * — превью 2D остаётся «чёрным», а навигация после animateCamera выглядит серой. Для навигации используем 0.
 */
export const ANDROID_BLACK_MAP_CAMERA_PITCH = 0;

export function getDarkMapProps() {
  if (Platform.OS === 'ios') {
    return {
      mapType: 'mutedStandard',
      customMapStyle: undefined,
    };
  }
  if (Platform.OS === 'android') {
    return {
      mapType: 'standard',
      customMapStyle: BLACK_CITY_ANDROID_STYLE,
    };
  }
  return { mapType: 'standard', customMapStyle: undefined };
}

/** Карта навигации: всегда чёрный город + жёлтая линия задаётся полилинией в экране. */
export function getBlackCityMapProps() {
  return getDarkMapProps();
}

/** Light = обычная карта; dark = чёрный город (Android). */
export function getMapAppearanceProps(resolvedScheme) {
  if (resolvedScheme === 'dark') {
    return getDarkMapProps();
  }
  if (Platform.OS === 'ios') {
    return { mapType: 'mutedStandard', customMapStyle: undefined };
  }
  return { mapType: 'standard', customMapStyle: undefined };
}
