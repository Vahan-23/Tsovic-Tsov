import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useFigures } from '../context/FiguresContext';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { WATCH_NAVIGATION } from '../constants/gpsAccuracy';
import { UNLOCK_RADIUS_METERS } from '../constants/unlockRadius';
import {
  ANDROID_BLACK_MAP_CAMERA_PITCH,
  BLACK_CITY_ANDROID_STYLE,
  getBlackCityMapProps,
} from '../constants/mapAppearance';
import { fetchOsrmFootRoute } from '../services/osrmRouter';
import { getWalkingRoute } from '../services/yandexRouter';
import { haversineDistanceMeters } from '../utils/haversine';
import UnlockCelebrationOverlay from '../components/UnlockCelebrationOverlay';

const FOOTPRINT_ICON = require('../../assets/footprints_21766.png');
const TIGRAN_NAV_BACK = require('../../assets/Tigran_Mets_Back.png');

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function toDegrees(value) {
  return (value * 180) / Math.PI;
}

function getBearingDegrees(from, to) {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const lngDelta = toRadians(to.longitude - from.longitude);
  const y = Math.sin(lngDelta) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(lngDelta);
  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

/** Rough local meters offsets for projecting a lat/lng point onto a segment (fine for Armenia-scale segments). */
function toLocalM(lat, lng, refLat, refLng) {
  const cosRef = Math.max(0.2, Math.cos((refLat * Math.PI) / 180));
  const mx = ((lng - refLng) * Math.PI) / 180 * 6378137 * cosRef;
  const my = ((lat - refLat) * Math.PI) / 180 * 6378137;
  return { mx, my };
}

/**
 * Finds index of first vertex that should remain (trim passed path).
 * User "erases" the polyline behind them — only monotone forward creep (with small jitter tolerance).
 */
function findTrimStartIndex(coords, user, trimMinIndex) {
  if (!coords || coords.length < 2 || !user) return 0;
  let bestDist = Infinity;
  let bestSegment = trimMinIndex;
  let bestT = 0;

  const startSeg = Math.max(0, Math.min(trimMinIndex, coords.length - 2));
  const endSeg = coords.length - 2;

  for (let i = startSeg; i <= endSeg; i++) {
    const a = coords[i];
    const b = coords[i + 1];
    const refLat = (a.latitude + b.latitude) / 2;
    const refLng = (a.longitude + b.longitude) / 2;

    const p = toLocalM(user.latitude, user.longitude, refLat, refLng);
    const aL = toLocalM(a.latitude, a.longitude, refLat, refLng);
    const bL = toLocalM(b.latitude, b.longitude, refLat, refLng);
    let vx = bL.mx - aL.mx;
    let vy = bL.my - aL.my;
    const segLenSq = vx * vx + vy * vy;
    if (segLenSq < 1e-6) continue;
    let t = (p.mx - aL.mx) * vx + (p.my - aL.my) * vy;
    t /= segLenSq;
    t = Math.max(0, Math.min(1, t));

    const qx = aL.mx + t * vx;
    const qy = aL.my + t * vy;
    const dx = p.mx - qx;
    const dy = p.my - qy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < bestDist) {
      bestDist = dist;
      bestSegment = i;
      bestT = t;
    }
  }

  // Vertex index ahead of projected point on route (remainder starts here or next).
  let vertexStart = bestT > 0.55 ? bestSegment + 1 : bestSegment;

  /** Don’t jitter backward more than ~2 vertices from last trim (GPS noise). */
  const maxBack = 2;
  if (vertexStart < trimMinIndex - maxBack) {
    vertexStart = trimMinIndex - maxBack;
  }
  vertexStart = Math.max(trimMinIndex, Math.min(coords.length - 1, vertexStart));

  return vertexStart;
}

/**
 * Курс **вдоль нарисованной линии** в точке, ближайшей к GPS на полилинии (касательная к сегменту).
 * Угол совпадает с тем, как полилиния уходит «прямо вперёд» от персонажа на земле.
 */
function getPolylineTangentBearingDeg(
  coords,
  user,
  trimMinIndex,
  targetLat,
  targetLon
) {
  if (!user) return 0;
  if (!coords || coords.length < 2) {
    return getBearingDegrees(user, { latitude: targetLat, longitude: targetLon });
  }

  let bestDist = Infinity;
  let bestI = 0;
  let bestT = 0;

  const startSeg = Math.max(0, Math.min(trimMinIndex, coords.length - 2));
  const endSeg = coords.length - 2;

  for (let i = startSeg; i <= endSeg; i++) {
    const a = coords[i];
    const b = coords[i + 1];
    const refLat = (a.latitude + b.latitude) / 2;
    const refLng = (a.longitude + b.longitude) / 2;

    const p = toLocalM(user.latitude, user.longitude, refLat, refLng);
    const aL = toLocalM(a.latitude, a.longitude, refLat, refLng);
    const bL = toLocalM(b.latitude, b.longitude, refLat, refLng);
    const vx = bL.mx - aL.mx;
    const vy = bL.my - aL.my;
    const segLenSq = vx * vx + vy * vy;
    if (segLenSq < 1e-6) continue;
    let t = (p.mx - aL.mx) * vx + (p.my - aL.my) * vy;
    t /= segLenSq;
    t = Math.max(0, Math.min(1, t));

    const qx = aL.mx + t * vx;
    const qy = aL.my + t * vy;
    const dx = p.mx - qx;
    const dy = p.my - qy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < bestDist) {
      bestDist = dist;
      bestI = i;
      bestT = t;
    }
  }

  if (bestT > 0.72 && bestI < coords.length - 2) {
    return getBearingDegrees(coords[bestI + 1], coords[bestI + 2]);
  }
  if (bestT > 0.72 && bestI === coords.length - 2) {
    return getBearingDegrees(coords[coords.length - 1], {
      latitude: targetLat,
      longitude: targetLon,
    });
  }
  return getBearingDegrees(coords[bestI], coords[bestI + 1]);
}

const CLOSE_ZOOM_DELTA = {
  latitude: 0.00105,
  longitude: 0.00105,
};

/** Авто-камера по GPS редкая: не дёргать карту при каждом тике и при ручном сдвиге вида. */
const MIN_MS_BETWEEN_AUTO_FOLLOW_CAM = 9000;
const MIN_METERS_MOVED_FOR_AUTO_FOLLOW_CAM = 48;
const MIN_MS_BETWEEN_CROW_TARGET_CAM = 14000;

/** Dark map + amber road accent (reads “black map, dark-yellow route”). */
const ROUTE_STROKE = '#c9a020';
const ROUTE_DIM = 'rgba(201,160,32,0.38)';

function sumPolylineLengthMeters(coords) {
  if (!coords || coords.length < 2) return 0;
  let sum = 0;
  for (let i = 0; i < coords.length - 1; i += 1) {
    sum += haversineDistanceMeters(coords[i], coords[i + 1]);
  }
  return sum;
}

/** RN params sometimes arrive as strings; commas break parseFloat unless normalized. */
function parseCoord(raw) {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string') {
    const n = parseFloat(raw.trim().replace(',', '.'));
    return Number.isFinite(n) ? n : NaN;
  }
  return NaN;
}

/**
 * Typical copy-paste bug: lon/lat stored reversed (still numeric).
 * Armenian bounds are narrow enough to detect when (lat,lng) "fits" after swap.
 */
function fixLikelyLatLonSwap(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { latitude: lat, longitude: lng };
  }
  const AM = {
    latMin: 38.85,
    latMax: 41.42,
    lonMin: 43.42,
    lonMax: 46.75,
  };
  const inBox = (lat0, lng0) =>
    lat0 >= AM.latMin &&
    lat0 <= AM.latMax &&
    lng0 >= AM.lonMin &&
    lng0 <= AM.lonMax;

  const directOk = inBox(lat, lng);
  const swappedOk = inBox(lng, lat);
  if (!directOk && swappedOk) {
    return { latitude: lng, longitude: lat };
  }
  return { latitude: lat, longitude: lng };
}

/** Don’t snap OSRM routes across oceans when GPS (emulator/real far away) mismatches Armenia. */
const MAX_ROUTE_CROW_METERS = 380_000;

const MIN_ZOOM_LAT_DELTA = 0.00042;
const MAX_ZOOM_LAT_DELTA = 0.11;

function clampNumber(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

/**
 * Keeps map center + zoom inside a lat/lng box so pan/pinch can’t throw the user to an ocean.
 */
function clampRegionToBounds(region, box) {
  const spanLat = box.maxLat - box.minLat;
  const spanLng = box.maxLng - box.minLng;
  if (spanLat <= 1e-9 || spanLng <= 1e-9) {
    return {
      latitude: box.minLat,
      longitude: box.minLng,
      latitudeDelta: MIN_ZOOM_LAT_DELTA,
      longitudeDelta: MIN_ZOOM_LAT_DELTA,
    };
  }

  const maxLatDelta = Math.min(MAX_ZOOM_LAT_DELTA, spanLat * 0.96);
  const maxLngDelta = Math.min(MAX_ZOOM_LAT_DELTA, spanLng * 0.96);

  let latDelta = clampNumber(
    region.latitudeDelta,
    MIN_ZOOM_LAT_DELTA,
    maxLatDelta
  );
  let lngDelta = clampNumber(
    region.longitudeDelta > 0 ? region.longitudeDelta : latDelta,
    MIN_ZOOM_LAT_DELTA,
    maxLngDelta
  );

  const halfLat = latDelta / 2;
  const halfLng = lngDelta / 2;
  const lat = clampNumber(
    region.latitude,
    box.minLat + halfLat,
    box.maxLat - halfLat
  );
  const lng = clampNumber(
    region.longitude,
    box.minLng + halfLng,
    box.maxLng - halfLng
  );

  return {
    latitude: lat,
    longitude: lng,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

function regionNeedsSnap(before, after) {
  return (
    Math.abs(before.latitude - after.latitude) > 1e-6 ||
    Math.abs(before.longitude - after.longitude) > 1e-6 ||
    Math.abs(before.latitudeDelta - after.latitudeDelta) > 1e-7 ||
    Math.abs(before.longitudeDelta - after.longitudeDelta) > 1e-7
  );
}

export default function NavigationScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useSettings();
  const { t } = useLanguage();
  const params = route.params || {};
  const collectionKind = params.collectionKind || 'statues';
  const targetId = params.targetId;
  const targetName = params.targetName;
  const rawLat = parseCoord(params.targetLat);
  const rawLng = parseCoord(params.targetLon);
  const fixed = fixLikelyLatLonSwap(rawLat, rawLng);
  const targetLat = fixed.latitude;
  const targetLon = fixed.longitude;
  const { unlockForSearchMode, commitHudCollectionProgress } = useFigures();
  const mapRef = useRef(null);
  const hasTargetCoords =
    Number.isFinite(targetLat) && Number.isFinite(targetLon);

  const [distanceMeters, setDistanceMeters] = useState(null);
  /** Азимут вперёд по полилинии маршрута (для Тиграна, подсказок и камеры). */
  const [routeFollowBearingDeg, setRouteFollowBearingDeg] = useState(0);
  /** UI for “follow / free look” — FAB highlights when the map tracks GPS. */
  const [mapFollowUser, setMapFollowUser] = useState(true);
  const [userCoords, setUserCoords] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const fullRouteCoordsRef = useRef([]);
  const trimStartIdxRef = useRef(0);
  const lastFollowCameraAtRef = useRef(0);
  /** When false, GPS updates do not drive the camera (user panned the map). */
  const followNavigationRef = useRef(true);
  const lastFollowCameraCenterRef = useRef(null);
  const lastProgrammaticCameraAtRef = useRef(0);
  /** Не давим clamp после «следы» — иначе animateToRegion сбросит поворот карты. */
  const suppressClampUntilRef = useRef(0);
  /** Один раз подвинуть камеру к позиции при старте (пока включён follow). */
  const hasAutoCenteredOnFirstFixRef = useRef(false);
  const lastCrowTargetCameraAtRef = useRef(0);
  const didUnlockRef = useRef(false);
  const didFitRef = useRef(false);
  const lastRouteFetchRef = useRef({
    coords: null,
    timestamp: 0,
  });
  const routeRequestRef = useRef(null);
  const crowTooFarAlertedRef = useRef(false);
  const [unlockCelebration, setUnlockCelebration] = useState(null);

  const remainingAlongRouteMeters = useMemo(
    () => sumPolylineLengthMeters(routeCoords),
    [routeCoords]
  );

  const displayPolylineCoords = useMemo(() => {
    if (routeCoords.length < 2) return [];
    if (!userCoords) return routeCoords;
    return [userCoords, ...routeCoords];
  }, [routeCoords, userCoords]);

  const hudMetersRounded = useMemo(() => {
    if (routeCoords.length >= 2 && remainingAlongRouteMeters >= 3) {
      return Math.max(0, Math.round(remainingAlongRouteMeters));
    }
    if (distanceMeters == null) return null;
    return Math.max(0, Math.round(distanceMeters));
  }, [distanceMeters, remainingAlongRouteMeters, routeCoords.length]);

  /** На чёрной карте маршрут всегда янтарно-жёлтый. */
  const routeStrokeColor = ROUTE_STROKE;
  const routeOutlineColor = ROUTE_DIM;

  const uiStyles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.bg,
        },
        mapSection: {
          flex: 1,
          position: 'relative',
        },
        mapInner: {
          ...StyleSheet.absoluteFillObject,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        },
        floatingCard: {
          position: 'absolute',
          top: 12,
          left: 16,
          right: 16,
          paddingHorizontal: 18,
          paddingVertical: 16,
          borderRadius: 18,
          backgroundColor: colors.bgElevated,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: Platform.OS === 'ios' ? 1 : 0,
          shadowRadius: 20,
          elevation: Platform.OS === 'android' ? 6 : 0,
        },
        floatingLabel: {
          fontSize: 11,
          fontWeight: '800',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: colors.textMuted,
          marginBottom: 6,
        },
        floatingTitle: {
          fontSize: 19,
          fontWeight: '800',
          color: colors.text,
          lineHeight: 24,
        },
        floatingDistance: {
          marginTop: 10,
          fontSize: 34,
          fontWeight: '900',
          letterSpacing: -0.5,
          color: routeStrokeColor,
        },
        bottomSheet: {
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          paddingHorizontal: 20,
          paddingTop: 18,
          backgroundColor: colors.bgElevated,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderLeftWidth: StyleSheet.hairlineWidth,
          borderRightWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: Platform.OS === 'ios' ? 0.12 : 0,
          shadowRadius: 16,
          elevation: Platform.OS === 'android' ? 16 : 0,
        },
        actionsRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        followFab: {
          width: 58,
          height: 58,
          borderRadius: 29,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.bgMuted,
          borderWidth: 2,
        },
        followFabActive: {
          borderColor: routeStrokeColor,
          backgroundColor: colors.bgElevated,
        },
        followFabIdle: {
          borderColor: colors.borderMuted,
        },
        followFabIcon: {
          width: 28,
          height: 28,
          tintColor: routeStrokeColor,
        },
        endBtn: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 16,
          paddingHorizontal: 16,
          borderRadius: 16,
          backgroundColor: colors.primaryBg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.tileEnabledBorder,
        },
        endBtnText: {
          fontSize: 16,
          fontWeight: '800',
          color: colors.primaryText,
        },
        invalidWrap: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 28,
        },
        invalidText: {
          fontSize: 16,
          fontWeight: '600',
          color: colors.textSecondary,
          textAlign: 'center',
        },
        tigranMarkerBox: {
          width: 52,
          height: 68,
          alignItems: 'center',
          justifyContent: 'flex-end',
        },
        tigranMarkerImg: {
          width: 48,
          height: 64,
        },
      }),
    [colors, routeStrokeColor]
  );

  const mapBounds = useMemo(() => {
    const cos = Math.cos((targetLat * Math.PI) / 180);
    const padLat = 0.042;
    const padLon = padLat / Math.max(cos, 0.35);

    let minLat = targetLat - padLat;
    let maxLat = targetLat + padLat;
    let minLng = targetLon - padLon;
    let maxLng = targetLon + padLon;

    if (userCoords) {
      const crow = haversineDistanceMeters(userCoords, {
        latitude: targetLat,
        longitude: targetLon,
      });
      if (crow <= MAX_ROUTE_CROW_METERS) {
        const expand = padLat * 0.42;
        const expandLon = padLon * 0.42;
        minLat = Math.min(minLat, userCoords.latitude - expand);
        maxLat = Math.max(maxLat, userCoords.latitude + expand);
        minLng = Math.min(minLng, userCoords.longitude - expandLon);
        maxLng = Math.max(maxLng, userCoords.longitude + expandLon);
      }
    }

    return { minLat, maxLat, minLng, maxLng };
  }, [targetLat, targetLon, userCoords]);

  const mapBoundsRef = useRef(mapBounds);
  mapBoundsRef.current = mapBounds;

  const initialSnappedRegion = useMemo(
    () =>
      clampRegionToBounds(
        {
          latitude: targetLat,
          longitude: targetLon,
          latitudeDelta: CLOSE_ZOOM_DELTA.latitude * 6,
          longitudeDelta: CLOSE_ZOOM_DELTA.longitude * 6,
        },
        mapBounds
      ),
    [targetLat, targetLon, mapBounds]
  );

  const animateRegionSafe = React.useCallback((region, dur) => {
    const snapped = clampRegionToBounds(region, mapBoundsRef.current);
    lastProgrammaticCameraAtRef.current = Date.now();
    mapRef.current?.animateToRegion(snapped, dur);
  }, []);

  const handleFollowTracksPress = React.useCallback(() => {
    if (!mapRef.current) return;
    followNavigationRef.current = true;
    setMapFollowUser(true);
    hasAutoCenteredOnFirstFixRef.current = true;

    const center =
      userCoords ??
      ({ latitude: targetLat, longitude: targetLon });

    if (!userCoords) {
      animateRegionSafe(
        {
          latitude: targetLat,
          longitude: targetLon,
          latitudeDelta: CLOSE_ZOOM_DELTA.latitude * 6,
          longitudeDelta: CLOSE_ZOOM_DELTA.longitude * 6,
        },
        420
      );
      return;
    }

    const full = fullRouteCoordsRef.current;
    const heading =
      full.length >= 2
        ? getPolylineTangentBearingDeg(
            full,
            center,
            trimStartIdxRef.current,
            targetLat,
            targetLon
          )
        : getBearingDegrees(center, {
            latitude: targetLat,
            longitude: targetLon,
          });

    suppressClampUntilRef.current = Date.now() + 3200;
    lastProgrammaticCameraAtRef.current = Date.now();

    const pitch =
      Platform.OS === 'android' ? ANDROID_BLACK_MAP_CAMERA_PITCH : 52;
    const camera =
      Platform.OS === 'android'
        ? { center, heading, pitch, zoom: 20 }
        : { center, heading, pitch, altitude: 155 };

    const mv = mapRef.current;
    if (typeof mv.animateCamera === 'function') {
      mv.animateCamera(camera, { duration: 520 });
      return;
    }
    animateRegionSafe(
      {
        latitude: center.latitude,
        longitude: center.longitude,
        ...CLOSE_ZOOM_DELTA,
      },
      420
    );
  }, [
    animateRegionSafe,
    targetLat,
    targetLon,
    userCoords,
  ]);

  const handleUserMovedMap = React.useCallback(() => {
    followNavigationRef.current = false;
    setMapFollowUser(false);
    /** Не делать отложенный «первый» авто-центр после жеста — иначе вид сбросится. */
    hasAutoCenteredOnFirstFixRef.current = true;
  }, []);

  const handleRegionChangeComplete = React.useCallback((r, details) => {
    if (!r || !mapRef.current) return;

    if (details?.isGesture) {
      handleUserMovedMap();
    }

    if (!followNavigationRef.current) {
      return;
    }

    if (Date.now() < suppressClampUntilRef.current) return;
    if (Date.now() - lastProgrammaticCameraAtRef.current < 720) return;
    const before = {
      latitude: r.latitude,
      longitude: r.longitude,
      latitudeDelta: r.latitudeDelta,
      longitudeDelta: r.longitudeDelta,
    };
    const fixed = clampRegionToBounds(before, mapBoundsRef.current);
    if (!regionNeedsSnap(before, fixed)) return;
    lastProgrammaticCameraAtRef.current = Date.now();
    mapRef.current.animateToRegion(fixed, 200);
  }, [handleUserMovedMap]);

  const requestRoadRoute = React.useCallback(
    async (origin, force = false) => {
      if (!hasTargetCoords || !origin) return;

      const crowStraight = haversineDistanceMeters(origin, {
        latitude: targetLat,
        longitude: targetLon,
      });

      if (crowStraight > MAX_ROUTE_CROW_METERS) {
        fullRouteCoordsRef.current = [];
        trimStartIdxRef.current = 0;
        setRouteCoords([]);
        if (!crowTooFarAlertedRef.current) {
          crowTooFarAlertedRef.current = true;
          Alert.alert(
            'GPS',
            'На карте цель в Армении, а позиция телефона/GPS сейчас очень далеко — тогда построитель маршрута тянет через океан.\n\nВ эмуляторе включи локацию рядом с Ереваном (или на реальном устройстве зайди в район статуи) и попробуй снова.'
          );
        }
        return;
      }

      const now = Date.now();
      const prev = lastRouteFetchRef.current;
      const movedMeters = prev.coords
        ? haversineDistanceMeters(prev.coords, origin)
        : Number.POSITIVE_INFINITY;
      const staleMs = now - prev.timestamp;

      if (!force && movedMeters < 18 && staleMs < 12000) {
        return;
      }

      lastRouteFetchRef.current = { coords: origin, timestamp: now };

      if (routeRequestRef.current) {
        routeRequestRef.current.abort();
      }

      const controller = new AbortController();
      routeRequestRef.current = controller;

      try {
        let formattedCoords = null;
        try {
          const routeData = await getWalkingRoute(
            origin.latitude,
            origin.longitude,
            targetLat,
            targetLon,
            { signal: controller.signal }
          );
          formattedCoords = routeData.coordinates;
        } catch (e) {
          console.warn('Yandex Router failed, using OSRM fallback:', e);
          try {
            formattedCoords = await fetchOsrmFootRoute(
              origin,
              targetLat,
              targetLon,
              controller.signal
            );
          } catch (osrmErr) {
            console.warn('OSRM fallback failed:', osrmErr);
          }
        }

        if (!formattedCoords || formattedCoords.length < 2) return;

        fullRouteCoordsRef.current = formattedCoords;
        trimStartIdxRef.current = 0;
        setRouteCoords(formattedCoords);
      } catch (error) {
        if (error?.name !== 'AbortError') {
          fullRouteCoordsRef.current = [];
          trimStartIdxRef.current = 0;
          setRouteCoords([]);
        }
      } finally {
        if (routeRequestRef.current === controller) {
          routeRequestRef.current = null;
        }
      }
    },
    [hasTargetCoords, targetLat, targetLon]
  );

  useEffect(() => {
    let locSub = null;
    let cancelled = false;

    (async () => {
      try {
        if (!hasTargetCoords) {
          Alert.alert('Սխալ', 'Թիրախի կոորդինատները բացակայում են։');
          navigation.goBack();
          return;
        }
        const { status } =
          await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Թույլտվություն', 'Պետք է թույլ տաս տեղադրության հասանելիությունը։');
          navigation.goBack();
          return;
        }

        locSub = await Location.watchPositionAsync(
          WATCH_NAVIGATION,
          (loc) => {
            if (cancelled) return;
            const lat = loc.coords.latitude;
            const lon = loc.coords.longitude;
            setUserCoords({ latitude: lat, longitude: lon });
            const pt = { latitude: lat, longitude: lon };

            const crowStraight = haversineDistanceMeters(pt, {
              latitude: targetLat,
              longitude: targetLon,
            });

            const full = fullRouteCoordsRef.current;
            if (
              full.length >= 2 &&
              crowStraight <= MAX_ROUTE_CROW_METERS
            ) {
              const nextTrim = findTrimStartIndex(full, pt, trimStartIdxRef.current);
              trimStartIdxRef.current = nextTrim;
              const remainder = full.slice(trimStartIdxRef.current);
              if (remainder.length >= 2) {
                setRouteCoords(remainder);
              } else if (remainder.length === 1) {
                setRouteCoords([
                  remainder[0],
                  { latitude: targetLat, longitude: targetLon },
                ]);
              }
            }

            const dist = haversineDistanceMeters(
              pt,
              { latitude: targetLat, longitude: targetLon }
            );
            setDistanceMeters(dist);

            let fwd = getBearingDegrees(pt, {
              latitude: targetLat,
              longitude: targetLon,
            });
            if (full.length >= 2 && crowStraight <= MAX_ROUTE_CROW_METERS) {
              fwd = getPolylineTangentBearingDeg(
                full,
                pt,
                trimStartIdxRef.current,
                targetLat,
                targetLon
              );
            }
            setRouteFollowBearingDeg(Math.round(fwd));
            requestRoadRoute(pt);

            const nowTs = Date.now();
            const crowFar = crowStraight > MAX_ROUTE_CROW_METERS;
            const noPolyline = full.length < 2;

            const runFollowCamera = () => {
              if (!mapRef.current || !followNavigationRef.current) return;
              lastFollowCameraAtRef.current = nowTs;
              lastFollowCameraCenterRef.current = {
                latitude: lat,
                longitude: lon,
              };

              if (crowFar) {
                lastCrowTargetCameraAtRef.current = nowTs;
                animateRegionSafe(
                  {
                    latitude: targetLat,
                    longitude: targetLon,
                    latitudeDelta: 0.06,
                    longitudeDelta: 0.06,
                  },
                  380
                );
              } else if (
                full.length >= 2 &&
                typeof mapRef.current.animateCamera === 'function'
              ) {
                const duration = 520;
                lastProgrammaticCameraAtRef.current = Date.now();
                suppressClampUntilRef.current = Date.now() + duration + 1100;
                mapRef.current.animateCamera(
                  Platform.OS === 'android'
                    ? {
                        center: pt,
                        heading: fwd,
                        pitch: ANDROID_BLACK_MAP_CAMERA_PITCH,
                        zoom: 19.65,
                      }
                    : {
                        center: pt,
                        heading: fwd,
                        pitch: 50,
                        altitude: 168,
                      },
                  { duration }
                );
              } else {
                animateRegionSafe(
                  {
                    latitude: lat,
                    longitude: lon,
                    ...CLOSE_ZOOM_DELTA,
                  },
                  420
                );
              }
            };

            if (mapRef.current && followNavigationRef.current) {
              if (!hasAutoCenteredOnFirstFixRef.current) {
                hasAutoCenteredOnFirstFixRef.current = true;
                runFollowCamera();
              } else if (crowFar) {
                if (
                  nowTs - lastCrowTargetCameraAtRef.current >=
                  MIN_MS_BETWEEN_CROW_TARGET_CAM
                ) {
                  runFollowCamera();
                }
              } else if (!noPolyline) {
                const dt = nowTs - lastFollowCameraAtRef.current;
                const movedSinceCam = lastFollowCameraCenterRef.current
                  ? haversineDistanceMeters(pt, lastFollowCameraCenterRef.current)
                  : Number.POSITIVE_INFINITY;
                if (
                  dt >= MIN_MS_BETWEEN_AUTO_FOLLOW_CAM &&
                  movedSinceCam >= MIN_METERS_MOVED_FOR_AUTO_FOLLOW_CAM
                ) {
                  runFollowCamera();
                }
              }
            }

            if (mapRef.current && !didFitRef.current) {
              didFitRef.current = true;
              requestRoadRoute({ latitude: lat, longitude: lon }, true);
            }

            if (!didUnlockRef.current && dist < UNLOCK_RADIUS_METERS) {
              didUnlockRef.current = true;
              if (targetId != null) {
                const result = unlockForSearchMode(collectionKind, targetId);
                setUnlockCelebration(
                  result.ok
                    ? {
                        title: t('unlockedTitle'),
                        lines: [t('foundOne', { name: targetName ?? '' })],
                        variant: 'success',
                        detailStatueId: targetId,
                        collectionKind,
                      }
                    : {
                        title: t('noticeTitle'),
                        lines: [t('unlockFailedNear', { name: targetName ?? '' })],
                        variant: 'soft',
                      }
                );
              } else {
                setUnlockCelebration({
                  title: t('navArrivedTitle'),
                  lines: [t('navReachedLine', { name: targetName ?? '—' })],
                  variant: 'success',
                });
              }
            }
          }
        );
      } catch {
        if (!cancelled) {
          Alert.alert('Սխալ', 'Չհաջողվեց ստանալ տեղադրությունը։');
          navigation.goBack();
        }
      }
    })();

    return () => {
      cancelled = true;
      if (routeRequestRef.current) routeRequestRef.current.abort();
      if (locSub && typeof locSub.remove === 'function') locSub.remove();
    };
  }, [
    hasTargetCoords,
    navigation,
    targetId,
    targetLat,
    targetLon,
    targetName,
    collectionKind,
    unlockForSearchMode,
    requestRoadRoute,
    animateRegionSafe,
    t,
  ]);

  if (!hasTargetCoords) {
    return (
      <View style={[uiStyles.root, { paddingTop: insets.top }]}>
        <View style={uiStyles.invalidWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={[uiStyles.invalidText, { marginTop: 16 }]}>
            {t('navInvalidCoords')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[uiStyles.root, { paddingTop: insets.top }]}>
      <View style={uiStyles.mapSection}>
        <MapView
          {...getBlackCityMapProps()}
          customMapStyle={
            Platform.OS === 'android' ? BLACK_CITY_ANDROID_STYLE : undefined
          }
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          showsCompass
          showsScale
          showsMyLocationButton={false}
          showsUserLocation={userCoords == null}
          followsUserLocation={false}
          scrollEnabled
          zoomEnabled
          zoomTapEnabled
          rotateEnabled
          pitchEnabled
          initialRegion={initialSnappedRegion}
          onPanDrag={handleUserMovedMap}
          onRegionChangeComplete={handleRegionChangeComplete}
        >
          {hasTargetCoords ? (
            <Marker
              coordinate={{ latitude: targetLat, longitude: targetLon }}
              title={targetName || 'Target'}
              pinColor={routeStrokeColor}
            />
          ) : null}
          {displayPolylineCoords.length >= 2 ? (
            <>
              <Polyline
                coordinates={displayPolylineCoords}
                strokeColor={routeOutlineColor}
                strokeWidth={10}
              />
              <Polyline
                coordinates={displayPolylineCoords}
                strokeColor={routeStrokeColor}
                strokeWidth={4}
              />
            </>
          ) : null}
          {userCoords ? (
            <Marker
              coordinate={userCoords}
              anchor={{ x: 0.5, y: 0.82 }}
              zIndex={100}
              flat
              rotation={routeFollowBearingDeg}
              tracksViewChanges={false}
            >
              <View style={uiStyles.tigranMarkerBox} pointerEvents="none">
                <Image
                  source={TIGRAN_NAV_BACK}
                  style={uiStyles.tigranMarkerImg}
                  resizeMode="contain"
                />
              </View>
            </Marker>
          ) : null}
        </MapView>

        <View style={uiStyles.floatingCard} pointerEvents="none">
          <Text style={uiStyles.floatingLabel}>{t('navHeadingTo')}</Text>
          <Text style={uiStyles.floatingTitle} numberOfLines={2}>
            {targetName ?? '—'}
          </Text>
          <Text style={uiStyles.floatingDistance}>
            {hudMetersRounded == null
              ? '—'
              : t('distanceMeters', { n: hudMetersRounded })}
          </Text>
        </View>
      </View>

      <View
        style={[
          uiStyles.bottomSheet,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <View style={uiStyles.actionsRow}>
          <Pressable
            accessibilityLabel={t('navFollowRouteHint')}
            style={({ pressed }) => [
              uiStyles.followFab,
              mapFollowUser ? uiStyles.followFabActive : uiStyles.followFabIdle,
              pressed && { opacity: 0.88 },
            ]}
            onPress={handleFollowTracksPress}
          >
            <Image
              source={FOOTPRINT_ICON}
              style={uiStyles.followFabIcon}
              resizeMode="contain"
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('navEndNavigation')}
            style={({ pressed }) => [uiStyles.endBtn, pressed && { opacity: 0.9 }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="stop-circle-outline" size={22} color={colors.primary} />
            <Text style={uiStyles.endBtnText}>{t('navEndNavigation')}</Text>
          </Pressable>
        </View>
      </View>

      <UnlockCelebrationOverlay
        visible={unlockCelebration != null}
        onDismiss={() => {
          setUnlockCelebration(null);
          commitHudCollectionProgress();
          navigation.goBack();
        }}
        onViewPress={
          unlockCelebration?.detailStatueId != null
            ? () => {
                const id = unlockCelebration.detailStatueId;
                const kind = unlockCelebration.collectionKind ?? 'statues';
                setUnlockCelebration(null);
                navigation.navigate('StatueDetail', {
                  statueId: id,
                  collectionKind: kind,
                });
              }
            : undefined
        }
        title={unlockCelebration?.title ?? ''}
        lines={unlockCelebration?.lines ?? []}
        variant={unlockCelebration?.variant ?? 'success'}
      />
    </View>
  );
}
