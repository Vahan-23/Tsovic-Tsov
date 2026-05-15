import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { useWalkBank } from '../../context/WalkBankContext';
import { formatWalkDistance } from '../../utils/formatWalkDistance';

export default function HomeHeroStrip({ unlocked, total, lockedLeft }) {
  const { t } = useLanguage();
  const { colors, resolvedScheme } = useSettings();
  const { walkBankMeters, loaded } = useWalkBank();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 4,
        },
        tagline: {
          fontSize: 15,
          lineHeight: 22,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 16,
        },
        pills: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          justifyContent: 'center',
        },
        pill: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 999,
          backgroundColor: colors.bgElevated,
          borderWidth: 1,
          borderColor: colors.border,
        },
        pillGold: {
          borderColor: 'rgba(201, 160, 32, 0.45)',
          backgroundColor:
            resolvedScheme === 'dark'
              ? 'rgba(201, 160, 32, 0.12)'
              : 'rgba(201, 160, 32, 0.1)',
        },
        pillPrimary: {
          borderColor: colors.tileEnabledBorder,
          backgroundColor: colors.primaryBg,
        },
        pillText: {
          fontSize: 13,
          fontWeight: '700',
          color: colors.text,
        },
        pillSub: {
          fontSize: 11,
          fontWeight: '600',
          color: colors.textMuted,
        },
        progressIcon: {
          width: 32,
          height: 32,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primaryBg,
        },
      }),
    [colors, resolvedScheme]
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.tagline}>{t('homeTagline')}</Text>
      <View style={styles.pills}>
        {loaded ? (
          <View style={[styles.pill, styles.pillGold]}>
            <Ionicons name="footsteps" size={16} color="#C9A020" />
            <View>
              <Text style={styles.pillText}>
                {formatWalkDistance(walkBankMeters, t)}
              </Text>
              <Text style={styles.pillSub}>{t('homePillWalk')}</Text>
            </View>
          </View>
        ) : null}
        <View style={[styles.pill, styles.pillPrimary]}>
          <View style={styles.progressIcon}>
            <Ionicons name="trophy" size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.pillText}>
              {t('homeProgressContext', { unlocked, total })}
            </Text>
            <Text style={styles.pillSub}>{t('homePillCollection')}</Text>
          </View>
        </View>
        {lockedLeft > 0 ? (
          <View style={styles.pill}>
            <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
            <Text style={styles.pillText}>
              {t('homeLockedLeft', { n: lockedLeft })}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
