import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, Modal, Animated, ScrollView, Image as RNImage, StyleSheet, ImageBackground } from 'react-native';
import SkeletonImage from '../components/SkeletonImage';
import { SkeletonFacilityCardLarge } from '../components/SkeletonLoaders';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useRTL } from '../hooks/useRTL';
import type { Facility } from '../types';
import { colors, spacing, radius, shadow, animation } from '../theme';
import { useFacilities } from '../hooks/useFacilitiesFirestore';
import { useLoading } from '../hooks/LoadingContext';
import { SegmentedControl } from '../components/SegmentedControl';
import Chip from '../components/Chip';
import ClinicsHospitalsPharmaciesMap from './ClinicsHospitalsPharmaciesMap';
import ScreenContainer from '../components/ScreenContainer';

export default function FacilitiesScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { isRTL, textAlign } = useRTL();
  const { facilities, loading, error } = useFacilities();
  const { startLoading, finishLoading } = useLoading();
  const _prefetched = useRef(new Set<string>());
  
  const FILTERS = [
    t('facilities.all', 'All'),
    t('facilities.clinic', 'Clinic'), 
    t('facilities.hospital', 'Hospital'),
    t('facilities.pharmacy', 'Pharmacy')
  ];

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 7,
        delay: 50,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 7,
        delay: 100,
      }),
    ]).start();
  }, []);

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
  const [filter, setFilter] = useState(FILTERS[0]);
  const [openNow, setOpenNow] = useState(false);
  const [hasDelivery, setHasDelivery] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const filtered = useMemo(() => {
    let f = facilities;
    if (filter !== FILTERS[0]) {
      const filterType = filter.toLowerCase();
      f = f.filter(fac => {
        const facType = fac.type.toLowerCase();
        return facType === filterType || 
               (filter === t('facilities.clinic', 'Clinic') && facType === 'clinic') ||
               (filter === t('facilities.hospital', 'Hospital') && facType === 'hospital') ||
               (filter === t('facilities.pharmacy', 'Pharmacy') && facType === 'pharmacy');
      });
    }
    if (openNow) f = f.filter(fac => fac.isOpen);
    if (hasDelivery) f = f.filter(fac => fac.hasDelivery);
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      f = f.filter(fac =>
        fac.name.toLowerCase().includes(s) ||
        fac.specialty?.toLowerCase().includes(s) ||
        fac.address?.toLowerCase().includes(s)
      );
    }
    return f;
  }, [facilities, filter, search, openNow, hasDelivery, t, FILTERS]);

  const openFacilityModal = (fac: any) => {
    setSelectedFacility(fac);
    setModalVisible(true);
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

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.content}>
      {/* Hero Header */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('facilities.title', 'Facilities')}</Text>
          <Text style={styles.headerSubtitle}>{t('facilities.findFacilities', 'Find clinics, hospitals & pharmacies')}</Text>
        </View>
      </Animated.View>

      {/* Search Bar */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
        <Pressable 
          style={({ pressed }) => [
            styles.searchBar,
            pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }
          ]}
        >
          <Ionicons name="search" size={22} color={colors.textTertiary} />
          <TextInput
            placeholder={t('facilities.searchFacilities', 'Search facilities...')}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            placeholderTextColor={colors.placeholder}
          />
        </Pressable>
      </Animated.View>

      {/* Filters */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
        <View style={styles.filterCard}>
          <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} />
          <View style={styles.chipRow}>
            <Chip 
              label={openNow ? `${t('facilities.openNow', 'Open Now')} ✓` : t('facilities.openNow', 'Open Now')} 
              selected={openNow} 
              onPress={() => setOpenNow(v => !v)} 
            />
            <Chip 
              label={hasDelivery ? `${t('facilities.delivery', 'Delivery')} ✓` : t('facilities.delivery', 'Delivery')} 
              selected={hasDelivery} 
              onPress={() => setHasDelivery(v => !v)} 
            />
          </View>
        </View>
      </Animated.View>

      {/* Map */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
        <View style={styles.mapCard}>
          <ClinicsHospitalsPharmaciesMap filtered={filtered} handleMap={() => {}} onFacilityPress={openFacilityModal} />
        </View>
      </Animated.View>

      {/* Facilities List */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('facilities.nearbyFacilities', 'Nearby Facilities')}</Text>
            <Text style={styles.sectionCount}>{filtered.length} {t('facilities.found', 'found')}</Text>
          </View>

          {loading ? (
            <View style={styles.list}>
              <SkeletonFacilityCardLarge />
              <SkeletonFacilityCardLarge />
              <SkeletonFacilityCardLarge />
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="business-outline" size={48} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>{t('facilities.noFacilities', 'No facilities found')}</Text>
              <Text style={styles.emptyText}>{t('facilities.adjustFilters', 'Try adjusting your filters or search')}</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {filtered.map((fac, index) => (
                <Animated.View
                  key={fac.id}
                  style={{
                    opacity: fadeAnim,
                    transform: [
                      { 
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 20],
                          outputRange: [0, 20 + (index * 10)],
                        })
                      }
                    ]
                  }}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.facilityCard,
                      pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }
                    ]}
                    onPress={() => openFacilityModal(fac)}
                  >
                    <ImageBackground
                      source={{ uri: fac.image || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400' }}
                      style={styles.facilityImage}
                      imageStyle={styles.facilityImageStyle}
                    >
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.facilityGradient}
                      >
                        <View style={styles.facilityBadges}>
                          {fac.isOpen ? (
                            <View style={styles.openBadge}>
                              <View style={styles.openDot} />
                              <Text style={styles.openBadgeText}>{t('facilities.open', 'Open')}</Text>
                            </View>
                          ) : (
                            <View style={styles.closedBadge}>
                              <Text style={styles.closedBadgeText}>{t('facilities.closed', 'Closed')}</Text>
                            </View>
                          )}
                          {fac.hasDelivery && (
                            <View style={styles.deliveryBadge}>
                              <Ionicons name="bicycle" size={12} color="#fff" />
                            </View>
                          )}
                        </View>
                      </LinearGradient>
                    </ImageBackground>

                    <View style={styles.facilityInfo}>
                      <Text style={styles.facilityName} numberOfLines={1}>{fac.name}</Text>
                      <Text style={styles.facilitySpecialty} numberOfLines={1}>{fac.specialty || fac.type}</Text>
                      
                      <View style={styles.facilityMeta}>
                        <View style={styles.facilityMetaItem}>
                          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                          <Text style={styles.facilityMetaText} numberOfLines={1}>{fac.distance || 'N/A'}</Text>
                        </View>
                        {fac.rating && (
                          <View style={styles.facilityMetaItem}>
                            <Ionicons name="star" size={14} color="#F59E0B" />
                            <Text style={styles.facilityMetaText}>{fac.rating.toFixed(1)}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          )}
        </View>
      </Animated.View>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            {selectedFacility && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedFacility.name}</Text>
                  <Pressable onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={28} color={colors.text} />
                  </Pressable>
                </View>

                {selectedFacility.image && (
                  <ImageBackground
                    source={{ uri: selectedFacility.image }}
                    style={styles.modalImage}
                    imageStyle={styles.modalImageStyle}
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.6)']}
                      style={styles.modalImageGradient}
                    >
                      <View style={styles.modalImageBadges}>
                        {selectedFacility.isOpen && (
                          <View style={styles.openBadge}>
                            <View style={styles.openDot} />
                            <Text style={styles.openBadgeText}>{t('facilities.open', 'Open')}</Text>
                          </View>
                        )}
                      </View>
                    </LinearGradient>
                  </ImageBackground>
                )}

                <View style={styles.modalBody}>
                  <Text style={styles.modalSpecialty}>{selectedFacility.specialty || selectedFacility.type}</Text>
                  
                  {selectedFacility.address && (
                    <View style={styles.modalRow}>
                      <View style={styles.modalRowIcon}>
                        <Ionicons name="location" size={20} color={colors.primary} />
                      </View>
                      <Text style={styles.modalRowText}>{selectedFacility.address}</Text>
                    </View>
                  )}

                  {selectedFacility.phoneNumber && (
                    <View style={styles.modalRow}>
                      <View style={styles.modalRowIcon}>
                        <Ionicons name="call" size={20} color={colors.primary} />
                      </View>
                      <Text style={styles.modalRowText}>{selectedFacility.phoneNumber}</Text>
                    </View>
                  )}

                  {selectedFacility.hours && (
                    <View style={styles.modalRow}>
                      <View style={styles.modalRowIcon}>
                        <Ionicons name="time" size={20} color={colors.primary} />
                      </View>
                      <Text style={styles.modalRowText}>{selectedFacility.hours}</Text>
                    </View>
                  )}

                  {selectedFacility.services && selectedFacility.services.length > 0 && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>{t('facilities.services', 'Services')}</Text>
                      <View style={styles.modalTags}>
                        {selectedFacility.services.map((service, idx) => (
                          <View key={idx} style={styles.modalTag}>
                            <Text style={styles.modalTagText}>{service}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxxl,
    paddingBottom: 140,
  },

  // Header
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.xs,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    marginHorizontal: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.xxl,
    gap: spacing.lg,
    ...shadow.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '400',
    color: colors.text,
  },

  // Filters
  filterCard: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.xl,
    padding: spacing.xl,
    borderRadius: radius.xxl,
    gap: spacing.lg,
    ...shadow.card,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },

  // Map
  mapCard: {
    marginHorizontal: spacing.xl,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    height: 320,
    ...shadow.card,
  },

  // Section
  section: {
    gap: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  sectionCount: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // List
  list: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },

  // Facility Card
  facilityCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    ...shadow.card,
  },
  facilityImage: {
    height: 180,
  },
  facilityImageStyle: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
  },
  facilityGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  facilityBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.98)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    ...shadow.sm,
  },
  openDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  openBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  closedBadge: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    ...shadow.sm,
  },
  closedBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.danger,
  },
  deliveryBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.98)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  facilityInfo: {
    padding: spacing.xl,
    gap: spacing.sm,
  },
  facilityName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  facilitySpecialty: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  facilityMeta: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  facilityMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  facilityMetaText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 2,
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xxxl,
    borderTopRightRadius: radius.xxxl,
    maxHeight: '90%',
    ...shadow.xl,
  },
  modalHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.line,
    alignSelf: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
    letterSpacing: -0.5,
  },
  modalImage: {
    height: 200,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  modalImageStyle: {
    borderRadius: radius.xxl,
  },
  modalImageGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.lg,
    borderRadius: radius.xxl,
  },
  modalImageBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalBody: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  modalSpecialty: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  modalRowIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRowText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  modalSection: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  modalTag: {
    backgroundColor: colors.primary50,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  modalTagText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});
