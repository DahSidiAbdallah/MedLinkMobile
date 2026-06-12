
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions, Image as RNImage } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const avatarSize = Math.min(80, Math.max(48, Math.floor(width * 0.16)));
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
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>{t('facilities.notFound', 'Facility not found.')}</Text>
      </View>
    );
  }

  const DetailRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon as any} size={16} color={colors.textSecondary} />
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.overlay}>
      <View style={styles.sheet}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header row */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>{t('facilities.summary', 'Summary')}</Text>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Avatar + name */}
        <View style={styles.heroSection}>
          <SkeletonImage
            source={{ uri: fac.image }}
            style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}
          />
          <Text style={styles.facilityName}>{fac.name}</Text>
          {fac.specialty ? <Text style={styles.facilitySpecialty}>{fac.specialty}</Text> : null}
        </View>

        {/* Status pills */}
        <View style={styles.pillRow}>
          <Pill tone="primary">{fac.type.charAt(0).toUpperCase() + fac.type.slice(1)}</Pill>
          {fac.isOpen && <Pill tone="neutral">{t('facilities.openNow', 'Open Now')}</Pill>}
          {fac.hasDelivery && <Pill tone="neutral">{t('facilities.hasDelivery', 'Delivery')}</Pill>}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Details */}
        <Text style={styles.sectionLabel}>{t('facilities.information', 'Information')}</Text>
        <View style={styles.detailList}>
          {fac.address && (
            <DetailRow icon="location-outline" label={t('facilities.address', 'Address')} value={fac.address} />
          )}
          {fac.phoneNumber && (
            <DetailRow icon="call-outline" label={t('facilities.phone', 'Phone')} value={fac.phoneNumber} />
          )}
          {fac.hours && (
            <DetailRow icon="time-outline" label={t('facilities.hours', 'Hours')} value={fac.hours} />
          )}
          {fac.rating && (
            <DetailRow icon="star-outline" label={t('facilities.rating', 'Rating')} value={`${fac.rating.toFixed(1)} / 5`} />
          )}
          {fac.services && fac.services.length > 0 && (
            <DetailRow icon="medical-outline" label={t('facilities.services', 'Services')} value={fac.services.join(', ')} />
          )}
          {fac.languages && fac.languages.length > 0 && (
            <DetailRow icon="language-outline" label={t('facilities.languages', 'Languages')} value={fac.languages.join(', ')} />
          )}
          {fac.acceptedInsurance && fac.acceptedInsurance.length > 0 && (
            <DetailRow icon="shield-checkmark-outline" label={t('facilities.insurance', 'Insurance')} value={fac.acceptedInsurance.join(', ')} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xxxl,
    borderTopRightRadius: radius.xxxl,
    padding: spacing.xl,
    paddingBottom: 40,
    ...shadow.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  avatar: {
    marginBottom: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  facilityName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  facilitySpecialty: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: spacing.xl,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.line,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.lg,
  },
  detailList: {
    gap: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  detailContent: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 21,
  },
});
