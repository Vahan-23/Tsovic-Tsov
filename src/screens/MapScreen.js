import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_SCROLL_SPACER } from '../constants/tabBar';
import { POSITION_MAX_ACCURACY } from '../constants/gpsAccuracy';
import {
  MAP_ROUTE_OUTLINE,
  MAP_ROUTE_STROKE,
  MAX_ROUTE_CROW_METERS,
} from '../constants/mapRoute';
import { getDarkMapProps } from '../constants/mapAppearance';
import { useFigures } from '../context/FiguresContext';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { fetchWalkingRouteToTarget } from '../services/fetchWalkingRouteToTarget';
import { labelForBrowseLocale } from '../utils/alphabetBrowse';
import { haversineDistanceMeters } from '../utils/haversine';
import { simplifyPolylineForMap } from '../utils/simplifyPolyline';
import MapWalkBankUnlock from '../components/MapWalkBankUnlock';
import UnlockCelebrationOverlay from '../components/UnlockCelebrationOverlay';

const DEFAULT_REGION = {
  latitude: 40.1792,
  longitude: 44.4991,
  latitudeDelta: 0.055,
  longitudeDelta: 0.055,
};

const COLLECTION_KIND = 'statues';

/** Native pins only — green = opened, gray = locked (never changes on tap). */
const PIN_OPEN = 'green';
const PIN_LOCKED = '#64748B';

function formatDurationMinutes(seconds, t) {
  const totalMin = Math.max(1, Math.round(seconds / 60));
  if (totalMin < 60) {
    return t('mapRouteDurationMin', { min: totalMin });
  }
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return t('mapRouteDurationHr', { h, m });
}

export default function MapScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useSettings();
  const { t, locale } = useLanguage();
  const { figures, storageLoaded, commitHudCollectionProgress } = useFigures();

  const routeRequestRef = useRef(null);
  const selectedIdRef = useRef(null);
  const markersByIdRef = useRef(new Map());

  const [selectedId, setSelectedId] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeDistanceM, setRouteDistanceM] = useState(null);
  const [routeDurationS, setRouteDurationS] = useState(null);
  const [crowMeters, setCrowMeters] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeErrorKey, setRouteErrorKey] = useState(null);
  const [unlockCelebration, setUnlockCelebration] = useState(null);

  const markers = useMemo(
    () =>
      figures.filter(
        (f) => Number.isFinite(f.latitude) && Number.isFinite(f.longitude)
      ),
    [figures]
  );

  useEffect(() => {
    const map = new Map();
    for (const f of markers) {
      map.set(String(f.id), f);
    }
    markersByIdRef.current = map;
  }, [markers]);

  const selectedFigure = useMemo(
    () => markers.find((f) => String(f.id) === String(selectedId)) ?? null,
    [markers, selectedId]
  );

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const clearSelection = useCallback(() => {
    if (routeRequestRef.current) {
      routeRequestRef.current.abort();
      routeRequestRef.current = null;
    }
    selectedIdRef.current = null;
    setSelectedId(null);
    setRouteCoords([]);
    setRouteDistanceM(null);
    setRouteDurationS(null);
    setCrowMeters(null);
    setRouteLoading(false);
    setRouteErrorKey(null);
  }, []);

  const loadRouteForFigure = useCallback(async (figure) => {
    if (routeRequestRef.current) {
      routeRequestRef.current.abort();
    }
    const controller = new AbortController();
    routeRequestRef.current = controller;
    const figureId = String(figure.id);

    setRouteLoading(true);
    setRouteErrorKey(null);
    setRouteDistanceM(null);
    setRouteDurationS(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setRouteErrorKey('permission');
        return;
      }

      const location = await Location.getCurrentPositionAsync(POSITION_MAX_ACCURACY);
      if (String(selectedIdRef.current) !== figureId) return;

      const origin = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      const crow = Math.round(
        haversineDistanceMeters(origin, {
          latitude: figure.latitude,
          longitude: figure.longitude,
        })
      );
      setCrowMeters(crow);

      if (crow > MAX_ROUTE_CROW_METERS) {
        setRouteErrorKey('far');
        return;
      }

      const routeData = await fetchWalkingRouteToTarget(
        origin,
        figure.latitude,
        figure.longitude,
        controller.signal
      );

      if (controller.signal.aborted) return;
      if (String(selectedIdRef.current) !== figureId) return;

      setRouteCoords(simplifyPolylineForMap(routeData.coordinates));
      setRouteDistanceM(Math.round(routeData.distanceMeters));
      setRouteDurationS(routeData.durationSeconds);
    } catch (err) {
      if (err?.name === 'AbortError') return;
      if (String(selectedIdRef.current) === figureId) {
        setRouteErrorKey('failed');
      }
    } finally {
      if (routeRequestRef.current === controller) {
        routeRequestRef.current = null;
      }
      if (String(selectedIdRef.current) === figureId) {
        setRouteLoading(false);
      }
    }
  }, []);

  const handleMapMarkerPress = useCallback(
    (event) => {
      const markerId =
        event?.nativeEvent?.id ?? event?.nativeEvent?.identifier;
      if (markerId == null || markerId === '') return;

      const figure = markersByIdRef.current.get(String(markerId));
      if (!figure) return;

      const id = String(figure.id);
      if (selectedIdRef.current === id) {
        clearSelection();
        return;
      }

      selectedIdRef.current = id;
      setSelectedId(id);
      setCrowMeters(null);
      setRouteCoords([]);
      void loadRouteForFigure(figure);
    },
    [clearSelection, loadRouteForFigure]
  );

  useEffect(
    () => () => {
      if (routeRequestRef.current) {
        routeRequestRef.current.abort();
      }
    },
    []
  );

  const mapMarkers = useMemo(
    () =>
      markers.map((f) => (
        <Marker
          key={`${f.id}-${f.unlocked ? 'o' : 'l'}`}
          identifier={String(f.id)}
          coordinate={{
            latitude: f.latitude,
            longitude: f.longitude,
          }}
          pinColor={f.unlocked ? PIN_OPEN : PIN_LOCKED}
          tracksViewChanges={false}
        />
      )),
    [markers]
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.bg,
        },
        map: {
          flex: 1,
        },
        loading: {
          ...StyleSheet.absoluteFillObject,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.bg,
        },
        sheet: {
          position: 'absolute',
          left: 12,
          right: 12,
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 14,
          backgroundColor: colors.bgElevated,
          borderWidth: 1,
          borderColor: colors.border,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
            },
            android: { elevation: 8 },
          }),
        },
        sheetHeader: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 8,
          marginBottom: 6,
        },
        sheetTitle: {
          flex: 1,
          fontSize: 17,
          fontWeight: '700',
          color: colors.text,
        },
        sheetClose: {
          padding: 4,
          marginTop: -2,
        },
        statusRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginBottom: 10,
        },
        statusPill: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 999,
        },
        statusPillOpen: {
          backgroundColor: 'rgba(22,163,74,0.2)',
        },
        statusPillLocked: {
          backgroundColor: 'rgba(100,116,139,0.25)',
        },
        statusText: {
          fontSize: 12,
          fontWeight: '600',
        },
        statusTextOpen: {
          color: '#4ADE80',
        },
        statusTextLocked: {
          color: colors.textSecondary,
        },
        statMain: {
          fontSize: 22,
          fontWeight: '800',
          color: colors.primary,
          marginBottom: 2,
        },
        statSub: {
          fontSize: 13,
          color: colors.textSecondary,
          marginBottom: 4,
        },
        statCrow: {
          fontSize: 12,
          color: colors.textMuted,
          marginBottom: 10,
        },
        nearbyHint: {
          fontSize: 12,
          color: '#4ADE80',
          marginBottom: 10,
        },
        errorText: {
          fontSize: 13,
          color: '#F87171',
          marginBottom: 10,
        },
        routeLoadingRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginBottom: 10,
        },
        routeLoadingText: {
          fontSize: 13,
          color: colors.textSecondary,
        },
        actions: {
          flexDirection: 'row',
          gap: 10,
          marginTop: 4,
        },
        btnPrimary: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          paddingVertical: 12,
          borderRadius: 12,
          backgroundColor: colors.primary,
        },
        btnSecondary: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          paddingVertical: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
        },
        btnPrimaryText: {
          fontSize: 15,
          fontWeight: '700',
          color: '#FFFFFF',
        },
        btnSecondaryText: {
          fontSize: 15,
          fontWeight: '600',
          color: colors.text,
        },
        hintBar: {
          position: 'absolute',
          left: 20,
          right: 20,
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 10,
          backgroundColor: 'rgba(15,23,42,0.32)',
        },
        hintText: {
          fontSize: 12,
          color: 'rgba(255,255,255,0.52)',
          textAlign: 'center',
        },
        legend: {
          position: 'absolute',
          right: 12,
          flexDirection: 'row',
          gap: 10,
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 10,
          backgroundColor: 'rgba(15,23,42,0.78)',
        },
        legendItem: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        },
        legendDot: {
          width: 10,
          height: 10,
          borderRadius: 5,
        },
        legendText: {
          fontSize: 11,
          color: 'rgba(255,255,255,0.9)',
        },
      }),
    [colors]
  );

  const mapPadding = useMemo(
    () => ({
      paddingTop: insets.top + 12,
      paddingRight: 12,
      paddingBottom: TAB_BAR_SCROLL_SPACER + Math.max(insets.bottom, 8),
      paddingLeft: 12,
    }),
    [insets.top, insets.bottom]
  );

  const sheetBottom = TAB_BAR_SCROLL_SPACER + Math.max(insets.bottom, 8) + 8;
  const legendTop = 8;
  const hintBottom =
    TAB_BAR_SCROLL_SPACER + Math.max(insets.bottom, 8) - 28;

  const titleText = selectedFigure
    ? labelForBrowseLocale(selectedFigure, locale)
    : '';

  const routeErrorMessage =
    routeErrorKey === 'permission'
      ? t('permissionMessage')
      : routeErrorKey === 'far'
        ? t('mapRouteFar')
        : routeErrorKey === 'failed'
          ? t('mapRouteFailed')
          : null;

  if (!storageLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.activityIndicator} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <MapView
        style={styles.map}
        {...getDarkMapProps()}
        initialRegion={DEFAULT_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        moveOnMarkerPress={false}
        mapPadding={mapPadding}
        onMarkerPress={handleMapMarkerPress}
      >
        {mapMarkers}

        {routeCoords.length >= 2 ? (
          <>
            <Polyline
              coordinates={routeCoords}
              strokeColor={MAP_ROUTE_OUTLINE}
              strokeWidth={10}
              lineCap="round"
              lineJoin="round"
            />
            <Polyline
              coordinates={routeCoords}
              strokeColor={MAP_ROUTE_STROKE}
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          </>
        ) : null}
      </MapView>

      <View style={[styles.legend, { top: legendTop }]} pointerEvents="none">
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#16A34A' }]} />
          <Text style={styles.legendText}>{t('mapLegendOpen')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#64748B' }]} />
          <Text style={styles.legendText}>{t('mapLegendLocked')}</Text>
        </View>
      </View>

      {!selectedFigure ? (
        <View
          style={[styles.hintBar, { bottom: Math.max(52, hintBottom) }]}
          pointerEvents="none"
        >
          <Text style={styles.hintText}>{t('mapTapHint')}</Text>
        </View>
      ) : null}

      {selectedFigure ? (
        <View style={[styles.sheet, { bottom: sheetBottom }]}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle} numberOfLines={2}>
              {titleText}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('mapClose')}
              hitSlop={12}
              style={styles.sheetClose}
              onPress={clearSelection}
            >
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusPill,
                selectedFigure.unlocked
                  ? styles.statusPillOpen
                  : styles.statusPillLocked,
              ]}
            >
              <Ionicons
                name={selectedFigure.unlocked ? 'checkmark-circle' : 'lock-closed'}
                size={14}
                color={selectedFigure.unlocked ? '#4ADE80' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.statusText,
                  selectedFigure.unlocked
                    ? styles.statusTextOpen
                    : styles.statusTextLocked,
                ]}
              >
                {selectedFigure.unlocked
                  ? t('mapStatueUnlocked')
                  : t('mapStatueLocked')}
              </Text>
            </View>
          </View>

          {routeLoading ? (
            <View style={styles.routeLoadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.routeLoadingText}>{t('mapRouteLoading')}</Text>
            </View>
          ) : null}

          {routeErrorMessage ? (
            <Text style={styles.errorText}>{routeErrorMessage}</Text>
          ) : null}

          {routeDistanceM != null && !routeLoading ? (
            <>
              <Text style={styles.statMain}>
                {t('mapRouteWalkDistance', { n: routeDistanceM })}
              </Text>
              {routeDurationS != null ? (
                <Text style={styles.statSub}>
                  {formatDurationMinutes(routeDurationS, t)}
                </Text>
              ) : null}
            </>
          ) : null}

          {crowMeters != null && !routeLoading ? (
            <Text style={styles.statCrow}>
              {t('mapRouteCrowLine', { n: crowMeters })}
            </Text>
          ) : null}

          <MapWalkBankUnlock
            figure={selectedFigure}
            crowMeters={crowMeters}
            onUnlocked={() => {
              setUnlockCelebration({
                title: t('unlockedTitle'),
                lines: [t('foundOne', { name: titleText })],
                detailStatueId: selectedFigure.id,
                collectionKind: COLLECTION_KIND,
              });
            }}
          />

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.btnPrimary,
                pressed && { opacity: 0.88 },
              ]}
              onPress={() =>
                navigation.navigate('Navigate', {
                  targetId: selectedFigure.id,
                  targetLat: Number(selectedFigure.latitude),
                  targetLon: Number(selectedFigure.longitude),
                  targetName: titleText,
                  collectionKind: COLLECTION_KIND,
                })
              }
            >
              <Ionicons name="navigate" size={18} color="#FFFFFF" />
              <Text style={styles.btnPrimaryText}>{t('mapNavigateCta')}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.btnSecondary,
                pressed && { opacity: 0.88 },
              ]}
              onPress={() =>
                navigation.navigate('StatueDetail', {
                  statueId: selectedFigure.id,
                  collectionKind: COLLECTION_KIND,
                })
              }
            >
              <Ionicons name="information-circle-outline" size={18} color={colors.text} />
              <Text style={styles.btnSecondaryText}>{t('mapDetailsCta')}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <UnlockCelebrationOverlay
        visible={unlockCelebration != null}
        onDismiss={() => {
          setUnlockCelebration(null);
          commitHudCollectionProgress();
        }}
        onViewPress={
          unlockCelebration?.detailStatueId != null
            ? () => {
                const id = unlockCelebration.detailStatueId;
                setUnlockCelebration(null);
                navigation.navigate('StatueDetail', {
                  statueId: id,
                  collectionKind: COLLECTION_KIND,
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
