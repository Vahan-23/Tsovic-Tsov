import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DiscoverNearbyBlock from '../DiscoverNearbyBlock';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { UNLOCK_RADIUS_METERS } from '../../constants/unlockRadius';

const TIPS = [
  { icon: 'locate', key: 'homeTipGps' },
  { icon: 'flash', key: 'homeTipInstant' },
  { icon: 'sparkles', key: 'homeTipCelebrate' },
];

export default function HomeSearchSection() {
  const { t } = useLanguage();
  const { colors, resolvedScheme } = useSettings();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          marginTop: 4,
          paddingBottom: 8,
        },
        actionCard: {
          marginHorizontal: 16,
          borderRadius: 24,
          paddingTop: 18,
          paddingBottom: 6,
          backgroundColor:
            resolvedScheme === 'dark'
              ? 'rgba(26, 34, 54, 0.95)'
              : colors.bgElevated,
          borderWidth: 1,
          borderColor:
            resolvedScheme === 'dark'
              ? 'rgba(154, 166, 255, 0.35)'
              : colors.tileEnabledBorder,
          ...Platform.select({
            ios: {
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: resolvedScheme === 'dark' ? 0.35 : 0.15,
              shadowRadius: 20,
            },
            android: { elevation: 6 },
          }),
        },
        badge: {
          alignSelf: 'center',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingVertical: 5,
          paddingHorizontal: 12,
          borderRadius: 999,
          backgroundColor: colors.primary,
          marginBottom: 12,
        },
        badgeText: {
          fontSize: 11,
          fontWeight: '800',
          letterSpacing: 0.5,
          color: '#FFFFFF',
          textTransform: 'uppercase',
        },
        title: {
          fontSize: 22,
          fontWeight: '900',
          textAlign: 'center',
          color: colors.text,
          letterSpacing: -0.5,
          paddingHorizontal: 16,
        },
        subtitle: {
          fontSize: 14,
          textAlign: 'center',
          color: colors.textSecondary,
          marginTop: 6,
          marginBottom: 4,
          paddingHorizontal: 20,
          lineHeight: 20,
        },
        radarHost: {
          alignItems: 'center',
          marginTop: -8,
        },
        tips: {
          paddingHorizontal: 20,
          paddingTop: 4,
          paddingBottom: 14,
          gap: 8,
        },
        tipRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        },
        tipIcon: {
          width: 28,
          height: 28,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.bgMuted,
        },
        tipText: {
          flex: 1,
          fontSize: 12,
          lineHeight: 17,
          color: colors.textMuted,
        },
      }),
    [colors, resolvedScheme]
  );

  return (
    <View style={styles.section}>
      <View style={styles.actionCard}>
        <View style={styles.badge}>
          <Ionicons name="star" size={12} color="#FFFFFF" />
          <Text style={styles.badgeText}>{t('homeMainActionBadge')}</Text>
        </View>
        <Text style={styles.title}>{t('homeSearchTitle')}</Text>
        <Text style={styles.subtitle}>
          {t('homeSearchSubtitle', { n: UNLOCK_RADIUS_METERS })}
        </Text>
        <View style={styles.radarHost}>
          <DiscoverNearbyBlock />
        </View>
        <View style={styles.tips}>
          {TIPS.map((tip) => (
            <View key={tip.key} style={styles.tipRow}>
              <View style={styles.tipIcon}>
                <Ionicons name={tip.icon} size={14} color={colors.primary} />
              </View>
              <Text style={styles.tipText}>{t(tip.key)}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
