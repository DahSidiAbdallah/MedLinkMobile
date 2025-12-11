
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, Modal, Animated, Easing, Dimensions, useWindowDimensions, Image as RNImage, StyleSheet, RefreshControl } from 'react-native';
import SkeletonImage from '../components/SkeletonImage';
import { SkeletonFacilityCard, Skeleton } from '../components/Skeleton';
import { Ionicons } from '@expo/vector-icons';
import type { Facility } from '../types';
import { colors, spacing, radius, shadow } from '../theme';
import Card from '../components/Card';
import { ListRow } from '../components/ListRow';
import { Pill } from '../components/Pill';
import { useFacilities } from '../hooks/useFacilitiesFirestore';
import { useLoading } from '../hooks/LoadingContext';
import { SegmentedControl } from '../components/SegmentedControl';
import Chip from '../components/Chip';
import ClinicsHospitalsPharmaciesMap from './ClinicsHospitalsPharmaciesMap';
import ScreenContainer from '../components/ScreenContainer';
import CachedImage from '../components/CachedImage';

const FILTERS = ['All', 'Clinic', 'Hospital', 'Pharmacy'];


export default function FacilitiesScreen({ navigation }: any) {
  const { facilities, loading, error } = useFacilities();
  const { startLoading, finishLoading } = useLoading();
  const _prefetched = useRef(new Set<string>());
  const { width } = useWindowDimensions();
  const listImageWidth = Math.min(140, Math.max(100, Math.floor(width * 0.32)));
  // Prefetch images for list when facilities update
  useEffect(() => {
    if (!facilities || facilities.length === 0) return;
    const uris = Array.from(new Set(facilities.map(f => f.image).filter(Boolean)));
    if (uris.length === 0) return;
    const key = 'clinic-images';
    startLoading(key);
    Promise.all(
      uris.map(uri => {
        if (_prefetched.current.has(uri)) return Promise.resolve(true);
        return RNImage.prefetch(uri)
          .then(() => _prefetched.current.add(uri))
          .catch(() => false);
      })
    ).finally(() => finishLoading(key));
  }, [facilities]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [openNow, setOpenNow] = useState(false);
  const [hasDelivery, setHasDelivery] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [sheetAnim] = useState(new Animated.Value(0));

  // Filter facilities by type, search, open now, and has delivery
  const filtered = useMemo(() => {
    let f = facilities;
    if (filter !== 'All') {
      f = f.filter(fac => fac.type.toLowerCase() === filter.toLowerCase());
    }
    if (openNow) {
      f = f.filter(fac => fac.isOpen);
    }
    if (hasDelivery) {
      f = f.filter(fac => fac.hasDelivery);
    }
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      f = f.filter(fac =>
        fac.name.toLowerCase().includes(s) ||
        fac.specialty?.toLowerCase().includes(s) ||
        fac.address?.toLowerCase().includes(s)
      );
    }
    return f;
  }, [facilities, filter, search, openNow, hasDelivery]);

  // Map handler (center map or show details)
  const handleMap = (lat: number, lng: number, name: string) => {
    // Optionally scroll to card or show details
  };

  // Show modal with animation
  const openFacilityModal = (fac: any) => {
    setSelectedFacility(fac);
    setModalVisible(true);
    sheetAnim.setValue(0);
    Animated.timing(sheetAnim, {
      toValue: 1,
      duration: 350,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();
    // Ensure the selected facility image is prefetched (if not already)
    const uri = fac?.image;
    if (uri && !_prefetched.current.has(uri)) {
      const key = `clinic-image-${fac.id}`;
      startLoading(key);
      RNImage.prefetch(uri)
        .then(() => _prefetched.current.add(uri))
        .catch(() => {})
        .finally(() => finishLoading(key));
    }
  };
  const closeFacilityModal = () => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.exp),
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setSelectedFacility(null);
    });
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.content}>
      <View style={styles.headerSection}>
        <Text style={styles.screenTitle}>Facilities</Text>
        <Text style={styles.screenSubtitle}>Find clinics, hospitals & pharmacies</Text>
      </View>

      <Card style={styles.filterCard}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            placeholder="Search facilities..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            placeholderTextColor={colors.muted}
          />
        </View>
        <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} />
        <View style={styles.chipRow}>
          <Chip label={openNow ? 'Open Now ✓' : 'Open Now'} selected={openNow} onPress={() => setOpenNow(v => !v)} />
          <Chip label={hasDelivery ? 'Delivery ✓' : 'Delivery'} selected={hasDelivery} onPress={() => setHasDelivery(v => !v)} />
        </View>
      </Card>

      <Card style={styles.mapCard}>
        <ClinicsHospitalsPharmaciesMap filtered={filtered} handleMap={handleMap} />
      </Card>

      <View style={styles.list}>
        {filtered.map(fac => (
          <Card key={fac.id} style={styles.facilityCard}>
            <ListRow
              title={fac.name}
              subtitle={fac.address || fac.location}
              imageUri={fac.image}
              right={fac.specialty ? <Pill tone="primary">{fac.specialty}</Pill> : undefined}
              onPress={() => openFacilityModal(fac)}
            />
            {/* Details section */}
            <View style={{ marginTop: 8 }}>
              {/* Info badges */}
              <View style={styles.facilityBadges}>
                <View style={[styles.facilityBadge, { backgroundColor: 'rgba(37,99,235,0.1)' }]}>
                  <Text style={[styles.facilityBadgeText, { color: colors.primary }]}>
                    {fac.type.charAt(0).toUpperCase() + fac.type.slice(1)}
                  </Text>
                </View>
                {fac.rating && (
                  <View style={[styles.facilityBadge, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={[styles.facilityBadgeText, { color: '#F59E0B' }]}>{fac.rating}</Text>
                  </View>
                )}
                {fac.isOpen ? (
                  <View style={[styles.facilityBadge, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                    <View style={styles.openDot} />
                    <Text style={[styles.facilityBadgeText, { color: colors.success }]}>Open</Text>
                  </View>
                ) : (
                  <View style={[styles.facilityBadge, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                    <Text style={[styles.facilityBadgeText, { color: colors.danger }]}>Closed</Text>
                  </View>
                )}
                {fac.hasDelivery && (
                  <View style={[styles.facilityBadge, { backgroundColor: 'rgba(139,92,246,0.1)' }]}>
                    <Ionicons name="bicycle" size={12} color="#8B5CF6" />
                    <Text style={[styles.facilityBadgeText, { color: '#8B5CF6' }]}>Delivery</Text>
                  </View>
                )}
              </View>
              {/* Hours */}
              {fac.hours && (
                <Text style={{ color: colors.text, fontSize: 13, marginTop: 2 }}>
                  Hours: {fac.hours}
                </Text>
              )}
            </View>
          </Card>
        ))}
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <SkeletonFacilityCard />
          <SkeletonFacilityCard />
          <SkeletonFacilityCard />
        </View>
      )}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
          <Text style={[styles.stateText, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>
        </View>
      )}
      {filtered.length === 0 && !loading && !error && (
        <View style={styles.emptyContainer}>
          <Ionicons name="business-outline" size={48} color={colors.mutedLight} />
          <Text style={styles.emptyTitle}>No facilities found</Text>
          <Text style={styles.emptyHint}>Try adjusting your filters or search</Text>
        </View>
      )}

      <Modal
        visible={modalVisible}
        animationType="none"
        transparent
        onRequestClose={closeFacilityModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalSheet,
              {
                transform: [
                  {
                    translateY: sheetAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [Dimensions.get('window').height, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {selectedFacility && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Summary</Text>
                  <Pressable onPress={closeFacilityModal} hitSlop={10}>
                    <Text style={styles.modalClose}>Close</Text>
                  </Pressable>
                </View>
                <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
                  {selectedFacility.image ? (
                    <SkeletonImage source={{ uri: selectedFacility.image }} style={styles.modalAvatar} resizeMode="cover" />
                  ) : null}
                  <Text style={styles.modalName}>{selectedFacility.name}</Text>
                  <Text style={styles.modalSubtitle}>{selectedFacility.specialty}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: spacing.lg }}>
                  <Pill tone="primary">{selectedFacility.type.charAt(0).toUpperCase() + selectedFacility.type.slice(1)}</Pill>
                  {selectedFacility.isOpen && <Pill tone="neutral">Open Now</Pill>}
                  {selectedFacility.hasDelivery && <Pill tone="neutral">Has Delivery</Pill>}
                </View>
                <View style={{ gap: 6 }}>
                  {selectedFacility.address && <Text style={styles.modalDetail}>Address: {selectedFacility.address}</Text>}
                  {selectedFacility.phoneNumber && <Text style={styles.modalDetail}>Phone: {selectedFacility.phoneNumber}</Text>}
                  {selectedFacility.hours && <Text style={styles.modalDetail}>Hours: {selectedFacility.hours}</Text>}
                  {selectedFacility.rating && <Text style={styles.modalDetail}>Rating: {selectedFacility.rating.toFixed(1)}</Text>}
                  {selectedFacility.services && selectedFacility.services.length > 0 && (
                    <Text style={styles.modalDetail}>Services: {selectedFacility.services.join(', ')}</Text>
                  )}
                  {selectedFacility.languages && selectedFacility.languages.length > 0 && (
                    <Text style={styles.modalDetail}>Languages: {selectedFacility.languages.join(', ')}</Text>
                  )}
                  {selectedFacility.acceptedInsurance && selectedFacility.acceptedInsurance.length > 0 && (
                    <Text style={styles.modalDetail}>Insurance: {selectedFacility.acceptedInsurance.join(', ')}</Text>
                  )}
                </View>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  headerSection: {
    marginBottom: spacing.sm,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 15,
    color: colors.muted,
  },
  filterCard: {
    gap: spacing.md,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  mapCard: {
    padding: 0,
    overflow: 'hidden',
    minHeight: 220,
    borderRadius: radius.lg,
  },
  list: {
    gap: spacing.lg,
  },
  facilityCard: {
    gap: spacing.sm,
  },
  facilityBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  facilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  facilityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  stateText: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    padding: spacing.xl,
    paddingBottom: 48,
    maxHeight: '85%',
    ...shadow.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: { fontWeight: 'bold', fontSize: 22, color: colors.text },
  modalClose: { color: colors.muted, fontWeight: '600', fontSize: 16 },
  modalAvatar: { width: 64, height: 64, borderRadius: 32, marginBottom: 8 },
  modalName: { fontSize: 20, fontWeight: '700', color: colors.text },
  modalSubtitle: { color: colors.muted, marginTop: 4 },
  modalDetail: { color: colors.text, fontSize: 15 },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.sm,
  },
  emptyHint: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
});
