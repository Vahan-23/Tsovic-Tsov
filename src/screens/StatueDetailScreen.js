import React, { useLayoutEffect, useMemo } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useFigures } from '../context/FiguresContext';

export default function StatueDetailScreen({ route, navigation }) {
  const { t } = useLanguage();
  const { statueId, collectionKind = 'statues' } = route.params || {};
  const { resolveCollectionItem } = useFigures();

  const figure = useMemo(
    () => resolveCollectionItem(collectionKind, statueId),
    [resolveCollectionItem, collectionKind, statueId]
  );

  const titleText = figure ? figure.displayName ?? figure.name : '';

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
                <Ionicons name="share-outline" size={22} color="#111827" />
              </Pressable>
            )
          : undefined,
    });
  }, [navigation, figure, collectionKind, t, titleText, shareMessage]);

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
            ? t('statueLockedHint')
            : collectionKind === 'statues3d'
              ? t('statue3dLockedHint')
              : t('statueLockedHint')}
        </Text>
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
        <Text style={styles.title}>{titleText}</Text>
        <Text style={styles.subLine}>{t('statue3dUnlockedLine')}</Text>
        {figure.image ? (
          <Image
            source={
              typeof figure.image === 'string'
                ? { uri: figure.image }
                : figure.image
            }
            style={styles.image}
            resizeMode="cover"
          />
        ) : null}
        <Text style={styles.discovered}>{t('statueDiscovered')}</Text>
        <Text style={styles.body}>{figure.description}</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>{titleText}</Text>
      {figure.image ? (
        <Image
          source={
            typeof figure.image === 'string'
              ? { uri: figure.image }
              : figure.image
          }
          style={styles.image}
          resizeMode="cover"
        />
      ) : null}
      <Text style={styles.discovered}>{t('statueDiscovered')}</Text>
      <Text style={styles.body}>{figure.description}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#F9FAFB',
  },
  kind: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  kind3d: {
    color: '#6D28D9',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  subLine: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 14,
  },
  discovered: {
    fontSize: 15,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  coords: {
    fontSize: 14,
    color: '#6B7280',
  },
  hint: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
    marginTop: 8,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#E5E7EB',
  },
});
