import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_SCROLL_SPACER } from '../constants/tabBar';
import { useLanguage } from '../context/LanguageContext';
import { useFigures } from '../context/FiguresContext';
import { useSearchTarget } from '../context/SearchTargetContext';

const ACCENT = {
  abovyan: '#7C3AED',
  komitas: '#059669',
  tumanyan: '#D97706',
};

const LOCKED_ONLY_KEY = '@tsovic_tsov/collection_locked_only';

const MODE_TKEY = {
  statues: 'searchModeStatues',
  statues3d: 'searchModeStatues3d',
  pulpulaks: 'searchModePulpulaks',
};

export default function CollectionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const {
    collectionGridForMode,
    lockedOnlyGridForMode,
    countsForSearchMode,
    storageLoaded,
  } = useFigures();
  const { searchMode } = useSearchTarget();

  const [lockedOnly, setLockedOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(LOCKED_ONLY_KEY);
        if (!cancelled && raw === '1') setLockedOnly(true);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleLockedOnly = React.useCallback((value) => {
    setLockedOnly(value);
    AsyncStorage.setItem(LOCKED_ONLY_KEY, value ? '1' : '0').catch(() => {});
  }, []);

  const gridData = lockedOnly
    ? lockedOnlyGridForMode(searchMode)
    : collectionGridForMode(searchMode);
  const { unlockedCount, totalCount } = countsForSearchMode(searchMode);

  if (!storageLoaded) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#374151" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: 12 }]}>
      <View style={styles.collectionBanner}>
        <Text style={styles.bannerLabel}>{t(MODE_TKEY[searchMode])}</Text>
      </View>

      <Text style={styles.progress}>
        {t('progressLabel', { unlocked: unlockedCount, total: totalCount })}
      </Text>

      <View style={styles.filterRow}>
        <View style={styles.filterTextWrap}>
          <Text style={styles.filterTitle}>{t('collectionLockedToggle')}</Text>
          <Text style={styles.filterHint}>{t('collectionLockedHint')}</Text>
        </View>
        <Switch
          value={lockedOnly}
          onValueChange={toggleLockedOnly}
          trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
          thumbColor={lockedOnly ? '#1D4ED8' : '#F3F4F6'}
        />
      </View>

      {gridData.length === 0 ? (
        <Text
          style={[
            styles.emptyFilter,
            {
              paddingBottom: TAB_BAR_SCROLL_SPACER + Math.max(insets.bottom, 8),
            },
          ]}
        >
          {t('collectionLockedEmpty')}
        </Text>
      ) : (
        <FlatList
          data={gridData}
          keyExtractor={(item) => String(item.id)}
          numColumns={3}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[
            styles.grid,
            {
              paddingBottom: TAB_BAR_SCROLL_SPACER + Math.max(insets.bottom, 8),
            },
          ]}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                !item.unlocked && styles.cardLocked,
                pressed && styles.cardPressed,
              ]}
              onPress={() =>
                navigation.navigate('StatueDetail', {
                  statueId: item.id,
                  collectionKind: searchMode,
                })
              }
            >
              <Text
                style={[
                  styles.cardInitial,
                  item.unlocked && {
                    color:
                      searchMode === 'pulpulaks'
                        ? '#0EA5E9'
                        : searchMode === 'statues3d'
                          ? ACCENT[String(item.linkedStatueId)] ?? '#7C3AED'
                          : ACCENT[String(item.id)] ?? '#2563EB',
                  },
                ]}
                numberOfLines={1}
              >
                {searchMode === 'pulpulaks'
                  ? '💧'
                  : item.displayName?.charAt(0) ?? '•'}
              </Text>
              <Text
                style={[styles.cardName, !item.unlocked && styles.cardNameLocked]}
                numberOfLines={2}
              >
                {item.displayName ?? item.name}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  collectionBanner: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
    marginBottom: 10,
  },
  bannerLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4338CA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterTextWrap: {
    flex: 1,
  },
  filterTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  filterHint: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  emptyFilter: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 15,
    marginTop: 24,
    paddingHorizontal: 16,
  },
  grid: {
    paddingBottom: 8,
  },
  row: {
    gap: 8,
    marginBottom: 8,
  },
  card: {
    flex: 1,
    aspectRatio: 0.85,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  cardLocked: {
    backgroundColor: '#E5E7EB',
    borderColor: '#D1D5DB',
    opacity: 0.85,
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardInitial: {
    fontSize: 28,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 6,
  },
  cardName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  cardNameLocked: {
    color: '#6B7280',
  },
});
