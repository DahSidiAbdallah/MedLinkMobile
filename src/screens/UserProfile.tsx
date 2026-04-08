import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
  Image as RNImage,
  Animated,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { signOutCompletely } from '../lib/authPersistence';
import SkeletonImage from '../components/SkeletonImage';
import { SkeletonHeroCard, SkeletonQuickAction } from '../components/SkeletonLoaders';
import ScreenContainer from '../components/ScreenContainer';
import { auth } from '../lib/firebase';
import { fetchUserProfile, createOrUpdateUserProfile, type Profile } from '../core/userProfile';
import { useLoading } from '../hooks/LoadingContext';
import MedicationsSheet from './user-sheets/MedicationsSheet';
import MedicalSheet from './user-sheets/MedicalSheet';
import InsuranceSheet from './user-sheets/InsuranceSheet';
import EmergencySheet from './user-sheets/EmergencySheet';
import EditProfileSheet from './user-sheets/EditProfileSheet';
import { colors, spacing, radius, shadow, animation } from '../theme';
import pkg from '../../package.json';

type UserProfileProps = {
  navigation: any;
  onLogout?: () => void;
};

const heroAvatar = require('../assets/avatar-placeholder.png');
const { width: SCREEN_W } = Dimensions.get('window');
// Exact width so two cards + one gap fit within horizontal padding
const CARD_W = (SCREEN_W - spacing.xl * 2 - spacing.lg) / 2;

export default function UserProfile({ navigation, onLogout }: Readonly<UserProfileProps>) {
  const { t, i18n } = useTranslation();
  const { startLoading, finishLoading } = useLoading();
  const _prefetched = useRef(new Set<string>());

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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 7,
        delay: 50,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 7,
        delay: 100,
      }),
    ]).start();
  }, []);

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
                await signOutCompletely();
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
      <ScreenContainer scrollable contentContainerStyle={{ gap: spacing.xxxl, paddingBottom: 140 }}>
        <SkeletonHeroCard />
        <View style={{ flexDirection: 'row', gap: spacing.lg, paddingHorizontal: spacing.xl }}>
          <SkeletonQuickAction />
          <SkeletonQuickAction />
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.lg, paddingHorizontal: spacing.xl }}>
          <SkeletonQuickAction />
          <SkeletonQuickAction />
        </View>
      </ScreenContainer>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loader}>
        <Text style={{ color: colors.muted }}>{t('profile.noProfileData', 'No profile data available')}</Text>
      </View>
    );
  }

  return (
    <>
      <ScreenContainer scrollable contentContainerStyle={styles.content}>
        {/* Hero Header with Image */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800' }}
            style={styles.hero}
            imageStyle={styles.heroImageStyle}
          >
            <LinearGradient
              colors={['rgba(38,201,168,0.88)', 'rgba(27,168,140,0.97)']}
              style={styles.heroOverlay}
            >
              <View style={styles.heroTop}>
                <View style={styles.heroAvatarWrap}>
                  <SkeletonImage
                    source={heroAvatar}
                    style={styles.heroAvatar}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.heroInfo}>
                  <Text style={styles.heroName} numberOfLines={1}>{profile.name}</Text>
                  <Text style={styles.heroEmail} numberOfLines={1}>{profile.email}</Text>
                  {profile.phone && <Text style={styles.heroPhone}>{profile.phone}</Text>}
                </View>
                <Pressable 
                  onPress={openEdit} 
                  style={({ pressed }) => [
                    styles.heroEditBtn,
                    pressed && { transform: [{ scale: 0.9 }], opacity: 0.8 }
                  ]}
                >
                  <Ionicons name="create-outline" size={20} color="#fff" />
                </Pressable>
              </View>

              <View style={styles.heroStats}>
                <View style={styles.statCard}>
                  <Ionicons name="water" size={18} color="rgba(255,255,255,0.95)" />
                  <Text style={styles.statValue}>{profile.blood_type || '—'}</Text>
                  <Text style={styles.statLabel}>{t('auth.bloodType', 'Blood Type')}</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="flask" size={18} color="rgba(255,255,255,0.95)" />
                  <Text style={styles.statValue}>{(profile.allergies || []).length}</Text>
                  <Text style={styles.statLabel}>{t('auth.allergies', 'Allergies')}</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="bandage" size={18} color="rgba(255,255,255,0.95)" />
                  <Text style={styles.statValue}>{(profile.medical_conditions || []).length}</Text>
                  <Text style={styles.statLabel}>{t('auth.conditions', 'Conditions')}</Text>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
          <View style={styles.quickActions}>
            {([
              { key: 'meds', icon: 'medkit' as const, label: t('profile.myMedications', 'Medications'), color: colors.primary, bg: colors.primary50, onPress: () => setMedicationsModal(true) },
              { key: 'medical', icon: 'pulse' as const, label: t('profile.medicalId', 'Medical ID'), color: '#8B5CF6', bg: '#F3E8FF', onPress: () => setMedicalModal(true) },
              { key: 'insurance', icon: 'shield-checkmark' as const, label: t('profile.insurance', 'Insurance'), color: colors.accent, bg: '#D1FAE5', onPress: () => setInsuranceModal(true) },
              { key: 'emergency', icon: 'call' as const, label: t('profile.emergencyContacts', 'Emergency'), color: colors.danger, bg: colors.danger100, onPress: () => setEmergencyModal(true) },
            ] as const).map((action, index) => (
              <Animated.View
                key={action.key}
                style={{
                  opacity: fadeAnim,
                  transform: [
                    { 
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 20],
                        outputRange: [0, 20 + (index * 5)],
                      })
                    }
                  ]
                }}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.quickActionCard,
                    { backgroundColor: action.bg },
                    pressed && { transform: [{ scale: 0.96 }], opacity: 0.9 }
                  ]}
                  onPress={action.onPress}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: '#fff' }]}>
                    <Ionicons name={action.icon} size={28} color={action.color} />
                  </View>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Health Summary */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('profile.healthSummary', 'Health Summary')}</Text>
            </View>

            <View style={styles.healthCards}>
              {[
                {
                  title: t('profile.medicalId', 'Medical ID'),
                  subtitle: profile.blood_type ? `${t('auth.bloodType', 'Blood Type')}: ${profile.blood_type}` : t('common.tapToAdd', 'Tap to add'),
                  icon: 'id-card' as const,
                  color: colors.primary,
                  bg: colors.primary50,
                  onPress: () => setMedicalModal(true),
                },
                {
                  title: t('profile.insurance', 'Insurance'),
                  subtitle: profile.insurance_info?.provider ?? t('common.tapToAdd', 'Tap to add'),
                  icon: 'shield' as const,
                  color: '#8B5CF6',
                  bg: '#F3E8FF',
                  onPress: () => setInsuranceModal(true),
                },
                {
                  title: t('profile.emergencyContacts', 'Emergency'),
                  subtitle: profile.emergency_contacts?.[0]?.name ?? t('common.tapToAdd', 'Tap to add'),
                  icon: 'call' as const,
                  color: colors.danger,
                  bg: colors.danger100,
                  onPress: () => setEmergencyModal(true),
                },
              ].map((card, index) => (
                <Animated.View
                  key={card.title}
                  style={{
                    opacity: fadeAnim,
                    transform: [
                      { 
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 20],
                          outputRange: [0, 20 + (index * 10)],
                        })
                      }
                    ]
                  }}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.healthCard,
                      pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }
                    ]}
                    onPress={card.onPress}
                  >
                    <View style={[styles.healthCardIcon, { backgroundColor: card.bg }]}>
                      <Ionicons name={card.icon} size={24} color={card.color} />
                    </View>
                    <View style={styles.healthCardContent}>
                      <Text style={styles.healthCardTitle}>{card.title}</Text>
                      <Text style={styles.healthCardSubtitle} numberOfLines={1}>{card.subtitle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Settings */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('profile.preferences', 'Settings')}</Text>
            </View>

            <View style={styles.settingsCards}>
              <Pressable
                style={({ pressed }) => [
                  styles.settingCard,
                  pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }
                ]}
                onPress={() => setLangModal(true)}
              >
                <View style={[styles.settingIcon, { backgroundColor: colors.primary50 }]}>
                  <Ionicons name="language" size={24} color={colors.primary} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{t('common.language', 'Language')}</Text>
                  <Text style={styles.settingValue}>{currentLang.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.settingCard,
                  pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }
                ]}
                onPress={handleLogout}
              >
                <View style={[styles.settingIcon, { backgroundColor: colors.danger100 }]}>
                  <Ionicons name="log-out" size={24} color={colors.danger} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.danger }]}>{t('auth.signOut', 'Sign Out')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </Pressable>
            </View>
          </View>
        </Animated.View>

        <Text style={styles.version}>v{pkg.version}</Text>
      </ScreenContainer>

      {/* Language Modal */}
      <Modal visible={langModal} animationType="slide" transparent onRequestClose={() => setLangModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t('common.languageSettings', 'Language Settings')}</Text>
            
            {languages.map(lang => (
              <Pressable
                key={lang.code}
                onPress={async () => {
                  await i18n.changeLanguage(lang.code);
                  setLangModal(false);
                }}
                style={({ pressed }) => [
                  styles.langOption,
                  pressed && { opacity: 0.8 }
                ]}
              >
                <View style={styles.langOptionLeft}>
                  <RNImage source={lang.flag} style={styles.langFlag} resizeMode="contain" />
                  <Text style={styles.langLabel}>{lang.label}</Text>
                </View>
                {i18n.language === lang.code && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
              </Pressable>
            ))}
          </View>
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

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    gap: spacing.xxxl,
    paddingBottom: 140,
    paddingTop: 0,
  },

  // Hero
  hero: {
    height: 360,
  },
  heroImageStyle: {
    borderBottomLeftRadius: radius.xxxl,
    borderBottomRightRadius: radius.xxxl,
  },
  heroOverlay: {
    flex: 1,
    paddingTop: spacing.xxxl * 1.5,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.xxl,
    borderBottomLeftRadius: radius.xxxl,
    borderBottomRightRadius: radius.xxxl,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  heroAvatarWrap: {
    borderRadius: 999,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
    ...shadow.xl,
  },
  heroAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  heroInfo: {
    flex: 1,
    gap: 4,
  },
  heroName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  heroEmail: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
  },
  heroPhone: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
  },
  heroEditBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  heroStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: spacing.lg,
    borderRadius: radius.xl,
    ...shadow.soft,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  quickActionCard: {
    width: CARD_W,
    padding: spacing.xl,
    borderRadius: radius.xxl,
    gap: spacing.lg,
    minHeight: 140,
    ...shadow.card,
  },
  quickActionIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  quickActionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 'auto',
    letterSpacing: -0.2,
  },

  // Section
  section: {
    gap: spacing.xl,
  },
  sectionHeader: {
    paddingHorizontal: spacing.xl,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },

  // Health Cards
  healthCards: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  healthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.xl,
    borderRadius: radius.xl,
    gap: spacing.lg,
    ...shadow.card,
  },
  healthCardIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthCardContent: {
    flex: 1,
    gap: spacing.xs,
  },
  healthCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  healthCardSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },

  // Settings
  settingsCards: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.xl,
    borderRadius: radius.xl,
    gap: spacing.lg,
    ...shadow.card,
  },
  settingIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
    gap: spacing.xs,
  },
  settingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },

  version: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    color: colors.textTertiary,
    marginTop: spacing.lg,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xxxl,
    borderTopRightRadius: radius.xxxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl * 2,
    gap: spacing.lg,
    ...shadow.xl,
  },
  modalHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.line,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: spacing.md,
  },
  langOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    padding: spacing.lg,
    borderRadius: radius.xl,
  },
  langOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  langFlag: {
    width: 36,
    height: 24,
    borderRadius: 6,
  },
  langLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
});
