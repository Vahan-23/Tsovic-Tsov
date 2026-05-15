import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { useWalkBank } from '../context/WalkBankContext';
import { formatWalkDistance } from '../utils/formatWalkDistance';
import { useLanguage } from '../context/LanguageContext';

/**
 * Compact “game currency” chip — footsteps balance (shown in app header).
 */
export default function WalkBankHudPill() {
  const { t } = useLanguage();
  const { colors, resolvedScheme } = useSettings();
  const { walkBankMeters, loaded } = useWalkBank();

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
          borderColor: 'rgba(201, 160, 32, 0.55)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: resolvedScheme === 'dark' ? 0.35 : 0.12,
          shadowRadius: 4,
          elevation: 3,
        },
        icon: {
          width: 22,
          height: 22,
          borderRadius: 11,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(201, 160, 32, 0.22)',
        },
        amount: {
          fontSize: 15,
          fontWeight: '800',
          color: colors.text,
          letterSpacing: -0.3,
        },
      }),
    [colors, resolvedScheme]
  );

  if (!loaded) return null;

  return (
    <View
      style={styles.pill}
      accessibilityRole="text"
      accessibilityLabel={t('walkBankHudA11y', {
        amount: formatWalkDistance(walkBankMeters, t),
      })}
    >
      <View style={styles.icon}>
        <Ionicons name="footsteps" size={14} color="#C9A020" />
      </View>
      <Text style={styles.amount}>{formatWalkDistance(walkBankMeters, t)}</Text>
    </View>
  );
}
