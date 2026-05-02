import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import HomeAlphabetBrowse from '../components/HomeAlphabetBrowse';
import { useLanguage } from '../context/LanguageContext';
import { useFigures } from '../context/FiguresContext';
import { useSearchTarget } from '../context/SearchTargetContext';

const MODE_TKEY = {
  statues: 'searchModeStatues',
  statues3d: 'searchModeStatues3d',
  pulpulaks: 'searchModePulpulaks',
};

export default function HomeScreen() {
  const { t } = useLanguage();
  const { storageLoaded, countsForSearchMode } = useFigures();
  const { searchMode } = useSearchTarget();

  const { unlockedCount, totalCount } = countsForSearchMode(searchMode);

  if (!storageLoaded) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#374151" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingHorizontal: 22 }]}>
        <Text style={styles.headline}>{t('homeHeadline')}</Text>
        <Text style={styles.progressLine}>
          {t('homeProgressContext', {
            mode: t(MODE_TKEY[searchMode]),
            unlocked: unlockedCount,
            total: totalCount,
          })}
        </Text>
      </View>
      <View style={styles.browseFill}>
        <HomeAlphabetBrowse />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  browseFill: {
    flex: 1,
    minHeight: 0,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  headline: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 30,
  },
  progressLine: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 360,
    alignSelf: 'center',
  },
});
