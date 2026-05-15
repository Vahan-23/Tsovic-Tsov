import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { FiguresProvider } from './src/context/FiguresContext';
import { WalkBankProvider } from './src/context/WalkBankContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import { SearchTargetProvider } from './src/context/SearchTargetContext';
import { CelebrationPeekProvider } from './src/context/CelebrationPeekContext';
import { RU_NON_CYRILLIC_BUCKET } from './src/constants/alphabet';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import StatueDetailScreen from './src/screens/StatueDetailScreen';
import ScanScreen from './src/screens/ScanScreen';
import NavigationScreen from './src/screens/NavigationScreen';
import StatuesByLetterScreen from './src/screens/StatuesByLetterScreen';

const Stack = createNativeStackNavigator();

function RootStack() {
  const { colors, resolvedScheme } = useSettings();
  const navigationTheme = useMemo(() => {
    const base = resolvedScheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.bg,
        card: colors.bgElevated,
        text: colors.text,
        border: colors.border,
        notification: colors.primary,
      },
    };
  }, [colors, resolvedScheme]);

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />
      <Stack.Navigator
        initialRouteName="Main"
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700', color: colors.text },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen
          name="Main"
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="StatueDetail"
          component={StatueDetailScreen}
          options={{ title: 'Արձան' }}
        />
        <Stack.Screen
          name="StatuesByLetter"
          component={StatuesByLetterScreen}
          options={({ route }) => {
            const letter = route.params?.letter;
            const title =
              letter == null
                ? '—'
                : letter === RU_NON_CYRILLIC_BUCKET
                  ? 'N/n'
                  : String(letter);
            return { title };
          }}
        />
        <Stack.Screen
          name="Scan"
          component={ScanScreen}
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="Navigate"
          component={NavigationScreen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <LanguageProvider>
          <SettingsProvider>
            <SearchTargetProvider>
              <FiguresProvider>
                <CelebrationPeekProvider>
                  <WalkBankProvider>
                    <RootStack />
                  </WalkBankProvider>
                </CelebrationPeekProvider>
              </FiguresProvider>
            </SearchTargetProvider>
          </SettingsProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
