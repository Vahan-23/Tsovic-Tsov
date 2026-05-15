import React, { useMemo } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RarityBadge from '../RarityBadge';
import { rarityAccentColor } from '../../utils/statueRarity';

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
}) {
  const tier = figure?.rarity ?? 2;
  const accent = rarityAccentColor(tier);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          gap: 16,
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
    </View>
  );
}
