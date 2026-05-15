import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { useFigures } from '../context/FiguresContext';
import { useLanguage } from '../context/LanguageContext';

/**
 * Collection progress chip — unlocked / remaining (app header, next to walk bank).
 */
export default function CollectionHudPill() {
  const { t } = useLanguage();
  const { colors, resolvedScheme } = useSettings();
  const { hudUnlockedCount, totalCount, storageLoaded } = useFigures();

  const lockedLeft = Math.max(0, totalCount - hudUnlockedCount);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        pill: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingVertical: 6,
          paddingHorizontal: 11,
          borderRadius: 999,
          backgroundColor:
            resolvedScheme === 'dark'
              ? 'rgba(15, 20, 32, 0.92)'
              : 'rgba(255, 255, 255, 0.95)',
          borderWidth: 1.5,
          borderColor: colors.tileEnabledBorder,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: resolvedScheme === 'dark' ? 0.35 : 0.12,
          shadowRadius: 4,
          elevation: 3,
          flexShrink: 1,
        },
        icon: {
          width: 22,
          height: 22,
          borderRadius: 11,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primaryBg,
        },
        counts: {
          fontSize: 15,
          fontWeight: '800',
          color: colors.text,
          letterSpacing: -0.3,
        },
        sep: {
          fontSize: 14,
          fontWeight: '700',
          color: colors.textMuted,
          marginHorizontal: 1,
        },
        left: {
          color: colors.textSecondary,
        },
      }),
    [colors, resolvedScheme]
  );

  if (!storageLoaded) return null;

  return (
    <View
      style={styles.pill}
      accessibilityRole="text"
      accessibilityLabel={t('hudCollectionA11y', {
        unlocked: hudUnlockedCount,
        total: totalCount,
        left: lockedLeft,
      })}
    >
      <View style={styles.icon}>
        <Ionicons name="trophy" size={13} color={colors.primary} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={[styles.counts, { color: colors.primary }]}>
          {hudUnlockedCount}
        </Text>
        <Text style={styles.sep}>·</Text>
        <Text style={[styles.counts, styles.left]}>{lockedLeft}</Text>
      </View>
    </View>
  );
}
