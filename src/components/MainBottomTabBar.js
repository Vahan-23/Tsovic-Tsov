import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';

/**
 * Home · Map · Letters · Collection — equal-width tabs.
 */
export default function MainBottomTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { colors } = useSettings();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        bar: {
          backgroundColor: colors.bgElevated,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          paddingTop: 8,
          shadowColor: colors.shadow,
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
        tab: {
          flex: 1,
          minHeight: 52,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 4,
          paddingHorizontal: 2,
        },
        tabPressed: {
          opacity: 0.72,
        },
        label: {
          marginTop: 2,
          fontSize: 10,
          fontWeight: '700',
          color: colors.tabInactive,
          letterSpacing: -0.2,
          textAlign: 'center',
        },
        labelActive: {
          color: colors.primary,
        },
      }),
    [colors]
  );

  const homeIndex = state.routes.findIndex((r) => r.name === 'Home');
  const mapIndex = state.routes.findIndex((r) => r.name === 'Map');
  const lettersIndex = state.routes.findIndex((r) => r.name === 'Letters');
  const collectionIndex = state.routes.findIndex((r) => r.name === 'Collection');

  const tabs = [
    {
      routeName: 'Home',
      index: homeIndex,
      iconActive: 'home',
      iconInactive: 'home-outline',
      labelKey: 'tabHome',
    },
    {
      routeName: 'Map',
      index: mapIndex,
      iconActive: 'map',
      iconInactive: 'map-outline',
      labelKey: 'tabMap',
    },
    {
      routeName: 'Letters',
      index: lettersIndex,
      iconActive: 'text',
      iconInactive: 'text-outline',
      labelKey: 'tabLetters',
    },
    {
      routeName: 'Collection',
      index: collectionIndex,
      iconActive: 'albums',
      iconInactive: 'albums-outline',
      labelKey: 'tabCollection',
    },
  ];

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
        {tabs.map((tab) => {
          const focused = tab.index >= 0 && state.index === tab.index;
          return (
            <Pressable
              key={tab.routeName}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              onPress={() => navigation.navigate(tab.routeName)}
              style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
            >
              <Ionicons
                name={focused ? tab.iconActive : tab.iconInactive}
                size={24}
                color={focused ? colors.primary : colors.tabInactive}
              />
              <Text style={[styles.label, focused && styles.labelActive]}>
                {t(tab.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
