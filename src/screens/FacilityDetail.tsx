
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions, Image as RNImage } from 'react-native';
import { colors, spacing, radius, shadow } from '../theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useFacilities } from '../hooks/useFacilitiesFirestore';
import { Pill } from '../components/Pill';
import SkeletonImage from '../components/SkeletonImage';
import { useLoading } from '../hooks/LoadingContext';
import { useTranslation } from 'react-i18next';

export default function FacilityDetail() {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params as { id: string };
  const { facilities } = useFacilities();
  const fac = facilities.find(f => f.id === id);

  const { width } = useWindowDimensions();
  const avatarSize = Math.min(96, Math.max(48, Math.floor(width * 0.18)));
  const _prefetched = useRef(new Set<string>());
  const { startLoading, finishLoading } = useLoading();

  useEffect(() => {
    if (fac?.image && !_prefetched.current.has(fac.image)) {
      const key = `facility-image-${fac.id}`;
      startLoading(key);
      RNImage.prefetch(fac.image).catch(() => null).finally(() => {
  _prefetched.current.add(fac.image);
        finishLoading(key);
      });
    }
  }, [fac, finishLoading, startLoading]);

  if (!fac) {
    return <Text style={{ marginTop: spacing.xl, textAlign: 'center' }}>Facility not found.</Text>;
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.sheet}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t('facilities.summary', 'Summary')}</Text>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
            <Text style={styles.cancel}>{t('common.cancel', 'Cancel')}</Text>
          </Pressable>
        </View>
        {/* Avatar, Name, Specialty */}
        <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
          <SkeletonImage source={{ uri: fac.image }} style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]} />
          <Text style={[{ fontSize: 22, fontWeight: '600', color: '#1A1A1A', letterSpacing: -0.3 }, { marginTop: spacing.sm }]}>{fac.name}</Text>
          <Text style={{ color: colors.muted }}>{fac.specialty}</Text>
        </View>
        {/* Status */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: spacing.lg }}>
          <Pill tone="primary">{fac.type.charAt(0).toUpperCase() + fac.type.slice(1)}</Pill>
          {fac.isOpen && <Pill tone="neutral">{t('facilities.openNow', 'Open Now')}</Pill>}
          {fac.hasDelivery && <Pill tone="neutral">{t('facilities.hasDelivery', 'Has Delivery')}</Pill>}
        </View>

        <Text style={styles.sectionTitle}>{t('facilities.information', 'Information')}</Text>
        <View style={{ marginBottom: spacing.lg }}>
          {fac.address && <Text style={styles.detailText}>Address: {fac.address}</Text>}
          {fac.phoneNumber && <Text style={styles.detailText}>Phone: {fac.phoneNumber}</Text>}
          {fac.hours && <Text style={styles.detailText}>Hours: {fac.hours}</Text>}
          {fac.rating && <Text style={styles.detailText}>Rating: {fac.rating.toFixed(1)}</Text>}
          {fac.services && fac.services.length > 0 && (
            <Text style={styles.detailText}>Services: {fac.services.join(', ')}</Text>
          )}
          {fac.languages && fac.languages.length > 0 && (
            <Text style={styles.detailText}>Languages: {fac.languages.join(', ')}</Text>
          )}
          {fac.acceptedInsurance && fac.acceptedInsurance.length > 0 && (
            <Text style={styles.detailText}>Insurance: {fac.acceptedInsurance.join(', ')}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.glass,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: 40,
    ...shadow.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 22,
    color: colors.text,
  },
  cancel: {
    color: colors.muted,
    fontWeight: '600',
    fontSize: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    color: colors.text,
  },
  detailText: {
    color: colors.text,
    fontSize: 15,
    marginBottom: 4,
    lineHeight: 20,
  },
});
