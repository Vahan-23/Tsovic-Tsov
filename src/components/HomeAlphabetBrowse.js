import React, { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  alphabetForLocale,
  RU_NON_CYRILLIC_BUCKET,
} from '../constants/alphabet';
import { useLanguage } from '../context/LanguageContext';
import { useFigures } from '../context/FiguresContext';
import { useSearchTarget } from '../context/SearchTargetContext';
import { buildLetterCounts, chunk } from '../utils/alphabetBrowse';

const GAP = 8;
const H_PADDING = 10;
/** Fewer columns → wider tiles; grid search below picks the largest square that fits. */
const MIN_COLS = 4;
const MAX_COLS = 8;

const RU_COLS = 6;

function computeLetterGrid(lettersCount, areaHeight, flowWidth, locale) {
  if (areaHeight <= 0 || lettersCount <= 0 || flowWidth <= 0) {
    return null;
  }
  if (locale === 'ru') {
    const cols = RU_COLS;
    const rows = Math.ceil(lettersCount / cols);
    const tileW = (flowWidth - (cols - 1) * GAP) / cols;
    const tileH = (areaHeight - (rows - 1) * GAP) / rows;
    const size = Math.floor(Math.min(tileW, tileH));
    if (size <= 0) return null;
    return { cols, rows, tileSize: size, flowWidth };
  }
  let best = null;
  for (let cols = MIN_COLS; cols <= MAX_COLS; cols++) {
    const rows = Math.ceil(lettersCount / cols);
    const tileW = (flowWidth - (cols - 1) * GAP) / cols;
    const tileH = (areaHeight - (rows - 1) * GAP) / rows;
    const size = Math.floor(Math.min(tileW, tileH));
    if (size <= 0) continue;
    if (
      !best ||
      size > best.tileSize ||
      (size === best.tileSize && rows < best.rows)
    ) {
      best = { cols, rows, tileSize: size, flowWidth };
    }
  }
  return best;
}

/** Cyrillic capitals sit a bit low in the line box on some system fonts. */
function isCyrillicLetter(ch) {
  if (!ch || ch.length === 0) return false;
  const c = ch.codePointAt(0);
  return c >= 0x0400 && c <= 0x04ff;
}

/**
 * Label shown on the tile (may differ from bucket key for navigation).
 * Armenian Ւ is commonly shown as the digraph ՈՒ in indices.
 */
function tileLetterLabel(letter, locale) {
  if (locale === 'hy' && letter === 'Ւ') {
    return 'ՈՒ';
  }
  /** Latin / Armenian / etc. when Russian UI — tile shows Lat «N» vs Cyrillic «Н». */
  if (locale === 'ru' && letter === RU_NON_CYRILLIC_BUCKET) {
    return 'N/n';
  }
  return letter;
}

export default function HomeAlphabetBrowse() {
  const navigation = useNavigation();
  const { width: windowWidth } = useWindowDimensions();
  const { locale } = useLanguage();
  const { radarTargetsForMode } = useFigures();
  const { searchMode } = useSearchTarget();

  const [browseHeight, setBrowseHeight] = useState(0);

  const onBrowseLayout = useCallback((e) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0) setBrowseHeight(h);
  }, []);

  const targets = useMemo(
    () => radarTargetsForMode(searchMode),
    [radarTargetsForMode, searchMode]
  );

  const counts = useMemo(
    () => buildLetterCounts(targets, locale),
    [targets, locale]
  );

  const letters = useMemo(() => {
    const base = [...alphabetForLocale(locale)];
    if ((counts['#'] ?? 0) > 0 && !base.includes('#')) {
      base.push('#');
    }
    return base;
  }, [locale, counts]);

  const flowWidth = windowWidth - H_PADDING * 2;

  const grid = useMemo(
    () => computeLetterGrid(letters.length, browseHeight, flowWidth, locale),
    [letters.length, browseHeight, flowWidth, locale]
  );

  const letterRows = useMemo(() => {
    if (!grid) return [];
    return chunk(letters, grid.cols);
  }, [letters, grid]);

  const letterFontSize = useMemo(() => {
    if (!grid) return 18;
    return Math.min(26, Math.max(15, grid.tileSize * 0.48));
  }, [grid]);

  const countFontSize = useMemo(() => {
    if (!grid) return 12;
    return Math.min(15, Math.max(11, grid.tileSize * 0.3));
  }, [grid]);

  const openLetter = (letter) => {
    navigation.navigate('StatuesByLetter', {
      letter,
      searchMode,
    });
  };

  return (
    <View style={styles.fill} onLayout={onBrowseLayout}>
      {grid && letterRows.length > 0 ? (
        <View style={[styles.flow, { width: grid.flowWidth }]}>
          {letterRows.map((row, rowIndex) => (
            <View
              key={`r-${rowIndex}`}
              style={[styles.row, { marginBottom: rowIndex < letterRows.length - 1 ? GAP : 0 }]}
            >
              {row.map((letter, colIndex) => {
                const n = counts[letter] ?? 0;
                const hasItems = n > 0;
                const isLastInRow = colIndex === row.length - 1;
                const sz = grid.tileSize;
                const label = tileLetterLabel(letter, locale);
                const labelFontSize =
                  label.length > 1
                    ? Math.max(
                        12,
                        Math.round(letterFontSize * (label.length > 2 ? 0.78 : 0.9))
                      )
                    : letterFontSize;
                const labelLineHeight = Math.round(
                  labelFontSize * (Platform.OS === 'android' ? 1.02 : 1.08)
                );
                return (
                  <Pressable
                    key={letter}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !hasItems }}
                    disabled={!hasItems}
                    android_ripple={
                      hasItems
                        ? { color: 'rgba(79, 70, 229, 0.22)', foreground: true }
                        : undefined
                    }
                    onPress={() => hasItems && openLetter(letter)}
                    style={({ pressed }) => [
                      styles.tile,
                      hasItems ? styles.tileEnabled : styles.tileDisabled,
                      {
                        width: sz,
                        height: sz,
                        marginRight: isLastInRow ? 0 : GAP,
                      },
                      hasItems && pressed && styles.tilePressed,
                    ]}
                  >
                    <View style={styles.tileInner}>
                      <Text
                        style={[
                          styles.tileLetter,
                          hasItems ? styles.tileLetterEnabled : styles.tileLetterDisabled,
                          {
                            fontSize: labelFontSize,
                            lineHeight: labelLineHeight,
                          },
                          Platform.OS === 'android' && styles.tileLetterAndroid,
                          isCyrillicLetter(letter) && styles.tileLetterCyrillic,
                        ]}
                        maxFontSizeMultiplier={1.3}
                      >
                        {label}
                      </Text>
                      <Text
                        style={[
                          styles.tileCount,
                          { fontSize: countFontSize },
                          hasItems ? styles.tileCountEnabled : styles.tileCountDisabled,
                        ]}
                        maxFontSizeMultiplier={1.25}
                      >
                        {n}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    width: '100%',
    paddingHorizontal: H_PADDING,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  flow: {
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  tile: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 4,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
  tileInner: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
  },
  tileEnabled: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#A5B4FC',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 4,
  },
  tileDisabled: {
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#D4D4D8',
    opacity: 0.72,
    shadowOpacity: 0,
    elevation: 0,
  },
  tilePressed: {
    backgroundColor: '#EEF2FF',
    borderColor: '#818CF8',
  },
  tileLetter: {
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 3,
    alignSelf: 'center',
    flexShrink: 1,
    maxWidth: '100%',
  },
  tileLetterAndroid: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  /** Small upward nudge so А–Я look centered next to Latin (iOS metrics). */
  tileLetterCyrillic: Platform.select({
    ios: { marginTop: -2 },
    default: {},
  }),
  tileLetterEnabled: {
    color: '#111827',
  },
  tileLetterDisabled: {
    color: '#9CA3AF',
  },
  tileCount: {
    fontWeight: '800',
    textAlign: 'center',
  },
  tileCountEnabled: {
    color: '#4F46E5',
  },
  tileCountDisabled: {
    color: '#A1A1AA',
  },
});
