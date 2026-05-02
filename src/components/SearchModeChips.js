import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SEARCH_MODES, useSearchTarget } from '../context/SearchTargetContext';
import { useLanguage } from '../context/LanguageContext';

const MODE_KEYS = {
  statues: 'searchModeStatues',
  statues3d: 'searchModeStatues3d',
  pulpulaks: 'searchModePulpulaks',
};

export default function SearchModeChips() {
  const { searchMode, setSearchMode } = useSearchTarget();
  const { t } = useLanguage();

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollInner}
      >
        {SEARCH_MODES.map((mode) => {
          const active = searchMode === mode;
          return (
            <Pressable
              key={mode}
              onPress={() => setSearchMode(mode)}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && styles.chipPressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {t(MODE_KEYS[mode])}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 10,
  },
  scrollInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 48,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  chipPressed: {
    opacity: 0.88,
  },
  chipText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  chipTextActive: {
    color: '#1E1B4B',
  },
});
