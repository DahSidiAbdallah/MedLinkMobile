
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

type RootStackParamList = {
  Dashboard: undefined;
  DrugInfo: undefined;
  Reminders: undefined;
  UserProfile: undefined;
  DoctorsPharmacies: undefined;
};

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export const Dashboard: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <LinearGradient colors={["#e0e7ff", "#fff"]} style={styles.gradient}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome to</Text>
        <Text style={styles.title}>MedLink</Text>
        <Text style={styles.subtitle}>Your health, your safety, your MedLink.</Text>
      </View>
      <View style={styles.servicesRow}>
        <TouchableOpacity style={styles.serviceCard} onPress={() => navigation.navigate('DrugInfo')}>
          <Ionicons name="medkit" size={32} color="#2196F3" />
          <Text style={styles.serviceText}>Drug Info</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.serviceCard} onPress={() => navigation.navigate('Reminders')}>
          <Ionicons name="notifications" size={32} color="#2196F3" />
          <Text style={styles.serviceText}>Reminders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.serviceCard} onPress={() => navigation.navigate('DoctorsPharmacies')}>
          <MaterialCommunityIcons name="hospital-building" size={32} color="#2196F3" />
          <Text style={styles.serviceText}>Clinics</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.serviceCard} onPress={() => navigation.navigate('UserProfile')}>
          <Ionicons name="person" size={32} color="#2196F3" />
          <Text style={styles.serviceText}>Profile</Text>
        </TouchableOpacity>
      </View>
      {/* Add more cards for quick actions, health tips, etc. */}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1, paddingTop: 60, alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 30 },
  greeting: { fontSize: 18, color: '#555' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#222', marginTop: 4 },
  subtitle: { fontSize: 16, color: '#666', marginTop: 8 },
  servicesRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 8,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#2196F3',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    width: 90,
  },
  serviceText: { marginTop: 8, fontSize: 14, color: '#2196F3', fontWeight: '600' },
});