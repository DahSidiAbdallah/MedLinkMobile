
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useDoctorsAndPharmacies } from '../hooks/useDoctorsAndPharmacies';

export const DoctorsPharmacies: React.FC = () => {
  const { doctors, pharmacies, loading, error } = useDoctorsAndPharmacies();
  const [search, setSearch] = useState('');

  const filteredDoctors = doctors.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialty?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredPharmacies = pharmacies.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.address?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Text style={styles.loading}>Loading...</Text>;
  if (error) return <Text style={styles.error}>{error}</Text>;

  return (
    <View style={styles.root}>
      <TextInput
        style={styles.search}
        placeholder="Search doctors or pharmacies..."
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#888"
      />
      <Text style={styles.sectionTitle}>Doctors</Text>
      <FlatList
        data={filteredDoctors}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="medkit" size={24} color="#2196F3" style={{ marginRight: 10 }} />
              <Text style={styles.name}>{item.name}</Text>
            </View>
            <Text style={styles.detail}><MaterialCommunityIcons name="stethoscope" size={16} color="#2196F3" /> {item.specialty}</Text>
            <Text style={styles.detail}><Ionicons name="location" size={16} color="#2196F3" /> {item.location}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No doctors found.</Text>}
        style={{ marginBottom: 16 }}
      />
      <Text style={styles.sectionTitle}>Pharmacies</Text>
      <FlatList
        data={filteredPharmacies}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="pill" size={24} color="#43a047" style={{ marginRight: 10 }} />
              <Text style={styles.name}>{item.name}</Text>
            </View>
            <Text style={styles.detail}><Ionicons name="location" size={16} color="#43a047" /> {item.address}</Text>
            <Text style={styles.detail}><Ionicons name="time" size={16} color="#2196F3" /> {item.hours}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No pharmacies found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, padding: 20, backgroundColor: '#f6f8fa' },
  search: { backgroundColor: '#fff', borderRadius: 12, padding: 12, fontSize: 16, marginBottom: 18, borderWidth: 1, borderColor: '#e0e0e0' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 10, marginBottom: 10, color: '#222' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#2196F3', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  detail: { fontSize: 14, color: '#444', marginTop: 2, marginLeft: 2 },
  empty: { textAlign: 'center', color: '#888', marginVertical: 20 },
  loading: { fontSize: 18, color: '#888', textAlign: 'center', marginTop: 40 },
  error: { color: 'red', fontSize: 16, textAlign: 'center', marginTop: 40 },
});
