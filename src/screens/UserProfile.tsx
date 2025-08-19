import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Image, StyleSheet, Pressable, Modal, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Image as RNImage } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { fetchUserProfile, createOrUpdateUserProfile, Profile } from '../core/userProfile';
import { colors, spacing, type, radius, shadow } from '../theme';
import Card from '../components/Card';
import MyMedicationsList from '../components/MyMedicationsList';
import { ListRow } from '../components/ListRow';

const styles = StyleSheet.create({
  headerCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    // ...shadow.lg, // Removed invalid property
    marginBottom: spacing.lg,
  },
  btn: {
    flex: 1,
    backgroundColor: colors.primary,
    marginHorizontal: 4,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTxt: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.line,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '90%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
    color: '#222',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  error: {
    color: '#EF4444',
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
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
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
    color: '#222',
    fontSize: 15,
    marginRight: 4,
  },
  chipRemove: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 2,
  },
  btn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

type UserProfileProps = {
  navigation: any;
  onLogout?: () => void;
};


import pkg from '../../package.json';

export default function UserProfile({ navigation, onLogout }: UserProfileProps) {
  const { t, i18n } = useTranslation();
  const [langModal, setLangModal] = useState(false);
  const [langRefresh, setLangRefresh] = useState(0);
  const languages = [
    { code: 'en', label: t('languages.english', 'English'), flag: require('../assets/gb.svg') },
    { code: 'fr', label: t('languages.french', 'French'), flag: require('../assets/fr.svg') },
    { code: 'ar', label: t('languages.arabic', 'Arabic'), flag: require('../assets/mr.svg') },
  ];
  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState<any>({});
  const [editErrors, setEditErrors] = useState<any>({});
  // Emergency contacts errors (array of objects)
  const [emgContactErrors, setEmgContactErrors] = useState<any[]>([]);
  // For chip/tag input fields
  const [allergyInput, setAllergyInput] = useState('');
  const [conditionInput, setConditionInput] = useState('');
  const [medicationInput, setMedicationInput] = useState('');
  const [medicalModal, setMedicalModal] = useState(false);
  const [medicationsModal, setMedicationsModal] = useState(false);
  const [insuranceModal, setInsuranceModal] = useState(false);
  const [emergencyModal, setEmergencyModal] = useState(false);

  // Remove handlers for chips
  const handleRemoveAllergy = (i: number) => setEdit((e: any) => ({ ...e, allergies: e.allergies.filter((_: string, idx: number) => idx !== i) }));
  const handleRemoveCondition = (i: number) => setEdit((e: any) => ({ ...e, medical_conditions: e.medical_conditions.filter((_: string, idx: number) => idx !== i) }));
  const handleRemoveMedication = (i: number) => setEdit((e: any) => ({ ...e, medications: e.medications.filter((_: string, idx: number) => idx !== i) }));

  const openEdit = () => {
    if (!profile) return;
    setEdit({
      name: profile.name,
      phone: profile.phone,
      blood_type: profile.blood_type || '',
      allergies: [...(profile.allergies || [])],
      medical_conditions: [...(profile.medical_conditions || [])],
      medications: [...(profile.medications || [])],
      insurance_info: {
        provider: profile.insurance_info?.provider || '',
        policy_number: profile.insurance_info?.policy_number || '',
      },
    });
    setEditModal(true);
  };

  const handleLogout = () => {
    Alert.alert(
      t('profile.confirmLogoutTitle', 'Confirm Logout'),
      t('profile.confirmLogoutMessage', 'Are you sure you want to log out?'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('auth.signOut', 'Logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              if (onLogout) onLogout();
            } catch (error: any) {
              Alert.alert(t('common.error', 'Error'), error.message || t('errors.logoutError', 'Failed to log out.'));
            }
          },
        },
      ]
    );
  };

  // Validation for edit profile modal
  const validateEdit = () => {
    let errors: any = {};
    let emgErrors: any[] = [];
    if (!edit.name || !edit.name.trim()) {
      errors.name = t('errors.fullNameRequired', 'Full name is required.');
    }
    if (edit.phone && !/^[234]\d{7}$/.test(edit.phone)) {
      errors.phone = t('errors.phoneInvalid', 'Mauritania numbers must be 8 digits, start with 2, 3, or 4.');
    }
    if (edit.blood_type && !/^([A|B|AB|O][+-])?$/.test(edit.blood_type.trim())) {
      errors.blood_type = t('errors.bloodTypeInvalid', 'Blood type must be A+, A-, B+, B-, AB+, AB-, O+, or O-.');
    }
    if (edit.insurance_info) {
      if (edit.insurance_info.provider && edit.insurance_info.provider.trim().length < 2) {
        errors.insurance_provider = t('errors.providerShort', 'Provider name is too short.');
      }
      if (edit.insurance_info.policy_number && edit.insurance_info.policy_number.trim().length < 4) {
        errors.insurance_policy = t('errors.policyShort', 'Policy number is too short.');
      }
    }
    if (Array.isArray(edit.emergency_contacts)) {
      emgErrors = edit.emergency_contacts.map((c: any) => {
        let ce: any = {};
        if (!c.name || !c.name.trim()) ce.name = t('validation.required', 'Required');
        if (!c.relationship || !c.relationship.trim()) ce.relationship = t('validation.required', 'Required');
        if (!c.phone || !/^[234]\d{7}$/.test(c.phone)) ce.phone = t('errors.phoneInvalid', 'Mauritania phone: 8 digits, starts with 2, 3, or 4.');
        return ce;
      });
    }
    setEditErrors(errors);
    setEmgContactErrors(emgErrors);
    // Only valid if no errors in main or any emergency contact
    const emgValid = emgErrors.every(e => Object.keys(e).length === 0);
    return Object.keys(errors).length === 0 && emgValid;
  };

  // Save handler for edit profile modal
  const saveEdit = async () => {
    if (!validateEdit()) return;
    setSaving(true);
    try {
      // Ensure id is present for saving
      const userId = profile?.id || (auth.currentUser && auth.currentUser.uid);
      if (!userId) throw new Error(t('errors.userIdMissing', 'User ID missing.'));
      await createOrUpdateUserProfile({ ...edit, id: userId });
      setEditModal(false);
      // Optionally reload profile
      const userProfile = await fetchUserProfile();
      setProfile(userProfile);
    } catch (e: any) {
      Alert.alert(t('common.error', 'Error'), e.message || t('errors.saveError', 'Failed to save profile.'));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        const userProfile = await fetchUserProfile();
        setProfile(userProfile);
      } finally {
        setLoadingProfile(false);
      }
    }
    loadProfile();
  }, []);

  if (loadingProfile) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <Text style={{ color: colors.muted }}>{t('profile.noProfileData', 'No profile data available')}</Text>
      </View>
    );
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
      {/* Language Modal */}
      <Modal visible={langModal} animationType="slide" transparent onRequestClose={() => setLangModal(false)}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: spacing.md }}>{t('common.languageSettings', 'Language Settings')}</Text>
            {languages.map(lang => (
              <Pressable
                key={lang.code}
                onPress={async () => {
                  await i18n.changeLanguage(lang.code);
                  setLangModal(false);
                  setLangRefresh(r => r + 1); // force re-render
                }}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, backgroundColor: i18n.language === lang.code ? '#F3F4F6' : 'transparent', marginBottom: 4 }}
              >
                <RNImage source={lang.flag} style={{ width: 28, height: 20, borderRadius: 4, marginRight: 10 }} resizeMode="contain" />
                <Text style={{ color: i18n.language === lang.code ? colors.primary : '#222', fontWeight: i18n.language === lang.code ? 'bold' : 'normal', fontSize: 16 }}>{lang.label}</Text>
              </Pressable>
            ))}
            <Pressable style={[modalStyles.btn, { backgroundColor: colors.primary, marginTop: spacing.lg }]} onPress={() => setLangModal(false)}>
              <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>{t('common.close', 'Close')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
  <ScrollView key={langRefresh} style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, paddingBottom: Platform.OS === 'ios' ? 32 : 16 }}>
        <Card style={styles.headerCard}>
          <Image source={require('../assets/avatar-placeholder.png')} style={styles.avatar} />
          <Text style={[type.h2, { marginTop: spacing.sm }]}>{profile.name}</Text>
          <Text style={{ color: colors.muted }}>{profile.email}</Text>
          <Text style={{ color: colors.muted }}>{profile.phone}</Text>
        </Card>
        <Card>
          <ListRow
            title={t('profile.medicalId', 'Medical ID')}
            right={<Ionicons name="chevron-forward" size={20} color={colors.muted} />}
            subtitle={profile.blood_type ? `${t('auth.bloodType', 'Blood Type')}: ${profile.blood_type}` : undefined}
            onPress={() => setMedicalModal(true)}
          />
        </Card>
        <Card>
          <ListRow
            title={t('profile.insurance', 'Insurance')}
            right={<Ionicons name="chevron-forward" size={20} color={colors.muted} />}
            subtitle={profile.insurance_info?.provider ? t('profile.providerWithValue', { provider: profile.insurance_info.provider }) : undefined}
            onPress={() => setInsuranceModal(true)}
          />
        </Card>
        <Card>
          <ListRow
            title={t('profile.emergencyContacts', 'Emergency Contacts')}
            right={<Ionicons name="chevron-forward" size={20} color={colors.muted} />}
            subtitle={profile.emergency_contacts && profile.emergency_contacts.length > 0 ? profile.emergency_contacts[0].name : undefined}
            onPress={() => setEmergencyModal(true)}
          />
        </Card>
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginTop: spacing.lg, marginBottom: spacing.lg }}>
          <Pressable style={({ pressed }) => [{
            flex: 1,
            minWidth: 120,
            marginHorizontal: 4,
            backgroundColor: colors.primary,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOpacity: pressed ? 0.18 : 0.08,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3,
            marginBottom: 8,
          }]} onPress={openEdit} android_ripple={{ color: colors.line }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{t('common.editProfile', 'Edit Profile')}</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [{
            flex: 1,
            minWidth: 120,
            marginHorizontal: 4,
            backgroundColor: colors.primary,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOpacity: pressed ? 0.18 : 0.08,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3,
            marginBottom: 8,
          }]} onPress={() => setMedicationsModal(true)} android_ripple={{ color: colors.line }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>My Medications</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [{
            flex: 1,
            minWidth: 120,
            marginHorizontal: 4,
            backgroundColor: colors.primary,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOpacity: pressed ? 0.18 : 0.08,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3,
            marginBottom: 8,
          }]} android_ripple={{ color: colors.line }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{t('common.privacy', 'Privacy')}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [{
              flex: 1,
              minWidth: 120,
              marginHorizontal: 4,
              backgroundColor: colors.danger,
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOpacity: pressed ? 0.18 : 0.08,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 3,
              marginBottom: 8,
            }]}
            android_ripple={{ color: colors.primary600 }}
            onPress={handleLogout}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{t('auth.signOut', 'Logout')}</Text>
          </Pressable>
        </View>
      {/* My Medications Bottom Sheet Modal */}
      <Modal visible={medicationsModal} animationType="slide" transparent onRequestClose={() => setMedicationsModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.08)', justifyContent: 'flex-end' }}>
          <View style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 32, paddingHorizontal: 20, minHeight: '50%', maxHeight: '90%', backgroundColor: '#fff', overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 22, color: colors.text }}>My Medications</Text>
              <Pressable onPress={() => setMedicationsModal(false)} hitSlop={10}>
                <Text style={{ color: colors.muted, fontWeight: '600', fontSize: 16 }}>Close</Text>
              </Pressable>
            </View>
            <MyMedicationsList />
          </View>
        </View>
      </Modal>
        {/* Language Switcher as ListRow (below Emergency Contacts) */}
        <Card>
          <ListRow
            title={t('common.language', 'Language')}
            right={<RNImage source={currentLang.flag} style={{ width: 28, height: 20, borderRadius: 4 }} resizeMode="contain" />}
            subtitle={currentLang.label}
            onPress={() => setLangModal(true)}
          />
        </Card>
        {/* Version Number */}
        <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
          <Text style={{ color: colors.muted, fontSize: 13 }}>v{pkg.version}</Text>
        </View>
      </ScrollView>
      {/* Medical ID Modal */}
      <Modal visible={medicalModal} animationType="slide" transparent onRequestClose={() => setMedicalModal(false)}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: spacing.md }}>{t('profile.medicalId', 'Medical ID')}</Text>
            <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 6 }}>
              {t('auth.bloodType', 'Blood Type')}: <Text style={{ color: colors.muted }}>{profile.blood_type || t('common.notSet', 'Not set')}</Text>
            </Text>
            <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 6 }}>{t('auth.allergies', 'Allergies')}:</Text>
            {profile.allergies && profile.allergies.length > 0 ? profile.allergies.map((a, i) => (
              <Text key={a} style={{ color: colors.muted, marginLeft: 8 }}>• {a}</Text>
            )) : <Text style={{ color: colors.muted, marginLeft: 8 }}>{t('common.none', 'None')}</Text>}
            <Text style={{ color: colors.text, fontWeight: '600', marginTop: 10, marginBottom: 6 }}>{t('auth.medicalConditions', 'Medical Conditions')}:</Text>
            {profile.medical_conditions && profile.medical_conditions.length > 0 ? profile.medical_conditions.map((c, i) => (
              <Text key={c} style={{ color: colors.muted, marginLeft: 8 }}>• {c}</Text>
            )) : <Text style={{ color: colors.muted, marginLeft: 8 }}>{t('common.none', 'None')}</Text>}
            <Text style={{ color: colors.text, fontWeight: '600', marginTop: 10, marginBottom: 6 }}>{t('auth.medications', 'Medications')}:</Text>
            {profile.medications && profile.medications.length > 0 ? profile.medications.map((m, i) => (
              <Text key={m} style={{ color: colors.muted, marginLeft: 8 }}>• {m}</Text>
            )) : <Text style={{ color: colors.muted, marginLeft: 8 }}>{t('common.none', 'None')}</Text>}
            <Pressable style={[modalStyles.btn, { backgroundColor: colors.primary, marginTop: spacing.lg }]} onPress={() => setMedicalModal(false)}>
              <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>{t('common.close', 'Close')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      {/* Insurance Modal */}
      <Modal visible={insuranceModal} animationType="slide" transparent onRequestClose={() => setInsuranceModal(false)}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: spacing.md }}>{t('profile.insurance', 'Insurance')}</Text>
            {profile.insurance_info ? (
              <>
                <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 6 }}>
                  {t('profile.provider', 'Provider')}: <Text style={{ color: colors.muted }}>{profile.insurance_info.provider || t('common.notSet', 'Not set')}</Text>
                </Text>
                <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 6 }}>
                  {t('profile.policyNumber', 'Policy #')}: <Text style={{ color: colors.muted }}>{profile.insurance_info.policy_number || t('common.notSet', 'Not set')}</Text>
                </Text>
                {/* Add more insurance fields as needed */}
              </>
            ) : <Text style={{ color: colors.muted }}>{t('profile.noInsuranceInfo', 'No insurance info.')}</Text>}
            <Pressable style={[modalStyles.btn, { backgroundColor: colors.primary, marginTop: spacing.lg }]} onPress={() => setInsuranceModal(false)}>
              <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>{t('common.close', 'Close')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      {/* Emergency Contacts Modal */}
      <Modal visible={emergencyModal} animationType="slide" transparent onRequestClose={() => setEmergencyModal(false)}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: spacing.md }}>{t('profile.emergencyContacts', 'Emergency Contacts')}</Text>
            {profile.emergency_contacts && profile.emergency_contacts.length > 0 ? profile.emergency_contacts.map((c, i) => (
              <View key={c.id || i} style={{ marginBottom: 10 }}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{c.name}</Text>
                <Text style={{ color: colors.muted }}>{c.relationship}</Text>
                <Text style={{ color: colors.muted }}>{c.phone}</Text>
                {c.isICE && <Text style={{ color: colors.primary, fontWeight: '600' }}>{t('profile.ice', 'ICE')}</Text>}
              </View>
            )) : <Text style={{ color: colors.muted }}>{t('profile.noEmergencyContacts', 'No emergency contacts')}</Text>}
            <Pressable style={[modalStyles.btn, { backgroundColor: colors.primary, marginTop: spacing.lg }]} onPress={() => setEmergencyModal(false)}>
              <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>{t('common.close', 'Close')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      {/* Edit Profile Modal */}
      <Modal visible={editModal} animationType="slide" transparent onRequestClose={() => setEditModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, width: '95%', maxWidth: 700, maxHeight: '90%', padding: 0, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, position: 'relative' }}>
            {/* Header with Save/Cancel */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <Pressable onPress={() => setEditModal(false)} style={{ marginRight: 12 }}>
                <Text style={{ color: '#888', fontWeight: 'bold', fontSize: 16 }}>{t('common.cancel', 'Cancel')}</Text>
              </Pressable>
              <Pressable onPress={saveEdit} disabled={saving} style={{ backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 18 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{saving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}</Text>
              </Pressable>
            </View>
            {/* Scrollable Form Content */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, minWidth: 320 }} showsVerticalScrollIndicator={true}>
              <Text style={{ fontWeight: 'bold', fontSize: 20, marginBottom: spacing.md }}>{t('common.editProfile', 'Edit Profile')}</Text>
              {/* Name */}
              <Text style={modalStyles.label}>{t('auth.fullName', 'Full Name')}</Text>
              <TextInput
                style={[modalStyles.input, editErrors.name && modalStyles.inputError]}
                placeholder={t('auth.namePlaceholder', 'Enter your full name')}
                value={edit.name}
                onChangeText={v => {
                  setEdit((e: any) => ({ ...e, name: v }));
                  if (editErrors.name) setEditErrors((errs: any) => ({ ...errs, name: undefined }));
                }}
                onBlur={() => {
                  if (!edit.name || !edit.name.trim()) setEditErrors((errs: any) => ({ ...errs, name: t('errors.fullNameRequired', 'Full name is required.') }));
                  else setEditErrors((errs: any) => ({ ...errs, name: undefined }));
                }}
              />
              {editErrors.name && <Text style={modalStyles.error}>{editErrors.name}</Text>}
              {/* Phone */}
              <Text style={modalStyles.label}>{t('auth.phoneNumber', 'Phone')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ backgroundColor: '#F3F4F6', borderTopLeftRadius: 8, borderBottomLeftRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', borderRightWidth: 0, paddingHorizontal: 10, height: 48, justifyContent: 'center' }}>
                  <Text style={{ color: '#888', fontSize: 16 }}>+222</Text>
                </View>
                <TextInput
                  style={[modalStyles.input, { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, marginBottom: 0 }, editErrors.phone && modalStyles.inputError]}
                  placeholder={t('profile.phoneDigitsPlaceholder', 'Phone (8 digits)')}
                  value={edit.phone}
                  onChangeText={v => {
                    // Only allow numbers, max 8 digits
                    const digits = v.replace(/[^0-9]/g, '').slice(0, 8);
                    setEdit((e: any) => ({ ...e, phone: digits }));
                    if (editErrors.phone) setEditErrors((errs: any) => ({ ...errs, phone: undefined }));
                  }}
                  keyboardType="number-pad"
                  maxLength={8}
                  onBlur={() => {
                    if (edit.phone && !/^[234]\d{7}$/.test(edit.phone)) setEditErrors((errs: any) => ({ ...errs, phone: t('errors.phoneInvalid', 'Mauritania numbers must be 8 digits, start with 2, 3, or 4.') }));
                    else setEditErrors((errs: any) => ({ ...errs, phone: undefined }));
                  }}
                />
              </View>
              {editErrors.phone && <Text style={modalStyles.error}>{editErrors.phone}</Text>}
              {/* Blood Type (Dropdown + Custom) */}
              <Text style={modalStyles.label}>{t('auth.bloodType', 'Blood Type')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                {Platform.OS === 'web' ? (
                  <select
                    style={{ flex: 1, height: 40, borderColor: editErrors.blood_type ? '#EF4444' : '#E5E7EB', borderWidth: 1, borderRadius: 8, paddingLeft: 12, paddingRight: 12, backgroundColor: '#F9FAFB', fontSize: 16 }}
                    value={edit.blood_type || ''}
                    onChange={e => {
                      setEdit((prev: any) => ({ ...prev, blood_type: e.target.value }));
                      if (editErrors.blood_type) setEditErrors((errs: any) => ({ ...errs, blood_type: undefined }));
                    }}
                  >
                    <option value="">{t('common.selectOne', 'Select one')}</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="custom">{t('profile.conditions.other', 'Other (type below)')}</option>
                  </select>
                ) : (
                  <View
                    style={{
                      flex: 1,
                      height: 40,
                      borderColor: editErrors.blood_type ? '#EF4444' : '#E5E7EB',
                      borderWidth: 1,
                      borderRadius: 8,
                      paddingLeft: 4,
                      backgroundColor: '#F9FAFB',
                      justifyContent: 'center',
                    }}
                  >
                    <Picker
                      selectedValue={edit.blood_type || ''}
                      onValueChange={(v) => {
                        setEdit((prev: any) => ({ ...prev, blood_type: v }));
                        if (editErrors.blood_type) setEditErrors((errs: any) => ({ ...errs, blood_type: undefined }));
                      }}
                      style={{ flex: 1 }}
                    >
                      <Picker.Item label={t('common.selectOne', 'Select one')} value="" />
                      <Picker.Item label="A+" value="A+" />
                      <Picker.Item label="A-" value="A-" />
                      <Picker.Item label="B+" value="B+" />
                      <Picker.Item label="B-" value="B-" />
                      <Picker.Item label="AB+" value="AB+" />
                      <Picker.Item label="AB-" value="AB-" />
                      <Picker.Item label="O+" value="O+" />
                      <Picker.Item label="O-" value="O-" />
                      <Picker.Item label={t('profile.conditions.other', 'Other (type below)')} value="custom" />
                    </Picker>
                  </View>
                )}
                {edit.blood_type === 'custom' && (
                  <TextInput
                    style={[modalStyles.input, editErrors.blood_type && modalStyles.inputError, { flex: 1, marginLeft: 8 }]}
                    placeholder={t('profile.enterBloodType', 'Enter blood type')}
                    value={edit.blood_type_custom || ''}
                    onChangeText={v => setEdit((e: any) => ({ ...e, blood_type_custom: v }))}
                  />
                )}
              </View>
              {editErrors.blood_type && <Text style={modalStyles.error}>{editErrors.blood_type}</Text>}
              {/* Allergies (Dropdown + Custom) */}
              <Text style={modalStyles.label}>{t('auth.allergies', 'Allergies')}</Text>
              <View style={modalStyles.chipInputRow}>
                {Platform.OS === 'web' ? (
                  <select
                    style={{ flex: 1, height: 40, borderColor: '#E5E7EB', borderWidth: 1, borderRadius: 8, paddingLeft: 12, paddingRight: 12, backgroundColor: '#F9FAFB', fontSize: 16 }}
                    value={allergyInput}
                    onChange={e => setAllergyInput(e.target.value)}
                  >
                    <option value="">{t('profile.addAllergyPrompt', 'Add allergy...')}</option>
                    <option value="Penicillin">{t('profile.allergyOptions.penicillin', 'Penicillin')}</option>
                    <option value="Sulfa drugs">{t('profile.allergyOptions.sulfaDrugs', 'Sulfa drugs')}</option>
                    <option value="Aspirin">{t('profile.allergyOptions.aspirin', 'Aspirin')}</option>
                    <option value="Peanuts">{t('profile.allergyOptions.peanuts', 'Peanuts')}</option>
                    <option value="Shellfish">{t('profile.allergyOptions.shellfish', 'Shellfish')}</option>
                    <option value="Latex">{t('profile.allergyOptions.latex', 'Latex')}</option>
                    <option value="Eggs">{t('profile.allergyOptions.eggs', 'Eggs')}</option>
                    <option value="Milk">{t('profile.allergyOptions.milk', 'Milk')}</option>
                    <option value="Other">{t('profile.allergyOptions.other', 'Other (type below)')}</option>
                  </select>
                ) : (
                  <View
                    style={{
                      flex: 1,
                      height: 40,
                      borderColor: '#E5E7EB',
                      borderWidth: 1,
                      borderRadius: 8,
                      paddingLeft: 4,
                      backgroundColor: '#F9FAFB',
                      justifyContent: 'center',
                    }}
                  >
                    <Picker
                      selectedValue={allergyInput}
                      onValueChange={v => setAllergyInput(v.toString())}
                      style={{ flex: 1 }}
                    >
                      <Picker.Item label={t('profile.addAllergyPrompt', 'Add allergy...')} value="" />
                      <Picker.Item label={t('profile.allergyOptions.penicillin', 'Penicillin')} value="Penicillin" />
                      <Picker.Item label={t('profile.allergyOptions.sulfaDrugs', 'Sulfa drugs')} value="Sulfa drugs" />
                      <Picker.Item label={t('profile.allergyOptions.aspirin', 'Aspirin')} value="Aspirin" />
                      <Picker.Item label={t('profile.allergyOptions.peanuts', 'Peanuts')} value="Peanuts" />
                      <Picker.Item label={t('profile.allergyOptions.shellfish', 'Shellfish')} value="Shellfish" />
                      <Picker.Item label={t('profile.allergyOptions.latex', 'Latex')} value="Latex" />
                      <Picker.Item label={t('profile.allergyOptions.eggs', 'Eggs')} value="Eggs" />
                      <Picker.Item label={t('profile.allergyOptions.milk', 'Milk')} value="Milk" />
                      <Picker.Item label={t('profile.allergyOptions.other', 'Other (type below)')} value="Other" />
                    </Picker>
                  </View>
                )}
                <Pressable
                  style={modalStyles.chipAddBtn}
                  onPress={() => {
                    if (allergyInput && !edit.allergies.includes(allergyInput)) {
                      setEdit((e: any) => ({ ...e, allergies: [...(e.allergies || []), allergyInput] }));
                      setAllergyInput('');
                    }
                  }}>
                  <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 18 }}>+</Text>
                </Pressable>
                {allergyInput === 'Other' && (
                  <TextInput
                    style={[modalStyles.chipInput, { flex: 1, marginLeft: 8 }]}
                    placeholder={t('profile.enterAllergy', 'Enter allergy')}
                    value={edit.allergy_custom || ''}
                    onChangeText={v => setEdit((e: any) => ({ ...e, allergy_custom: v }))}
                  />
                )}
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
              </View>
              {/* Insurance Info */}
              <Text style={modalStyles.label}>{t('profile.insuranceProvider', 'Insurance Provider')}</Text>
              <TextInput
                style={[modalStyles.input, editErrors.insurance_provider && modalStyles.inputError]}
                placeholder={t('profile.provider', 'Provider')}
                value={edit.insurance_info?.provider}
                onChangeText={v => {
                  setEdit((e: any) => ({ ...e, insurance_info: { ...e.insurance_info, provider: v } }));
                  if (editErrors.insurance_provider) setEditErrors((errs: any) => ({ ...errs, insurance_provider: undefined }));
                }}
                onBlur={() => {
                  if (edit.insurance_info?.provider && edit.insurance_info.provider.trim().length < 2) setEditErrors((errs: any) => ({ ...errs, insurance_provider: t('errors.providerShort', 'Provider name is too short.') }));
                  else setEditErrors((errs: any) => ({ ...errs, insurance_provider: undefined }));
                }}
              />
              {editErrors.insurance_provider && <Text style={modalStyles.error}>{editErrors.insurance_provider}</Text>}
              <Text style={modalStyles.label}>{t('profile.policyNumber', 'Policy #')}</Text>
              <TextInput
                style={[modalStyles.input, editErrors.insurance_policy && modalStyles.inputError]}
                placeholder={t('profile.policyNumber', 'Policy #')}
                value={edit.insurance_info?.policy_number}
                onChangeText={v => {
                  setEdit((e: any) => ({ ...e, insurance_info: { ...e.insurance_info, policy_number: v } }));
                  if (editErrors.insurance_policy) setEditErrors((errs: any) => ({ ...errs, insurance_policy: undefined }));
                }}
                onBlur={() => {
                  if (edit.insurance_info?.policy_number && edit.insurance_info.policy_number.trim().length < 4) setEditErrors((errs: any) => ({ ...errs, insurance_policy: t('errors.policyShort', 'Policy number is too short.') }));
                  else setEditErrors((errs: any) => ({ ...errs, insurance_policy: undefined }));
                }}
              />
              {editErrors.insurance_policy && <Text style={modalStyles.error}>{editErrors.insurance_policy}</Text>}
              {/* Emergency Contacts */}
              <Text style={modalStyles.label}>{t('profile.emergencyContacts', 'Emergency Contacts')}</Text>
              {(edit.emergency_contacts ?? []).map((c: any, i: number) => (
                <View key={i} style={{ marginBottom: 8, backgroundColor: '#F3F4F6', borderRadius: 8, padding: 8 }}>
                  <TextInput
                    style={[modalStyles.input, emgContactErrors[i]?.name && modalStyles.inputError]}
                    placeholder={t('auth.fullName', 'Full Name')}
                    value={c.name}
                    onChangeText={v => {
                      setEdit((e: any) => {
                        const arr = [...e.emergency_contacts];
                        arr[i] = { ...arr[i], name: v };
                        return { ...e, emergency_contacts: arr };
                      });
                      if (emgContactErrors[i]?.name) setEmgContactErrors((errs: any[]) => { const arr = [...errs]; arr[i] = { ...arr[i], name: undefined }; return arr; });
                    }}
                    onBlur={() => {
                      if (!c.name || !c.name.trim()) setEmgContactErrors((errs: any[]) => { const arr = [...errs]; arr[i] = { ...arr[i], name: t('validation.required', 'Required') }; return arr; });
                      else setEmgContactErrors((errs: any[]) => { const arr = [...errs]; arr[i] = { ...arr[i], name: undefined }; return arr; });
                    }}
                  />
                  {emgContactErrors[i]?.name && <Text style={modalStyles.error}>{emgContactErrors[i].name}</Text>}
                  <TextInput
                    style={[modalStyles.input, emgContactErrors[i]?.relationship && modalStyles.inputError]}
                    placeholder={t('profile.relationship', 'Relationship')}
                    value={c.relationship}
                    onChangeText={v => {
                      setEdit((e: any) => {
                        const arr = [...e.emergency_contacts];
                        arr[i] = { ...arr[i], relationship: v };
                        return { ...e, emergency_contacts: arr };
                      });
                      if (emgContactErrors[i]?.relationship) setEmgContactErrors((errs: any[]) => { const arr = [...errs]; arr[i] = { ...arr[i], relationship: undefined }; return arr; });
                    }}
                    onBlur={() => {
                      if (!c.relationship || !c.relationship.trim()) setEmgContactErrors((errs: any[]) => { const arr = [...errs]; arr[i] = { ...arr[i], relationship: t('validation.required', 'Required') }; return arr; });
                      else setEmgContactErrors((errs: any[]) => { const arr = [...errs]; arr[i] = { ...arr[i], relationship: undefined }; return arr; });
                    }}
                  />
                  {emgContactErrors[i]?.relationship && <Text style={modalStyles.error}>{emgContactErrors[i].relationship}</Text>}
                  <TextInput
                    style={[modalStyles.input, emgContactErrors[i]?.phone && modalStyles.inputError]}
                    placeholder={t('auth.phoneNumber', 'Phone')}
                    value={c.phone}
                    onChangeText={v => {
                      // Only allow numbers, max 8 digits
                      const digits = v.replace(/\D/g, '').slice(0, 8);
                      setEdit((e: any) => {
                        const arr = [...e.emergency_contacts];
                        arr[i] = { ...arr[i], phone: digits };
                        return { ...e, emergency_contacts: arr };
                      });
                      if (emgContactErrors[i]?.phone) setEmgContactErrors((errs: any[]) => { const arr = [...errs]; arr[i] = { ...arr[i], phone: undefined }; return arr; });
                    }}
                    keyboardType="number-pad"
                    maxLength={8}
                    onBlur={() => {
                      if (!c.phone || !/^[234]\d{7}$/.test(c.phone)) setEmgContactErrors((errs: any[]) => { const arr = [...errs]; arr[i] = { ...arr[i], phone: t('errors.phoneInvalid', 'Mauritania phone: 8 digits, starts with 2, 3, or 4.') }; return arr; });
                      else setEmgContactErrors((errs: any[]) => { const arr = [...errs]; arr[i] = { ...arr[i], phone: undefined }; return arr; });
                    }}
                  />
                  {emgContactErrors[i]?.phone && <Text style={modalStyles.error}>{emgContactErrors[i].phone}</Text>}
                  <Pressable onPress={() => setEdit((e: any) => ({ ...e, emergency_contacts: e.emergency_contacts.filter((_: any, idx: number) => idx !== i) }))} style={{ marginTop: 4 }}>
                    <Text style={{ color: colors.danger, fontWeight: 'bold' }}>{t('common.remove', 'Remove')}</Text>
                  </Pressable>
                </View>
              ))}
              <Pressable
                style={[modalStyles.btn, { backgroundColor: colors.primary, marginBottom: 8 }]}
                onPress={() => setEdit((e: any) => ({ ...e, emergency_contacts: [...(e.emergency_contacts || []), { name: '', relationship: '', phone: '' }] }))}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>{t('profile.addEmergencyContact', 'Add Emergency Contact')}</Text>
              </Pressable>
              {/* Medical Conditions (Dropdown + Custom) */}
              <Text style={modalStyles.label}>{t('auth.medicalConditions', 'Medical Conditions')}</Text>
              <View style={modalStyles.chipInputRow}>
                {Platform.OS === 'web' ? (
                  <select
                    style={{ flex: 1, height: 40, borderColor: '#E5E7EB', borderWidth: 1, borderRadius: 8, paddingLeft: 12, paddingRight: 12, backgroundColor: '#F9FAFB', fontSize: 16 }}
                    value={conditionInput}
                    onChange={e => setConditionInput(e.target.value)}
                  >
                    <option value="">{t('profile.addConditionPrompt', 'Add condition...')}</option>
                    <option value="Diabetes">{t('profile.conditionOptions.diabetes', 'Diabetes')}</option>
                    <option value="Hypertension">{t('profile.conditionOptions.hypertension', 'Hypertension')}</option>
                    <option value="Asthma">{t('profile.conditionOptions.asthma', 'Asthma')}</option>
                    <option value="Heart Disease">{t('profile.conditionOptions.heartDisease', 'Heart Disease')}</option>
                    <option value="Kidney Disease">{t('profile.conditionOptions.kidneyDisease', 'Kidney Disease')}</option>
                    <option value="Liver Disease">{t('profile.conditionOptions.liverDisease', 'Liver Disease')}</option>
                    <option value="Epilepsy">{t('profile.conditionOptions.epilepsy', 'Epilepsy')}</option>
                    <option value="Other">{t('profile.conditionOptions.other', 'Other (type below)')}</option>
                  </select>
                ) : (
                  <View
                    style={{
                      flex: 1,
                      height: 40,
                      borderColor: '#E5E7EB',
                      borderWidth: 1,
                      borderRadius: 8,
                      paddingLeft: 4,
                      backgroundColor: '#F9FAFB',
                      justifyContent: 'center',
                    }}
                  >
                    <Picker
                      selectedValue={conditionInput}
                      onValueChange={v => setConditionInput(v.toString())}
                      style={{ flex: 1 }}
                    >
                      <Picker.Item label={t('profile.addConditionPrompt', 'Add condition...')} value="" />
                      <Picker.Item label={t('profile.conditionOptions.diabetes', 'Diabetes')} value="Diabetes" />
                      <Picker.Item label={t('profile.conditionOptions.hypertension', 'Hypertension')} value="Hypertension" />
                      <Picker.Item label={t('profile.conditionOptions.asthma', 'Asthma')} value="Asthma" />
                      <Picker.Item label={t('profile.conditionOptions.heartDisease', 'Heart Disease')} value="Heart Disease" />
                      <Picker.Item label={t('profile.conditionOptions.kidneyDisease', 'Kidney Disease')} value="Kidney Disease" />
                      <Picker.Item label={t('profile.conditionOptions.liverDisease', 'Liver Disease')} value="Liver Disease" />
                      <Picker.Item label={t('profile.conditionOptions.epilepsy', 'Epilepsy')} value="Epilepsy" />
                      <Picker.Item label={t('profile.conditionOptions.other', 'Other (type below)')} value="Other" />
                    </Picker>
                  </View>
                )}
                <Pressable
                  style={modalStyles.chipAddBtn}
                  onPress={() => {
                    if (conditionInput && !edit.medical_conditions.includes(conditionInput)) {
                      setEdit((e: any) => ({ ...e, medical_conditions: [...(e.medical_conditions || []), conditionInput] }));
                      setConditionInput('');
                    }
                  }}>
                  <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 18 }}>+</Text>
                </Pressable>
                {conditionInput === 'Other' && (
                  <TextInput
                    style={[modalStyles.chipInput, { flex: 1, marginLeft: 8 }]}
                    placeholder={t('profile.enterCondition', 'Enter condition')}
                    value={edit.condition_custom || ''}
                    onChangeText={v => setEdit((e: any) => ({ ...e, condition_custom: v }))}
                  />
                )}
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
              </View>
              {/* Medications */}
              <Text style={modalStyles.label}>{t('auth.medications', 'Medications')}</Text>
              <View style={modalStyles.chipInputRow}>
                <TextInput
                  style={modalStyles.chipInput}
                  placeholder={t('profile.addMedicationPrompt', 'Add medication')}
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
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
  </SafeAreaView>
  );
}
