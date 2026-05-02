import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_SCROLL_SPACER } from '../constants/tabBar';
import { useLanguage } from '../context/LanguageContext';
import { useFigures } from '../context/FiguresContext';
import { useSearchTarget } from '../context/SearchTargetContext';

const MODE_TKEY = {
  statues: 'searchModeStatues',
  statues3d: 'searchModeStatues3d',
  pulpulaks: 'searchModePulpulaks',
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollInner,
          {
            paddingTop: 20,
            paddingBottom: 24 + TAB_BAR_SCROLL_SPACER + insets.bottom,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.headline}>{t('homeHeadline')}</Text>

        <Text style={styles.progressLine}>
          {t('homeProgressContext', {
            mode: t(MODE_TKEY[searchMode]),
            unlocked: unlockedCount,
            total: totalCount,
          })}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scroll: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: 22,
    alignItems: 'center',
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
    marginTop: 14,
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
});
