import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFigures } from '../context/FiguresContext';

const SCAN_DEBOUNCE_MS = 1200;

export default function ScanScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const { unlockById, isUnlockableId } = useFigures();
  const lastHandledRef = useRef(0);
  const [hint, setHint] = useState('');

  const handleBarcode = useCallback(
    ({ data }) => {
      const now = Date.now();
      if (now - lastHandledRef.current < SCAN_DEBOUNCE_MS) return;
      const trimmed = typeof data === 'string' ? data.trim() : '';
      if (!trimmed) return;

      lastHandledRef.current = now;

      if (!isUnlockableId(trimmed)) {
        setHint('Unknown QR — not a statue id from your current catalog.');
        return;
      }

      const result = unlockById(trimmed);
      if (!result.ok) {
        setHint('Unknown statue ID.');
        return;
      }

      if (result.alreadyHad) {
        setHint('You already unlocked this statue.');
        return;
      }

      setHint('');
      Alert.alert('Unlocked', 'New statue added to your collection.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    [navigation, unlockById, isUnlockableId]
  );

  if (!permission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Checking camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.body}>
          Camera access is needed to scan statue QR codes.
        </Text>
        <Pressable style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.primaryBtnText}>Allow camera</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarcode}
      />
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.frame} />
        <Text style={styles.overlayHint}>Point at a statue QR code</Text>
      </View>
      {hint ? (
        <View style={styles.hintBox}>
          <Text style={styles.hintText}>{hint}</Text>
        </View>
      ) : null}
      <Pressable
        style={[styles.closeBtn, { top: insets.top + 8 }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.closeBtnText}>Close</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  muted: {
    fontSize: 16,
    color: '#6B7280',
  },
  body: {
    fontSize: 16,
    textAlign: 'center',
    color: '#374151',
    marginBottom: 8,
  },
  primaryBtn: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  primaryBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryBtn: {
    paddingVertical: 10,
  },
  secondaryBtnText: {
    color: '#4B5563',
    fontSize: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  frame: {
    width: 240,
    height: 240,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  overlayHint: {
    marginTop: 20,
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '500',
  },
  hintBox: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 100,
    backgroundColor: 'rgba(17,24,39,0.92)',
    padding: 12,
    borderRadius: 10,
  },
  hintText: {
    color: '#F9FAFB',
    fontSize: 14,
    textAlign: 'center',
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  closeBtnText: {
    color: '#FFF',
    fontWeight: '600',
  },
});
