import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useFigures } from '../context/FiguresContext';
import { haversineDistanceMeters } from '../utils/haversine';

const UNLOCK_DISTANCE_METERS = 50;

export default function ScanScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { figures, unlockById } = useFigures();
  const [isChecking, setIsChecking] = useState(false);
  const [statusText, setStatusText] = useState('');
  const pulseAnim = useRef(new Animated.Value(0)).current;

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

  const handleCheckNearby = useCallback(async () => {
    if (isChecking) return;

    setIsChecking(true);
    setStatusText('Ստուգվում է քո տեղադրությունը...');

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setStatusText('Պետք է թույլ տաս տեղադրության հասանելիությունը։');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const nearbyLockedStatues = figures.filter((figure) => {
        if (figure.unlocked) return false;
        const distance = haversineDistanceMeters(
          {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
          {
            latitude: figure.latitude,
            longitude: figure.longitude,
          }
        );
        return distance < UNLOCK_DISTANCE_METERS;
      });

      if (nearbyLockedStatues.length === 0) {
        setStatusText('Մոտակայքում արձան չկա։ Մոտեցիր ու նորից փորձիր։');
        return;
      }

      const discoveredNames = [];
      nearbyLockedStatues.forEach((figure) => {
        const result = unlockById(figure.id);
        if (result.ok && !result.alreadyHad) {
          discoveredNames.push(figure.name);
        }
      });

      if (discoveredNames.length === 0) {
        setStatusText('Նոր արձան չբացվեց։');
        return;
      }

      const message =
        discoveredNames.length === 1
          ? `Դու հայտնաբերեցիր ${discoveredNames[0]}-ը։`
          : discoveredNames.map((name) => `Դու հայտնաբերեցիր ${name}-ը։`).join('\n');
      Alert.alert('Բացվեց', message, [
        { text: 'Լավ', onPress: () => navigation.goBack() },
      ]);
    } catch {
      setStatusText('Չհաջողվեց ստանալ տեղադրությունը։ Փորձիր կրկին։');
    } finally {
      setIsChecking(false);
    }
  }, [figures, isChecking, navigation, unlockById]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24 }]}>
      <View style={styles.content}>
        <Text style={styles.title}>Մոտակայքի արձաններ</Text>
        <Text style={styles.body}>
          Սեղմիր կլոր կոճակը, որ բացվեն այն արձանները, որոնք քո ներկայիս
          տեղադրությունից 50 մետր շառավղում են։
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            (pressed || isChecking) && styles.primaryBtnPressed,
          ]}
          onPress={handleCheckNearby}
          disabled={isChecking}
        >
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
          <View style={styles.primaryBtnCore}>
            <Text style={styles.primaryBtnIcon}>⌕</Text>
            <Text style={styles.primaryBtnText}>
              {isChecking ? 'Ստուգում...' : 'Փնտրել'}
            </Text>
          </View>
        </Pressable>

        {statusText ? <Text style={styles.hintText}>{statusText}</Text> : null}
      </View>

      <Pressable style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.secondaryBtnText}>Փակել</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    textAlign: 'center',
    color: '#374151',
    marginBottom: 20,
    lineHeight: 24,
  },
  primaryBtn: {
    width: 168,
    height: 168,
    borderRadius: 84,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  primaryBtnPressed: {
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
  primaryBtnCore: {
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
  },
  primaryBtnIcon: {
    color: '#FFF',
    fontSize: 34,
    marginBottom: 4,
  },
  primaryBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },
  secondaryBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
  },
  secondaryBtnText: {
    color: '#4B5563',
    fontSize: 16,
  },
  hintText: {
    marginTop: 14,
    color: '#4B5563',
    fontSize: 14,
    textAlign: 'center',
  },
});
