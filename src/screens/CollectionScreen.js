import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TAB_BAR_SCROLL_SPACER } from '../constants/tabBar';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { useFigures } from '../context/FiguresContext';
import { labelForBrowseLocale } from '../utils/alphabetBrowse';
import {
  getStatueCollectionImageSource,
  hasStatueCollectionImage,
} from '../data/statueCollectionImages';

const UNLOCKED_ONLY_FILTER_KEY = '@tsovic_tsov/collection_unlocked_only';

/** Сначала объекты с локальным превью в assets, затем по алфавиту. */
function sortStatuesForCollection(items, locale) {
  return [...items].sort((a, b) => {
    const pa = hasStatueCollectionImage(a) ? 1 : 0;
    const pb = hasStatueCollectionImage(b) ? 1 : 0;
    if (pb !== pa) return pb - pa;
    const la = labelForBrowseLocale(a, locale).toLowerCase();
    const lb = labelForBrowseLocale(b, locale).toLowerCase();
    const tag = locale === 'ru' ? 'ru' : locale === 'hy' ? 'hy' : 'en';
    try {
      return la.localeCompare(lb, tag);
    } catch {
      return la.localeCompare(lb);
    }
  });
}
const COLLECTION_KIND = 'statues';
const COLUMN_GAP = 10;

function placeholderTint(id, dark) {
  const s = String(id);
  let n = 7;
  for (let i = 0; i < s.length; i++) {
    n = (n + s.charCodeAt(i) * 37) % 320;
  }
  const sat = dark ? 38 : 36;
  const light = dark ? 26 : 90;
  return `hsl(${n}, ${sat}%, ${light}%)`;
}

function CollectionFigureTile({
  item,
  tileWidth,
  onPress,
  styles,
  colors,
  locale,
  t,
  resolvedScheme,
}) {
  const title = labelForBrowseLocale(item, locale);
  const localThumb = getStatueCollectionImageSource(item);
  const initial = (title || '?').trim().charAt(0).toUpperCase() || '•';
  const tint = placeholderTint(item.id, resolvedScheme === 'dark');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tileWrap,
        { width: tileWidth },
        pressed && styles.tilePressed,
      ]}
    >
      <View style={[styles.tileCard, !item.unlocked && styles.tileCardLocked]}>
        <View style={styles.tileImageSection}>
          {localThumb ? (
            <Image source={localThumb} style={styles.tileImage} resizeMode="cover" />
          ) : (
            <View style={[styles.tilePlaceholder, { backgroundColor: tint }]}>
              <Text style={styles.tileInitial}>{initial}</Text>
              <View style={styles.tilePlaceholderIcon}>
                <Ionicons name="business" size={36} color="rgba(255,255,255,0.35)" />
              </View>
            </View>
          )}
          {!item.unlocked ? (
            <View style={styles.tileLockOverlay}>
              <View style={styles.tileLockBubble}>
                <Ionicons name="lock-closed" size={22} color="#FFFFFF" />
              </View>
            </View>
          ) : (
            <View style={styles.tileOpenBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            </View>
          )}
        </View>
        <View style={styles.tileFooter}>
          <Text
            style={[styles.tileTitle, !item.unlocked && styles.tileTitleMuted]}
            numberOfLines={2}
          >
            {title}
          </Text>
          {!item.unlocked ? (
            <Text style={styles.tileLockedHint}>{t('collectionCardLocked')}</Text>
          ) : (
            <Text style={styles.tileOpenHint} numberOfLines={1}>
              {t('statueDiscovered')}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function CollectionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { t, locale } = useLanguage();
  const { colors, resolvedScheme } = useSettings();
  const pad = 12;
  const tileWidth = Math.max(
    140,
    (width - pad * 2 - COLUMN_GAP) / 2
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.bg,
          paddingHorizontal: pad,
          paddingTop: 10,
        },
        centered: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.bg,
        },
        progressWrap: {
          marginBottom: 14,
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: 18,
          backgroundColor: colors.bgElevated,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        progressTitle: {
          fontSize: 13,
          fontWeight: '700',
          color: colors.textMuted,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          marginBottom: 6,
        },
        progressStat: {
          fontSize: 26,
          fontWeight: '900',
          letterSpacing: -0.8,
          color: colors.text,
        },
        filterRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 14,
          paddingVertical: 12,
          paddingHorizontal: 14,
          backgroundColor: colors.bgElevated,
          borderRadius: 14,
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
          justifyContent: 'space-between',
          marginBottom: COLUMN_GAP,
        },
        tileWrap: {},
        tilePressed: {
          opacity: 0.94,
          transform: [{ scale: 0.988 }],
        },
        tileCard: {
          borderRadius: 18,
          overflow: 'hidden',
          backgroundColor: colors.bgElevated,
          borderWidth: 1,
          borderColor: colors.tileEnabledBorder,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 4,
        },
        tileCardLocked: {
          borderColor: colors.borderMuted,
          opacity: 0.96,
        },
        tileImageSection: {
          width: '100%',
          aspectRatio: 1.05,
          backgroundColor: colors.placeholderBg,
          position: 'relative',
        },
        tileImage: {
          width: '100%',
          height: '100%',
        },
        tilePlaceholder: {
          ...StyleSheet.absoluteFillObject,
          alignItems: 'center',
          justifyContent: 'center',
        },
        tileInitial: {
          fontSize: 44,
          fontWeight: '900',
          color: 'rgba(255,255,255,0.92)',
          letterSpacing: -1,
        },
        tilePlaceholderIcon: {
          position: 'absolute',
          bottom: 10,
          right: 10,
          opacity: 0.9,
        },
        tileLockOverlay: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(15, 23, 42, 0.48)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        tileLockBubble: {
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: 'rgba(0,0,0,0.35)',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.25)',
        },
        tileOpenBadge: {
          position: 'absolute',
          top: 10,
          right: 10,
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: 'rgba(13, 155, 114, 0.92)',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.35)',
        },
        tileFooter: {
          paddingHorizontal: 12,
          paddingTop: 10,
          paddingBottom: 12,
        },
        tileTitle: {
          fontSize: 14,
          fontWeight: '800',
          color: colors.text,
          lineHeight: 19,
          letterSpacing: -0.2,
        },
        tileTitleMuted: {
          color: colors.textSecondary,
          fontWeight: '700',
        },
        tileLockedHint: {
          marginTop: 5,
          fontSize: 11,
          fontWeight: '700',
          color: colors.textMuted,
          letterSpacing: 0.3,
          textTransform: 'uppercase',
        },
        tileOpenHint: {
          marginTop: 5,
          fontSize: 12,
          fontWeight: '600',
          color: colors.accentGreen,
        },
      }),
    [colors]
  );

  const {
    collectionGridForMode,
    unlockedOnlyGridForMode,
    countsForSearchMode,
    storageLoaded,
    figures,
  } = useFigures();

  const [unlockedOnlyFilter, setUnlockedOnlyFilter] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(UNLOCKED_ONLY_FILTER_KEY);
        if (!cancelled && raw === '1') setUnlockedOnlyFilter(true);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleUnlockedOnlyFilter = useCallback((value) => {
    setUnlockedOnlyFilter(value);
    AsyncStorage.setItem(UNLOCKED_ONLY_FILTER_KEY, value ? '1' : '0').catch(
      () => {}
    );
  }, []);

  const gridData = useMemo(() => {
    const raw = unlockedOnlyFilter
      ? unlockedOnlyGridForMode(COLLECTION_KIND)
      : collectionGridForMode(COLLECTION_KIND);
    return sortStatuesForCollection(raw, locale);
  }, [
    unlockedOnlyFilter,
    unlockedOnlyGridForMode,
    collectionGridForMode,
    locale,
    figures,
  ]);
  const { unlockedCount, totalCount } = countsForSearchMode(COLLECTION_KIND);

  const navigateToDetail = useCallback(
    (item) => {
      navigation.navigate('StatueDetail', {
        statueId: item.id,
        collectionKind: COLLECTION_KIND,
      });
    },
    [navigation]
  );

  if (!storageLoaded) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.activityIndicator} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: 8 }]}>
      <View style={styles.progressWrap}>
        <Text style={styles.progressTitle}>{t('collectionEntryHeroTitle')}</Text>
        <Text style={styles.progressStat}>
          {t('progressLabel', { unlocked: unlockedCount, total: totalCount })}
        </Text>
      </View>

      <View style={styles.filterRow}>
        <View style={styles.filterTextWrap}>
          <Text style={styles.filterTitle}>{t('collectionUnlockedFilterToggle')}</Text>
          <Text style={styles.filterHint}>{t('collectionUnlockedFilterHint')}</Text>
        </View>
        <Switch
          value={unlockedOnlyFilter}
          onValueChange={toggleUnlockedOnlyFilter}
          trackColor={{
            false: colors.switchTrackOff,
            true: colors.switchTrackOn,
          }}
          thumbColor={
            unlockedOnlyFilter ? colors.switchThumbOn : colors.switchThumbOff
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
          {t('collectionUnlockedFilterEmpty')}
        </Text>
      ) : (
        <FlatList
          data={gridData}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[
            styles.grid,
            {
              paddingBottom: TAB_BAR_SCROLL_SPACER + Math.max(insets.bottom, 8),
            },
          ]}
          renderItem={({ item }) => (
            <CollectionFigureTile
              item={item}
              tileWidth={tileWidth}
              onPress={() => navigateToDetail(item)}
              styles={styles}
              colors={colors}
              locale={locale}
              t={t}
              resolvedScheme={resolvedScheme}
            />
          )}
        />
      )}
    </View>
  );
}
