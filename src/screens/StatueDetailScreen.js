import React, { useLayoutEffect, useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFigures } from '../context/FiguresContext';

export default function StatueDetailScreen({ route, navigation }) {
  const { statueId } = route.params;
  const { figures } = useFigures();

  const figure = useMemo(
    () => figures.find((f) => String(f.id) === String(statueId)),
    [figures, statueId]
  );

  useLayoutEffect(() => {
    navigation.setOptions({ title: figure ? figure.displayName ?? figure.name : 'Արձան' });
  }, [navigation, figure]);

  if (!figure) {
    return (
      <View style={styles.centered}>
        <Text style={styles.body}>Արձանը չի գտնվել։</Text>
      </View>
    );
  }

  if (!figure.unlocked) {
    return (
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{figure.name}</Text>
        <Text style={styles.hint}>Մոտեցիր այս արձանին՝ այն բացելու համար</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>{figure.displayName ?? figure.name}</Text>
      {figure.image ? (
        <Image
          source={
            typeof figure.image === 'string'
              ? { uri: figure.image }
              : figure.image
          }
          style={styles.image}
          resizeMode="cover"
        />
      ) : null}
      <Text style={styles.discovered}>Դու հայտնաբերել ես այս արձանը</Text>
      <Text style={styles.body}>{figure.description}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  discovered: {
    fontSize: 15,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  hint: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
    marginTop: 8,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#E5E7EB',
  },
});
