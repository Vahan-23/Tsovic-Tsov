import React, { useMemo } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_SCROLL_SPACER } from '../constants/tabBar';
import { useLanguage } from '../context/LanguageContext';
import { useFigures } from '../context/FiguresContext';
import {
  filterItemsForLetter,
  labelForBrowseLocale,
} from '../utils/alphabetBrowse';

export default function StatuesByLetterScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { t, locale } = useLanguage();
  const { radarTargetsForMode } = useFigures();
  const letter = route.params?.letter;
  const searchMode = route.params?.searchMode ?? 'statues';

  const targets = useMemo(
    () => radarTargetsForMode(searchMode),
    [radarTargetsForMode, searchMode]
  );

  const items = useMemo(
    () =>
      letter != null ? filterItemsForLetter(targets, locale, letter) : [],
    [targets, locale, letter]
  );

  const bottomPad = TAB_BAR_SCROLL_SPACER + Math.max(insets.bottom, 12);

  if (letter == null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.body}>{t('letterListEmpty')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {items.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.body}>{t('letterListEmpty')}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad }]}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() =>
                navigation.navigate('StatueDetail', {
                  statueId: item.id,
                  collectionKind: searchMode,
                })
              }
            >
              <Text style={styles.rowTitle} numberOfLines={2}>
                {labelForBrowseLocale(item, locale)}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  body: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  listContent: {
    paddingTop: 8,
  },
  row: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  rowPressed: {
    backgroundColor: '#F9FAFB',
  },
  rowTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 24,
  },
});
