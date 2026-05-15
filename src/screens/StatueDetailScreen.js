import React, { useLayoutEffect, useMemo } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UNLOCK_RADIUS_METERS } from '../constants/unlockRadius';
import { useLanguage } from '../context/LanguageContext';
import { labelForBrowseLocale } from '../utils/alphabetBrowse';
import { useFigures } from '../context/FiguresContext';
import { useSettings } from '../context/SettingsContext';
import { getStatueCollectionImageSource } from '../data/statueCollectionImages';

/** Текст про сам объект: где стоит, зачем поставлен, примечательности (см. i18n curatedMonumentStory_* или OSM/Yandex description). */
function resolveMonumentStoryBody(figure, t) {
  if (figure?.curatedKey) {
    const k = `curatedMonumentStory_${figure.curatedKey}`;
    const text = t(k);
    if (text && text !== k) return text;
  }
  const d = typeof figure?.description === 'string' ? figure.description.trim() : '';
  return d || null;
}

function MonumentStorySection({ figure, t, styles }) {
  const body = resolveMonumentStoryBody(figure, t);
  if (!body) return null;
  return (
    <View style={styles.storySection}>
      <Text style={styles.storyHeading}>{t('statueStoryHeading')}</Text>
      <Text style={styles.storyBody}>{body}</Text>
    </View>
  );
}

/** Биография персоны (курированные тексты); описание памятника перенесено в MonumentStorySection. */
function CuratedStatueCopy({ figure, t, styles }) {
  if (!figure?.curatedKey) {
    return null;
  }
  const bioKey = `curatedBio_${figure.curatedKey}`;
  const bio = t(bioKey);
  return (
    <>
      <Text style={styles.sectionHeading}>{t('statueLifeHeading')}</Text>
      <Text style={styles.metaMuted}>{t('statueMetaLife', { born: figure.born, died: figure.died })}</Text>
      {figure.monumentUnveiled != null ? (
        <Text style={[styles.metaMuted, styles.metaSpaced]}>
          {t('statueMetaMonument', { year: figure.monumentUnveiled })}
        </Text>
      ) : null}
      <Text style={[styles.body, styles.bioBlock]}>{bio}</Text>
    </>
  );
}

export default function StatueDetailScreen({ route, navigation }) {
  const { t, locale } = useLanguage();
  const { colors } = useSettings();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        centered: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
          backgroundColor: colors.bg,
        },
        scroll: {
          padding: 20,
          paddingBottom: 40,
          backgroundColor: colors.bg,
        },
        kind: {
          fontSize: 13,
          fontWeight: '700',
          color: colors.link,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          marginBottom: 8,
        },
        kind3d: {
          color: colors.accentPurple,
        },
        title: {
          fontSize: 24,
          fontWeight: '700',
          color: colors.text,
          marginBottom: 16,
        },
        subLine: {
          fontSize: 14,
          lineHeight: 20,
          color: colors.textMuted,
          marginBottom: 14,
        },
        discovered: {
          fontSize: 15,
          fontWeight: '600',
          color: colors.accentGreen,
          marginBottom: 12,
        },
        body: {
          fontSize: 16,
          lineHeight: 24,
          color: colors.iconMuted,
        },
        metaMuted: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.textMuted,
          lineHeight: 20,
        },
        metaSpaced: {
          marginTop: 6,
        },
        bioBlock: {
          marginTop: 14,
        },
        sectionHeading: {
          fontSize: 17,
          fontWeight: '800',
          color: colors.text,
          marginBottom: 10,
          marginTop: 4,
        },
        storySection: {
          marginBottom: 0,
        },
        storyHeading: {
          fontSize: 17,
          fontWeight: '800',
          color: colors.text,
          marginBottom: 10,
        },
        storyBody: {
          fontSize: 16,
          lineHeight: 24,
          color: colors.iconMuted,
        },
        coords: {
          fontSize: 14,
          color: colors.textMuted,
        },
        hint: {
          fontSize: 16,
          lineHeight: 24,
          color: colors.textSecondary,
          marginTop: 8,
        },
        navButtonOuter: {
          marginTop: 28,
          alignSelf: 'stretch',
          borderRadius: 14,
          overflow: 'hidden',
          ...(Platform.OS === 'ios'
            ? {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 10,
              }
            : { elevation: 5 }),
        },
        navButtonInner: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          paddingVertical: 16,
          paddingHorizontal: 22,
          backgroundColor: colors.primary,
        },
        navButtonText: {
          color: '#FFFFFF',
          fontSize: 17,
          fontWeight: '800',
          letterSpacing: 0.25,
        },
        image: {
          width: '100%',
          height: 200,
          borderRadius: 12,
          marginBottom: 16,
          backgroundColor: colors.placeholderBg,
        },
        heroWrap: {
          borderRadius: 22,
          overflow: 'hidden',
          marginBottom: 18,
          backgroundColor: colors.placeholderBg,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
            },
            android: { elevation: 6 },
          }),
        },
        heroImage: {
          width: '100%',
          height: 256,
          backgroundColor: colors.placeholderBg,
        },
        heroBottom: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 18,
          paddingVertical: 18,
          backgroundColor: 'rgba(15, 23, 42, 0.58)',
        },
        heroTitle: {
          fontSize: 24,
          fontWeight: '900',
          color: '#FFFFFF',
          letterSpacing: -0.6,
          marginBottom: 10,
          lineHeight: 30,
        },
        heroChip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          alignSelf: 'flex-start',
          paddingHorizontal: 12,
          paddingVertical: 7,
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.22)',
        },
        heroChipText: {
          fontSize: 13,
          fontWeight: '800',
          color: '#FFFFFF',
          letterSpacing: 0.2,
        },
        discoveredChipRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 18,
        },
        chipPill: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 999,
          backgroundColor: colors.chipBg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.borderMuted,
        },
        chipText: {
          fontSize: 14,
          fontWeight: '800',
          color: colors.accentGreen,
        },
        detailSheet: {
          padding: 18,
          borderRadius: 20,
          backgroundColor: colors.bgElevated,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        detailDivider: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: colors.borderMuted,
          marginVertical: 16,
        },
      }),
    [colors]
  );

  const { statueId, collectionKind = 'statues' } = route.params || {};
  const { resolveCollectionItem } = useFigures();

  const figure = useMemo(
    () => resolveCollectionItem(collectionKind, statueId),
    [resolveCollectionItem, collectionKind, statueId]
  );

  const titleText = figure ? labelForBrowseLocale(figure, locale) : '';

  /** Локальный asset из bundle имеет приоритет над URL из данных. */
  const heroResolvedImageSource = useMemo(() => {
    if (!figure) return null;
    const local = getStatueCollectionImageSource(figure);
    if (local != null) return local;
    if (figure.image && typeof figure.image === 'string') {
      const u = figure.image.trim();
      if (u.startsWith('http://') || u.startsWith('https://')) {
        return { uri: u };
      }
    }
    return null;
  }, [figure]);

  const hasMonumentStory = useMemo(
    () => (figure ? Boolean(resolveMonumentStoryBody(figure, t)) : false),
    [figure, t]
  );
  const hasLifeBio = Boolean(figure?.curatedKey);

  const canNavigateToTarget =
    figure != null &&
    Number.isFinite(Number(figure.latitude)) &&
    Number.isFinite(Number(figure.longitude));

  const shareMessage = useMemo(() => {
    if (!figure || !Number.isFinite(Number(figure.latitude))) return '';
    const lat = Number(figure.latitude).toFixed(5);
    const lon = Number(figure.longitude).toFixed(5);
    return t('shareBody', { name: titleText || '—', lat, lon });
  }, [figure, titleText, t]);

  useLayoutEffect(() => {
    const screenTitle = figure
      ? titleText
      : collectionKind === 'pulpulaks'
        ? t('pulpulakKindLabel')
        : collectionKind === 'statues3d'
          ? t('statue3dKindLabel')
          : t('statueDetailTitle');
    navigation.setOptions({
      title: screenTitle,
      headerRight:
        figure && shareMessage
          ? () => (
              <Pressable
                onPress={async () => {
                  try {
                    await Share.share({ message: shareMessage });
                  } catch {
                    Alert.alert(t('errorTitle'), t('shareFailed'));
                  }
                }}
                style={({ pressed }) => [{ opacity: pressed ? 0.65 : 1, padding: 8 }]}
                accessibilityRole="button"
                accessibilityLabel={t('shareAccessibility')}
              >
                <Ionicons name="share-outline" size={22} color={colors.icon} />
              </Pressable>
            )
          : undefined,
    });
  }, [navigation, figure, collectionKind, t, locale, titleText, shareMessage, colors.icon]);

  if (!figure) {
    return (
      <View style={styles.centered}>
        <Text style={styles.body}>{t('statueNotFound')}</Text>
      </View>
    );
  }

  if (!figure.unlocked) {
    return (
      <ScrollView contentContainerStyle={styles.scroll}>
        {collectionKind === 'pulpulaks' ? (
          <Text style={styles.kind}>{t('pulpulakKindLabel')}</Text>
        ) : null}
        {collectionKind === 'statues3d' ? (
          <Text style={[styles.kind, styles.kind3d]}>{t('statue3dKindLabel')}</Text>
        ) : null}
        <Text style={styles.title}>{titleText}</Text>
        <Text style={styles.hint}>
          {collectionKind === 'pulpulaks'
            ? t('statueLockedHint', { n: UNLOCK_RADIUS_METERS })
            : collectionKind === 'statues3d'
              ? t('statue3dLockedHint', { n: UNLOCK_RADIUS_METERS })
              : t('statueLockedHint', { n: UNLOCK_RADIUS_METERS })}
        </Text>
        {canNavigateToTarget ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('statueLockedNavigateCta')}
            android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
            style={({ pressed }) => [
              styles.navButtonOuter,
              pressed && { opacity: 0.9 },
            ]}
            onPress={() =>
              navigation.navigate('Navigate', {
                targetId: figure.id,
                targetLat: Number(figure.latitude),
                targetLon: Number(figure.longitude),
                targetName: titleText,
                collectionKind,
              })
            }
          >
            <View style={styles.navButtonInner}>
              <Ionicons name="navigate" size={22} color="#FFFFFF" />
              <Text style={styles.navButtonText}>{t('statueLockedNavigateCta')}</Text>
            </View>
          </Pressable>
        ) : null}
      </ScrollView>
    );
  }

  if (collectionKind === 'pulpulaks') {
    return (
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.kind}>{t('pulpulakKindLabel')}</Text>
        <Text style={styles.title}>{titleText}</Text>
        <Text style={styles.discovered}>{t('pulpulakDiscovered')}</Text>
        <Text style={styles.coords}>
          {Number(figure.latitude).toFixed(5)}, {Number(figure.longitude).toFixed(5)}
        </Text>
      </ScrollView>
    );
  }

  if (collectionKind === 'statues3d') {
    return (
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.kind, styles.kind3d]}>{t('statue3dKindLabel')}</Text>
        <Text style={styles.subLine}>{t('statue3dUnlockedLine')}</Text>
        {heroResolvedImageSource ? (
          <View style={styles.heroWrap}>
            <Image
              source={heroResolvedImageSource}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroBottom}>
              <Text style={styles.heroTitle} numberOfLines={3}>
                {titleText}
              </Text>
              <View style={styles.heroChip}>
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.heroChipText}>{t('statueDiscovered')}</Text>
              </View>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.title}>{titleText}</Text>
            <View style={styles.discoveredChipRow}>
              <View style={styles.chipPill}>
                <Ionicons name="checkmark-circle" size={18} color={colors.accentGreen} />
                <Text style={styles.chipText}>{t('statueDiscovered')}</Text>
              </View>
            </View>
          </>
        )}
        {hasMonumentStory || hasLifeBio ? (
          <View style={styles.detailSheet}>
            {hasMonumentStory ? (
              <MonumentStorySection figure={figure} t={t} styles={styles} />
            ) : null}
            {hasMonumentStory && hasLifeBio ? (
              <View style={styles.detailDivider} />
            ) : null}
            {hasLifeBio ? (
              <CuratedStatueCopy figure={figure} t={t} styles={styles} />
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {heroResolvedImageSource ? (
        <View style={styles.heroWrap}>
          <Image
            source={heroResolvedImageSource}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroBottom}>
            <Text style={styles.heroTitle} numberOfLines={3}>
              {titleText}
            </Text>
            <View style={styles.heroChip}>
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.heroChipText}>{t('statueDiscovered')}</Text>
            </View>
          </View>
        </View>
      ) : (
        <>
          <Text style={styles.title}>{titleText}</Text>
          <View style={styles.discoveredChipRow}>
            <View style={styles.chipPill}>
              <Ionicons name="checkmark-circle" size={18} color={colors.accentGreen} />
              <Text style={styles.chipText}>{t('statueDiscovered')}</Text>
            </View>
          </View>
        </>
      )}
      {hasMonumentStory || hasLifeBio ? (
        <View style={styles.detailSheet}>
          {hasMonumentStory ? (
            <MonumentStorySection figure={figure} t={t} styles={styles} />
          ) : null}
          {hasMonumentStory && hasLifeBio ? (
            <View style={styles.detailDivider} />
          ) : null}
          {hasLifeBio ? <CuratedStatueCopy figure={figure} t={t} styles={styles} /> : null}
        </View>
      ) : null}
    </ScrollView>
  );
}
