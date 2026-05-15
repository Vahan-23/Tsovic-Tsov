import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { UNLOCK_RADIUS_METERS } from '../../constants/unlockRadius';

const STEPS = [
  {
    icon: 'footsteps',
    color: '#C9A020',
    titleKey: 'homeStep1Title',
    bodyKey: 'homeStep1Body',
  },
  {
    icon: 'radio',
    color: '#60A5FA',
    titleKey: 'homeStep2Title',
    bodyKey: 'homeStep2Body',
    bodyParams: { n: UNLOCK_RADIUS_METERS },
  },
  {
    icon: 'map',
    color: '#4ADE80',
    titleKey: 'homeStep3Title',
    bodyKey: 'homeStep3Body',
  },
];

export default function HomeHowItWorks() {
  const { t } = useLanguage();
  const { colors } = useSettings();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          paddingTop: 8,
          paddingBottom: 4,
        },
        label: {
          fontSize: 11,
          fontWeight: '800',
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: colors.textMuted,
          paddingHorizontal: 20,
          marginBottom: 10,
        },
        scroll: {
          paddingHorizontal: 16,
          gap: 10,
        },
        card: {
          width: 152,
          padding: 14,
          borderRadius: 16,
          backgroundColor: colors.bgElevated,
          borderWidth: 1,
          borderColor: colors.border,
          marginRight: 10,
        },
        stepNum: {
          fontSize: 10,
          fontWeight: '800',
          color: colors.textMuted,
          marginBottom: 8,
        },
        iconWrap: {
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
        },
        title: {
          fontSize: 14,
          fontWeight: '800',
          color: colors.text,
          marginBottom: 4,
        },
        body: {
          fontSize: 12,
          lineHeight: 17,
          color: colors.textSecondary,
        },
      }),
    [colors]
  );

  return (
    <View style={styles.section}>
      <Text style={styles.label}>{t('homeHowItWorks')}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {STEPS.map((step, index) => (
          <View key={step.titleKey} style={styles.card}>
            <Text style={styles.stepNum}>
              {t('homeStepNum', { n: index + 1 })}
            </Text>
            <View
              style={[styles.iconWrap, { backgroundColor: `${step.color}22` }]}
            >
              <Ionicons name={step.icon} size={22} color={step.color} />
            </View>
            <Text style={styles.title}>{t(step.titleKey)}</Text>
            <Text style={styles.body}>
              {t(step.bodyKey, step.bodyParams ?? {})}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
