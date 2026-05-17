import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

/**
 * 3D monument cutout PNG — full color when unlocked, muted gray when locked.
 */
export default function Monument3dPreviewImage({
  source,
  unlocked,
  style,
  imageStyle,
}) {
  return (
    <View style={[styles.root, style]}>
      <Image
        source={source}
        style={[styles.image, imageStyle, !unlocked && styles.imageLocked]}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      {!unlocked ? <View style={styles.lockedWash} pointerEvents="none" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageLocked: {
    opacity: 0.38,
  },
  lockedWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(148, 152, 162, 0.55)',
  },
});
