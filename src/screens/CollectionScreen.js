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
  getMonument3dPreviewSource,
  hasMonument3dPreview,
} from '../data/monument3dPreviewImages';
import { hasStatueCollectionImage } from '../data/statueCollectionImages';
import Monument3dPreviewImage from '../components/monument/Monument3dPreviewImage';

const UNLOCKED_ONLY_FILTER_KEY = '@tsovic_tsov/collection_unlocked_only';

/** Сначала объекты с локальным превью в assets, затем по алфавиту. */
const COLLECTION_PREVIEW_OPTS = { fillWithPlaceholder: true };

function sortStatuesForCollection(items, locale) {
  return [...items].sort((a, b) => {
    const pa =
      hasMonument3dPreview(a, COLLECTION_PREVIEW_OPTS) || hasStatueCollectionImage(a)
        ? 1
        : 0;
    const pb =
      hasMonument3dPreview(b, COLLECTION_PREVIEW_OPTS) || hasStatueCollectionImage(b)
        ? 1
        : 0;
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
  const localThumb = getMonument3dPreviewSource(item, COLLECTION_PREVIEW_OPTS);
  const is3dPreview = localThumb != null;
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
      <View
        style={[
          styles.tileCard,
          is3dPreview ? styles.tileCard3d : styles.tileCardPlain,
          !item.unlocked && !is3dPreview && styles.tileCardLocked,
        ]}
      >
        <View
          style={[
            styles.tileImageSection,
            is3dPreview && styles.tileImageSection3d,
          ]}
        >
          {localThumb && is3dPreview ? (
            <Monument3dPreviewImage
              source={localThumb}
              unlocked={item.unlocked}
              style={StyleSheet.absoluteFillObject}
            />
          ) : localThumb ? (
            <Image source={localThumb} style={styles.tileImage} resizeMode="cover" />
          ) : (
            <View style={[styles.tilePlaceholder, { backgroundColor: tint }]}>
              <Text style={styles.tileInitial}>{initial}</Text>
              <View style={styles.tilePlaceholderIcon}>
                <Ionicons name="business" size={36} color="rgba(255,255,255,0.35)" />
              </View>
            </View>
          )}
          {!item.unlocked && !is3dPreview ? (
            <View style={styles.tileLockOverlay}>
              <View style={styles.tileLockBubble}>
                <Ionicons name="lock-closed" size={22} color="#FFFFFF" />
              </View>
            </View>
          ) : !item.unlocked ? null : !is3dPreview ? (
            <View style={styles.tileOpenBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            </View>
          ) : null}
        </View>
        <View style={[styles.tileFooter, is3dPreview && styles.tileFooter3d]}>
          <Text
            style={[
              styles.tileTitle,
              is3dPreview && styles.tileTitle3d,
              !item.unlocked && styles.tileTitleMuted,
            ]}
            numberOfLines={is3dPreview ? 1 : 2}
          >
            {title}
          </Text>
          {!is3dPreview ? (
            !item.unlocked ? (
              <Text style={styles.tileLockedHint}>{t('collectionCardLocked')}</Text>
            ) : (
              <Text style={styles.tileOpenHint} numberOfLines={1}>
                {t('statueDiscovered')}
              </Text>
            )
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export default function CollectionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { t, locale } = useLanguage();
  const { colors, resolvedScheme } = useSettings();
  const pad = 10;
  const tileWidth = Math.max(
    140,
    (width - pad * 2 - COLUMN_GAP) / 2
  );
  const tileImageHeight3d = Math.max(
    200,
    Math.min(300, Math.round((height - 168) * 0.32))
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.bg,
          paddingHorizontal: pad,
          paddingTop: 4,
        },
        centered: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.bg,
        },
        toolbar: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
        },
        toolPill: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          paddingVertical: 6,
          paddingHorizontal: 11,
          borderRadius: 999,
          backgroundColor:
            resolvedScheme === 'dark'
              ? 'rgba(15, 20, 32, 0.92)'
              : 'rgba(255, 255, 255, 0.95)',
          borderWidth: 1.5,
          borderColor: colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: resolvedScheme === 'dark' ? 0.28 : 0.1,
          shadowRadius: 4,
          elevation: 2,
        },
        toolPillActive: {
          borderColor: colors.primary,
          backgroundColor: colors.primaryBg,
        },
        toolPillLabel: {
          fontSize: 14,
          fontWeight: '800',
          color: colors.textSecondary,
          letterSpacing: -0.2,
        },
        toolPillLabelActive: {
          color: colors.text,
        },
        toolPillCount: {
          fontSize: 15,
          fontWeight: '900',
          color: colors.textMuted,
          letterSpacing: -0.3,
        },
        toolPillCountActive: {
          color: colors.primary,
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
          overflow: 'hidden',
          backgroundColor: 'transparent',
          position: 'relative',
        },
        tileCardPlain: {
          borderRadius: 18,
          backgroundColor: colors.bgElevated,
          borderWidth: 0,
          shadowOpacity: 0,
          elevation: 0,
        },
        tileCardLocked: {
          opacity: 0.96,
        },
        tileImageSection: {
          width: '100%',
          aspectRatio: 1.05,
          backgroundColor: colors.placeholderBg,
          position: 'relative',
        },
        tileCard3d: {
          borderWidth: 0,
          backgroundColor: 'transparent',
          shadowOpacity: 0,
          elevation: 0,
        },
        tileImageSection3d: {
          backgroundColor: 'transparent',
          height: tileImageHeight3d,
          aspectRatio: undefined,
        },
        tileFooter3d: {
          paddingHorizontal: 4,
          paddingTop: 2,
          paddingBottom: 4,
        },
        tileTitle3d: {
          fontSize: 11,
          lineHeight: 14,
          textAlign: 'center',
          fontWeight: '700',
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
    [colors, resolvedScheme, tileImageHeight3d]
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
      <View style={styles.toolbar}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: !unlockedOnlyFilter }}
          onPress={() => toggleUnlockedOnlyFilter(false)}
          style={({ pressed }) => [
            styles.toolPill,
            !unlockedOnlyFilter && styles.toolPillActive,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text
            style={[
              styles.toolPillLabel,
              !unlockedOnlyFilter && styles.toolPillLabelActive,
            ]}
          >
            {t('collectionShowAll')}
          </Text>
          <Text
            style={[
              styles.toolPillCount,
              !unlockedOnlyFilter && styles.toolPillCountActive,
            ]}
          >
            {totalCount}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: unlockedOnlyFilter }}
          onPress={() => toggleUnlockedOnlyFilter(true)}
          style={({ pressed }) => [
            styles.toolPill,
            unlockedOnlyFilter && styles.toolPillActive,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text
            style={[
              styles.toolPillLabel,
              unlockedOnlyFilter && styles.toolPillLabelActive,
            ]}
          >
            {t('collectionTabOpened')}
          </Text>
          <Text
            style={[
              styles.toolPillCount,
              unlockedOnlyFilter && styles.toolPillCountActive,
            ]}
          >
            {unlockedCount}
          </Text>
        </Pressable>
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
          style={{ flex: 1 }}
          data={gridData}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[
            styles.grid,
            {
              flexGrow: 1,
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
