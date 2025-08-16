import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFacilities } from '../hooks/useDoctorsAndPharmacies';
import { colors, spacing, radius } from '../theme';
import Card from '../components/Card';
import { ListRow } from '../components/ListRow';

export default function ClinicsHospitalsPharmacies() {
  const { clinics, hospitals, pharmacies, loading, error } = useFacilities();
  const [search, setSearch] = useState('');

  const filterBySearch = (arr: any[]) =>
    arr.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.top}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.muted} />
          <TextInput
            style={{ flex: 1, marginLeft: spacing.sm }}
            placeholder="Search facilities"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
        {filterBySearch(hospitals).map(fac => (
          <Card key={fac.id}>
            <ListRow
              title={fac.name}
              subtitle={fac.specialty || fac.location}
              leftIcon={<Ionicons name="medkit" size={24} color={colors.primary} />}
              right={<View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Pressable style={styles.outlineBtn}><Text style={styles.outlineText}>Call</Text></Pressable>
                <Pressable style={styles.outlineBtn}><Text style={styles.outlineText}>Map</Text></Pressable>
              </View>}
            />
          </Card>
        ))}
        {filterBySearch(clinics).map(fac => (
          <Card key={fac.id}>
            <ListRow
              title={fac.name}
              subtitle={fac.specialty || fac.location}
              leftIcon={<Ionicons name="medkit" size={24} color={colors.primary} />}
              right={<View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Pressable style={styles.outlineBtn}><Text style={styles.outlineText}>Call</Text></Pressable>
                <Pressable style={styles.outlineBtn}><Text style={styles.outlineText}>Map</Text></Pressable>
              </View>}
            />
          </Card>
        ))}
        {filterBySearch(pharmacies).map(fac => (
          <Card key={fac.id}>
            <ListRow
              title={fac.name}
              subtitle={fac.address || fac.location}
              leftIcon={<Ionicons name="business" size={24} color={colors.accent} />}
              right={<View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Pressable style={styles.outlineBtn}><Text style={styles.outlineText}>Call</Text></Pressable>
                <Pressable style={styles.outlineBtn}><Text style={styles.outlineText}>Map</Text></Pressable>
              </View>}
            />
          </Card>
        ))}
        {loading && <Text style={{ textAlign: 'center' }}>Loading...</Text>}
        {error && <Text style={{ color: colors.danger }}>{error}</Text>}
      </ScrollView>
    </View>
  );
}
  // Removed extra closing brace

const styles = StyleSheet.create({
  top: { padding: spacing.xl },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  outlineBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  outlineText: { color: colors.primary, fontWeight: '600' },
});
