
import React, { useState } from 'react';
import { Text, TextInput, ScrollView, StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchUserProfile, createOrUpdateUserProfile, Profile } from '../core/userProfile';

export const UserProfile: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editProfile, setEditProfile] = useState<Partial<Profile>>({});

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserProfile();
      setProfile(data);
      setEditProfile(data || {});
    } catch (err) {
      console.error('Failed to load profile', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!editProfile.id) return;
    setLoading(true);
    setError(null);
    try {
      await createOrUpdateUserProfile(editProfile as Profile);
      setProfile(editProfile as Profile);
      setEditing(false);
    } catch (err) {
      console.error('Failed to save profile', err);
      setError('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Text style={styles.loading}>Loading...</Text>;
  if (error) return <Text style={styles.error}>{error}</Text>;
  if (!profile) return <Text style={styles.error}>No profile found.</Text>;

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <View style={styles.avatarContainer}>
        <Image
          source={require('../assets/avatar-placeholder.png')}
          style={styles.avatar}
        />
        <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
          <Ionicons name="pencil" size={20} color="#2196F3" />
        </TouchableOpacity>
      </View>
      <Text style={styles.name}>{profile.name}</Text>
      {editing ? (
        <View style={styles.editSection}>
          <TextInput
            style={styles.input}
            value={editProfile.name || ''}
            onChangeText={text => setEditProfile(p => ({ ...p, name: text }))}
            placeholder="Name"
          />
          <TextInput
            style={styles.input}
            value={editProfile.email || ''}
            onChangeText={text => setEditProfile(p => ({ ...p, email: text }))}
            placeholder="Email"
          />
          <TextInput
            style={styles.input}
            value={editProfile.phone || ''}
            onChangeText={text => setEditProfile(p => ({ ...p, phone: text }))}
            placeholder="Phone"
          />
          <TextInput
            style={styles.input}
            value={editProfile.date_of_birth || ''}
            onChangeText={text => setEditProfile(p => ({ ...p, date_of_birth: text }))}
            placeholder="Date of Birth"
          />
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Ionicons name="checkmark" size={22} color="#fff" />
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditing(false); setEditProfile(profile); }}>
              <Ionicons name="close" size={22} color="#2196F3" />
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Ionicons name="mail" size={18} color="#2196F3" style={styles.icon} />
            <Text style={styles.detail}>{profile.email}</Text>
          </View>
          <View style={styles.card}>
            <Ionicons name="call" size={18} color="#2196F3" style={styles.icon} />
            <Text style={styles.detail}>{profile.phone}</Text>
          </View>
          <View style={styles.card}>
            <MaterialCommunityIcons name="cake-variant" size={18} color="#2196F3" style={styles.icon} />
            <Text style={styles.detail}>{profile.date_of_birth}</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flexGrow: 1, alignItems: 'center', backgroundColor: '#f6f8fa', paddingTop: 40, paddingBottom: 40 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#e3e3e3' },
  editBtn: { position: 'absolute', right: 0, bottom: 0, backgroundColor: '#fff', borderRadius: 16, padding: 6, elevation: 2 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#222', marginBottom: 18 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, width: 320, elevation: 2, shadowColor: '#2196F3', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  icon: { marginRight: 12 },
  detail: { fontSize: 16, color: '#444' },
  editSection: { width: 320, backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 16 },
  editActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2196F3', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: '#2196F3' },
  cancelBtnText: { color: '#2196F3', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
  loading: { fontSize: 18, color: '#888', textAlign: 'center', marginTop: 40 },
  error: { color: 'red', fontSize: 16, textAlign: 'center', marginTop: 40 },
});
