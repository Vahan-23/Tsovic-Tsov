import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import HomeAlphabetBrowse from '../components/HomeAlphabetBrowse';
import { useSettings } from '../context/SettingsContext';

export default function LettersScreen() {
  const { colors } = useSettings();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.bg,
        },
      }),
    [colors]
  );

  return (
    <View style={styles.root}>
      <HomeAlphabetBrowse />
    </View>
  );
}
