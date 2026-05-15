import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import { POSITION_MAX_ACCURACY } from '../constants/gpsAccuracy';
import { UNLOCK_RADIUS_METERS } from '../constants/unlockRadius';
import { useLanguage } from '../context/LanguageContext';
import { useFigures } from '../context/FiguresContext';
import { useSettings } from '../context/SettingsContext';
import { haversineDistanceMeters } from '../utils/haversine';
import UnlockCelebrationOverlay from '../components/UnlockCelebrationOverlay';
import { useCelebrationPeek } from '../context/CelebrationPeekContext';

export default function ScanScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useSettings();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.bg,
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
          color: colors.text,
          marginBottom: 10,
          textAlign: 'center',
        },
        body: {
          fontSize: 16,
          textAlign: 'center',
          color: colors.iconMuted,
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
          borderColor: colors.primary,
        },
        pulseRingInner: {
          position: 'absolute',
          width: 146,
          height: 146,
          borderRadius: 73,
          borderWidth: 2,
          borderColor: colors.primaryMuted,
        },
        primaryBtnCore: {
          width: 132,
          height: 132,
          borderRadius: 66,
          backgroundColor: colors.radarCore,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.24,
          shadowRadius: 10,
          elevation: 8,
        },
        primaryBtnIcon: {
          color: colors.radarTextOnCore,
          fontSize: 34,
          marginBottom: 4,
        },
        primaryBtnText: {
          color: colors.radarTextOnCore,
          fontWeight: '600',
          fontSize: 15,
        },
        secondaryBtn: {
          alignSelf: 'center',
          paddingVertical: 10,
        },
        secondaryBtnText: {
          color: colors.textSecondary,
          fontSize: 16,
        },
        hintText: {
          marginTop: 14,
          color: colors.textSecondary,
          fontSize: 14,
          textAlign: 'center',
        },
      }),
    [colors]
  );
  const { t } = useLanguage();
  const { figures, unlockById, commitHudCollectionProgress } = useFigures();
  const [isChecking, setIsChecking] = useState(false);
  const [unlockCelebration, setUnlockCelebration] = useState(null);
  const { celebrationHidden, beginDetailPeek } = useCelebrationPeek();
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

      const location = await Location.getCurrentPositionAsync(
        POSITION_MAX_ACCURACY
      );

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
        return distance < UNLOCK_RADIUS_METERS;
      });

      if (nearbyLockedStatues.length === 0) {
        setStatusText('Մոտակայքում արձան չկա։ Մոտեցիր ու նորից փորձիր։');
        return;
      }

      const unlockedItems = [];
      nearbyLockedStatues.forEach((figure) => {
        const result = unlockById(figure.id);
        if (result.ok && !result.alreadyHad) {
          unlockedItems.push({
            id: figure.id,
            name: figure.displayName ?? figure.name,
            rarity: figure.rarity,
          });
        }
      });

      if (unlockedItems.length === 0) {
        setStatusText('Նոր արձան չբացվեց։');
        return;
      }

      setUnlockCelebration({
        title: t('unlockedTitle'),
        unlockedItems,
        variant: 'success',
        collectionKind: 'statues',
      });
    } catch {
      setStatusText('Չհաջողվեց ստանալ տեղադրությունը։ Փորձիր կրկին։');
    } finally {
      setIsChecking(false);
    }
  }, [figures, isChecking, t, unlockById]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24 }]}>
      <View style={styles.content}>
        <Text style={styles.title}>Մոտակայքի արձաններ</Text>
        <Text style={styles.body}>
          {t('scanRadiusUnlockBody', { n: UNLOCK_RADIUS_METERS })}
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

      <UnlockCelebrationOverlay
        visible={unlockCelebration != null}
        hiddenForPeek={celebrationHidden}
        onDismiss={() => {
          setUnlockCelebration(null);
          commitHudCollectionProgress();
          navigation.goBack();
        }}
        onViewPress={
          unlockCelebration?.unlockedItems?.length === 1
            ? () => {
                const id = unlockCelebration.unlockedItems[0].id;
                const kind = unlockCelebration.collectionKind ?? 'statues';
                beginDetailPeek();
                navigation.navigate('StatueDetail', {
                  statueId: id,
                  collectionKind: kind,
                });
              }
            : undefined
        }
        onItemPress={(id) => {
          const kind = unlockCelebration?.collectionKind ?? 'statues';
          beginDetailPeek();
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
