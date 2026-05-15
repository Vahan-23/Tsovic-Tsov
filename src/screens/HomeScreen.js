import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import CollectionEntryCard from '../components/CollectionEntryCard';
import DiscoverNearbyBlock from '../components/DiscoverNearbyBlock';
import WalkBankCard from '../components/WalkBankCard';
import { useLanguage } from '../context/LanguageContext';
import { useFigures } from '../context/FiguresContext';
import { useSettings } from '../context/SettingsContext';
import { useSearchTarget } from '../context/SearchTargetContext';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { storageLoaded, countsForSearchMode } = useFigures();
  const { searchMode } = useSearchTarget();
  const { colors } = useSettings();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.bg,
        },
        header: {
          paddingTop: 16,
          paddingBottom: 8,
        },
        radarFill: {
          flex: 1,
          minHeight: 0,
          justifyContent: 'center',
          alignItems: 'center',
          /** Shift radar cluster slightly above visual center (header pulls balance down). */
          marginTop: -18,
        },
        centered: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.bg,
        },
        headline: {
          fontSize: 24,
          fontWeight: '800',
          color: colors.text,
          textAlign: 'center',
          lineHeight: 30,
        },
        bankWrap: {
          marginTop: 12,
          marginBottom: 4,
        },
      }),
    [colors]
  );

  const { unlockedCount, totalCount } = countsForSearchMode(searchMode);

  if (!storageLoaded) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.activityIndicator} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingHorizontal: 22 }]}>
        <Text style={styles.headline}>{t('homeHeadline')}</Text>
        <View style={styles.bankWrap}>
          <WalkBankCard />
        </View>
        <CollectionEntryCard
          unlocked={unlockedCount}
          total={totalCount}
          onPress={() => navigation.navigate('Collection')}
        />
      </View>
      <View style={styles.radarFill}>
        <DiscoverNearbyBlock />
      </View>
    </View>
  );
}
