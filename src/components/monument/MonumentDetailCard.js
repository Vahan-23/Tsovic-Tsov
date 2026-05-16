import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import RarityBadge from '../RarityBadge';
import { rarityAccentColor } from '../../utils/statueRarity';
import { resolveMonumentCardId } from '../../data/monumentCards';
import MotherArmeniaGlbViewer from '../MotherArmeniaGlbViewer';
import { useLanguage } from '../../context/LanguageContext';

function FactTile({ fact, styles, accent }) {
  return (
    <View style={[styles.factTile, { borderColor: `${accent}44` }]}>
      <View style={[styles.factIconWrap, { backgroundColor: `${accent}22` }]}>
        <Ionicons name={fact.icon} size={18} color={accent} />
      </View>
      <Text style={styles.factLabel}>{fact.label}</Text>
      <Text style={styles.factValue}>{fact.value}</Text>
    </View>
  );
}

/**
 * Rich monument detail — hero, fact grid, why / story sections.
 */
export default function MonumentDetailCard({
  title,
  figure,
  heroImageSource,
  card,
  colors,
  resolvedScheme,
  onNavigate,
  navigateLabel,
  motherArmenia3dHint,
}) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const scrollRef = useRef(null);
  const [heroBlockHeight, setHeroBlockHeight] = useState(0);
  const blinkDown = useRef(new Animated.Value(0)).current;
  const blinkUp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (v) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 900, useNativeDriver: true }),
        ])
      );
    const a = loop(blinkDown);
    const b = loop(blinkUp);
    a.start();
    b.start();
    return () => {
      a.stop();
      b.stop();
    };
  }, [blinkDown, blinkUp]);

  const scrollToInfo = useCallback(() => {
    if (heroBlockHeight > 0) {
      scrollRef.current?.scrollTo({ y: heroBlockHeight, animated: true });
    }
  }, [heroBlockHeight]);

  const scrollToModel = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const tier = figure?.rarity ?? 2;
  const accent = rarityAccentColor(tier);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          gap: 16,
        },
        viewerBleed: {
          marginHorizontal: -16,
        },
        motherModelWrap: {
          width: '100%',
          alignSelf: 'stretch',
          alignItems: 'center',
          justifyContent: 'center',
        },
        motherArrowPress: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 12,
          paddingHorizontal: 28,
        },
        motherInfoSection: {
          paddingHorizontal: 16,
          gap: 16,
          paddingTop: 12,
          paddingBottom: 8,
        },
        motherStickyUpBar: {
          backgroundColor: colors.bg,
          paddingTop: 4,
          paddingBottom: 10,
          alignItems: 'center',
          justifyContent: 'center',
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.borderMuted,
          ...Platform.select({
            android: { elevation: 3 },
          }),
        },
        heroWrap: {
          borderRadius: 24,
          overflow: 'hidden',
          backgroundColor: colors.placeholderBg,
          borderWidth: tier === 3 ? 2 : 1,
          borderColor: tier === 3 ? accent : colors.border,
          ...Platform.select({
            ios: {
              shadowColor: accent,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: tier === 3 ? 0.35 : 0.12,
              shadowRadius: 20,
            },
            android: { elevation: tier === 3 ? 8 : 4 },
          }),
        },
        heroImage: {
          width: '100%',
          height: 280,
          backgroundColor: colors.placeholderBg,
        },
        heroShadeMid: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '70%',
          backgroundColor: 'rgba(15, 23, 42, 0.35)',
        },
        heroShadeBot: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '48%',
          backgroundColor: 'rgba(15, 23, 42, 0.88)',
        },
        heroContent: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 18,
          paddingBottom: 18,
          paddingTop: 48,
        },
        heroTitle: {
          fontSize: 26,
          fontWeight: '900',
          color: '#FFFFFF',
          letterSpacing: -0.6,
          lineHeight: 32,
          marginBottom: 8,
        },
        heroLead: {
          fontSize: 14,
          lineHeight: 20,
          color: 'rgba(255,255,255,0.88)',
          marginBottom: 12,
        },
        heroRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 8,
        },
        discoveredChip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 999,
          backgroundColor: 'rgba(34,197,94,0.35)',
        },
        discoveredText: {
          fontSize: 12,
          fontWeight: '800',
          color: '#FFFFFF',
        },
        sheet: {
          borderRadius: 22,
          padding: 18,
          backgroundColor: colors.bgElevated,
          borderWidth: 1,
          borderColor: colors.border,
        },
        sectionLabel: {
          fontSize: 11,
          fontWeight: '800',
          letterSpacing: 1.1,
          textTransform: 'uppercase',
          color: accent,
          marginBottom: 10,
        },
        sectionBody: {
          fontSize: 16,
          lineHeight: 25,
          color: colors.textSecondary,
        },
        factsGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 4,
        },
        factTile: {
          width: '48%',
          flexGrow: 1,
          minWidth: 140,
          padding: 12,
          borderRadius: 16,
          backgroundColor:
            resolvedScheme === 'dark'
              ? 'rgba(15, 23, 42, 0.6)'
              : colors.bgMuted,
          borderWidth: 1,
        },
        factIconWrap: {
          width: 34,
          height: 34,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
        },
        factLabel: {
          fontSize: 11,
          fontWeight: '700',
          color: colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
          marginBottom: 4,
        },
        factValue: {
          fontSize: 14,
          fontWeight: '800',
          color: colors.text,
          lineHeight: 19,
        },
        divider: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: colors.borderMuted,
          marginVertical: 18,
        },
        locationRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
          marginTop: 4,
        },
        locationText: {
          flex: 1,
          fontSize: 14,
          lineHeight: 20,
          color: colors.textMuted,
        },
        navBtn: {
          marginTop: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 14,
          borderRadius: 14,
          backgroundColor: colors.primary,
        },
        navBtnText: {
          fontSize: 16,
          fontWeight: '800',
          color: '#FFFFFF',
        },
        compactHeader: {
          borderRadius: 20,
          padding: 18,
          backgroundColor: colors.bgElevated,
          borderWidth: 1,
          borderColor: tier === 3 ? accent : colors.border,
          gap: 10,
        },
        compactTitle: {
          fontSize: 24,
          fontWeight: '900',
          color: colors.text,
          letterSpacing: -0.5,
        },
        compactLead: {
          fontSize: 15,
          lineHeight: 22,
          color: colors.textSecondary,
        },
        compactRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 8,
        },
        compactDiscoveredChip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 999,
          backgroundColor: '#16A34A',
        },
        compactDiscoveredText: {
          fontSize: 12,
          fontWeight: '800',
          color: '#FFFFFF',
        },
        bioBlock: {
          marginTop: 4,
          padding: 14,
          borderRadius: 14,
          backgroundColor: colors.primaryBg,
          borderWidth: 1,
          borderColor: colors.tileEnabledBorder,
        },
        bioHeading: {
          fontSize: 13,
          fontWeight: '800',
          color: colors.primary,
          marginBottom: 8,
        },
        bioText: {
          fontSize: 15,
          lineHeight: 23,
          color: colors.textSecondary,
        },
      }),
    [colors, resolvedScheme, tier, accent]
  );

  const hasFacts = card.facts?.length > 0;
  const hasWhy = Boolean(card.whyHere);
  const hasStory = Boolean(card.story);
  const hasPersonBio = Boolean(card.personBio) && card.personBio !== card.story;

  const monumentCardId = resolveMonumentCardId(figure);
  const showMotherArmenia3d = monumentCardId === 'mother_armenia';

  const sheetBody = (
    <View style={styles.sheet}>
        {hasFacts ? (
          <>
            <Text style={styles.sectionLabel}>{card.factsSectionTitle}</Text>
            <View style={styles.factsGrid}>
              {card.facts.map((fact, i) => (
                <FactTile
                  key={`${fact.label}-${i}`}
                  fact={fact}
                  styles={styles}
                  accent={accent}
                />
              ))}
            </View>
          </>
        ) : null}

        {hasWhy ? (
          <>
            {hasFacts ? <View style={styles.divider} /> : null}
            <Text style={styles.sectionLabel}>{card.whySectionTitle}</Text>
            <Text style={styles.sectionBody}>{card.whyHere}</Text>
          </>
        ) : null}

        {hasStory ? (
          <>
            {hasFacts || hasWhy ? <View style={styles.divider} /> : null}
            <Text style={styles.sectionLabel}>{card.storySectionTitle}</Text>
            <Text style={styles.sectionBody}>{card.story}</Text>
          </>
        ) : null}

        {hasPersonBio ? (
          <View style={styles.bioBlock}>
            <Text style={styles.bioHeading}>{card.personSectionTitle}</Text>
            <Text style={styles.bioText}>{card.personBio}</Text>
          </View>
        ) : null}

        {card.locationLine ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={20} color={accent} />
            <Text style={styles.locationText}>{card.locationLine}</Text>
          </View>
        ) : null}

        {onNavigate ? (
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.9 }]}
            onPress={onNavigate}
          >
            <Ionicons name="navigate" size={20} color="#FFFFFF" />
            <Text style={styles.navBtnText}>{navigateLabel}</Text>
          </Pressable>
        ) : null}
    </View>
  );

  if (showMotherArmenia3d) {
    const topBand = Math.max(0, insets.top - 20);
    const arrowBand = 92;
    const rawGlH = Math.max(
      300,
      Math.min(
        Math.round(windowHeight * 0.8),
        windowHeight - topBand - arrowBand - insets.bottom
      )
    );
    const glViewerHeight = Number.isFinite(rawGlH) && rawGlH > 0 ? rawGlH : 320;
    const gold = '#d8a85a';
    const downArrowAnimatedStyle = {
      opacity: blinkDown.interpolate({ inputRange: [0, 1], outputRange: [0.34, 1] }),
      transform: [
        {
          translateY: blinkDown.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }),
        },
      ],
    };
    const upArrowAnimatedStyle = {
      opacity: blinkUp.interpolate({ inputRange: [0, 1], outputRange: [0.34, 1] }),
      transform: [
        {
          translateY: blinkUp.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }),
        },
      ],
    };

    return (
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        stickyHeaderIndices={[1]}
      >
        <View
          style={{
            minHeight: windowHeight,
            width: '100%',
            paddingTop: Math.max(0, insets.top - 18),
          }}
          onLayout={(e) => setHeroBlockHeight(e.nativeEvent.layout.height)}
        >
          <View
            style={[
              styles.motherModelWrap,
              {
                height: glViewerHeight,
                minHeight: glViewerHeight,
                marginTop: -54,
              },
            ]}
            collapsable={false}
          >
            <MotherArmeniaGlbViewer
              key={`ma-glb-${glViewerHeight}`}
              colors={colors}
              hintLabel={motherArmenia3dHint ?? ''}
              viewerHeight={glViewerHeight}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('statueMotherArmeniaScrollToInfo')}
            android_ripple={{ color: 'rgba(216,168,90,0.28)' }}
            onPress={scrollToInfo}
            style={({ pressed }) => [styles.motherArrowPress, pressed && { opacity: 0.88 }]}
          >
            <Animated.View style={downArrowAnimatedStyle}>
              <Ionicons name="chevron-down-circle" size={48} color={gold} />
            </Animated.View>
          </Pressable>
        </View>

        <View style={styles.motherStickyUpBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('statueMotherArmeniaScrollToModel')}
            android_ripple={{ color: 'rgba(216,168,90,0.28)' }}
            onPress={scrollToModel}
            style={({ pressed }) => [styles.motherArrowPress, pressed && { opacity: 0.88 }]}
          >
            <Animated.View style={upArrowAnimatedStyle}>
              <Ionicons name="chevron-up-circle" size={48} color={gold} />
            </Animated.View>
          </Pressable>
        </View>

        <View style={styles.motherInfoSection}>
          <View style={styles.compactHeader}>
            {card.lead ? <Text style={styles.compactLead}>{card.lead}</Text> : null}
            <View style={styles.compactRow}>
              <View style={styles.compactDiscoveredChip}>
                <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
                <Text style={styles.compactDiscoveredText}>{card.discoveredLabel}</Text>
              </View>
              {figure?.rarity ? <RarityBadge tier={figure.rarity} compact /> : null}
            </View>
          </View>
          {sheetBody}
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.heroWrap}>
        {heroImageSource ? (
          <Image source={heroImageSource} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={[styles.heroImage, { backgroundColor: colors.bgMuted }]} />
        )}
        <View style={styles.heroShadeMid} pointerEvents="none" />
        <View style={styles.heroShadeBot} pointerEvents="none" />
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>{title}</Text>
          {card.lead ? (
            <Text style={styles.heroLead}>{card.lead}</Text>
          ) : null}
          <View style={styles.heroRow}>
            <View style={styles.discoveredChip}>
              <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
              <Text style={styles.discoveredText}>{card.discoveredLabel}</Text>
            </View>
            {figure?.rarity ? <RarityBadge tier={figure.rarity} compact /> : null}
          </View>
        </View>
      </View>

      {sheetBody}
    </View>
  );
}
