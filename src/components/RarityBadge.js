import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import {
  rarityAccentColor,
  rarityI18nKey,
  rarityShortLabel,
} from '../utils/statueRarity';

/**
 * Compact rarity pill (I / II / III).
 */
export default function RarityBadge({ tier, compact = false, style }) {
  const { t } = useLanguage();
  const { colors, resolvedScheme } = useSettings();
  const accent = rarityAccentColor(tier);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        pill: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: compact ? 2 : 4,
          paddingHorizontal: compact ? 6 : 8,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: accent,
          backgroundColor:
            resolvedScheme === 'dark'
              ? `${accent}22`
              : `${accent}18`,
        },
        roman: {
          fontSize: compact ? 10 : 11,
          fontWeight: '900',
          color: accent,
          letterSpacing: 0.3,
        },
        label: {
          fontSize: compact ? 10 : 11,
          fontWeight: '700',
          color: colors.textSecondary,
          marginLeft: compact ? 4 : 5,
        },
      }),
    [accent, colors, compact, resolvedScheme]
  );

  if (!tier) return null;

  return (
    <View style={[styles.pill, style]} accessibilityRole="text">
      <Text style={styles.roman}>{rarityShortLabel(tier)}</Text>
      {!compact ? (
        <Text style={styles.label} numberOfLines={1}>
          {t(rarityI18nKey(tier))}
        </Text>
      ) : null}
    </View>
  );
}
