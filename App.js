import React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { FiguresProvider } from './src/context/FiguresContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { SearchTargetProvider } from './src/context/SearchTargetContext';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import StatueDetailScreen from './src/screens/StatueDetailScreen';
import ScanScreen from './src/screens/ScanScreen';
import NavigationScreen from './src/screens/NavigationScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <LanguageProvider>
          <SettingsProvider>
            <SearchTargetProvider>
              <FiguresProvider>
                <NavigationContainer>
                  <StatusBar style="dark" />
                  <Stack.Navigator
                    initialRouteName="Main"
                    screenOptions={{
                      headerStyle: { backgroundColor: '#F9FAFB' },
                      headerTintColor: '#111827',
                      headerTitleStyle: { fontWeight: '700' },
                      contentStyle: { backgroundColor: '#F9FAFB' },
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
