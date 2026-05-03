import React, { useEffect, useMemo, useState } from 'react';
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
import { useSettings } from '../context/SettingsContext';
import { useFigures } from '../context/FiguresContext';

const ACCENT = {
  abovyan: '#7C3AED',
  komitas: '#059669',
  tumanyan: '#D97706',
};

const LOCKED_ONLY_KEY = '@tsovic_tsov/collection_locked_only';

const COLLECTION_KIND = 'statues';

export default function CollectionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { colors } = useSettings();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.bg,
          paddingHorizontal: 12,
          paddingTop: 8,
        },
        centered: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.bg,
        },
        progress: {
          fontSize: 16,
          fontWeight: '600',
          color: colors.text,
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
          backgroundColor: colors.bgElevated,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
        },
        filterTextWrap: {
          flex: 1,
        },
        filterTitle: {
          fontSize: 15,
          fontWeight: '700',
          color: colors.text,
        },
        filterHint: {
          marginTop: 4,
          fontSize: 12,
          color: colors.textMuted,
          lineHeight: 16,
        },
        emptyFilter: {
          textAlign: 'center',
          color: colors.textSubtle,
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
          backgroundColor: colors.bgElevated,
          borderRadius: 12,
          padding: 10,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 2,
          elevation: 2,
        },
        cardLocked: {
          backgroundColor: colors.placeholderBg,
          borderColor: colors.borderMuted,
          opacity: 0.85,
        },
        cardPressed: {
          opacity: 0.92,
        },
        cardInitial: {
          fontSize: 28,
          fontWeight: '700',
          color: colors.textSubtle,
          marginBottom: 6,
        },
        cardName: {
          fontSize: 11,
          fontWeight: '600',
          color: colors.text,
          textAlign: 'center',
        },
        cardNameLocked: {
          color: colors.textMuted,
        },
      }),
    [colors]
  );
  const {
    collectionGridForMode,
    lockedOnlyGridForMode,
    countsForSearchMode,
    storageLoaded,
  } = useFigures();

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
    ? lockedOnlyGridForMode(COLLECTION_KIND)
    : collectionGridForMode(COLLECTION_KIND);
  const { unlockedCount, totalCount } = countsForSearchMode(COLLECTION_KIND);

  if (!storageLoaded) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.activityIndicator} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: 12 }]}>
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
          trackColor={{
            false: colors.switchTrackOff,
            true: colors.switchTrackOn,
          }}
          thumbColor={
            lockedOnly ? colors.switchThumbOn : colors.switchThumbOff
          }
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
                  collectionKind: COLLECTION_KIND,
                })
              }
            >
              <Text
                style={[
                  styles.cardInitial,
                  item.unlocked && {
                    color: ACCENT[String(item.id)] ?? '#2563EB',
                  },
                ]}
                numberOfLines={1}
              >
                {item.displayName?.charAt(0) ?? '•'}
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
