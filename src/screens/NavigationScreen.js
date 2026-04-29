import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useFigures } from '../context/FiguresContext';
import { haversineDistanceMeters } from '../utils/haversine';

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

function getTurnHint(deltaDeg) {
  const abs = Math.abs(deltaDeg);
  if (abs < 15) return { title: 'Ուղիղ առաջ', arrow: '↑' };
  if (deltaDeg > 0) {
    return { title: `Աջ թեքիր ${Math.round(abs)}°`, arrow: '↗' };
  }
  return { title: `Ձախ թեքիր ${Math.round(abs)}°`, arrow: '↖' };
}

export default function NavigationScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { targetId, targetLat, targetLon, targetName } = route.params || {};
  const { unlockById } = useFigures();
  const mapRef = useRef(null);
  const hasTargetCoords =
    typeof targetLat === 'number' && typeof targetLon === 'number';

  const [distanceMeters, setDistanceMeters] = useState(null);
  const [azimuthDeg, setAzimuthDeg] = useState(0);
  const [headingDeg, setHeadingDeg] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [userCoords, setUserCoords] = useState(null);

  const rotationAnim = useRef(new Animated.Value(0)).current;
  const headingDegRef = useRef(0);
  const didUnlockRef = useRef(false);
  const didFitRef = useRef(false);

  const turnHint = useMemo(() => {
    if (distanceMeters == null) return { title: 'Սկսում ենք…', arrow: '↑' };
    const bearing = azimuthDeg;
    const turnDelta = ((bearing - headingDeg + 540) % 360) - 180;
    return getTurnHint(turnDelta);
  }, [azimuthDeg, headingDeg, distanceMeters]);

  useEffect(() => {
    let locSub = null;
    let headingSub = null;
    let cancelled = false;

    (async () => {
      try {
        if (!hasTargetCoords) {
          Alert.alert('Սխալ', 'Թիրախի կոորդինատները բացակայում են։');
          navigation.goBack();
          return;
        }
        setIsRunning(true);
        const { status } =
          await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Թույլտվություն', 'Պետք է թույլ տաս տեղադրության հասանելիությունը։');
          navigation.goBack();
          return;
        }

        locSub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          (loc) => {
            if (cancelled) return;
            const lat = loc.coords.latitude;
            const lon = loc.coords.longitude;
            setUserCoords({ latitude: lat, longitude: lon });
            const dist = haversineDistanceMeters(
              { latitude: lat, longitude: lon },
              { latitude: targetLat, longitude: targetLon }
            );
            const bearing = getBearingDegrees(
              { latitude: lat, longitude: lon },
              { latitude: targetLat, longitude: targetLon }
            );
            setDistanceMeters(dist);
            setAzimuthDeg(Math.round(bearing));

            // If we have heading, compute arrow rotation.
            const turnDelta =
              ((bearing - headingDegRef.current + 540) % 360) - 180;
            const nextRotation = Math.round(turnDelta);
            rotationAnim.setValue(nextRotation);

            if (mapRef.current && !didFitRef.current) {
              didFitRef.current = true;
              mapRef.current.fitToCoordinates(
                [
                  { latitude: lat, longitude: lon },
                  { latitude: targetLat, longitude: targetLon },
                ],
                {
                  edgePadding: { top: 110, right: 70, bottom: 130, left: 70 },
                  animated: true,
                }
              );
            }

            if (!didUnlockRef.current && dist < 50) {
              didUnlockRef.current = true;
              if (targetId != null) {
                const result = unlockById(targetId);
                Alert.alert(
                  'Բացվեց',
                  result.ok
                    ? `Դու հայտնաբերեցիր ${targetName}։`
                    : `Գտանք քեզ մոտ, բայց չհաջողվեց բացել (${targetName})։`
                );
              } else {
                Alert.alert('Մոտ ես', `Դու արդեն հասել ես ${targetName}։`);
              }
              navigation.goBack();
            }
          }
        );

        headingSub = await Location.watchHeadingAsync((event) => {
          if (cancelled) return;
          const nextHeading =
            Number.isFinite(event.trueHeading) && event.trueHeading >= 0
              ? event.trueHeading
              : Number.isFinite(event.magHeading) ? event.magHeading : 0;
          headingDegRef.current = nextHeading;
          setHeadingDeg(nextHeading);
        });
      } catch {
        if (!cancelled) {
          Alert.alert('Սխալ', 'Չհաջողվեց ստանալ տեղադրությունը։');
          navigation.goBack();
        }
      }
    })();

    return () => {
      cancelled = true;
      if (locSub && typeof locSub.remove === 'function') locSub.remove();
      if (headingSub && typeof headingSub.remove === 'function') headingSub.remove();
    };
  }, [
    hasTargetCoords,
    navigation,
    targetId,
    targetLat,
    targetLon,
    targetName,
    unlockById,
    rotationAnim,
  ]);

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.topHud}>
        <Text style={styles.targetTitle}>{targetName ?? 'Target'}</Text>
        <Text style={styles.distanceText}>
          {distanceMeters == null ? '—' : `${Math.max(0, Math.round(distanceMeters))} մ`}
        </Text>
      </View>

      <View style={styles.center}>
        <Animated.View
          style={[
            styles.arrowWrap,
            {
              transform: [
                {
                  rotate: rotationAnim.interpolate({
                    inputRange: [-180, 180],
                    outputRange: ['-180deg', '180deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.arrow}>▲</Text>
        </Animated.View>
        <Text style={styles.turnText}>
          {isRunning ? turnHint.title : 'Սկսում ենք…'}
        </Text>
      </View>

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={styles.map}
          customMapStyle={DARK_MAP_STYLE}
          showsCompass
          showsScale
          showsMyLocationButton={false}
          showsUserLocation
          followsUserLocation={false}
          initialRegion={{
            latitude: targetLat || 40.18,
            longitude: targetLon || 44.51,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          {userCoords ? (
            <Marker
              coordinate={userCoords}
              title="Դու"
              pinColor="#2dd4bf"
            />
          ) : null}
          {typeof targetLat === 'number' && typeof targetLon === 'number' ? (
            <Marker
              coordinate={{ latitude: targetLat, longitude: targetLon }}
              title={targetName || 'Target'}
              pinColor="#22c55e"
            />
          ) : null}
          {userCoords &&
          typeof targetLat === 'number' &&
          typeof targetLon === 'number' ? (
            <Polyline
              coordinates={[
                userCoords,
                { latitude: targetLat, longitude: targetLon },
              ]}
              strokeColor="#22c55e"
              strokeWidth={4}
              lineDashPattern={[8, 8]}
            />
          ) : null}
        </MapView>
      </View>

      <View style={styles.bottomBar}>
        <Pressable
          style={({ pressed }) => [styles.stopBtn, pressed && { opacity: 0.85 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.stopBtnText}>Դադարեցնել</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  topHud: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f1f',
  },
  targetTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  distanceText: {
    marginTop: 4,
    color: '#22c55e',
    fontSize: 38,
    fontWeight: '900',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(34,197,94,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
  },
  arrow: {
    color: '#22c55e',
    fontSize: 64,
    fontWeight: '900',
    transform: [{ translateY: 2 }],
  },
  turnText: {
    marginTop: 14,
    color: '#e5e7eb',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  mapWrap: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    minHeight: 260,
  },
  map: {
    width: '100%',
    height: 260,
    borderRadius: 16,
    overflow: 'hidden',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  stopBtn: {
    backgroundColor: '#1f2937',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  stopBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
});

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0a0a0a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#b8b8b8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0a0a' }] },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#2b2b2b' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#3a3a3a' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#111827' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
];

