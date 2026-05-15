import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { useWalkBank } from '../context/WalkBankContext';
import { formatWalkDistance } from '../utils/formatWalkDistance';

/**
 * Home / map — balance of walk meters available for remote unlocks.
 */
export default function WalkBankCard({ compact = false }) {
  const { t } = useLanguage();
  const { colors, resolvedScheme } = useSettings();
  const { walkBankMeters, todayEarnedMeters, dailyCapMeters, loaded } =
    useWalkBank();

  const dailyProgress =
    dailyCapMeters > 0
      ? Math.min(1, todayEarnedMeters / dailyCapMeters)
      : 0;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: 16,
          padding: compact ? 12 : 14,
          backgroundColor:
            resolvedScheme === 'dark'
              ? 'rgba(154, 166, 255, 0.12)'
              : colors.primaryBg,
          borderWidth: 1,
          borderColor:
            resolvedScheme === 'dark'
              ? 'rgba(154, 166, 255, 0.28)'
              : colors.tileEnabledBorder,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        iconWrap: {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor:
            resolvedScheme === 'dark'
              ? 'rgba(201, 160, 32, 0.22)'
              : 'rgba(201, 160, 32, 0.18)',
        },
        body: {
          flex: 1,
          minWidth: 0,
        },
        label: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color: colors.textMuted,
          marginBottom: 2,
        },
        amount: {
          fontSize: compact ? 22 : 26,
          fontWeight: '800',
          color: colors.text,
          letterSpacing: -0.5,
        },
        hint: {
          fontSize: 12,
          color: colors.textSecondary,
          marginTop: 3,
          lineHeight: 16,
        },
        track: {
          height: 4,
          borderRadius: 2,
          backgroundColor:
            resolvedScheme === 'dark'
              ? 'rgba(255,255,255,0.1)'
              : 'rgba(15,23,42,0.08)',
          marginTop: 10,
          overflow: 'hidden',
        },
        fill: {
          height: '100%',
          borderRadius: 2,
          backgroundColor: '#C9A020',
        },
        trackCaption: {
          fontSize: 10,
          color: colors.textMuted,
          marginTop: 4,
        },
      }),
    [colors, compact, resolvedScheme]
  );

  if (!loaded) return null;

  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="footsteps" size={24} color="#C9A020" />
        </View>
        <View style={styles.body}>
          <Text style={styles.label}>{t('walkBankLabel')}</Text>
          <Text style={styles.amount}>
            {formatWalkDistance(walkBankMeters, t)}
          </Text>
          <Text style={styles.hint}>{t('walkBankHint')}</Text>
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${dailyProgress * 100}%` }]} />
      </View>
      <Text style={styles.trackCaption}>
        {t('walkBankDaily', {
          earned: formatWalkDistance(todayEarnedMeters, t),
          cap: formatWalkDistance(dailyCapMeters, t),
        })}
      </Text>
      <Text style={[styles.trackCaption, { marginTop: 6 }]}>
        {t('walkBankDailyWhy')}
      </Text>
    </View>
  );
}
