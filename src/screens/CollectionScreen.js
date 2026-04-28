import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFigures } from '../context/FiguresContext';

const ACCENT = {
  abovyan: '#7C3AED',
  komitas: '#059669',
  tumanyan: '#D97706',
};

export default function CollectionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const {
    figures,
    unlockedCount,
    totalCount,
    storageLoaded,
    catalogFromRemote,
    catalogError,
    catalogRefreshing,
    refreshCatalog,
  } = useFigures();

  useFocusEffect(
    useCallback(() => {
      refreshCatalog();
    }, [refreshCatalog])
  );

  if (!storageLoaded) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#374151" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      <Text style={styles.progress}>
        {unlockedCount} / {totalCount} collected
      </Text>
      {catalogError ? (
        <Text style={styles.catalogWarn}>
          Catalog sync failed ({catalogError}). Using built-in list.
        </Text>
      ) : catalogFromRemote ? (
        <Text style={styles.catalogOk}>
          Loaded from server — pull down or return here to refresh
        </Text>
      ) : null}
      <FlatList
        data={figures}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl
            refreshing={catalogRefreshing}
            onRefresh={refreshCatalog}
            tintColor="#374151"
            colors={['#374151']}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.card,
              !item.unlocked && styles.cardLocked,
              pressed && styles.cardPressed,
            ]}
            onPress={() =>
              navigation.navigate('StatueDetail', { statueId: item.id })
            }
          >
            <Text
              style={[
                styles.cardInitial,
                item.unlocked && { color: ACCENT[item.id] ?? '#2563EB' },
              ]}
              numberOfLines={1}
            >
              {item.name.charAt(0)}
            </Text>
            <Text
              style={[styles.cardName, !item.unlocked && styles.cardNameLocked]}
              numberOfLines={2}
            >
              {item.name}
            </Text>
          </Pressable>
        )}
      />
      <Pressable
        style={({ pressed }) => [
          styles.scanButton,
          pressed && styles.scanButtonPressed,
        ]}
        onPress={() => navigation.navigate('Scan')}
      >
        <Text style={styles.scanButtonText}>Scan QR</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  progress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  catalogWarn: {
    fontSize: 12,
    color: '#B45309',
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  catalogOk: {
    fontSize: 12,
    color: '#059669',
    textAlign: 'center',
    marginBottom: 10,
  },
  grid: {
    paddingBottom: 8,
  },
  row: {
    gap: 8,
    marginBottom: 8,
  },
  card: {
    flex: 1,
    aspectRatio: 0.85,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  cardLocked: {
    backgroundColor: '#E5E7EB',
    borderColor: '#D1D5DB',
    opacity: 0.85,
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardInitial: {
    fontSize: 28,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 6,
  },
  cardName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  cardNameLocked: {
    color: '#6B7280',
  },
  scanButton: {
    marginTop: 'auto',
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  scanButtonPressed: {
    opacity: 0.88,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
