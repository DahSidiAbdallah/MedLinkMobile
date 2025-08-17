  // Remove handlers for chips
  const handleRemoveAllergy = (i: number) => setEdit((e: any) => ({ ...e, allergies: e.allergies.filter((_: string, idx: number) => idx !== i) }));
  const handleRemoveCondition = (i: number) => setEdit((e: any) => ({ ...e, medical_conditions: e.medical_conditions.filter((_: string, idx: number) => idx !== i) }));
  const handleRemoveMedication = (i: number) => setEdit((e: any) => ({ ...e, medications: e.medications.filter((_: string, idx: number) => idx !== i) }));
import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Image, StyleSheet, Pressable, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { fetchUserProfile, createOrUpdateUserProfile, Profile } from '../core/userProfile';
import { colors, spacing, type, radius, shadow } from '../theme';
import Card from '../components/Card';
import { ListRow } from '../components/ListRow';

export default function UserProfile({ navigation }: any) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState<any>({});
  const [editErrors, setEditErrors] = useState<any>({});
  // For chip/tag input fields
  const [allergyInput, setAllergyInput] = useState('');
  const [conditionInput, setConditionInput] = useState('');
  const [medicationInput, setMedicationInput] = useState('');
  const [medicalModal, setMedicalModal] = useState(false);
  const [insuranceModal, setInsuranceModal] = useState(false);
  const [emergencyModal, setEmergencyModal] = useState(false);

  useEffect(() => {
    fetchUserProfile().then(setProfile).catch(() => {});
  }, []);

  const openEdit = () => {
    if (!profile) return;
    setEdit({
      name: profile.name,
      phone: profile.phone,
      blood_type: profile.blood_type || '',
      allergies: [...(profile.allergies || [])],
      medical_conditions: [...(profile.medical_conditions || [])],
      medications: [...(profile.medications || [])],
    });
    setEditErrors({});
    setAllergyInput('');
    setConditionInput('');
    setMedicationInput('');
    setEditModal(true);
  };

  const saveEdit = async () => {
    if (!profile) return;
    // Validation
    const errors: any = {};
    if (!edit.name || edit.name.trim().length < 2) errors.name = 'Name is required.';
    if (!edit.phone || edit.phone.trim().length < 6) errors.phone = 'Phone is required.';
    if (!edit.blood_type) errors.blood_type = 'Blood type is required.';
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    try {
      const updated = {
        ...profile,
        name: edit.name,
        phone: edit.phone,
        blood_type: edit.blood_type,
        allergies: edit.allergies,
        medical_conditions: edit.medical_conditions,
        medications: edit.medications,
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

  const handleLogout = (navigationOverride?: any) => {
  Alert.alert('Confirm Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        try {
          await signOut(auth);
          Alert.alert('Logged out', 'You have been logged out.');
          const nav = navigationOverride || navigation;
            nav?.navigate?.('Login');
        } catch (e: any) {
          Alert.alert('Logout Error', e.message || 'Failed to log out.');
        }
      }},
        { text: 'Logout', style: 'destructive', onPress: () => {
          (async () => {
            try {
              await signOut(auth);
              Alert.alert('Logged out', 'You have been logged out.');
              const nav = navigationOverride || navigation;
              nav?.navigate?.('Login');
            } catch (e: any) {
              Alert.alert('Logout Error', e.message || 'Failed to log out.');
            }
          })();
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
          <ListRow title="Medical ID" right={<Ionicons name="chevron-forward" size={20} color={colors.muted} />} subtitle={profile.blood_type ? `Blood Type: ${profile.blood_type}` : undefined} onPress={() => setMedicalModal(true)} />
        </Card>
        <Card>
          <ListRow title="Insurance" right={<Ionicons name="chevron-forward" size={20} color={colors.muted} />} subtitle={profile.insurance_info?.provider ? `Provider: ${profile.insurance_info.provider}` : undefined} onPress={() => setInsuranceModal(true)} />
        </Card>
        <Card>
          <ListRow title="Emergency Contacts" right={<Ionicons name="chevron-forward" size={20} color={colors.muted} />} subtitle={profile.emergency_contacts && profile.emergency_contacts.length > 0 ? profile.emergency_contacts[0].name : undefined} onPress={() => setEmergencyModal(true)} />
        </Card>
        <View style={styles.buttonRow}>
          <Pressable style={styles.btn} android_ripple={{ color: colors.line }} onPress={openEdit}><Text style={styles.btnTxt}>Edit Profile</Text></Pressable>
          <Pressable style={styles.btn} android_ripple={{ color: colors.line }}><Text style={styles.btnTxt}>Privacy</Text></Pressable>
          <Pressable style={[styles.btn, { backgroundColor: colors.danger }]} android_ripple={{ color: colors.primary600 }} onPress={() => handleLogout()}> 
      {/* Medical ID Modal */}
      <Modal visible={medicalModal} animationType="slide" transparent onRequestClose={() => setMedicalModal(false)}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: spacing.md }}>Medical ID</Text>
            <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 6 }}>Blood Type: <Text style={{ color: colors.muted }}>{profile.blood_type || 'N/A'}</Text></Text>
            <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 6 }}>Allergies:</Text>
            {profile.allergies && profile.allergies.length > 0 ? profile.allergies.map((a, i) => (
              <Text key={a} style={{ color: colors.muted, marginLeft: 8 }}>• {a}</Text>
            )) : <Text style={{ color: colors.muted, marginLeft: 8 }}>None</Text>}
            <Text style={{ color: colors.text, fontWeight: '600', marginTop: 10, marginBottom: 6 }}>Medical Conditions:</Text>
            {profile.medical_conditions && profile.medical_conditions.length > 0 ? profile.medical_conditions.map((c, i) => (
              <Text key={c} style={{ color: colors.muted, marginLeft: 8 }}>• {c}</Text>
            )) : <Text style={{ color: colors.muted, marginLeft: 8 }}>None</Text>}
            <Text style={{ color: colors.text, fontWeight: '600', marginTop: 10, marginBottom: 6 }}>Medications:</Text>
            {profile.medications && profile.medications.length > 0 ? profile.medications.map((m, i) => (
              <Text key={m} style={{ color: colors.muted, marginLeft: 8 }}>• {m}</Text>
            )) : <Text style={{ color: colors.muted, marginLeft: 8 }}>None</Text>}
            <Pressable style={[modalStyles.btn, { backgroundColor: colors.primary, marginTop: spacing.lg }]} onPress={() => setMedicalModal(false)}>
              <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      {/* Insurance Modal */}
      <Modal visible={insuranceModal} animationType="slide" transparent onRequestClose={() => setInsuranceModal(false)}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: spacing.md }}>Insurance</Text>
            {profile.insurance_info ? (
              <>
                <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 6 }}>Provider: <Text style={{ color: colors.muted }}>{profile.insurance_info.provider || 'N/A'}</Text></Text>
                <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 6 }}>Policy #: <Text style={{ color: colors.muted }}>{profile.insurance_info.policyNumber || 'N/A'}</Text></Text>
                <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 6 }}>Group #: <Text style={{ color: colors.muted }}>{profile.insurance_info.groupNumber || 'N/A'}</Text></Text>
                <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 6 }}>Expiry: <Text style={{ color: colors.muted }}>{profile.insurance_info.expiryDate || 'N/A'}</Text></Text>
              </>
            ) : <Text style={{ color: colors.muted }}>No insurance info.</Text>}
            <Pressable style={[modalStyles.btn, { backgroundColor: colors.primary, marginTop: spacing.lg }]} onPress={() => setInsuranceModal(false)}>
              <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      {/* Emergency Contacts Modal */}
      <Modal visible={emergencyModal} animationType="slide" transparent onRequestClose={() => setEmergencyModal(false)}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: spacing.md }}>Emergency Contacts</Text>
            {profile.emergency_contacts && profile.emergency_contacts.length > 0 ? profile.emergency_contacts.map((c, i) => (
              <View key={c.id || i} style={{ marginBottom: 10 }}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{c.name}</Text>
                <Text style={{ color: colors.muted }}>{c.relationship}</Text>
                <Text style={{ color: colors.muted }}>{c.phone}</Text>
                {c.isICE && <Text style={{ color: colors.primary, fontWeight: '600' }}>ICE</Text>}
              </View>
            )) : <Text style={{ color: colors.muted }}>No emergency contacts.</Text>}
            <Pressable style={[modalStyles.btn, { backgroundColor: colors.primary, marginTop: spacing.lg }]} onPress={() => setEmergencyModal(false)}>
              <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
            <Text style={[styles.btnTxt, { color: '#fff' }]}>Logout</Text>
          </Pressable>
        </View>
      </ScrollView>
      <Modal visible={editModal} animationType="slide" transparent onRequestClose={() => setEditModal(false)}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <Text style={{ fontWeight: 'bold', fontSize: 20, marginBottom: spacing.md }}>Edit Profile</Text>
            {/* Name */}
            <Text style={modalStyles.label}>Full Name</Text>
            <TextInput style={[modalStyles.input, editErrors.name && modalStyles.inputError]} placeholder="Full Name" value={edit.name} onChangeText={v => setEdit((e: any) => ({ ...e, name: v }))} />
            {editErrors.name && <Text style={modalStyles.error}>{editErrors.name}</Text>}
            {/* Phone */}
            <Text style={modalStyles.label}>Phone</Text>
            <TextInput style={[modalStyles.input, editErrors.phone && modalStyles.inputError]} placeholder="Phone" value={edit.phone} onChangeText={v => setEdit((e: any) => ({ ...e, phone: v }))} keyboardType="phone-pad" />
            {editErrors.phone && <Text style={modalStyles.error}>{editErrors.phone}</Text>}
            {/* Blood Type */}
            <Text style={modalStyles.label}>Blood Type</Text>
            <TextInput style={[modalStyles.input, editErrors.blood_type && modalStyles.inputError]} placeholder="Blood Type" value={edit.blood_type} onChangeText={v => setEdit((e: any) => ({ ...e, blood_type: v }))} />
            {editErrors.blood_type && <Text style={modalStyles.error}>{editErrors.blood_type}</Text>}
            {/* Allergies */}
            <Text style={modalStyles.label}>Allergies</Text>
            <View style={modalStyles.chipInputRow}>
              <TextInput
                style={modalStyles.chipInput}
                placeholder="Add allergy"
                value={allergyInput}
                onChangeText={setAllergyInput}
                onSubmitEditing={() => {
                  if (allergyInput.trim()) {
                    setEdit((e: any) => ({ ...e, allergies: [...(e.allergies || []), allergyInput.trim()] }));
                    setAllergyInput('');
                  }
                }}
                returnKeyType="done"
              />
              <Pressable
                style={modalStyles.chipAddBtn}
                onPress={() => {
                  if (allergyInput.trim()) {
                    setEdit((e: any) => ({ ...e, allergies: [...(e.allergies || []), allergyInput.trim()] }));
                    setAllergyInput('');
                  }
                }}>
                <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 18 }}>+</Text>
              </Pressable>
            </View>
            <View style={modalStyles.chipList}>
              {(edit.allergies ?? []).map((a: string, i: number) => (
                <View key={a + i} style={modalStyles.chip}>
                  <Text style={modalStyles.chipText}>{a}</Text>
                  <Pressable onPress={() => handleRemoveAllergy(i)}>
                    <Text style={modalStyles.chipRemove}>×</Text>
                  </Pressable>
                </View>
              ))}
                {(edit.allergies ?? []).map((a: string, i: number) => {
                  const handleRemove = () => setEdit((e: any) => ({ ...e, allergies: e.allergies.filter((_: string, idx: number) => idx !== i) }));
                  return (
                    <View key={a + i} style={modalStyles.chip}>
                      <Text style={modalStyles.chipText}>{a}</Text>
                      <Pressable onPress={handleRemove}>
                        <Text style={modalStyles.chipRemove}>×</Text>
                      </Pressable>
                    </View>
                  );
                })}
            </View>
            {/* Medical Conditions */}
            <Text style={modalStyles.label}>Medical Conditions</Text>
            <View style={modalStyles.chipInputRow}>
              <TextInput
                style={modalStyles.chipInput}
                placeholder="Add condition"
                value={conditionInput}
                onChangeText={setConditionInput}
                onSubmitEditing={() => {
                  if (conditionInput.trim()) {
                    setEdit((e: any) => ({ ...e, medical_conditions: [...(e.medical_conditions || []), conditionInput.trim()] }));
                    setConditionInput('');
                  }
                }}
                returnKeyType="done"
              />
              <Pressable
                style={modalStyles.chipAddBtn}
                onPress={() => {
                  if (conditionInput.trim()) {
                    setEdit((e: any) => ({ ...e, medical_conditions: [...(e.medical_conditions || []), conditionInput.trim()] }));
                    setConditionInput('');
                  }
                }}>
                <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 18 }}>+</Text>
              </Pressable>
            </View>
            <View style={modalStyles.chipList}>
              {(edit.medical_conditions ?? []).map((a: string, i: number) => (
                <View key={a + i} style={modalStyles.chip}>
                  <Text style={modalStyles.chipText}>{a}</Text>
                  <Pressable onPress={() => handleRemoveCondition(i)}>
                    <Text style={modalStyles.chipRemove}>×</Text>
                  </Pressable>
                </View>
              ))}
                {(edit.medical_conditions ?? []).map((a: string, i: number) => {
                  const handleRemove = () => setEdit((e: any) => ({ ...e, medical_conditions: e.medical_conditions.filter((_: string, idx: number) => idx !== i) }));
                  return (
                    <View key={a + i} style={modalStyles.chip}>
                      <Text style={modalStyles.chipText}>{a}</Text>
                      <Pressable onPress={handleRemove}>
                        <Text style={modalStyles.chipRemove}>×</Text>
                      </Pressable>
                    </View>
                  );
                })}
            </View>
            {/* Medications */}
            <Text style={modalStyles.label}>Medications</Text>
            <View style={modalStyles.chipInputRow}>
              <TextInput
                style={modalStyles.chipInput}
                placeholder="Add medication"
                value={medicationInput}
                onChangeText={setMedicationInput}
                onSubmitEditing={() => {
                  if (medicationInput.trim()) {
                    setEdit((e: any) => ({ ...e, medications: [...(e.medications || []), medicationInput.trim()] }));
                    setMedicationInput('');
                  }
                }}
                returnKeyType="done"
              />
              <Pressable
                style={modalStyles.chipAddBtn}
                onPress={() => {
                  if (medicationInput.trim()) {
                    setEdit((e: any) => ({ ...e, medications: [...(e.medications || []), medicationInput.trim()] }));
                    setMedicationInput('');
                  }
                }}>
                <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 18 }}>+</Text>
              </Pressable>
            </View>
            <View style={modalStyles.chipList}>
              {(edit.medications ?? []).map((a: string, i: number) => (
                <View key={a + i} style={modalStyles.chip}>
                  <Text style={modalStyles.chipText}>{a}</Text>
                  <Pressable onPress={() => handleRemoveMedication(i)}>
                    <Text style={modalStyles.chipRemove}>×</Text>
                  </Pressable>
                </View>
              ))}
                {(edit.medications ?? []).map((a: string, i: number) => {
                  const handleRemove = () => setEdit((e: any) => ({ ...e, medications: e.medications.filter((_: string, idx: number) => idx !== i) }));
                  return (
                    <View key={a + i} style={modalStyles.chip}>
                      <Text style={modalStyles.chipText}>{a}</Text>
                      <Pressable onPress={handleRemove}>
                        <Text style={modalStyles.chipRemove}>×</Text>
                      </Pressable>
                    </View>
                  );
                })}
            </View>
            {/* Save/Cancel Buttons */}
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
  label: {
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
    marginBottom: 2,
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
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: 4,
  },
  chipInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  chipInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: spacing.md,
    backgroundColor: colors.card,
    fontSize: 16,
  },
  chipAddBtn: {
    marginLeft: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  chipText: {
    color: colors.text,
    fontSize: 15,
    marginRight: 4,
  },
  chipRemove: {
    color: colors.danger,
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 2,
  },
  btn: {
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
