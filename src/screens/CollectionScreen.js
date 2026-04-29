import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFigures } from '../context/FiguresContext';
import { haversineDistanceMeters } from '../utils/haversine';
import MiniMap from '../components/MiniMap';

const FOOTPRINT_ICON = require('../../assets/footprints_21766.png');

const ACCENT = {
  abovyan: '#7C3AED',
  komitas: '#059669',
  tumanyan: '#D97706',
};
const UNLOCK_DISTANCE_METERS = 50;
const MIN_SEARCH_MS = 3000;

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

function getDirectionLabel(bearing) {
  const directions = [
    { label: 'Հյուսիս', arrow: '↑' },
    { label: 'Հյուսիս-Արևելք', arrow: '↗' },
    { label: 'Արևելք', arrow: '→' },
    { label: 'Հարավ-Արևելք', arrow: '↘' },
    { label: 'Հարավ', arrow: '↓' },
    { label: 'Հարավ-Արևմուտք', arrow: '↙' },
    { label: 'Արևմուտք', arrow: '←' },
    { label: 'Հյուսիս-Արևմուտք', arrow: '↖' },
  ];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

export default function CollectionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const radarAnims = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0))
  ).current;
  const radarLoopsRef = useRef([]);
  const [isChecking, setIsChecking] = React.useState(false);
  const [guidance, setGuidance] = React.useState(null);
  const [mapVisible, setMapVisible] = React.useState(false);
  const {
    figures,
    unlockedCount,
    totalCount,
    storageLoaded,
    unlockById,
  } = useFigures();

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1200,
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
          duration: 2200,
          delay: index * 260,
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
          title: 'Թույլտվություն',
          message: 'Խնդրում ենք թույլատրել տեղադրության հասանելիությունը։',
        };
      } else {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const nearbyLockedStatues = figures.filter((figure) => {
          if (figure.unlocked) return false;
          const distance = haversineDistanceMeters(
            { latitude: location.coords.latitude, longitude: location.coords.longitude },
            { latitude: figure.latitude, longitude: figure.longitude }
          );
          return distance < UNLOCK_DISTANCE_METERS;
        });

        if (nearbyLockedStatues.length === 0) {
          const lockedWithDistance = figures
            .filter((figure) => !figure.unlocked)
            .map((figure) => {
              const distance = haversineDistanceMeters(
                { latitude: location.coords.latitude, longitude: location.coords.longitude },
                { latitude: figure.latitude, longitude: figure.longitude }
              );
              return { figure, distance };
            })
            .filter((row) => Number.isFinite(row.distance))
            .sort((a, b) => a.distance - b.distance);

          if (lockedWithDistance.length === 0) {
            outcome = {
              type: 'empty',
              title: 'Արձան չգտնվեց',
              message: 'Բոլոր արձանները արդեն բացված են։',
            };
            setGuidance(null);
          } else {
            const nearest = lockedWithDistance[0];
            const metersLeft = Math.max(
              0,
              Math.round(nearest.distance - UNLOCK_DISTANCE_METERS)
            );
            const bearing = getBearingDegrees(
              { latitude: location.coords.latitude, longitude: location.coords.longitude },
              {
                latitude: nearest.figure.latitude,
                longitude: nearest.figure.longitude,
              }
            );
            const direction = getDirectionLabel(bearing);
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
              targetName: nearest.figure.name,
              metersLeft,
              directionLabel: `${direction.arrow} ${direction.label}`,
              azimuthDeg: Math.round(bearing),
              rotationDeg: Math.round(turnDelta),
            });
            setMapVisible(true);
            outcome = { type: 'modal' };
          }
        } else {
          const discovered = [];
          nearbyLockedStatues.forEach((figure) => {
            const result = unlockById(figure.id);
            if (result.ok && !result.alreadyHad) discovered.push(figure.name);
          });

          if (discovered.length === 0) {
            outcome = {
              type: 'nonew',
              title: 'Տեղեկացում',
              message: 'Նոր արձան չբացվեց։',
            };
            setGuidance(null);
          } else {
            const message =
              discovered.length === 1
                ? `Դու հայտնաբերեցիր ${discovered[0]}-ը։`
                : discovered.map((name) => `Դու հայտնաբերեցիր ${name}-ը։`).join('\n');
            outcome = { type: 'success', title: 'Բացվեց', message };
            setGuidance(null);
          }
        }
      }

      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_SEARCH_MS) {
        await wait(MIN_SEARCH_MS - elapsed);
      }

      if (outcome.type !== 'none' && outcome.type !== 'modal') {
        Alert.alert(outcome.title, outcome.message);
      }
    } catch {
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_SEARCH_MS) {
        await wait(MIN_SEARCH_MS - elapsed);
      }
      Alert.alert('Սխալ', 'Չհաջողվեց ստանալ տեղադրությունը։ Փորձիր կրկին։');
    } finally {
      setIsChecking(false);
    }
  }, [figures, isChecking, unlockById]);

  if (!storageLoaded) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#374151" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      <Text style={styles.progress}>
        {unlockedCount} / {totalCount} հավաքված
      </Text>
      <FlatList
        data={figures}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.card,
              !item.unlocked && styles.cardLocked,
              pressed && styles.cardPressed,
            ]}
            onPress={() =>
              navigation.navigate('StatueDetail', { statueId: item.id })
            }
          >
            <Text
              style={[
                styles.cardInitial,
                item.unlocked && { color: ACCENT[item.id] ?? '#2563EB' },
              ]}
              numberOfLines={1}
            >
              {item.name.charAt(0)}
            </Text>
            <Text
              style={[styles.cardName, !item.unlocked && styles.cardNameLocked]}
              numberOfLines={2}
            >
              {item.name}
            </Text>
          </Pressable>
        )}
      />
      <Pressable
        style={({ pressed }) => [
          styles.scanButton,
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
        <View style={styles.scanButtonCore}>
          {isChecking ? (
            <>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.radarDot,
                  styles.dotYellow,
                  {
                    opacity: pulseAnim.interpolate({
                      inputRange: [0, 0.3, 1],
                      outputRange: [0.2, 1, 0.15],
                    }),
                    transform: [
                      {
                        scale: pulseAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0.8, 1.2, 0.9],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.radarDot,
                  styles.dotWhite,
                  {
                    opacity: pulseAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.15, 0.95, 0.2],
                    }),
                    transform: [
                      {
                        scale: pulseAnim.interpolate({
                          inputRange: [0, 0.4, 1],
                          outputRange: [1.2, 0.8, 1.1],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.radarDot,
                  styles.dotDarkGreen,
                  {
                    opacity: pulseAnim.interpolate({
                      inputRange: [0, 0.2, 1],
                      outputRange: [0.1, 0.9, 0.2],
                    }),
                    transform: [
                      {
                        scale: pulseAnim.interpolate({
                          inputRange: [0, 0.6, 1],
                          outputRange: [0.9, 1.25, 0.75],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.radarDot,
                  styles.dotBlack,
                  {
                    opacity: pulseAnim.interpolate({
                      inputRange: [0, 0.45, 1],
                      outputRange: [0.05, 0.65, 0.1],
                    }),
                    transform: [
                      {
                        scale: pulseAnim.interpolate({
                          inputRange: [0, 0.35, 1],
                          outputRange: [1.15, 0.85, 1],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.radarDot,
                  styles.dotSquareMint,
                  {
                    opacity: pulseAnim.interpolate({
                      inputRange: [0, 0.35, 1],
                      outputRange: [0.2, 0.95, 0.2],
                    }),
                    transform: [
                      {
                        rotate: pulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '24deg'],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.radarDot,
                  styles.dotSquareWhite,
                  {
                    opacity: pulseAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.1, 0.85, 0.15],
                    }),
                    transform: [
                      {
                        rotate: pulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['-10deg', '18deg'],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.triangleDot,
                  styles.dotTriangleYellow,
                  {
                    opacity: pulseAnim.interpolate({
                      inputRange: [0, 0.4, 1],
                      outputRange: [0.05, 0.9, 0.1],
                    }),
                  },
                ]}
              />
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.triangleDot,
                  styles.dotTriangleGreen,
                  {
                    opacity: pulseAnim.interpolate({
                      inputRange: [0, 0.55, 1],
                      outputRange: [0.1, 0.85, 0.1],
                    }),
                  },
                ]}
              />
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.radarDot,
                  styles.dotCircleSoftGreen,
                  {
                    opacity: pulseAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.1, 0.8, 0.15],
                    }),
                  },
                ]}
              />
            </>
          ) : null}
          <Text style={styles.scanButtonIcon}>⌕</Text>
          <Text style={styles.scanButtonText}>{isChecking ? 'Որոնում...' : 'Փնտրել'}</Text>
        </View>
      </Pressable>
      <Text style={styles.scanHint}>
        {isChecking
          ? 'Ռադարն աշխատում է...'
          : 'Սեղմիր՝ մոտակա արձանները գտնելու համար'}
      </Text>

      <Modal
        visible={mapVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMapVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>TACTICAL MINIMAP</Text>
            <MiniMap
              districtName="KENTRON"
              distanceMeters={guidance?.metersLeft ?? 0}
              azimuthDeg={guidance?.azimuthDeg ?? 0}
            />
            <Text style={styles.modalHint}>
              TARGET: {guidance?.targetName ?? '-'} • {guidance?.directionLabel ?? '-'}
            </Text>
            <Text style={styles.modalStatMain}>{guidance?.metersLeft ?? 0} m</Text>
            <Text style={styles.modalStatSub}>AZIMUTH {guidance?.azimuthDeg ?? 0}°</Text>
            <View style={styles.modalButtonsRow}>
              <Pressable
                style={({ pressed }) => [styles.okButton, pressed && { opacity: 0.85 }]}
                onPress={() => setMapVisible(false)}
              >
                <Text style={styles.okButtonText}>OK</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.modalGoButton, pressed && { opacity: 0.85 }]}
                onPress={() => setMapVisible(false)}
              >
                <Image source={FOOTPRINT_ICON} style={styles.modalGoIcon} />
                <Text style={styles.modalGoButtonText}>GO</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  progress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  grid: {
    paddingBottom: 8,
  },
  row: {
    gap: 8,
    marginBottom: 8,
  },
  card: {
    flex: 1,
    aspectRatio: 0.85,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  cardLocked: {
    backgroundColor: '#E5E7EB',
    borderColor: '#D1D5DB',
    opacity: 0.85,
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardInitial: {
    fontSize: 28,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 6,
  },
  cardName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  cardNameLocked: {
    color: '#6B7280',
  },
  scanButton: {
    marginTop: 'auto',
    width: 168,
    height: 168,
    borderRadius: 84,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    position: 'relative',
  },
  scanButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  pulseRingOuter: {
    position: 'absolute',
    width: 168,
    height: 168,
    borderRadius: 84,
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  pulseRingInner: {
    position: 'absolute',
    width: 146,
    height: 146,
    borderRadius: 73,
    borderWidth: 2,
    borderColor: '#818CF8',
  },
  radarWave: {
    position: 'absolute',
    width: 168,
    height: 168,
    borderRadius: 84,
    borderColor: '#22C55E',
  },
  scanButtonCore: {
    width: 132,
    height: 132,
    borderRadius: 66,
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
  radarDot: {
    position: 'absolute',
    borderRadius: 99,
  },
  dotYellow: {
    width: 16,
    height: 16,
    backgroundColor: '#FACC15',
    top: 20,
    left: 24,
  },
  dotWhite: {
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    top: 48,
    right: 22,
  },
  dotDarkGreen: {
    width: 14,
    height: 14,
    backgroundColor: '#166534',
    bottom: 20,
    left: 34,
  },
  dotBlack: {
    width: 10,
    height: 10,
    backgroundColor: '#0B0F0C',
    bottom: 30,
    right: 30,
  },
  dotSquareMint: {
    width: 13,
    height: 13,
    borderRadius: 2,
    backgroundColor: '#34D399',
    top: 26,
    right: 40,
  },
  dotSquareWhite: {
    width: 9,
    height: 9,
    borderRadius: 2,
    backgroundColor: '#ECFEFF',
    bottom: 43,
    left: 20,
  },
  dotCircleSoftGreen: {
    width: 11,
    height: 11,
    backgroundColor: '#86EFAC',
    top: 58,
    left: 50,
  },
  triangleDot: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 13,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  dotTriangleYellow: {
    borderBottomColor: '#FDE047',
    top: 22,
    left: 62,
  },
  dotTriangleGreen: {
    borderBottomColor: '#14532D',
    bottom: 18,
    right: 44,
  },
  scanButtonIcon: {
    color: '#FFFFFF',
    fontSize: 34,
    marginBottom: 4,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  scanHint: {
    marginTop: 14,
    marginBottom: 2,
    color: '#4B5563',
    fontSize: 13,
    textAlign: 'center',
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
