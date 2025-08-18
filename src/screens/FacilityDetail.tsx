
import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, type } from '../theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useFacilities } from '../hooks/useDoctorsAndPharmacies';
import { Pill } from '../components/Pill';

export default function FacilityDetail() {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params as { id: string };
  const { facilities } = useFacilities();
  const fac = facilities.find(f => f.id === id);

  if (!fac) {
    return <Text style={{ marginTop: spacing.xl, textAlign: 'center' }}>Facility not found.</Text>;
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.sheet}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Summary</Text>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
        </View>
        {/* Avatar, Name, Specialty */}
        <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
          <Image source={{ uri: fac.image }} style={styles.avatar} />
          <Text style={[type.h2, { marginTop: spacing.sm }]}>{fac.name}</Text>
          <Text style={{ color: colors.muted }}>{fac.specialty}</Text>
        </View>
        {/* Status */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: spacing.lg }}>
          <Pill tone="primary">{fac.type.charAt(0).toUpperCase() + fac.type.slice(1)}</Pill>
          {fac.isOpen && <Pill tone="neutral">Open Now</Pill>}
          {fac.hasDelivery && <Pill tone="neutral">Has Delivery</Pill>}
        </View>

        <Text style={styles.sectionTitle}>Information</Text>
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
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'flex-end',
  },
  sheet: {
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
  },
});
