import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow } from '../theme';
import { useLoading } from '../hooks/LoadingContext';

export default function GlobalLoader() {
  const { isLoading } = useLoading();
  if (!isLoading) return null;
  return (
    <View style={[styles.overlay]} accessibilityElementsHidden={false} importantForAccessibility="no-hide-descendants">
      <LinearGradient
        colors={colors.subtleGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.text}>Loading…</Text>
      </LinearGradient>
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
    backgroundColor: colors.overlay,
    zIndex: 9999,
  },
  container: {
    padding: 18,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
    ...shadow.soft,
  },
  text: {
    marginTop: 12,
    color: colors.text,
    fontSize: 14,
  },
});
