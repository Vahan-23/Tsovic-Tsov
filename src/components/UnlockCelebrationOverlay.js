import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import RarityBadge from './RarityBadge';
import { rarityAccentColor } from '../utils/statueRarity';

const { width: W, height: H } = Dimensions.get('window');

/** Золотистые оттенки искр (без радуги). */
const GOLD_SPARK_COLORS = [
  '#FFF8E7',
  '#FFEFC8',
  '#FFE082',
  '#FFD54F',
  '#FFC947',
  '#F5C84C',
  '#E8B923',
  '#D4AF37',
  '#C9A227',
  '#B8860B',
];

const FIREWORK_COUNT = 48;
/** Дальность искр — почти до краёв экрана (общий центр взрыва). */
const MAX_BURST_RADIUS = Math.hypot(W, H) * 0.47;
/** Один таймлайн на все частицы — иначе «взрыв» расползается во времени. */
const FIREWORK_DURATION_MS = 2300;
/** Доля линейного времени на резкий радиальный вылет (остальное — падение/занос). */
const BURST_PHASE_END = 0.09;
const ORIGIN_TOP = H / 2 - 8;
const SHOCK_RING_SIZE = Math.min(W, H) * 0.42;

function hashSeed(index) {
  return index * 7919 + 2654435761;
}

/**
 * Частица фейерверка: один общий взрыв — вылет по радиусу, затем лёгкий занос и падение.
 * Раньше конечная точка по X тянула частицы обратно к центру (burstX * 0.42), из‑за этого
 * «взрыв» выглядел как всасывание.
 */
function FireworkParticle({ index }) {
  const progress = useRef(new Animated.Value(0)).current;

  const { burstX, burstY, drift, fallExtra, color, dot } = useMemo(() => {
    const seed = hashSeed(index);
    const angleDeg = (360 * index) / FIREWORK_COUNT;
    const rad = (angleDeg * Math.PI) / 180;
    const distFrac = 0.34 + ((seed % 1001) / 1000) * 0.66;
    const dist = MAX_BURST_RADIUS * distFrac;
    const bx = Math.cos(rad) * dist;
    const by = -Math.sin(rad) * dist * 0.98;
    const driftX = ((seed >> 7) % 72) - 36;
    const fall = H * 0.2 + (seed % Math.max(120, Math.floor(H * 0.22)));
    const colorIdx = (seed + index * 13) % GOLD_SPARK_COLORS.length;
    const size = 2 + (seed % 4);
    return {
      burstX: bx,
      burstY: by,
      drift: driftX,
      fallExtra: fall,
      color: GOLD_SPARK_COLORS[colorIdx],
      dot: size,
    };
  }, [index]);

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: FIREWORK_DURATION_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const translateX = progress.interpolate({
    inputRange: [0, BURST_PHASE_END, 1],
    outputRange: [0, burstX, burstX + drift],
  });
  const translateY = progress.interpolate({
    inputRange: [0, BURST_PHASE_END, 1],
    outputRange: [0, burstY, burstY + fallExtra],
  });
  const fade = progress.interpolate({
    inputRange: [0, 0.72, 1],
    outputRange: [1, 1, 0],
  });
  const sparkScale = progress.interpolate({
    inputRange: [0, BURST_PHASE_END, 1],
    outputRange: [0.2, 1, 0.85],
  });

  return (
    <Animated.View
      style={[
        styles.fireworkOrigin,
        {
          opacity: fade,
          transform: [{ translateX }, { translateY }],
        },
      ]}
      pointerEvents="none"
    >
      <Animated.View style={{ transform: [{ scale: sparkScale }] }}>
        <View
          style={{
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            backgroundColor: color,
          }}
        />
      </Animated.View>
    </Animated.View>
  );
}

/**
 * @typedef {{ id: string | number, name: string, rarity?: 1 | 2 | 3 }} UnlockedCelebrationItem
 */

function UnlockedItemRow({ item, onPress, styles, isSuccess }) {
  const accent = item.rarity ? rarityAccentColor(item.rarity) : '#F5C84C';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.itemRow,
        pressed && styles.itemRowPressed,
      ]}
      onPress={() => onPress(item.id)}
      accessibilityRole="button"
      accessibilityLabel={item.name}
    >
      <View style={[styles.itemIconWrap, { borderColor: `${accent}88` }]}>
        <Ionicons name="checkmark" size={20} color={accent} />
      </View>
      <View style={styles.itemBody}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.name}
        </Text>
        {item.rarity ? (
          <View style={styles.itemBadge}>
            <RarityBadge tier={item.rarity} compact />
          </View>
        ) : null}
      </View>
      {isSuccess ? (
        <Ionicons name="chevron-forward" size={22} color={accent} />
      ) : null}
    </Pressable>
  );
}

/**
 * Полноэкранное «вау» при открытии объекта в коллекции (вместо сухого Alert).
 */
export default function UnlockCelebrationOverlay({
  visible,
  /** Скрыто под StatueDetail — без повторной анимации при возврате */
  hiddenForPeek = false,
  onDismiss,
  /** «Посмотреть» — карточка объекта; только при success, одном объекте и если передан */
  onViewPress,
  /** Открытые объекты — список с именами (при нескольких) */
  unlockedItems = [],
  /** Переход в карточку по нажатию на строку */
  onItemPress,
  title,
  lines = [],
  /** success = конфетти + трофей; soft = спокойная карточка (почти открылось / приехал) */
  variant = 'success',
}) {
  const { t } = useLanguage();
  const { colors, resolvedScheme } = useSettings();
  const cardScale = useRef(new Animated.Value(0.4)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const iconBounce = useRef(new Animated.Value(0)).current;
  const shockwave = useRef(new Animated.Value(0)).current;

  const isSuccess = variant === 'success';
  const hasItemList = unlockedItems.length > 0;
  const multipleItems = unlockedItems.length > 1;
  const showViewButton =
    isSuccess &&
    !multipleItems &&
    typeof onViewPress === 'function' &&
    (hasItemList || lines.length > 0);
  const subtitleText = useMemo(() => {
    if (!hasItemList || unlockedItems.length < 2) return null;
    return t('foundManyIntro', { n: unlockedItems.length });
  }, [hasItemList, t, unlockedItems]);

  const shockScale = shockwave.interpolate({
    inputRange: [0, 1],
    outputRange: [0.22, 2.75],
  });
  const shockOpacity = shockwave.interpolate({
    inputRange: [0, 0.18, 1],
    outputRange: [0.62, 0.28, 0],
  });

  const prevVisibleRef = useRef(false);
  const bounceLoopRef = useRef(null);
  const [showFireworkParticles, setShowFireworkParticles] = useState(false);

  const stopBounceLoop = useCallback(() => {
    if (bounceLoopRef.current) {
      bounceLoopRef.current.stop();
      bounceLoopRef.current = null;
    }
  }, []);

  const startBounceLoop = useCallback(() => {
    stopBounceLoop();
    const bounceLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(iconBounce, {
          toValue: 1,
          duration: 550,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(iconBounce, {
          toValue: 0,
          duration: 550,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    bounceLoop.start();
    bounceLoopRef.current = bounceLoop;
  }, [iconBounce, stopBounceLoop]);

  useEffect(() => {
    if (!visible) {
      prevVisibleRef.current = false;
      setShowFireworkParticles(false);
      stopBounceLoop();
      return;
    }

    if (hiddenForPeek) {
      setShowFireworkParticles(false);
      stopBounceLoop();
      return;
    }

    const justOpened = !prevVisibleRef.current;
    prevVisibleRef.current = true;

    if (!justOpened) {
      cardScale.setValue(1);
      cardOpacity.setValue(1);
      glow.setValue(1);
      startBounceLoop();
      return stopBounceLoop;
    }

    cardScale.setValue(0.45);
    cardOpacity.setValue(0);
    glow.setValue(0);
    iconBounce.setValue(0);

    Animated.parallel([
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 7,
        tension: 78,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.timing(glow, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    if (isSuccess) {
      setShowFireworkParticles(true);
      shockwave.setValue(0);
      Animated.timing(shockwave, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }

    startBounceLoop();
    return stopBounceLoop;
  }, [
    cardOpacity,
    cardScale,
    glow,
    hiddenForPeek,
    iconBounce,
    isSuccess,
    shockwave,
    startBounceLoop,
    stopBounceLoop,
    visible,
  ]);

  const iconY = iconBounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });
  const glowScale = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1],
  });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor:
            resolvedScheme === 'dark'
              ? 'rgba(5, 6, 14, 0.94)'
              : 'rgba(15, 18, 34, 0.88)',
          justifyContent: 'center',
          paddingHorizontal: 22,
        },
        glowBlob: {
          position: 'absolute',
          alignSelf: 'center',
          width: W * 0.92,
          height: W * 0.92,
          borderRadius: (W * 0.92) / 2,
          backgroundColor:
            resolvedScheme === 'dark'
              ? 'rgba(154, 166, 255, 0.18)'
              : 'rgba(91, 99, 232, 0.2)',
          top: H * 0.12,
        },
        fireworkHost: {
          ...StyleSheet.absoluteFillObject,
          overflow: 'hidden',
        },
        card: {
          borderRadius: 26,
          paddingVertical: 28,
          paddingHorizontal: 22,
          backgroundColor: colors.bgElevated,
          borderWidth: 2,
          borderColor: isSuccess ? '#F5C84C' : colors.border,
          ...Platform.select({
            ios: {
              shadowColor: isSuccess ? '#F5C84C' : colors.shadow,
              shadowOffset: { width: 0, height: 18 },
              shadowOpacity: isSuccess ? 0.45 : 0.15,
              shadowRadius: 28,
            },
            android: { elevation: 18 },
          }),
        },
        iconWrap: {
          alignSelf: 'center',
          marginBottom: 18,
          width: 108,
          height: 108,
          alignItems: 'center',
          justifyContent: 'center',
        },
        ring: {
          position: 'absolute',
          width: 104,
          height: 104,
          borderRadius: 52,
          borderWidth: 3,
          borderColor: isSuccess ? 'rgba(245,200,76,0.55)' : colors.borderMuted,
        },
        title: {
          fontSize: 26,
          fontWeight: '900',
          letterSpacing: -0.6,
          color: colors.text,
          textAlign: 'center',
          marginBottom: 14,
        },
        line: {
          fontSize: 17,
          fontWeight: '600',
          lineHeight: 24,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 8,
        },
        scrollLines: {
          maxHeight: Math.min(220, H * 0.28),
          marginBottom: 8,
        },
        subtitle: {
          fontSize: 16,
          fontWeight: '600',
          lineHeight: 22,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 14,
        },
        itemListScroll: {
          maxHeight: Math.min(320, H * 0.42),
          marginBottom: 6,
        },
        itemListContent: {
          paddingBottom: 4,
        },
        itemListHint: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.textMuted,
          textAlign: 'center',
          marginBottom: 10,
        },
        itemRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: 16,
          marginBottom: 10,
          backgroundColor:
            resolvedScheme === 'dark'
              ? 'rgba(255,255,255,0.06)'
              : 'rgba(0,0,0,0.04)',
          borderWidth: 1,
          borderColor: isSuccess ? 'rgba(245,200,76,0.28)' : colors.border,
        },
        itemRowPressed: {
          opacity: 0.88,
        },
        itemIconWrap: {
          width: 40,
          height: 40,
          borderRadius: 20,
          borderWidth: 2,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
          backgroundColor:
            resolvedScheme === 'dark'
              ? 'rgba(245,200,76,0.12)'
              : 'rgba(245,200,76,0.15)',
        },
        itemBody: {
          flex: 1,
          minWidth: 0,
          marginRight: 8,
        },
        itemName: {
          fontSize: 16,
          fontWeight: '800',
          color: colors.text,
          lineHeight: 21,
        },
        itemBadge: {
          marginTop: 6,
          alignSelf: 'flex-start',
        },
        ctaRow: {
          marginTop: 18,
          flexDirection: 'row',
          alignItems: 'stretch',
          gap: 12,
        },
        cta: {
          flex: 1,
          borderRadius: 16,
          paddingVertical: 16,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primary,
          ...Platform.select({
            ios: {
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.38,
              shadowRadius: 14,
            },
            android: { elevation: 8 },
          }),
        },
        ctaSingle: {
          marginTop: 18,
          borderRadius: 16,
          paddingVertical: 16,
          alignItems: 'center',
          backgroundColor: colors.primary,
          ...Platform.select({
            ios: {
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.38,
              shadowRadius: 14,
            },
            android: { elevation: 8 },
          }),
        },
        ctaSecondary: {
          flex: 1,
          borderRadius: 16,
          paddingVertical: 16,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: isSuccess ? '#F5C84C' : colors.border,
          backgroundColor: 'transparent',
        },
        ctaText: {
          fontSize: 17,
          fontWeight: '800',
          color: resolvedScheme === 'dark' ? '#141824' : '#FFFFFF',
        },
        ctaSecondaryText: {
          fontSize: 17,
          fontWeight: '800',
          color: isSuccess ? '#F5C84C' : colors.primary,
        },
      }),
    [colors, isSuccess, resolvedScheme]
  );

  const modalShown = visible && !hiddenForPeek;

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={modalShown}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.root}>
        <Animated.View
          style={[styles.glowBlob, { opacity: glow, transform: [{ scale: glowScale }] }]}
          pointerEvents="none"
        />

        {isSuccess && showFireworkParticles ? (
          <View style={styles.fireworkHost} pointerEvents="none">
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                width: SHOCK_RING_SIZE,
                height: SHOCK_RING_SIZE,
                borderRadius: SHOCK_RING_SIZE / 2,
                left: W / 2 - SHOCK_RING_SIZE / 2,
                top: H / 2 - SHOCK_RING_SIZE / 2,
                borderWidth: 2,
                borderColor: 'rgba(245, 200, 76, 0.9)',
                backgroundColor: 'transparent',
                opacity: shockOpacity,
                transform: [{ scale: shockScale }],
              }}
            />
            {Array.from({ length: FIREWORK_COUNT }, (_, i) => (
              <FireworkParticle key={i} index={i} />
            ))}
          </View>
        ) : null}

        <Animated.View
          pointerEvents="box-none"
          style={{
            opacity: cardOpacity,
            transform: [{ scale: cardScale }],
          }}
        >
          <View style={styles.card} pointerEvents="auto">
            <View style={styles.iconWrap}>
              {isSuccess ? <View style={styles.ring} /> : null}
              <Animated.View style={{ transform: [{ translateY: iconY }] }}>
                <Ionicons
                  name={isSuccess ? 'trophy' : 'checkmark-circle'}
                  size={64}
                  color={isSuccess ? '#F5C84C' : colors.primary}
                />
              </Animated.View>
            </View>

            <Text style={styles.title}>{title}</Text>

            {hasItemList ? (
              <>
                {subtitleText ? (
                  <Text style={styles.subtitle}>{subtitleText}</Text>
                ) : null}
                {multipleItems && typeof onItemPress === 'function' ? (
                  <Text style={styles.itemListHint}>{t('celebrationTapItem')}</Text>
                ) : null}
                <ScrollView
                  style={styles.itemListScroll}
                  contentContainerStyle={styles.itemListContent}
                  showsVerticalScrollIndicator={unlockedItems.length > 3}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                >
                  {unlockedItems.map((item) => (
                    <UnlockedItemRow
                      key={String(item.id)}
                      item={item}
                      styles={styles}
                      isSuccess={isSuccess && typeof onItemPress === 'function'}
                      onPress={
                        typeof onItemPress === 'function'
                          ? onItemPress
                          : () => {}
                      }
                    />
                  ))}
                </ScrollView>
              </>
            ) : (
              <ScrollView
                style={styles.scrollLines}
                showsVerticalScrollIndicator={lines.length > 5}
              >
                {lines.map((line, i) => (
                  <Text key={i} style={styles.line}>
                    {line}
                  </Text>
                ))}
              </ScrollView>
            )}

            {showViewButton ? (
              <View style={styles.ctaRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.ctaSecondary,
                    pressed && { opacity: 0.88 },
                  ]}
                  onPress={onViewPress}
                  accessibilityRole="button"
                  accessibilityLabel={t('celebrationView')}
                >
                  <Text style={styles.ctaSecondaryText}>{t('celebrationView')}</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}
                  onPress={onDismiss}
                  accessibilityRole="button"
                  accessibilityLabel={t('celebrationContinue')}
                >
                  <Text style={styles.ctaText}>{t('celebrationContinue')}</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  styles.ctaSingle,
                  pressed && { opacity: 0.9 },
                ]}
                onPress={onDismiss}
                accessibilityRole="button"
              >
                <Text style={styles.ctaText}>{t('celebrationContinue')}</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fireworkOrigin: {
    position: 'absolute',
    left: W / 2 - 8,
    top: ORIGIN_TOP,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
