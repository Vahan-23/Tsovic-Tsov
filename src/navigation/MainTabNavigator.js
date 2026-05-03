import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MainBottomTabBar from '../components/MainBottomTabBar';
import MainMenu from '../components/MainMenu';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import LettersScreen from '../screens/LettersScreen';
import CollectionScreen from '../screens/CollectionScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { colors } = useSettings();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.bg,
        },
        topBar: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 14,
          paddingBottom: 10,
          backgroundColor: colors.bg,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        brand: {
          fontSize: 19,
          fontWeight: '800',
          color: colors.text,
          letterSpacing: -0.3,
        },
      }),
    [colors]
  );

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Text style={styles.brand}>{t('appTitle')}</Text>
        <MainMenu />
      </View>
      <Tab.Navigator
        tabBar={(props) => <MainBottomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          lazy: false,
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Map" component={MapScreen} />
        <Tab.Screen name="Letters" component={LettersScreen} />
        <Tab.Screen name="Collection" component={CollectionScreen} />
      </Tab.Navigator>
    </View>
  );
}
