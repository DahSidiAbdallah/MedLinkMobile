
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, ScrollView, Text, TextInput, Platform, Pressable, Modal, Animated, Easing, Dimensions, useWindowDimensions, Image as RNImage } from 'react-native';
import SkeletonImage from '../components/SkeletonImage';
import type { Facility } from '../types';
import { colors, spacing, radius } from '../theme';
import Card from '../components/Card';
import { ListRow } from '../components/ListRow';
import { Pill } from '../components/Pill';
import { useFacilities } from '../hooks/useFacilitiesFirestore';
import { useLoading } from '../hooks/LoadingContext';
import { SegmentedControl } from '../components/SegmentedControl';
import Chip from '../components/Chip';
import ClinicsHospitalsPharmaciesMap from './ClinicsHospitalsPharmaciesMap';

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
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.xl }}>
      {/* Search bar */}

      <View style={{ marginBottom: spacing.lg }}>
    <TextInput
          placeholder="Search facilities..."
          value={search}
          onChangeText={setSearch}
          style={{
      backgroundColor: colors.card,
      borderRadius: radius.md,
            paddingHorizontal: 16,
            paddingVertical: Platform.OS === 'web' ? 12 : 8,
            fontSize: 16,
            borderWidth: 1,
            borderColor: colors.line,
            marginBottom: 8,
          }}
          placeholderTextColor={colors.muted}
        />
        <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} />

        {/* Filter Chips */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <Chip label={openNow ? 'Open Now ✓' : 'Open Now'} selected={openNow} onPress={() => setOpenNow(v => !v)} />
          <Chip label={hasDelivery ? 'Has Delivery ✓' : 'Has Delivery'} selected={hasDelivery} onPress={() => setHasDelivery(v => !v)} />
        </View>
      </View>

      {/* Map */}
      <View style={{ marginBottom: spacing.xl }}>
        <ClinicsHospitalsPharmaciesMap filtered={filtered} handleMap={handleMap} />
      </View>

      {/* Facility list */}
      <View style={{ gap: spacing.lg }}>
        {filtered.map(fac => (
          <Card key={fac.id} style={{ marginBottom: spacing.lg }}>
            <ListRow
              title={fac.name}
              subtitle={fac.address || fac.location}
              right={fac.specialty ? <Pill tone="primary">{fac.specialty}</Pill> : undefined}
              onPress={() => openFacilityModal(fac)}
            />
      {/* Facility Details Modal Sheet */}
      <Modal
        visible={modalVisible}
        animationType="none"
        transparent
        onRequestClose={closeFacilityModal}
      >
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <Animated.View
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              padding: spacing.xl,
              paddingBottom: 40,
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: -4 },
              elevation: 8,
              transform: [
                {
                  translateY: sheetAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [Dimensions.get('window').height, 0],
                  }),
                },
              ],
            }}
          >
            {selectedFacility && (
              <>
                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 22, color: colors.text }}>Summary</Text>
                  <Pressable onPress={closeFacilityModal} hitSlop={10}>
                    <Text style={{ color: colors.muted, fontWeight: '600', fontSize: 16 }}>Cancel</Text>
                  </Pressable>
                </View>
                {/* Avatar, Name, Specialty */}
                <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
                  {selectedFacility.image ? (
                    <SkeletonImage source={{ uri: selectedFacility.image }} style={{ width: 64, height: 64, borderRadius: 32, marginBottom: 8 }} resizeMode="cover" />
                  ) : null}
                  <Text style={[{ fontSize: 20, fontWeight: '700', color: colors.text, marginTop: spacing.sm }]}>{selectedFacility.name}</Text>
                  <Text style={{ color: colors.muted }}>{selectedFacility.specialty}</Text>
                </View>
                {/* Status */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: spacing.lg }}>
                  <Pill tone="primary">{selectedFacility.type.charAt(0).toUpperCase() + selectedFacility.type.slice(1)}</Pill>
                  {!!selectedFacility.isOpen && <Pill tone="neutral">Open Now</Pill>}
                  {!!selectedFacility.hasDelivery && <Pill tone="neutral">Has Delivery</Pill>}
                </View>
                {/* Show actual facility fields from the database */}
                <View style={{ marginBottom: spacing.lg }}>
                  {selectedFacility.address && <Text style={{ color: colors.text, fontSize: 15, marginBottom: 4 }}>Address: {selectedFacility.address}</Text>}
                  {selectedFacility.phoneNumber && <Text style={{ color: colors.text, fontSize: 15, marginBottom: 4 }}>Phone: {selectedFacility.phoneNumber}</Text>}
                  {selectedFacility.hours && <Text style={{ color: colors.text, fontSize: 15, marginBottom: 4 }}>Hours: {selectedFacility.hours}</Text>}
                  {selectedFacility.rating && <Text style={{ color: colors.text, fontSize: 15, marginBottom: 4 }}>Rating: {selectedFacility.rating.toFixed(1)}</Text>}
                  {selectedFacility.services && selectedFacility.services.length > 0 && (
                    <Text style={{ color: colors.text, fontSize: 15, marginBottom: 4 }}>Services: {selectedFacility.services.join(', ')}</Text>
                  )}
                  {selectedFacility.languages && selectedFacility.languages.length > 0 && (
                    <Text style={{ color: colors.text, fontSize: 15, marginBottom: 4 }}>Languages: {selectedFacility.languages.join(', ')}</Text>
                  )}
                  {selectedFacility.acceptedInsurance && selectedFacility.acceptedInsurance.length > 0 && (
                    <Text style={{ color: colors.text, fontSize: 15, marginBottom: 4 }}>Insurance: {selectedFacility.acceptedInsurance.join(', ')}</Text>
                  )}
                </View>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
            {/* Details section */}
            <View style={{ marginTop: 8 }}>
              {/* Images */}
              {!!fac.image && (
                <View style={{ marginBottom: 8, borderRadius: radius.md, overflow: 'hidden', alignSelf: 'flex-start' }}>
                  <SkeletonImage source={{ uri: fac.image }} style={{ width: listImageWidth, height: Math.round(listImageWidth * 0.66), borderRadius: radius.md }} resizeMode="cover" />
                </View>
              )}
              {/* Info */}
              <Text style={{ color: colors.muted, fontSize: 13 }}>
                {fac.type.charAt(0).toUpperCase() + fac.type.slice(1)}
                {fac.rating ? ` · ⭐ ${fac.rating}` : ''}
                {fac.phoneNumber ? ` · 📞 ${fac.phoneNumber}` : ''}
                {fac.hours ? ` · 🕒 ${fac.hours}` : ''}
                {fac.isOpen ? ' · Open Now' : ' · Closed'}
                {fac.hasDelivery ? ' · 🚴‍♂️ Has Delivery' : ''}
              </Text>
              {/* Hours */}
              {fac.hours && (
                <Text style={{ color: colors.text, fontSize: 13, marginTop: 2 }}>
                  Hours: {fac.hours}
                </Text>
              )}
            </View>
          </Card>
        ))}
        {loading && <Text style={{ textAlign: 'center' }}>Loading...</Text>}
        {error && <Text style={{ color: colors.danger }}>{error}</Text>}
        {filtered.length === 0 && !loading && !error && (
          <Text style={{ textAlign: 'center', color: colors.muted }}>No facilities found.</Text>
        )}
      </View>
    </ScrollView>
  );
}
