import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_SCROLL_SPACER } from '../constants/tabBar';
import { getDarkMapProps } from '../constants/mapAppearance';
import { useFigures } from '../context/FiguresContext';
import { useSettings } from '../context/SettingsContext';

/** Yerevan — default view when there are no coordinates yet */
const DEFAULT_REGION = {
  latitude: 40.1792,
  longitude: 44.4991,
  latitudeDelta: 0.055,
  longitudeDelta: 0.055,
};

const COLLECTION_KIND = 'statues';

export default function MapScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useSettings();
  const { figures, storageLoaded } = useFigures();

  const markers = useMemo(
    () =>
      figures.filter(
        (f) =>
          Number.isFinite(f.latitude) &&
          Number.isFinite(f.longitude)
      ),
    [figures]
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.bg,
        },
        map: {
          flex: 1,
        },
        loading: {
          ...StyleSheet.absoluteFillObject,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.bg,
        },
      }),
    [colors]
  );

  const mapPadding = useMemo(
    () => ({
      paddingTop: 12,
      paddingRight: 12,
      paddingBottom: TAB_BAR_SCROLL_SPACER + Math.max(insets.bottom, 8),
      paddingLeft: 12,
    }),
    [insets.bottom]
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
      <MapView
        style={styles.map}
        {...getDarkMapProps()}
        initialRegion={DEFAULT_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        mapPadding={mapPadding}
      >
        {markers.map((f) => (
          <Marker
            key={String(f.id)}
            coordinate={{
              latitude: f.latitude,
              longitude: f.longitude,
            }}
            title={f.displayName ?? f.name ?? ''}
            onPress={() =>
              navigation.navigate('StatueDetail', {
                statueId: f.id,
                collectionKind: COLLECTION_KIND,
              })
            }
          />
        ))}
      </MapView>
    </View>
  );
}
