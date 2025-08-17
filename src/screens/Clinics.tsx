
import React, { useState, useMemo } from 'react';
import { View, ScrollView, Text, TextInput, Platform, Pressable, Image, Modal, Animated, Easing, Dimensions } from 'react-native';
import type { Facility } from '../types';
import { colors, spacing } from '../theme';
import Card from '../components/Card';
import { ListRow } from '../components/ListRow';
import { Pill } from '../components/Pill';
import { useFacilities } from '../hooks/useDoctorsAndPharmacies';
import { SegmentedControl } from '../components/SegmentedControl';
import ClinicsHospitalsPharmaciesMap from './ClinicsHospitalsPharmaciesMap';

const FILTERS = ['All', 'Clinic', 'Hospital', 'Pharmacy'];


export default function FacilitiesScreen({ navigation }: any) {
  const { facilities, loading, error } = useFacilities();
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
            backgroundColor: '#fff',
            borderRadius: 12,
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

        {/* Filter Pills */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
          <Pressable
            onPress={() => setOpenNow(v => !v)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: openNow ? colors.primary : '#F3F4F6',
              borderRadius: 999,
              paddingHorizontal: 14,
              paddingVertical: 7,
              marginRight: 8,
            }}>
            <Text style={{ color: openNow ? '#fff' : colors.muted, fontSize: 15, marginRight: 6 }}>●</Text>
            <Text style={{ color: openNow ? '#fff' : colors.text, fontWeight: '600', fontSize: 15 }}>Open Now</Text>
          </Pressable>
          <Pressable
            onPress={() => setHasDelivery(v => !v)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: hasDelivery ? colors.primary : '#F3F4F6',
              borderRadius: 999,
              paddingHorizontal: 14,
              paddingVertical: 7,
            }}>
            <Text style={{ color: hasDelivery ? '#fff' : colors.muted, fontSize: 15, marginRight: 6 }}>🚴‍♂️</Text>
            <Text style={{ color: hasDelivery ? '#fff' : colors.text, fontWeight: '600', fontSize: 15 }}>Has Delivery</Text>
          </Pressable>
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
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.08)', justifyContent: 'flex-end' }}>
          <Animated.View
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 28,
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
                    <Image source={{ uri: selectedFacility.image }} style={{ width: 64, height: 64, borderRadius: 32, marginBottom: 8 }} />
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
                {/* Doctor's Advice (example) */}
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: colors.text }}>Doctor's Advice</Text>
                <View style={{ marginBottom: spacing.lg }}>
                  {['Drink 4 Liters of Water a day', 'No Smoking', 'Sleep for 8 Hours a day'].map((item) => (
                    <View key={item} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={{ color: colors.accent, fontSize: 18, marginRight: 8 }}>✓</Text>
                      <Text style={{ color: colors.text, fontSize: 15 }}>{item}</Text>
                    </View>
                  ))}
                </View>
                {/* Discharge Files (example) */}
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: colors.text }}>Discharge</Text>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  {[{ name: 'File 1', type: 'pdf' }, { name: 'File 2', type: 'pdf' }].map((file) => (
                    <View key={file.name} style={{ backgroundColor: '#F3F4F6', borderRadius: 16, padding: 16, alignItems: 'center', width: 80 }}>
                      <Text style={{ fontSize: 36, textAlign: 'center' }}>📄</Text>
                      <Text style={{ fontWeight: '600', textAlign: 'center', marginTop: 4 }}>{file.name}</Text>
                    </View>
                  ))}
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
                <View style={{ marginBottom: 8, borderRadius: 12, overflow: 'hidden', alignSelf: 'flex-start' }}>
                  <Image source={{ uri: fac.image }} style={{ width: 120, height: 80, borderRadius: 12 }} />
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
