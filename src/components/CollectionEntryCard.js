import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';

/**
 * Крупная анимированная карточка входа в коллекцию (главная).
 */
export default function CollectionEntryCard({ unlocked, total, onPress }) {
  const { t } = useLanguage();
  const { colors, resolvedScheme } = useSettings();
  const breathe = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 1900,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 1900,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();

    const shine = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 3200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    shine.start();

    return () => {
      loop.stop();
      shine.stop();
    };
  }, [breathe, shimmer]);

  const scale = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.012],
  });

  const shimmerX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-220, 400],
  });

  const ratio = total > 0 ? Math.min(1, unlocked / total) : 0;
  const shimmerBand =
    resolvedScheme === 'dark'
      ? 'rgba(255,255,255,0.07)'
      : 'rgba(255,255,255,0.45)';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        outer: {
          marginTop: 4,
          marginBottom: 4,
        },
        card: {
          borderRadius: 22,
          overflow: 'hidden',
          backgroundColor: colors.bgElevated,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.tileEnabledBorder,
          ...Platform.select({
            ios: {
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: resolvedScheme === 'dark' ? 0.35 : 0.22,
              shadowRadius: 22,
            },
            android: { elevation: 10 },
          }),
        },
        cardInner: {
          paddingVertical: 18,
          paddingHorizontal: 18,
          position: 'relative',
        },
        shimmerMask: {
          ...StyleSheet.absoluteFillObject,
          overflow: 'hidden',
        },
        shimmerStripe: {
          position: 'absolute',
          top: -40,
          bottom: -40,
          width: 110,
          transform: [{ skewX: '-18deg' }],
          backgroundColor: shimmerBand,
        },
        topRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        },
        titleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          flex: 1,
        },
        title: {
          fontSize: 20,
          fontWeight: '900',
          letterSpacing: -0.4,
          color: colors.text,
          flex: 1,
        },
        sub: {
          marginTop: 6,
          fontSize: 14,
          fontWeight: '600',
          color: colors.textSecondary,
          lineHeight: 20,
        },
        progressLabel: {
          marginTop: 14,
          fontSize: 13,
          fontWeight: '800',
          letterSpacing: 0.4,
          color: colors.primary,
        },
        track: {
          marginTop: 8,
          height: 7,
          borderRadius: 4,
          backgroundColor: colors.bgMuted,
          overflow: 'hidden',
        },
        fill: {
          height: '100%',
          borderRadius: 4,
          backgroundColor: colors.primary,
        },
        ctaRow: {
          marginTop: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        cta: {
          fontSize: 13,
          fontWeight: '700',
          color: colors.textMuted,
        },
        iconOrb: {
          width: 48,
          height: 48,
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primaryBg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.tileEnabledBorder,
        },
        pressed: {
          opacity: 0.92,
        },
      }),
    [colors, resolvedScheme, shimmerBand]
  );

  return (
    <Animated.View style={[styles.outer, { transform: [{ scale }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('collectionEntryHeroTitle')}. ${t('openCollection')}`}
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <View style={styles.cardInner}>
          <View style={styles.shimmerMask} pointerEvents="none">
            <Animated.View
              style={[
                styles.shimmerStripe,
                { transform: [{ translateX: shimmerX }] },
              ]}
            />
          </View>

          <View style={styles.topRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Ionicons name="sparkles" size={22} color={colors.primary} />
                <Text style={styles.title} numberOfLines={2}>
                  {t('collectionEntryHeroTitle')}
                </Text>
              </View>
              <Text style={styles.sub}>{t('collectionEntryHeroSub')}</Text>
              <Text style={styles.progressLabel}>
                {t('homeProgressContext', { unlocked, total })}
              </Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
              </View>
              <View style={styles.ctaRow}>
                <Text style={styles.cta}>{t('collectionEntryTap')}</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
              </View>
            </View>
            <View style={styles.iconOrb}>
              <Ionicons name="albums" size={26} color={colors.primary} />
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
