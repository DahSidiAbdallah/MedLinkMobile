import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';

interface Props {
  onRequest: () => void;
  loading?: boolean;
  error?: string | null;
}

export default function LocationSplash({ onRequest, loading, error }: Props) {
  const { t } = useTranslation();
  
  return (
    <View style={styles.container}>
      <Ionicons name="location" size={64} color={colors.primary} style={{ marginBottom: spacing.xl }} />
      <Text style={styles.title}>{t('location.enableTitle', 'Enable Location')}</Text>
      <Text style={styles.subtitle}>
        {t('location.enableSubtitle', 'To show nearby clinics, hospitals, and pharmacies, we need your location.')}
      </Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={styles.button} onPress={onRequest} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.card} /> : <Text style={styles.buttonText}>{t('location.allowButton', 'Allow Location')}</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    padding: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: 16,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  buttonText: {
  color: colors.card,
    fontWeight: '600',
    fontSize: 16,
  },
});
