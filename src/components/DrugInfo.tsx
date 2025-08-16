import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useDrugInfo } from '../hooks/useDrugInfo';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export const DrugInfo: React.FC = () => {
  const { searchDrug, suggestions, loading, error } = useDrugInfo();
  const [query, setQuery] = useState('');
  const [drugInfo, setDrugInfo] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleSearch = async () => {
    const result = await searchDrug(query);
    setDrugInfo(result);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (drugInfo?.images) {
      setCurrentImageIndex((prev) => (prev + 1) % drugInfo.images.length);
    }
  };

  const prevImage = () => {
    if (drugInfo?.images) {
      setCurrentImageIndex((prev) => (prev - 1 + drugInfo.images.length) % drugInfo.images.length);
    }
  };

  return (
    <LinearGradient colors={["#e0e7ff", "#fff"]} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Drug Info</Text>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={22} color="#2196F3" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.input}
            placeholder="Search for a drug..."
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        {suggestions.length > 0 && !drugInfo && (
          <View style={styles.suggestions}>
            {suggestions.map((drug) => (
              <TouchableOpacity key={drug} style={styles.suggestionPill} onPress={() => { setQuery(drug); handleSearch(); }}>
                <Text style={styles.suggestionText}>{drug}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {loading && <ActivityIndicator size="large" color="#2196F3" style={{ marginVertical: 20 }} />}
        {error && <Text style={styles.error}>{error}</Text>}
        {drugInfo && (
          <View style={styles.infoCard}>
            <Text style={styles.drugName}>{drugInfo.name}</Text>
            {drugInfo.generic_name && <Text style={styles.genericName}>({drugInfo.generic_name})</Text>}
            {drugInfo.images && drugInfo.images.length > 0 && (
              <View style={styles.imageBox}>
                <Image source={{ uri: drugInfo.images[currentImageIndex] }} style={styles.image} />
                {drugInfo.images.length > 1 && (
                  <View style={styles.imageNav}>
                    <TouchableOpacity onPress={prevImage} style={styles.navBtn}><Ionicons name="chevron-back" size={24} color="#2196F3" /></TouchableOpacity>
                    <Text style={styles.imageNavText}>{currentImageIndex + 1} / {drugInfo.images.length}</Text>
                    <TouchableOpacity onPress={nextImage} style={styles.navBtn}><Ionicons name="chevron-forward" size={24} color="#2196F3" /></TouchableOpacity>
                  </View>
                )}
              </View>
            )}
            {drugInfo.description && <Text style={styles.section}>{drugInfo.description}</Text>}
            {drugInfo.side_effects && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionHeader}><MaterialCommunityIcons name="alert-circle-outline" size={20} color="#f59e42" /><Text style={styles.sectionTitle}> Side Effects</Text></View>
                {drugInfo.side_effects.map((effect: string) => (
                  <Text key={effect} style={styles.section}>{effect}</Text>
                ))}
              </View>
            )}
            {drugInfo.interactions && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionHeader}><Ionicons name="swap-horizontal" size={20} color="#2196F3" /><Text style={styles.sectionTitle}> Interactions</Text></View>
                {drugInfo.interactions.map((interaction: string) => (
                  <Text key={interaction} style={styles.section}>{interaction}</Text>
                ))}
              </View>
            )}
            {drugInfo.warnings && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionHeader}><Ionicons name="warning" size={20} color="#e53935" /><Text style={styles.sectionTitle}> Warnings</Text></View>
                {drugInfo.warnings.map((warning: string) => (
                  <Text key={warning} style={[styles.section, { color: '#e53935' }]}>{warning}</Text>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { padding: 20, paddingTop: 40, backgroundColor: 'transparent', flexGrow: 1 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#222', textAlign: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, elevation: 2 },
  input: { flex: 1, fontSize: 16, padding: 10, backgroundColor: 'transparent' },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  suggestionPill: { backgroundColor: '#e3f2fd', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, margin: 4 },
  suggestionText: { color: '#2196F3', fontWeight: '600' },
  error: { color: 'red', marginVertical: 10, textAlign: 'center' },
  infoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginTop: 10, elevation: 3, shadowColor: '#2196F3', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  drugName: { fontSize: 22, fontWeight: 'bold', color: '#222' },
  genericName: { fontSize: 16, color: '#666', marginBottom: 8 },
  imageBox: { alignItems: 'center', marginVertical: 10 },
  image: { width: 180, height: 180, borderRadius: 12, marginBottom: 8 },
  imageNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  navBtn: { padding: 6 },
  imageNavText: { fontSize: 14, color: '#2196F3', marginHorizontal: 8 },
  sectionBox: { marginTop: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  sectionTitle: { fontWeight: 'bold', fontSize: 16, marginLeft: 4, color: '#222' },
  section: { fontSize: 15, marginBottom: 2, color: '#444' },
});
