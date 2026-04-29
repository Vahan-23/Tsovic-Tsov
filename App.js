import React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { FiguresProvider } from './src/context/FiguresContext';
import CollectionScreen from './src/screens/CollectionScreen';
import StatueDetailScreen from './src/screens/StatueDetailScreen';
import ScanScreen from './src/screens/ScanScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <FiguresProvider>
          <NavigationContainer>
            <StatusBar style="dark" />
            <Stack.Navigator
              initialRouteName="Collection"
              screenOptions={{
                headerStyle: { backgroundColor: '#F9FAFB' },
                headerTintColor: '#111827',
                headerTitleStyle: { fontWeight: '700' },
                contentStyle: { backgroundColor: '#F9FAFB' },
              }}
            >
              <Stack.Screen
                name="Collection"
                component={CollectionScreen}
                options={{ title: 'Tsovic-Tsov' }}
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
            </Stack.Navigator>
          </NavigationContainer>
        </FiguresProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
