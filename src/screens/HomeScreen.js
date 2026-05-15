import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import DiscoverNearbyBlock from '../components/DiscoverNearbyBlock';
import { useFigures } from '../context/FiguresContext';
import { useSettings } from '../context/SettingsContext';

export default function HomeScreen() {
  const { storageLoaded } = useFigures();
  const { colors } = useSettings();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.bg,
        },
        center: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
        },
        loading: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.bg,
        },
      }),
    [colors]
  );

  if (!storageLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.activityIndicator} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.center}>
        <DiscoverNearbyBlock layout="home" />
      </View>
    </View>
  );
}
