import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';

export default function HomeQuickLinks({ onMap, onCollection }) {
  const { t } = useLanguage();
  const { colors } = useSettings();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          paddingHorizontal: 16,
          paddingTop: 4,
          paddingBottom: 4,
        },
        row: {
          flexDirection: 'row',
          gap: 10,
        },
        card: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          padding: 14,
          borderRadius: 16,
          backgroundColor: colors.bgElevated,
          borderWidth: 1,
          borderColor: colors.border,
        },
        icon: {
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
        },
        title: {
          fontSize: 14,
          fontWeight: '800',
          color: colors.text,
        },
        sub: {
          fontSize: 11,
          color: colors.textMuted,
          marginTop: 2,
        },
        pressed: {
          opacity: 0.88,
        },
      }),
    [colors]
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          onPress={onMap}
          accessibilityRole="button"
        >
          <View style={[styles.icon, { backgroundColor: 'rgba(96,165,250,0.2)' }]}>
            <Ionicons name="map" size={20} color="#60A5FA" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t('tabMap')}</Text>
            <Text style={styles.sub}>{t('homeQuickMapHint')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          onPress={onCollection}
          accessibilityRole="button"
        >
          <View style={[styles.icon, { backgroundColor: colors.primaryBg }]}>
            <Ionicons name="grid" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t('tabCollection')}</Text>
            <Text style={styles.sub}>{t('homeQuickCollectionHint')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}
