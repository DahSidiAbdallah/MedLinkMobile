import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colors } from '../theme';
import { useLoading } from '../hooks/LoadingContext';

export default function GlobalLoader() {
  const { isLoading } = useLoading();
  if (!isLoading) return null;
  return (
    <View style={styles.overlay} accessibilityElementsHidden={false} importantForAccessibility="no-hide-descendants">
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.text}>Loading…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
    zIndex: 9999,
  },
  container: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
    elevation: 6,
  },
  text: {
    marginTop: 12,
    color: '#333',
  },
});
