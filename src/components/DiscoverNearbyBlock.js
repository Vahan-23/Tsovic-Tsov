import React, { useEffect, useMemo, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { POSITION_MAX_ACCURACY, WATCH_MODAL_MAP } from '../constants/gpsAccuracy';
import { getDarkMapProps } from '../constants/mapAppearance';
import { useLanguage } from '../context/LanguageContext';
import { useFigures } from '../context/FiguresContext';
import { useSearchTarget } from '../context/SearchTargetContext';
import { haversineDistanceMeters } from '../utils/haversine';

const FOOTPRINT_ICON = require('../../assets/footprints_21766.png');
const SEARCH_ICONS = [
  require('../../assets/search_ico/Gemini_Generated_Image_rcrvqkrcrvqkrcrv.png'),
  require('../../assets/search_ico/Gemini_Generated_Image_6b1xyb6b1xyb6b1x.png'),
  require('../../assets/search_ico/Gemini_Generated_Image_jwomxqjwomxqjwom.png'),
];

const UNLOCK_DISTANCE_METERS = 50;
const MIN_SEARCH_MS = 1800;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

function getDirectionLabel(bearing, directions) {
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

export default function DiscoverNearbyBlock({
  navigation: navigationProp,
  variant = 'default',
}) {
  const navigationFallback = useNavigation();
  const navigation = navigationProp ?? navigationFallback;
  const { t, stringsForLocale } = useLanguage();
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const searchIconOpacity = useRef(new Animated.Value(1)).current;
  const radarAnims = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0))
  ).current;
  const radarLoopsRef = useRef([]);
  const [isChecking, setIsChecking] = React.useState(false);
  const [guidance, setGuidance] = React.useState(null);
  const [mapVisible, setMapVisible] = React.useState(false);
  const [searchIconIndex, setSearchIconIndex] = React.useState(0);
  const [liveUserCoords, setLiveUserCoords] = React.useState(null);
  const [liveDistanceMeters, setLiveDistanceMeters] = React.useState(null);
  const [liveAzimuthDeg, setLiveAzimuthDeg] = React.useState(null);
  const { radarTargetsForMode, storageLoaded, unlockForSearchMode } = useFigures();
  const { searchMode } = useSearchTarget();

  const targets = useMemo(
    () => radarTargetsForMode(searchMode),
    [radarTargetsForMode, searchMode]
  );

  const directions = stringsForLocale.directions;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 850,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  useEffect(() => {
    if (!isChecking) {
      radarLoopsRef.current.forEach((loop) => loop.stop());
      radarLoopsRef.current = [];
      radarAnims.forEach((value) => value.setValue(0));
      return;
    }

    radarLoopsRef.current = radarAnims.map((value, index) =>
      Animated.loop(
        Animated.timing(value, {
          toValue: 1,
          duration: 1500,
          delay: index * 140,
          useNativeDriver: false,
        })
      )
    );

    radarLoopsRef.current.forEach((loop) => loop.start());

    return () => {
      radarLoopsRef.current.forEach((loop) => loop.stop());
      radarLoopsRef.current = [];
    };
  }, [isChecking, radarAnims]);

  useEffect(() => {
    if (!isChecking) return undefined;
    const timer = setInterval(() => {
      Animated.sequence([
        Animated.timing(searchIconOpacity, {
          toValue: 0.15,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(searchIconOpacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
      setSearchIconIndex((prev) => (prev + 1) % SEARCH_ICONS.length);
    }, 380);
    return () => clearInterval(timer);
  }, [isChecking, searchIconOpacity]);

  useEffect(() => {
    let watcher = null;
    let isActive = true;

    async function startLiveTracking() {
      if (!mapVisible || !guidance?.targetLat || !guidance?.targetLon) {
        setLiveUserCoords(null);
        setLiveDistanceMeters(null);
        setLiveAzimuthDeg(null);
        return;
      }

      try {
        watcher = await Location.watchPositionAsync(
          WATCH_MODAL_MAP,
          (position) => {
            if (!isActive) return;
            const current = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            const target = {
              latitude: guidance.targetLat,
              longitude: guidance.targetLon,
            };
            setLiveUserCoords(current);
            setLiveDistanceMeters(
              Math.max(0, Math.round(haversineDistanceMeters(current, target)))
            );
            setLiveAzimuthDeg(Math.round(getBearingDegrees(current, target)));
          }
        );
      } catch {
        if (!isActive) return;
        setLiveUserCoords(null);
      }
    }

    startLiveTracking();

    return () => {
      isActive = false;
      if (watcher) watcher.remove();
    };
  }, [guidance?.targetLat, guidance?.targetLon, mapVisible]);

  const modalMapRegion = useMemo(() => {
    const targetLat = guidance?.targetLat;
    const targetLon = guidance?.targetLon;
    if (!Number.isFinite(targetLat) || !Number.isFinite(targetLon)) return null;

    const userLat = liveUserCoords?.latitude;
    const userLon = liveUserCoords?.longitude;
    if (!Number.isFinite(userLat) || !Number.isFinite(userLon)) {
      return {
        latitude: targetLat,
        longitude: targetLon,
        latitudeDelta: 0.006,
        longitudeDelta: 0.006,
      };
    }

    const latitude = (userLat + targetLat) / 2;
    const longitude = (userLon + targetLon) / 2;
    const latitudeDelta = Math.max(Math.abs(userLat - targetLat) * 2.6, 0.0045);
    const longitudeDelta = Math.max(Math.abs(userLon - targetLon) * 2.6, 0.0045);
    return { latitude, longitude, latitudeDelta, longitudeDelta };
  }, [guidance?.targetLat, guidance?.targetLon, liveUserCoords?.latitude, liveUserCoords?.longitude]);

  const shownDistanceMeters = liveDistanceMeters ?? guidance?.distanceMeters ?? 0;
  const shownAzimuthDeg = liveAzimuthDeg ?? guidance?.azimuthDeg ?? 0;

  const handleCheckNearby = React.useCallback(async () => {
    if (isChecking) return;
    setIsChecking(true);
    setGuidance(null);
    const startedAt = Date.now();

    try {
      let outcome = { type: 'none' };
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        outcome = {
          type: 'permission',
          title: t('permissionTitle'),
          message: t('permissionMessage'),
        };
      } else {
        const location = await Location.getCurrentPositionAsync(
          POSITION_MAX_ACCURACY
        );

        const userLat = location.coords.latitude;
        const userLon = location.coords.longitude;
        const userLatRad = (userLat * Math.PI) / 180;
        const latDeltaMax = UNLOCK_DISTANCE_METERS / 111000;
        const cosLat = Math.cos(userLatRad);
        const lonDeltaMax = cosLat > 1e-6 ? latDeltaMax / cosLat : Infinity;

        const nearbyLockedStatues = targets.filter((figure) => {
          if (figure.unlocked) return false;
          if (
            !Number.isFinite(figure.latitude) ||
            !Number.isFinite(figure.longitude)
          ) {
            return false;
          }
          if (Math.abs(figure.latitude - userLat) > latDeltaMax) return false;
          if (Math.abs(figure.longitude - userLon) > lonDeltaMax) return false;

          const distance = haversineDistanceMeters(
            { latitude: userLat, longitude: userLon },
            { latitude: figure.latitude, longitude: figure.longitude }
          );
          return distance < UNLOCK_DISTANCE_METERS;
        });

        if (nearbyLockedStatues.length === 0) {
          let nearestFigure = null;
          let nearestDistance = Number.POSITIVE_INFINITY;

          for (const figure of targets) {
            if (figure.unlocked) continue;
            if (!Number.isFinite(figure.latitude) || !Number.isFinite(figure.longitude)) {
              continue;
            }
            const distance = haversineDistanceMeters(
              { latitude: userLat, longitude: userLon },
              { latitude: figure.latitude, longitude: figure.longitude }
            );
            if (distance < nearestDistance) {
              nearestDistance = distance;
              nearestFigure = figure;
            }
          }

          if (!nearestFigure || !Number.isFinite(nearestDistance)) {
            const empty =
              searchMode === 'pulpulaks'
                ? { title: t('emptyPulpulakTitle'), message: t('emptyPulpulakMessage') }
                : searchMode === 'statues3d'
                  ? { title: t('emptyStatue3dTitle'), message: t('emptyStatue3dMessage') }
                  : { title: t('emptyStatueTitle'), message: t('emptyStatueMessage') };
            outcome = { type: 'empty', ...empty };
            setGuidance(null);
          } else {
            const distanceMeters = Math.round(nearestDistance);
            const bearing = getBearingDegrees(
              { latitude: userLat, longitude: userLon },
              {
                latitude: nearestFigure.latitude,
                longitude: nearestFigure.longitude,
              }
            );
            const direction = getDirectionLabel(bearing, directions);
            let heading = 0;
            try {
              const headingResult = await Location.getHeadingAsync();
              heading =
                Number.isFinite(headingResult?.trueHeading) &&
                headingResult.trueHeading >= 0
                  ? headingResult.trueHeading
                  : Number.isFinite(headingResult?.magHeading)
                    ? headingResult.magHeading
                    : 0;
            } catch {
              heading = 0;
            }
            const turnDelta = ((bearing - heading + 540) % 360) - 180;
            setGuidance({
              targetId: nearestFigure.id,
              targetName: nearestFigure.displayName ?? nearestFigure.name,
              targetLat: nearestFigure.latitude,
              targetLon: nearestFigure.longitude,
              distanceMeters,
              targetImage: nearestFigure.image || '',
              directionLabel: `${direction.arrow} ${direction.label}`,
              azimuthDeg: Math.round(bearing),
              rotationDeg: Math.round(turnDelta),
            });
            outcome = { type: 'modal' };
          }
        } else {
          const discovered = [];
          nearbyLockedStatues.forEach((figure) => {
            const result = unlockForSearchMode(searchMode, figure.id);
            if (result.ok && !result.alreadyHad) {
              discovered.push(figure.displayName ?? figure.name);
            }
          });

          if (discovered.length === 0) {
            outcome = {
              type: 'nonew',
              title: t('noticeTitle'),
              message: t('noNewUnlockMessage'),
            };
            setGuidance(null);
          } else {
            const message =
              discovered.length === 1
                ? t('foundOne', { name: discovered[0] })
                : discovered.map((name) => t('foundManyLine', { name })).join('\n');
            outcome = { type: 'success', title: t('unlockedTitle'), message };
            setGuidance(null);
          }
        }
      }

      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_SEARCH_MS) {
        await wait(MIN_SEARCH_MS - elapsed);
      }

      if (outcome.type === 'modal') {
        setMapVisible(true);
      } else if (outcome.type !== 'none') {
        Alert.alert(outcome.title, outcome.message);
      }
    } catch {
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_SEARCH_MS) {
        await wait(MIN_SEARCH_MS - elapsed);
      }
      Alert.alert(t('errorTitle'), t('errorLocationMessage'));
    } finally {
      setIsChecking(false);
    }
  }, [directions, targets, isChecking, t, unlockForSearchMode, searchMode]);

  if (!storageLoaded) {
    return null;
  }

  const isTabBar = variant === 'tabBar';

  return (
    <View style={[styles.wrap, isTabBar && styles.wrapTabBar]}>
      <Pressable
        style={({ pressed }) => [
          styles.scanButton,
          isTabBar && styles.scanButtonTabBar,
          pressed && styles.scanButtonPressed,
        ]}
        onPress={handleCheckNearby}
        disabled={isChecking}
      >
        {isChecking ? (
          <>
            {radarAnims.map((radar, idx) => (
              <Animated.View
                key={`radar-${idx}`}
                pointerEvents="none"
                style={[
                  styles.radarWave,
                  isTabBar && styles.radarWaveTabBar,
                  {
                    borderWidth: radar.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 5],
                    }),
                    opacity: radar.interpolate({
                      inputRange: [0, 0.7, 1],
                      outputRange: [0.75, 0.38, 0],
                    }),
                    transform: [
                      {
                        scale: radar.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.58, 1.42],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          </>
        ) : (
          <>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.pulseRingOuter,
                isTabBar && styles.pulseRingOuterTabBar,
                {
                  opacity: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.45, 0.15],
                  }),
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.12],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View
              pointerEvents="none"
              style={[
                styles.pulseRingInner,
                isTabBar && styles.pulseRingInnerTabBar,
                {
                  opacity: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.55, 0.22],
                  }),
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.08],
                      }),
                    },
                  ],
                },
              ]}
            />
          </>
        )}
        <View style={[styles.scanButtonCore, isTabBar && styles.scanButtonCoreTabBar]}>
          {isChecking ? (
            <Animated.Image
              source={SEARCH_ICONS[searchIconIndex]}
              style={[
                styles.searchCycleIcon,
                isTabBar && styles.searchCycleIconTabBar,
                { opacity: searchIconOpacity },
              ]}
            />
          ) : (
            <Text style={[styles.scanButtonIcon, isTabBar && styles.scanButtonIconTabBar]}>
              ⌕
            </Text>
          )}
          {!isChecking && !isTabBar ? (
            <Text style={styles.scanButtonText}>{t('discoverSearch')}</Text>
          ) : null}
        </View>
      </Pressable>
      <Text
        style={[styles.scanHint, isTabBar && styles.scanHintTabBar]}
        numberOfLines={isTabBar ? 1 : undefined}
      >
        {isChecking
          ? t('discoverSearching')
          : isTabBar
            ? t('discoverSearch')
            : t('discoverHintIdle')}
      </Text>

      <Modal
        visible={mapVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMapVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('modalNearbyTarget')}</Text>
            {modalMapRegion ? (
              <MapView
                {...getDarkMapProps()}
                style={styles.modalMap}
                region={modalMapRegion}
                pitchEnabled={false}
                rotateEnabled={false}
                toolbarEnabled={false}
              >
                {liveUserCoords ? (
                  <Marker coordinate={liveUserCoords} title={t('modalYou')} pinColor="#22C55E" />
                ) : null}
                {Number.isFinite(guidance?.targetLat) && Number.isFinite(guidance?.targetLon) ? (
                  <Marker
                    coordinate={{
                      latitude: guidance.targetLat,
                      longitude: guidance.targetLon,
                    }}
                    title={guidance?.targetName ?? t('modalGoal')}
                    pinColor="#EF4444"
                  />
                ) : null}
                {liveUserCoords &&
                Number.isFinite(guidance?.targetLat) &&
                Number.isFinite(guidance?.targetLon) ? (
                  <Polyline
                    coordinates={[
                      liveUserCoords,
                      {
                        latitude: guidance.targetLat,
                        longitude: guidance.targetLon,
                      },
                    ]}
                    strokeColor="#60A5FA"
                    strokeWidth={3}
                  />
                ) : null}
              </MapView>
            ) : null}
            {guidance?.targetImage ? (
              <Image
                source={{ uri: guidance.targetImage }}
                style={styles.modalTargetImage}
                resizeMode="cover"
              />
            ) : null}
            <Text style={styles.modalHint}>
              {t('modalTargetPrefix')} {guidance?.targetName ?? '-'} •{' '}
              {guidance?.directionLabel ?? '-'}
            </Text>
            <Text style={styles.modalStatMain}>
              {t('distanceMeters', { n: shownDistanceMeters })}
            </Text>
            <Text style={styles.modalStatSub}>
              {t('modalAzimuth')} {shownAzimuthDeg}°
            </Text>
            <View style={styles.modalButtonsRow}>
              <Pressable
                style={({ pressed }) => [styles.modalGoButton, pressed && { opacity: 0.85 }]}
                onPress={() => {
                  const targetId = guidance?.targetId;
                  const targetLat = guidance?.targetLat;
                  const targetLon = guidance?.targetLon;
                  const targetName = guidance?.targetName;
                  setMapVisible(false);
                  navigation.navigate('Navigate', {
                    targetId,
                    targetLat: Number(targetLat),
                    targetLon: Number(targetLon),
                    targetName,
                    collectionKind: searchMode,
                  });
                }}
              >
                <Text style={styles.modalGoButtonText}>{t('modalGo')}</Text>
                <Image source={FOOTPRINT_ICON} style={styles.modalGoIcon} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.okButton, pressed && { opacity: 0.85 }]}
                onPress={() => setMapVisible(false)}
              >
                <Text style={styles.okButtonText}>{t('modalClose')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: '100%',
  },
  wrapTabBar: {
    maxWidth: 124,
    alignSelf: 'center',
  },
  scanButton: {
    width: 182,
    height: 182,
    borderRadius: 91,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  /** Bottom tab — larger than side icons so the radar stays the primary control. */
  scanButtonTabBar: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  scanButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  pulseRingOuter: {
    position: 'absolute',
    width: 182,
    height: 182,
    borderRadius: 91,
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  pulseRingOuterTabBar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
  },
  pulseRingInner: {
    position: 'absolute',
    width: 158,
    height: 158,
    borderRadius: 79,
    borderWidth: 2,
    borderColor: '#818CF8',
  },
  pulseRingInnerTabBar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
  },
  radarWave: {
    position: 'absolute',
    width: 182,
    height: 182,
    borderRadius: 91,
    borderColor: '#22C55E',
  },
  radarWaveTabBar: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  scanButtonCore: {
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  scanButtonCoreTabBar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 8,
  },
  scanButtonIcon: {
    color: '#FFFFFF',
    fontSize: 34,
    marginBottom: 4,
  },
  scanButtonIconTabBar: {
    fontSize: 28,
    marginBottom: 0,
  },
  searchCycleIcon: {
    width: 78,
    height: 78,
    marginBottom: 2,
    resizeMode: 'contain',
  },
  searchCycleIconTabBar: {
    width: 40,
    height: 40,
    marginBottom: 0,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  scanHint: {
    marginTop: 14,
    color: '#4B5563',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  scanHintTabBar: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 13,
    paddingHorizontal: 2,
    color: '#374151',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.64)',
    justifyContent: 'center',
    padding: 14,
  },
  modalCard: {
    backgroundColor: '#0b0b0b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    padding: 12,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  modalHint: {
    color: '#d4d4d4',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 8,
  },
  modalMap: {
    width: '100%',
    height: 210,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  modalTargetImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginTop: 10,
    backgroundColor: '#111',
  },
  modalStatMain: {
    color: '#FFFFFF',
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  modalStatSub: {
    color: '#E5E7EB',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 12,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  okButton: {
    backgroundColor: '#16A34A',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  okButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  modalGoButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalGoIcon: {
    width: 16,
    height: 16,
    tintColor: '#FFFFFF',
  },
  modalGoButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
});
