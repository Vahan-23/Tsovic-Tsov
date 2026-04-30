import { Platform } from 'react-native';

/**
 * JSON map style — **применяется только на Android (Google Maps)**.
 * На iOS Apple MapKit игнорирует `customMapStyle`, поэтому там используем `mapType="mutedStandard"`.
 */
export const DARK_MAP_ANDROID_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#000000' }] },
  { elementType: 'geometry.fill', stylers: [{ color: '#000000' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5c5c5c' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#000000' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#000000' }],
  },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape', stylers: [{ color: '#000000' }] },
  { featureType: 'landscape.natural', stylers: [{ color: '#000000' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#121212' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#0a0a0a' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#0d0d0d' }],
  },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#000000' }],
  },
];

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
      customMapStyle: DARK_MAP_ANDROID_STYLE,
    };
  }
  return { mapType: 'standard', customMapStyle: undefined };
}
