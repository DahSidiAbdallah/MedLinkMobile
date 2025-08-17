import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Image, StyleSheet, Pressable, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { fetchUserProfile, createOrUpdateUserProfile, Profile } from '../core/userProfile';
import { colors, spacing, type, radius, shadow } from '../theme';
import Card from '../components/Card';
import { ListRow } from '../components/ListRow';

export default function UserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [edit, setEdit] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUserProfile().then(setProfile).catch(() => {});
  }, []);

  const openEdit = () => {
    if (!profile) return;
    setEdit({
      name: profile.name,
      phone: profile.phone,
      blood_type: profile.blood_type || '',
      allergies: (profile.allergies || []).join(', '),
      medical_conditions: (profile.medical_conditions || []).join(', '),
      medications: (profile.medications || []).join(', '),
    });
    setEditModal(true);
  };

  const saveEdit = async () => {
    if (!profile) return;
    setSaving(true);
  try {
      const updated = {
        ...profile,
        name: edit.name,
        phone: edit.phone,
        blood_type: edit.blood_type,
        allergies: edit.allergies.split(',').map((a: string) => a.trim()).filter(Boolean),
        medical_conditions: edit.medical_conditions.split(',').map((a: string) => a.trim()).filter(Boolean),
        medications: edit.medications.split(',').map((a: string) => a.trim()).filter(Boolean),
      };
      await createOrUpdateUserProfile(updated);
  Alert.alert('Success', 'Profile updated successfully.');
      setProfile(updated);
      setEditModal(false);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        try {
          await signOut(auth);
          Alert.alert('Logged out', 'You have been logged out.');
        } catch (e: any) {
          Alert.alert('Logout Error', e.message || 'Failed to log out.');
        }
      }},
    ]);
  };

  if (!profile) {
    return <Text style={{ marginTop: spacing.xl, textAlign: 'center' }}>Loading...</Text>;
  }

  return (
    <>
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
        <Card style={styles.headerCard}>
          <Image source={require('../assets/avatar-placeholder.png')} style={styles.avatar} />
          <Text style={[type.h2, { marginTop: spacing.sm }]}>{profile.name}</Text>
          <Text style={{ color: colors.muted }}>{profile.email}</Text>
          <Text style={{ color: colors.muted }}>{profile.phone}</Text>
        </Card>
        <Card>
          <ListRow title="Medical ID" right={<Ionicons name="chevron-forward" size={20} color={colors.muted} />} subtitle={profile.blood_type ? `Blood Type: ${profile.blood_type}` : undefined} />
        </Card>
        <Card>
          <ListRow title="Insurance" right={<Ionicons name="chevron-forward" size={20} color={colors.muted} />} subtitle={profile.insurance_info?.provider ? `Provider: ${profile.insurance_info.provider}` : undefined} />
        </Card>
        <Card>
          <ListRow title="Emergency Contacts" right={<Ionicons name="chevron-forward" size={20} color={colors.muted} />} subtitle={profile.emergency_contacts && profile.emergency_contacts.length > 0 ? profile.emergency_contacts[0].name : undefined} />
        </Card>
        <View style={styles.buttonRow}>
          <Pressable style={styles.btn} android_ripple={{ color: colors.line }} onPress={openEdit}><Text style={styles.btnTxt}>Edit Profile</Text></Pressable>
          <Pressable style={styles.btn} android_ripple={{ color: colors.line }}><Text style={styles.btnTxt}>Privacy</Text></Pressable>
          <Pressable style={[styles.btn, { backgroundColor: colors.danger }]} android_ripple={{ color: colors.primary600 }} onPress={handleLogout}>
            <Text style={[styles.btnTxt, { color: '#fff' }]}>Logout</Text>
          </Pressable>
        </View>
      </ScrollView>
      <Modal visible={editModal} animationType="slide" transparent onRequestClose={() => setEditModal(false)}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: spacing.md }}>Edit Profile</Text>
            <TextInput style={modalStyles.input} placeholder="Full Name" value={edit.name} onChangeText={v => setEdit((e: any) => ({ ...e, name: v }))} />
            <TextInput style={modalStyles.input} placeholder="Phone" value={edit.phone} onChangeText={v => setEdit((e: any) => ({ ...e, phone: v }))} />
            <TextInput style={modalStyles.input} placeholder="Blood Type" value={edit.blood_type} onChangeText={v => setEdit((e: any) => ({ ...e, blood_type: v }))} />
            <TextInput style={modalStyles.input} placeholder="Allergies (comma separated)" value={edit.allergies} onChangeText={v => setEdit((e: any) => ({ ...e, allergies: v }))} />
            <TextInput style={modalStyles.input} placeholder="Medical Conditions (comma separated)" value={edit.medical_conditions} onChangeText={v => setEdit((e: any) => ({ ...e, medical_conditions: v }))} />
            <TextInput style={modalStyles.input} placeholder="Medications (comma separated)" value={edit.medications} onChangeText={v => setEdit((e: any) => ({ ...e, medications: v }))} />
            <View style={{ flexDirection: 'row', marginTop: spacing.md }}>
              <Pressable style={[modalStyles.btn, { backgroundColor: colors.primary, flex: 1 }]} onPress={saveEdit} disabled={saving}>
                <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>{saving ? 'Saving...' : 'Save'}</Text>
              </Pressable>
              <Pressable style={[modalStyles.btn, { backgroundColor: colors.card, flex: 1, marginLeft: 8 }]} onPress={() => setEditModal(false)} disabled={saving}>
                <Text style={{ color: colors.primary, fontWeight: 'bold', textAlign: 'center' }}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  headerCard: { alignItems: 'center' },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: spacing.sm },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xl },
  btn: {
    flex: 1,
    backgroundColor: colors.card,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginHorizontal: 4,
    ...shadow.card,
  },
  btnTxt: { fontWeight: '600', color: colors.primary },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: colors.bg,
    padding: spacing.xl,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    ...shadow.card,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.card,
    fontSize: 16,
  },
  btn: {
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
