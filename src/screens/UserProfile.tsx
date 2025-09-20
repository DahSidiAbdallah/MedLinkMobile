import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  Image as RNImage,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import SkeletonImage from '../components/SkeletonImage';
import ScreenContainer from '../components/ScreenContainer';
import Card from '../components/Card';
import { ListRow } from '../components/ListRow';
import { auth } from '../lib/firebase';
import { fetchUserProfile, createOrUpdateUserProfile, type Profile } from '../core/userProfile';
import { useLoading } from '../hooks/LoadingContext';
import MedicationsSheet from './user-sheets/MedicationsSheet';
import MedicalSheet from './user-sheets/MedicalSheet';
import InsuranceSheet from './user-sheets/InsuranceSheet';
import EmergencySheet from './user-sheets/EmergencySheet';
import EditProfileSheet from './user-sheets/EditProfileSheet';
import { colors, spacing, type, radius, shadow } from '../theme';
import pkg from '../../package.json';

type UserProfileProps = {
  navigation: any;
  onLogout?: () => void;
};

type ActionTone = 'primary' | 'neutral' | 'danger';

type QuickAction = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  tone?: ActionTone;
};

const heroAvatar = require('../assets/avatar-placeholder.png');

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hero: {
    borderBottomLeftRadius: radius.xl + 6,
    borderBottomRightRadius: radius.xl + 6,
    paddingTop: spacing.xxl * 1.4,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  heroName: {
    ...type.h1,
    color: '#fff',
  },
  heroMeta: {
    color: 'rgba(255,255,255,0.78)',
    marginTop: 2,
  },
  heroStats: {
    flexDirection: 'row',
    gap: spacing.lg,
    flexWrap: 'wrap',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  statText: {
    color: '#fff',
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.16)',
    minWidth: 150,
  },
  quickButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  quickButtonDanger: {
    backgroundColor: 'rgba(239,68,68,0.18)',
  },
  content: {
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  sectionCard: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...type.h2,
  },
  sectionHint: {
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  listSpacer: {
    height: 1,
    backgroundColor: 'rgba(15,23,42,0.08)',
    marginVertical: spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  actionLabel: {
    color: colors.text,
    fontWeight: '600',
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  version: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.4)',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalCard: {
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  modalLangRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(248,250,255,0.7)',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  modalClose: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  modalCloseText: {
    color: colors.muted,
    fontWeight: '600',
  },
  modalConfirm: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    ...shadow.soft,
  },
  modalConfirmText: {
    color: colors.card,
    fontWeight: '700',
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  content: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.card,
  },
});

export default function UserProfile({ navigation, onLogout }: Readonly<UserProfileProps>) {
  const { t, i18n } = useTranslation();
  const { startLoading, finishLoading } = useLoading();
  const { width } = useWindowDimensions();
  const _prefetched = useRef(new Set<string>());
  const avatarSize = width > 700 ? 120 : 88;

  const [langModal, setLangModal] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState<any>({});
  const [medicalModal, setMedicalModal] = useState(false);
  const [medicationsModal, setMedicationsModal] = useState(false);
  const [insuranceModal, setInsuranceModal] = useState(false);
  const [emergencyModal, setEmergencyModal] = useState(false);

  const languages = [
    { code: 'en', label: t('languages.english', 'English'), flag: require('../assets/gb.svg') },
    { code: 'fr', label: t('languages.french', 'French'), flag: require('../assets/fr.svg') },
    { code: 'ar', label: t('languages.arabic', 'Arabic'), flag: require('../assets/mr.svg') },
  ];
  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

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
          onPress: () => {
            (async () => {
              try {
                await signOut(auth);
                if (onLogout) onLogout();
              } catch (error: any) {
                Alert.alert(t('common.error', 'Error'), error.message || t('errors.logoutError', 'Failed to log out.'));
              }
            })();
          },
        },
      ],
    );
  };

  useEffect(() => {
    let mounted = true;
    const key = 'profile';
    startLoading(key);
    (async () => {
      try {
        const userProfile = await fetchUserProfile();
        if (!mounted) return;
        setProfile(userProfile);
        const uri = (userProfile as any)?.image || (userProfile as any)?.avatar;
        if (uri && !_prefetched.current.has(uri)) {
          const imgKey = 'profile-image';
          startLoading(imgKey);
          try {
            await RNImage.prefetch(uri);
            _prefetched.current.add(uri);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.debug('Profile image prefetch failed', e);
          } finally {
            finishLoading(imgKey);
          }
        }
      } finally {
        if (mounted) setLoadingProfile(false);
        finishLoading(key);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [startLoading, finishLoading]);

  if (loadingProfile) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loader}>
        <Text style={{ color: colors.muted }}>{t('profile.noProfileData', 'No profile data available')}</Text>
      </View>
    );
  }

  const quickActions: QuickAction[] = [
    {
      key: 'edit',
      label: t('common.editProfile', 'Edit Profile'),
      icon: 'create-outline',
      onPress: openEdit,
      tone: 'primary',
    },
    {
      key: 'meds',
      label: t('profile.myMedications', 'My Medications'),
      icon: 'medkit-outline',
      onPress: () => setMedicationsModal(true),
      tone: 'primary',
    },
    {
      key: 'privacy',
      label: t('common.privacy', 'Privacy'),
      icon: 'shield-checkmark-outline',
      onPress: () => {},
      tone: 'neutral',
    },
    {
      key: 'logout',
      label: t('auth.signOut', 'Logout'),
      icon: 'log-out-outline',
      onPress: handleLogout,
      tone: 'danger',
    },
  ];

  const renderActionButton = (action: QuickAction) => (
    <Pressable
      key={action.key}
      onPress={action.onPress}
      style={[
        styles.quickButton,
        action.tone === 'danger' && styles.quickButtonDanger,
      ]}
    >
      <Ionicons
        name={action.icon}
        size={18}
        color={action.tone === 'danger' ? '#FEE2E2' : '#F8FAFF'}
      />
      <Text style={styles.quickButtonText}>{action.label}</Text>
    </Pressable>
  );

  return (
    <>
      <ScreenContainer
        scrollable
        contentContainerStyle={styles.content}
        header={(
          <LinearGradient
            colors={colors.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroTop}>
              <SkeletonImage
                source={heroAvatar}
                style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, backgroundColor: colors.line }}
                resizeMode="cover"
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.heroName}>{profile.name}</Text>
                <Text style={styles.heroMeta}>{profile.email}</Text>
                {profile.phone ? <Text style={styles.heroMeta}>{profile.phone}</Text> : null}
              </View>
            </View>
            <View style={styles.heroStats}>
              <View style={styles.statPill}>
                <Ionicons name="water-outline" size={16} color="#fff" />
                <Text style={styles.statText}>{profile.blood_type || t('common.notSet', 'Not set')}</Text>
              </View>
              <View style={styles.statPill}>
                <Ionicons name="flask-outline" size={16} color="#fff" />
                <Text style={styles.statText}>{(profile.allergies || []).length} {t('auth.allergies', 'Allergies')}</Text>
              </View>
              <View style={styles.statPill}>
                <Ionicons name="bandage-outline" size={16} color="#fff" />
                <Text style={styles.statText}>{(profile.medical_conditions || []).length} {t('auth.medicalConditions', 'Conditions')}</Text>
              </View>
            </View>
            <View style={styles.quickActions}>{quickActions.map(renderActionButton)}</View>
          </LinearGradient>
        )}
      >
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('profile.healthSummary', 'Health summary')}</Text>
          <Text style={styles.sectionHint}>{t('profile.healthSummaryHint', 'Review and keep your medical data up to date.')}</Text>
          <ListRow
            title={t('profile.medicalId', 'Medical ID')}
            subtitle={profile.blood_type ? `${t('auth.bloodType', 'Blood Type')}: ${profile.blood_type}` : undefined}
            right={<Ionicons name="chevron-forward" size={18} color={colors.muted} />}
            onPress={() => setMedicalModal(true)}
          />
          <View style={styles.listSpacer} />
          <ListRow
            title={t('profile.insurance', 'Insurance')}
            subtitle={profile.insurance_info?.provider ? t('profile.providerWithValue', { provider: profile.insurance_info.provider }) : undefined}
            right={<Ionicons name="chevron-forward" size={18} color={colors.muted} />}
            onPress={() => setInsuranceModal(true)}
          />
          <View style={styles.listSpacer} />
          <ListRow
            title={t('profile.emergencyContacts', 'Emergency Contacts')}
            subtitle={profile.emergency_contacts && profile.emergency_contacts.length > 0 ? profile.emergency_contacts[0].name : t('common.none', 'None')}
            right={<Ionicons name="chevron-forward" size={18} color={colors.muted} />}
            onPress={() => setEmergencyModal(true)}
          />
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('profile.preferences', 'Preferences')}</Text>
          <Pressable
            onPress={() => setLangModal(true)}
            style={styles.actionRow}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View style={styles.actionIcon}>
                <Ionicons name="language-outline" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.actionLabel}>{t('common.language', 'Language')}</Text>
                <Text style={{ color: colors.muted }}>{currentLang.label}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        </Card>

        <Text style={styles.version}>v{pkg.version}</Text>
      </ScreenContainer>

      <Modal visible={langModal} animationType="fade" transparent onRequestClose={() => setLangModal(false)}>
        <View style={modalStyles.overlay}>
          <Card style={styles.modalCard}>
            <Text style={{ ...type.h2, textAlign: 'center' }}>{t('common.languageSettings', 'Language Settings')}</Text>
            {languages.map(lang => (
              <Pressable
                key={lang.code}
                onPress={async () => {
                  await i18n.changeLanguage(lang.code);
                  setLangModal(false);
                }}
                style={styles.modalLangRow}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <RNImage source={lang.flag} style={{ width: 32, height: 20, borderRadius: 4 }} resizeMode="contain" />
                  <Text style={{ color: colors.text, fontWeight: '600' }}>{lang.label}</Text>
                </View>
                {i18n.language === lang.code ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
              </Pressable>
            ))}
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalClose} onPress={() => setLangModal(false)}>
                <Text style={styles.modalCloseText}>{t('common.close', 'Close')}</Text>
              </Pressable>
              <Pressable style={styles.modalConfirm} onPress={() => setLangModal(false)}>
                <Text style={styles.modalConfirmText}>{t('common.save', 'Save')}</Text>
              </Pressable>
            </View>
          </Card>
        </View>
      </Modal>

      <MedicationsSheet visible={medicationsModal} onClose={() => setMedicationsModal(false)} />
      <MedicalSheet visible={medicalModal} profile={profile} onClose={() => setMedicalModal(false)} />
      <InsuranceSheet visible={insuranceModal} profile={profile} onClose={() => setInsuranceModal(false)} />
      <EmergencySheet visible={emergencyModal} profile={profile} onClose={() => setEmergencyModal(false)} />
      <EditProfileSheet
        visible={editModal}
        initial={edit}
        onSave={async data => {
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
        }}
        onClose={() => setEditModal(false)}
      />
    </>
  );
}
