import React, { useEffect, useLayoutEffect, useMemo } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UNLOCK_RADIUS_METERS } from '../constants/unlockRadius';
import { useLanguage } from '../context/LanguageContext';
import { labelForBrowseLocale } from '../utils/alphabetBrowse';
import { useFigures } from '../context/FiguresContext';
import { useSettings } from '../context/SettingsContext';
import {
  getStatueCollectionImageSource,
  hasMonument3dPreview,
} from '../data/statueCollectionImages';
import Monument3dPreviewImage from '../components/monument/Monument3dPreviewImage';
import RarityBadge from '../components/RarityBadge';
import MonumentDetailCard from '../components/monument/MonumentDetailCard';
import { resolveMonumentCardContent } from '../utils/resolveMonumentCard';
import { resolveMonumentCardId } from '../data/monumentCards';
import { monumentHasGlbPreview } from '../data/monumentGlbModels';
import { useCelebrationPeekOptional } from '../context/CelebrationPeekContext';

export default function StatueDetailScreen({ route, navigation }) {
  const celebrationPeek = useCelebrationPeekOptional();
  const { t, locale } = useLanguage();
  const { width: windowWidth } = useWindowDimensions();

  useEffect(() => {
    return () => {
      celebrationPeek?.endDetailPeek();
    };
  }, [celebrationPeek]);
  const { colors, resolvedScheme } = useSettings();
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
          padding: 16,
          paddingBottom: 40,
          backgroundColor: colors.bg,
        },
        lockedScroll: {
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
        rarityRow: {
          marginBottom: 10,
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
        lockedPreviewWrap: {
          width: '100%',
          height: Math.min(windowWidth * 0.92, 380),
          marginBottom: 20,
          backgroundColor: 'transparent',
        },
      }),
    [colors, windowWidth]
  );

  const { statueId, collectionKind = 'statues' } = route.params || {};
  const { resolveCollectionItem } = useFigures();

  const figure = useMemo(
    () => resolveCollectionItem(collectionKind, statueId),
    [resolveCollectionItem, collectionKind, statueId]
  );

  const titleText = figure ? labelForBrowseLocale(figure, locale) : '';

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

  const monumentCard = useMemo(() => {
    if (!figure || collectionKind !== 'statues') return null;
    const content = resolveMonumentCardContent(figure, titleText, t);
    return {
      ...content,
      discoveredLabel: t('statueDiscovered'),
      factsSectionTitle: t('cardSectionFacts'),
      whySectionTitle: t('cardSectionWhy'),
      storySectionTitle: t('cardSectionStory'),
      personSectionTitle: t('cardSectionPerson'),
    };
  }, [figure, collectionKind, titleText, t]);

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
  }, [navigation, figure, collectionKind, t, titleText, shareMessage, colors.icon]);

  if (!figure) {
    return (
      <View style={styles.centered}>
        <Text style={styles.body}>{t('statueNotFound')}</Text>
      </View>
    );
  }

  const lockedPreviewSource =
    figure && collectionKind === 'statues' && hasMonument3dPreview(figure)
      ? getStatueCollectionImageSource(figure)
      : null;

  if (!figure.unlocked) {
    return (
      <ScrollView contentContainerStyle={styles.lockedScroll}>
        {lockedPreviewSource ? (
          <View style={styles.lockedPreviewWrap}>
            <Monument3dPreviewImage
              source={lockedPreviewSource}
              unlocked={false}
              style={StyleSheet.absoluteFillObject}
            />
          </View>
        ) : null}
        {collectionKind === 'pulpulaks' ? (
          <Text style={styles.kind}>{t('pulpulakKindLabel')}</Text>
        ) : null}
        {collectionKind === 'statues3d' ? (
          <Text style={[styles.kind, styles.kind3d]}>{t('statue3dKindLabel')}</Text>
        ) : null}
        <Text style={styles.title}>{titleText}</Text>
        {collectionKind === 'statues' && figure.rarity ? (
          <View style={styles.rarityRow}>
            <RarityBadge tier={figure.rarity} />
          </View>
        ) : null}
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
        <Text style={styles.title}>{titleText}</Text>
        <Text style={styles.discovered}>{t('statueDiscovered')}</Text>
      </ScrollView>
    );
  }

  const monumentCardIdFor3d = figure ? resolveMonumentCardId(figure) : null;
  const isMonument3dDetail =
    figure &&
    collectionKind === 'statues' &&
    monumentHasGlbPreview(monumentCardIdFor3d);

  if (isMonument3dDetail && monumentCard) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <MonumentDetailCard
          title={titleText}
          figure={figure}
          heroImageSource={heroResolvedImageSource}
          card={monumentCard}
          colors={colors}
          resolvedScheme={resolvedScheme}
          navigateLabel={t('statueLockedNavigateCta')}
          onNavigate={
            canNavigateToTarget
              ? () =>
                  navigation.navigate('Navigate', {
                    targetId: figure.id,
                    targetLat: Number(figure.latitude),
                    targetLon: Number(figure.longitude),
                    targetName: titleText,
                    collectionKind,
                  })
              : undefined
          }
        />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <MonumentDetailCard
        title={titleText}
        figure={figure}
        heroImageSource={heroResolvedImageSource}
        card={monumentCard}
        colors={colors}
        resolvedScheme={resolvedScheme}
        navigateLabel={t('statueLockedNavigateCta')}
        onNavigate={
          canNavigateToTarget
            ? () =>
                navigation.navigate('Navigate', {
                  targetId: figure.id,
                  targetLat: Number(figure.latitude),
                  targetLon: Number(figure.longitude),
                  targetName: titleText,
                  collectionKind,
                })
            : undefined
        }
      />
    </ScrollView>
  );
}
