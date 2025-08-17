
import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Pressable } from 'react-native';
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

  // Example advice and files (replace with real data if available)
  const advice = [
    'Drink 4 Liters of Water a day',
    'No Smoking',
    'Sleep for 8 Hours a day',
  ];
  const files = [
    { name: 'File 1', type: 'pdf' },
    { name: 'File 2', type: 'pdf' },
  ];

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
        {/* Doctor's Advice */}
        <Text style={styles.sectionTitle}>Doctor's Advice</Text>
        <View style={{ marginBottom: spacing.lg }}>
          {advice.map((item, idx) => (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ color: colors.accent, fontSize: 18, marginRight: 8 }}>✓</Text>
              <Text style={{ color: colors.text, fontSize: 15 }}>{item}</Text>
            </View>
          ))}
        </View>
        {/* Discharge Files */}
        <Text style={styles.sectionTitle}>Discharge</Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {files.map((file, idx) => (
            <View key={idx} style={styles.fileCard}>
              <Text style={{ fontSize: 36, textAlign: 'center' }}>📄</Text>
              <Text style={{ fontWeight: '600', textAlign: 'center', marginTop: 4 }}>{file.name}</Text>
            </View>
          ))}
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
  fileCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: 80,
  },
});
