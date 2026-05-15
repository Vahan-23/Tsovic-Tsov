import React, { useEffect, useMemo, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  Alert,
  Animated,
  Easing,
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
import { UNLOCK_RADIUS_METERS } from '../constants/unlockRadius';
import { getDarkMapProps } from '../constants/mapAppearance';
import { useLanguage } from '../context/LanguageContext';
import { useFigures } from '../context/FiguresContext';
import { useSettings } from '../context/SettingsContext';
import { useSearchTarget } from '../context/SearchTargetContext';
import { haversineDistanceMeters } from '../utils/haversine';
import UnlockCelebrationOverlay from './UnlockCelebrationOverlay';

const FOOTPRINT_ICON = require('../../assets/footprints_21766.png');
const SEARCH_ICONS = [
  require('../../assets/search_ico/cascade.png'),
  require('../../assets/search_ico/monument.png'),
  require('../../assets/search_ico/opera.png'),
  require('../../assets/search_ico/dav.png'),
];

const MIN_SEARCH_MS = 1800;

/** Idle: very slow gentle 3D turn (rotateY) left→center→right→center; small angle keeps face visible. */
const IDLE_WOBBLE_HALF_MS = 5200;
/** Tap: one full 3D flip around vertical axis (rotateY 360°), then search starts. */
const BURST_FLIP_MS = 620;
/** Peak rotateY — keep low so the disk still reads “mostly frontal”. */
const WOBBLE_Y_DEG = 6;

const BTN = 200;
const CORE = 158;
const RING_FADE_IN_MS = 420;
const RING_FADE_OUT_MS = 560;

const RADAR_LAYOUT = {
  default: {
    wrapMarginTop: -26,
    radarScaleMin: 0.58,
    radarScaleMax: 1.42,
    pulseOuterMax: 1.12,
    pulseInnerMax: 1.08,
    radarBorderMax: 5,
    useStage: false,
    stageSize: 0,
  },
  home: {
    wrapMarginTop: 0,
    radarScaleMin: 0.58,
    radarScaleMax: 1.28,
    pulseOuterMax: 1.08,
    pulseInnerMax: 1.05,
    radarBorderMax: 5,
    useStage: false,
    stageSize: 0,
  },
};

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
  layout = 'default',
  celebrationHidden = false,
  beginCelebrationDetailPeek,
}) {
  const radarLayout = RADAR_LAYOUT[layout] ?? RADAR_LAYOUT.default;
  const navigationFallback = useNavigation();
  const navigation = navigationProp ?? navigationFallback;
  const { t, stringsForLocale } = useLanguage();
  const { colors } = useSettings();
  const pulseAnim = useRef(new Animated.Value(0)).current;
  /** 0 = idle rings, 1 = active radar sweep — crossfades both layers. */
  const ringMode = useRef(new Animated.Value(0)).current;
  /** 0 → −deg, 0.5 → face-on, 1 → +deg — slow vertical-axis drift (before & after search). */
  const idleWobble = useRef(new Animated.Value(0)).current;
  const burstSpin = useRef(new Animated.Value(0)).current;
  const searchIconOpacity = useRef(new Animated.Value(1)).current;
  const radarAnims = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0))
  ).current;
  const radarLoopsRef = useRef([]);
  const [isChecking, setIsChecking] = React.useState(false);
  const [windingUp, setWindingUp] = React.useState(false);
  const [guidance, setGuidance] = React.useState(null);
  const [mapVisible, setMapVisible] = React.useState(false);
  const [searchIconIndex, setSearchIconIndex] = React.useState(0);
  const [liveUserCoords, setLiveUserCoords] = React.useState(null);
  const [liveDistanceMeters, setLiveDistanceMeters] = React.useState(null);
  const [liveAzimuthDeg, setLiveAzimuthDeg] = React.useState(null);
  const [unlockCelebration, setUnlockCelebration] = React.useState(null);
  const liveUserCoordsRef = useRef(null);
  liveUserCoordsRef.current = liveUserCoords;
  const modalMapRef = useRef(null);
  const {
    radarTargetsForMode,
    storageLoaded,
    unlockForSearchMode,
    commitHudCollectionProgress,
  } = useFigures();
  const { searchMode } = useSearchTarget();

  const targets = useMemo(
    () => radarTargetsForMode(searchMode),
    [radarTargetsForMode, searchMode]
  );

  const directions = stringsForLocale.directions;
  const radarActive = isChecking || windingUp;

  useEffect(() => {
    Animated.timing(ringMode, {
      toValue: radarActive ? 1 : 0,
      duration: radarActive ? RING_FADE_IN_MS : RING_FADE_OUT_MS,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [radarActive, ringMode]);

  const idleRingOpacity = useMemo(
    () =>
      ringMode.interpolate({
        inputRange: [0, 0.4, 1],
        outputRange: [1, 0.12, 0],
      }),
    [ringMode]
  );

  const activeRingOpacity = useMemo(
    () =>
      ringMode.interpolate({
        inputRange: [0, 0.18, 1],
        outputRange: [0, 0.55, 1],
      }),
    [ringMode]
  );

  useEffect(() => {
    if (radarActive) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 850,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 850,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [radarActive, pulseAnim]);

  /** Idle: smooth slow rotateY sway — pauses only during tap flip / radar. */
  useEffect(() => {
    if (isChecking || windingUp) {
      idleWobble.stopAnimation();
      return;
    }
    idleWobble.setValue(0);
    const loopAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(idleWobble, {
          toValue: 1,
          duration: IDLE_WOBBLE_HALF_MS,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(idleWobble, {
          toValue: 0,
          duration: IDLE_WOBBLE_HALF_MS,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );
    loopAnim.start();
    return () => {
      loopAnim.stop();
      idleWobble.stopAnimation();
    };
  }, [isChecking, windingUp, idleWobble]);

  useEffect(() => {
    if (!radarActive) return undefined;

    radarLoopsRef.current.forEach((loop) => loop.stop());
    radarLoopsRef.current = radarAnims.map((value, index) =>
      Animated.loop(
        Animated.timing(value, {
          toValue: 1,
          duration: 1500,
          delay: index * 140,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        })
      )
    );
    radarLoopsRef.current.forEach((loop) => loop.start());

    return undefined;
  }, [radarActive, radarAnims]);

  useEffect(() => {
    if (radarActive) return undefined;

    const timeout = setTimeout(() => {
      radarLoopsRef.current.forEach((loop) => loop.stop());
      radarLoopsRef.current = [];
      radarAnims.forEach((value) => value.setValue(0));
    }, RING_FADE_OUT_MS);

    return () => clearTimeout(timeout);
  }, [radarActive, radarAnims]);

  useEffect(
    () => () => {
      radarLoopsRef.current.forEach((loop) => loop.stop());
      radarLoopsRef.current = [];
    },
    []
  );

  useEffect(() => {
    if (!isChecking) return undefined;
    const timer = setInterval(() => {
      Animated.sequence([
        Animated.timing(searchIconOpacity, {
          toValue: 0.15,
          duration: 85,
          useNativeDriver: true,
        }),
        Animated.timing(searchIconOpacity, {
          toValue: 1,
          duration: 105,
          useNativeDriver: true,
        }),
      ]).start();
      setSearchIconIndex((prev) => (prev + 1) % SEARCH_ICONS.length);
    }, 280);
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

  const scheduleModalMapFit = React.useCallback(() => {
    const tLat = guidance?.targetLat;
    const tLon = guidance?.targetLon;
    if (!Number.isFinite(tLat) || !Number.isFinite(tLon)) return;
    const map = modalMapRef.current;
    if (!map || typeof map.fitToCoordinates !== 'function') return;
    const goal = { latitude: tLat, longitude: tLon };
    const u = liveUserCoordsRef.current;
    const coords =
      u && Number.isFinite(u.latitude) && Number.isFinite(u.longitude)
        ? [u, goal]
        : [goal];
    map.fitToCoordinates(coords, {
      edgePadding: { top: 44, right: 44, bottom: 44, left: 44 },
      animated: true,
    });
  }, [guidance?.targetLat, guidance?.targetLon]);

  React.useEffect(() => {
    if (!mapVisible || !Number.isFinite(guidance?.targetLat)) return;
    let cancelled = false;
    const run = () => {
      if (!cancelled) scheduleModalMapFit();
    };
    const a = setTimeout(run, 140);
    const b = setTimeout(run, 880);
    return () => {
      cancelled = true;
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [
    mapVisible,
    guidance?.targetId,
    guidance?.targetLat,
    guidance?.targetLon,
    scheduleModalMapFit,
  ]);

  const shownDistanceMeters = liveDistanceMeters ?? guidance?.distanceMeters ?? 0;
  const shownAzimuthDeg = liveAzimuthDeg ?? guidance?.azimuthDeg ?? 0;

  const runCheckNearby = React.useCallback(async () => {
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
        const latDeltaMax = UNLOCK_RADIUS_METERS / 111000;
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
          return distance < UNLOCK_RADIUS_METERS;
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
            outcome = {
              type: 'empty',
              title: t('emptyStatueTitle'),
              message: t('emptyStatueMessage'),
            };
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
          const unlockedItems = [];
          nearbyLockedStatues.forEach((figure) => {
            const result = unlockForSearchMode(searchMode, figure.id);
            if (result.ok && !result.alreadyHad) {
              unlockedItems.push({
                id: figure.id,
                name: figure.displayName ?? figure.name,
                rarity: figure.rarity,
              });
            }
          });

          if (unlockedItems.length === 0) {
            outcome = {
              type: 'nonew',
              title: t('noticeTitle'),
              message: t('noNewUnlockMessage'),
            };
            setGuidance(null);
          } else {
            outcome = {
              type: 'success',
              title: t('unlockedTitle'),
              unlockedItems,
              collectionKind: searchMode,
            };
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
      } else if (outcome.type === 'success') {
        setUnlockCelebration({
          title: outcome.title,
          unlockedItems: outcome.unlockedItems,
          variant: 'success',
          collectionKind: outcome.collectionKind,
        });
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

  /** Perspective + idle tilt — only on core stack (rings stay flat & circular). */
  const coreOuter3DStyle = useMemo(
    () => ({
      transform: [
        { perspective: 1000 },
        {
          rotateY: idleWobble.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [
              `-${WOBBLE_Y_DEG}deg`,
              '0deg',
              `${WOBBLE_Y_DEG}deg`,
            ],
          }),
        },
      ],
    }),
    [idleWobble]
  );

  /** One full “coin” flip on tap (3D rotateY), subtle scale for punch. */
  const coreInnerBurstStyle = useMemo(
    () => ({
      transform: [
        {
          rotateY: burstSpin.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
          }),
        },
        {
          scale: burstSpin.interpolate({
            inputRange: [0, 0.12, 1],
            outputRange: [1, 1.08, 1],
          }),
        },
      ],
    }),
    [burstSpin]
  );

  const onMedallionPress = React.useCallback(() => {
    if (isChecking || windingUp) return;
    setWindingUp(true);
    idleWobble.stopAnimation();
    idleWobble.setValue(0.5);
    burstSpin.setValue(0);
    Animated.timing(burstSpin, {
      toValue: 1,
      duration: BURST_FLIP_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      burstSpin.setValue(0);
      setWindingUp(false);
      if (finished) {
        void runCheckNearby();
      }
    });
  }, [isChecking, windingUp, burstSpin, idleWobble, runCheckNearby]);

  if (!storageLoaded) {
    return null;
  }

  const wrapStyle = [
    styles.wrap,
    { marginTop: radarLayout.wrapMarginTop },
    radarLayout.useStage && styles.wrapHome,
  ];
  const medallion = (
    <Pressable
      style={({ pressed }) => [
        styles.scanButton,
        pressed && styles.scanButtonPressed,
      ]}
      onPress={onMedallionPress}
      disabled={isChecking || windingUp}
    >
      <View style={styles.ringLayer} pointerEvents="none">
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pulseRingOuter,
            { borderColor: colors.primary },
            {
              opacity: Animated.multiply(
                pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.45, 0.15],
                }),
                idleRingOpacity
              ),
              transform: [
                {
                  scale: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, radarLayout.pulseOuterMax],
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
            { borderColor: colors.primaryMuted },
            {
              opacity: Animated.multiply(
                pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.55, 0.22],
                }),
                idleRingOpacity
              ),
              transform: [
                {
                  scale: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, radarLayout.pulseInnerMax],
                  }),
                },
              ],
            },
          ]}
        />
        {radarAnims.map((radar, idx) => (
          <Animated.View
            key={`radar-${idx}`}
            style={[
              styles.radarWave,
              {
                borderWidth: radar.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, radarLayout.radarBorderMax],
                }),
                opacity: Animated.multiply(
                  radar.interpolate({
                    inputRange: [0, 0.7, 1],
                    outputRange: [0.75, 0.38, 0],
                  }),
                  activeRingOpacity
                ),
                transform: [
                  {
                    scale: radar.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        radarLayout.radarScaleMin,
                        radarLayout.radarScaleMax,
                      ],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>

      <Animated.View style={[styles.core3DHost, coreOuter3DStyle]}>
        <Animated.View style={coreInnerBurstStyle}>
          <View
            style={[
              styles.scanButtonCore,
              { backgroundColor: colors.radarCore },
            ]}
          >
            {isChecking ? (
              <Animated.Image
                source={SEARCH_ICONS[searchIconIndex]}
                style={[styles.searchCycleIcon, { opacity: searchIconOpacity }]}
              />
            ) : (
              <Text
                style={[
                  styles.scanButtonIcon,
                  { color: colors.radarTextOnCore },
                ]}
              >
                ⌕
              </Text>
            )}
            {!isChecking ? (
              <Text style={[styles.scanButtonText, { color: colors.radarTextOnCore }]}>
                {t('discoverSearch')}
              </Text>
            ) : null}
          </View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );

  return (
    <View style={wrapStyle}>
      {medallion}
      <Text
        style={[
          styles.scanHint,
          radarLayout.useStage && styles.scanHintHome,
          { color: colors.textSecondary },
        ]}
      >
        {isChecking
          ? t('discoverSearching')
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
            {Number.isFinite(guidance?.targetLat) &&
            Number.isFinite(guidance?.targetLon) ? (
              <MapView
                {...getDarkMapProps()}
                ref={modalMapRef}
                style={styles.modalMap}
                initialRegion={{
                  latitude: guidance.targetLat,
                  longitude: guidance.targetLon,
                  latitudeDelta: 0.007,
                  longitudeDelta: 0.007,
                }}
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

      <UnlockCelebrationOverlay
        visible={unlockCelebration != null}
        hiddenForPeek={celebrationHidden}
        onDismiss={() => {
          setUnlockCelebration(null);
          commitHudCollectionProgress();
        }}
        onViewPress={
          unlockCelebration?.unlockedItems?.length === 1
            ? () => {
                const id = unlockCelebration.unlockedItems[0].id;
                const kind = unlockCelebration.collectionKind ?? 'statues';
                beginCelebrationDetailPeek?.();
                navigation.navigate('StatueDetail', {
                  statueId: id,
                  collectionKind: kind,
                });
              }
            : undefined
        }
        onItemPress={(id) => {
          const kind = unlockCelebration?.collectionKind ?? 'statues';
          beginCelebrationDetailPeek?.();
          navigation.navigate('StatueDetail', {
            statueId: id,
            collectionKind: kind,
          });
        }}
        title={unlockCelebration?.title ?? ''}
        unlockedItems={unlockCelebration?.unlockedItems ?? []}
        variant={unlockCelebration?.variant ?? 'success'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: '100%',
  },
  wrapHome: {
    justifyContent: 'center',
  },
  scanButton: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  scanButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  ringLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  core3DHost: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRingOuter: {
    position: 'absolute',
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    left: '50%',
    top: '50%',
    marginLeft: -BTN / 2,
    marginTop: -BTN / 2,
    borderWidth: 2,
    borderColor: '#5B63E8',
  },
  pulseRingInner: {
    position: 'absolute',
    width: 174,
    height: 174,
    borderRadius: 87,
    left: '50%',
    top: '50%',
    marginLeft: -87,
    marginTop: -87,
    borderWidth: 2,
    borderColor: '#A3AAF5',
  },
  radarWave: {
    position: 'absolute',
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    left: '50%',
    top: '50%',
    marginLeft: -BTN / 2,
    marginTop: -BTN / 2,
    borderColor: '#22C55E',
  },
  scanButtonCore: {
    width: CORE,
    height: CORE,
    borderRadius: CORE / 2,
    backgroundColor: '#1A2233',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  scanButtonIcon: {
    color: '#FFFFFF',
    fontSize: 34,
    marginBottom: 4,
  },
  searchCycleIcon: {
    width: 86,
    height: 86,
    marginBottom: 2,
    resizeMode: 'contain',
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  scanHint: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 28,
    lineHeight: 20,
  },
  scanHintHome: {
    marginTop: 28,
    maxWidth: 280,
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
