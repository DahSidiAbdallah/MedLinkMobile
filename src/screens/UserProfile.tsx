import React, { useEffect, useState, useRef } from 'react';
import SkeletonImage from '../components/SkeletonImage';
import { ScrollView, View, Text, StyleSheet, Pressable, Modal, Alert, ActivityIndicator, Platform, useWindowDimensions, Image as RNImage } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { fetchUserProfile, createOrUpdateUserProfile, Profile } from '../core/userProfile';
import { useLoading } from '../hooks/LoadingContext';
import { colors, spacing, type, radius } from '../theme';
import Card from '../components/Card';
// sheet components (extracted for clarity)
import MedicationsSheet from './user-sheets/MedicationsSheet';
import MedicalSheet from './user-sheets/MedicalSheet';
import InsuranceSheet from './user-sheets/InsuranceSheet';
import EmergencySheet from './user-sheets/EmergencySheet';
import EditProfileSheet from './user-sheets/EditProfileSheet';
import { ListRow } from '../components/ListRow';

const styles = StyleSheet.create({
  headerCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  backgroundColor: colors.surface,
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
  color: colors.surface,
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
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  buttonGridItem: {
    flexBasis: '48%',
    minWidth: 140,
    marginBottom: 8,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  signOutButton: {
    backgroundColor: colors.danger,
  },
  buttonPressed: {
    shadowOpacity: 0.18,
    transform: [{ scale: 0.995 }],
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
  flex: 1,
  backgroundColor: colors.overlay,
  },
  content: {
  backgroundColor: colors.surface,
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
  color: colors.text,
  },
  input: {
    borderWidth: 1,
  borderColor: colors.line,
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
    fontSize: 16,
  backgroundColor: colors.surface,
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
  borderRadius: radius.md,
  padding: 12,
  backgroundColor: colors.surface,
    fontSize: 16,
  },
  chipAddBtn: {
  marginLeft: 8,
  backgroundColor: colors.line,
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
  backgroundColor: colors.line,
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

export default function UserProfile({ navigation, onLogout }: Readonly<UserProfileProps>) {
  const { t, i18n } = useTranslation();
  const { startLoading, finishLoading } = useLoading();
  const _prefetched = useRef(new Set<string>());
  const { width } = useWindowDimensions();
  const contentPadding = width > 700 ? 48 : spacing.xl;
  const avatarSize = width > 700 ? 120 : 80;
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
  // Emergency contacts errors (array of objects) - handled locally in validation
  const [medicalModal, setMedicalModal] = useState(false);
  const [medicationsModal, setMedicationsModal] = useState(false);
  const [insuranceModal, setInsuranceModal] = useState(false);
  const [emergencyModal, setEmergencyModal] = useState(false);

  // chip/remove handlers are implemented inside EditProfileSheet

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
          onPress: () => { (async () => {
            try {
              await signOut(auth);
              if (onLogout) onLogout();
            } catch (error: any) {
              Alert.alert(t('common.error', 'Error'), error.message || t('errors.logoutError', 'Failed to log out.'));
            }
          })(); },
        },
      ]
    );
  };

  // Validation and save are handled inside EditProfileSheet

  useEffect(() => {
    let mounted = true;
    const key = 'profile';
    startLoading(key);
    (async () => {
      try {
        const userProfile = await fetchUserProfile();
        if (!mounted) return;
        setProfile(userProfile);
        // If profile contains a remote avatar image, prefetch it
        const uri = (userProfile as any)?.image || (userProfile as any)?.avatar;
          if (uri && !_prefetched.current.has(uri)) {
            const imgKey = 'profile-image';
            startLoading(imgKey);
            try {
              await RNImage.prefetch(uri);
              _prefetched.current.add(uri);
            } catch (e) {
              console.warn('Profile image prefetch failed', e);
            } finally {
              finishLoading(imgKey);
            }
          }
      } finally {
        if (mounted) setLoadingProfile(false);
        finishLoading(key);
      }
    })();
    return () => { mounted = false; };
  }, [startLoading, finishLoading]);

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
              <Text style={{ color: colors.card, fontWeight: 'bold', textAlign: 'center' }}>{t('common.close', 'Close')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
  <ScrollView key={langRefresh} style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: contentPadding, paddingBottom: Platform.OS === 'ios' ? 32 : 16 }}>
        <Card style={styles.headerCard}>
          <SkeletonImage source={require('../assets/avatar-placeholder.png')} style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]} resizeMode="contain" />
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
        <View style={[styles.buttonGrid, { marginTop: spacing.lg, marginBottom: spacing.lg }]}>
          <Pressable onPress={openEdit} style={({ pressed }) => [styles.buttonGridItem, styles.primaryButton, pressed && styles.buttonPressed]} android_ripple={{ color: colors.line }}>
            <Text style={styles.btnTxt}>{t('common.editProfile', 'Edit Profile')}</Text>
          </Pressable>
          <Pressable onPress={() => setMedicationsModal(true)} style={({ pressed }) => [styles.buttonGridItem, styles.primaryButton, pressed && styles.buttonPressed]} android_ripple={{ color: colors.line }}>
            <Text style={styles.btnTxt}>My Medications</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.buttonGridItem, styles.primaryButton, pressed && styles.buttonPressed]} android_ripple={{ color: colors.line }}>
            <Text style={styles.btnTxt}>{t('common.privacy', 'Privacy')}</Text>
          </Pressable>
          <Pressable onPress={handleLogout} style={({ pressed }) => [styles.buttonGridItem, styles.signOutButton, pressed && styles.buttonPressed]} android_ripple={{ color: colors.primary600 }}>
            <Text style={styles.btnTxt}>{t('auth.signOut', 'Logout')}</Text>
          </Pressable>
        </View>
  <MedicationsSheet visible={medicationsModal} onClose={() => setMedicationsModal(false)} />
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
  <MedicalSheet visible={medicalModal} profile={profile} onClose={() => setMedicalModal(false)} />
  <InsuranceSheet visible={insuranceModal} profile={profile} onClose={() => setInsuranceModal(false)} />
  <EmergencySheet visible={emergencyModal} profile={profile} onClose={() => setEmergencyModal(false)} />
      <EditProfileSheet visible={editModal} initial={edit} onSave={async (data) => {
        setSaving(true);
        try {
          const userId = profile?.id || auth.currentUser?.uid;
          if (!userId) throw new Error(t('errors.userIdMissing', 'User ID missing.'));
          await createOrUpdateUserProfile({ ...data, id: userId });
          const userProfile = await fetchUserProfile();
          setProfile(userProfile);
          setEditModal(false);
        } catch (e: any) {
          Alert.alert(t('common.error', 'Error'), e.message || t('errors.saveError', 'Failed to save profile.'));
        } finally {
          setSaving(false);
        }
      }} onClose={() => setEditModal(false)} />
  </SafeAreaView>
  );
}
