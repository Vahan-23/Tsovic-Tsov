import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import DiscoverNearbyBlock from './DiscoverNearbyBlock';

/**
 * Home | [radar] | Collection — symmetric tappable row, radar centered (typical “main app” pattern).
 */
export default function MainBottomTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const homeIndex = state.routes.findIndex((r) => r.name === 'Home');
  const collectionIndex = state.routes.findIndex((r) => r.name === 'Collection');
  const homeFocused = state.index === homeIndex;
  const collectionFocused = state.index === collectionIndex;

  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: homeFocused }}
          onPress={() => navigation.navigate('Home')}
          style={({ pressed }) => [styles.side, pressed && styles.sidePressed]}
        >
          <Ionicons
            name={homeFocused ? 'home' : 'home-outline'}
            size={26}
            color={homeFocused ? '#4F46E5' : '#9CA3AF'}
          />
          <Text style={[styles.sideLabel, homeFocused && styles.sideLabelActive]}>
            {t('tabHome')}
          </Text>
        </Pressable>

        <View style={styles.centerSlot} pointerEvents="box-none">
          <DiscoverNearbyBlock variant="tabBar" />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: collectionFocused }}
          onPress={() => navigation.navigate('Collection')}
          style={({ pressed }) => [styles.side, pressed && styles.sidePressed]}
        >
          <Ionicons
            name={collectionFocused ? 'albums' : 'albums-outline'}
            size={26}
            color={collectionFocused ? '#4F46E5' : '#9CA3AF'}
          />
          <Text style={[styles.sideLabel, collectionFocused && styles.sideLabelActive]}>
            {t('tabCollection')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  side: {
    flex: 1,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  sidePressed: {
    opacity: 0.72,
  },
  sideLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: -0.2,
  },
  sideLabelActive: {
    color: '#4F46E5',
  },
  centerSlot: {
    width: 124,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
