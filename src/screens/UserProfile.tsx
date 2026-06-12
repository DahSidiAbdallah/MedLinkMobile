import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
  Image as RNImage,
  Animated,
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
const CARD_W = (SCREEN_W - spacing.xxl * 2 - spacing.xxl) / 2;

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
  const langModalAnim = useRef(new Animated.Value(0)).current;
  const langSlideAnim = useRef(new Animated.Value(300)).current;

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

  useEffect(() => {
    if (langModal) {
      Animated.parallel([
        Animated.timing(langModalAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(langSlideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 7,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(langModalAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(langSlideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [langModal]);

  // Language selection animation
  const [selectedLangAnim] = useState(() => ({
    en: new Animated.Value(1),
    fr: new Animated.Value(1),
    ar: new Animated.Value(1),
  }));

  const animateLanguageSelection = (langCode: string) => {
    Animated.sequence([
      Animated.timing(selectedLangAnim[langCode as keyof typeof selectedLangAnim], {
        toValue: 1.05,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(selectedLangAnim[langCode as keyof typeof selectedLangAnim], {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

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
                // Force navigation to reset and let auth state change trigger login
                if (navigation) {
                  navigation.popToTop();
                }
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
          <View style={styles.hero}>
            <LinearGradient
              colors={[colors.primary, colors.primary700]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.6, y: 1 }}
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
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
          <View style={styles.quickActions}>
            {([
              { key: 'meds', icon: 'medkit' as const, label: t('profile.myMedications', 'Medications'), color: colors.primary, onPress: () => setMedicationsModal(true) },
              { key: 'medical', icon: 'pulse' as const, label: t('profile.medicalId', 'Medical ID'), color: colors.primary, onPress: () => setMedicalModal(true) },
              { key: 'insurance', icon: 'shield-checkmark' as const, label: t('profile.insurance', 'Insurance'), color: colors.primary, onPress: () => setInsuranceModal(true) },
              { key: 'emergency', icon: 'call' as const, label: t('profile.emergencyContacts', 'Emergency'), color: colors.danger, onPress: () => setEmergencyModal(true) },
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
                    pressed && { opacity: 0.88 }
                  ]}
                  onPress={action.onPress}
                >
                  <View style={styles.quickActionIcon}>
                    <Ionicons name={action.icon} size={22} color={action.color} />
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
                  onPress: () => setMedicalModal(true),
                },
                {
                  title: t('profile.insurance', 'Insurance'),
                  subtitle: profile.insurance_info?.provider ?? t('common.tapToAdd', 'Tap to add'),
                  icon: 'shield' as const,
                  color: colors.primary,
                  onPress: () => setInsuranceModal(true),
                },
                {
                  title: t('profile.emergencyContacts', 'Emergency'),
                  subtitle: profile.emergency_contacts?.[0]?.name ?? t('common.tapToAdd', 'Tap to add'),
                  icon: 'call' as const,
                  color: colors.danger,
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
                    <View style={styles.healthCardIcon}>
                      <Ionicons name={card.icon} size={20} color={card.color} />
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
                <View style={styles.settingIcon}>
                  <Ionicons name="language" size={20} color={colors.textSecondary} />
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
                <View style={styles.settingIcon}>
                  <Ionicons name="log-out" size={20} color={colors.danger} />
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
      <Modal visible={langModal} animationType="none" transparent onRequestClose={() => setLangModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setLangModal(false)}>
          <Animated.View 
            style={[
              styles.modalOverlay,
              {
                backgroundColor: colors.overlay,
                opacity: langModalAnim,
              }
            ]}
          >
            <Pressable onPress={() => setLangModal(false)} style={{ flex: 1 }} />
            <Animated.View
              style={[
                styles.modalContent,
                {
                  transform: [{ translateY: langSlideAnim }]
                }
              ]}
            >
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>{t('common.languageSettings', 'Language Settings')}</Text>
              <Text style={styles.modalSubtitle}>{t('common.selectLanguagePrompt', 'Choose your preferred language')}</Text>
              
              {languages.map((lang, index) => (
                <Animated.View
                  key={lang.code}
                  style={{
                    opacity: langModalAnim,
                    transform: [
                      {
                        translateY: langSlideAnim.interpolate({
                          inputRange: [0, 300],
                          outputRange: [0, 50 + (index * 10)],
                        })
                      }
                    ]
                  }}
                >
                  <Pressable
                    onPress={async () => {
                      animateLanguageSelection(lang.code);
                      await i18n.changeLanguage(lang.code);
                      setTimeout(() => setLangModal(false), 400);
                    }}
                    style={({ pressed }) => [
                      styles.langOption,
                      i18n.language === lang.code && styles.langOptionActive,
                      pressed && { opacity: 0.9 }
                    ]}
                  >
                    <View style={styles.langOptionLeft}>
                      <View style={[styles.langFlagWrap, i18n.language === lang.code && styles.langFlagWrapActive]}>
                        <RNImage source={lang.flag} style={styles.langFlag} resizeMode="contain" />
                      </View>
                      <Text style={[styles.langLabel, i18n.language === lang.code && styles.langLabelActive]}>{lang.label}</Text>
                    </View>
                    {i18n.language === lang.code && (
                      <View style={styles.checkmarkWrap}>
                        <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
                      </View>
                    )}
                  </Pressable>
                </Animated.View>
              ))}
            </Animated.View>
          </Animated.View>
        </Pressable>
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
    gap: spacing.xxl,
    paddingBottom: 120,
    paddingTop: 0,
  },

  // Hero
  hero: {
    height: 330,
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    overflow: 'hidden',
  },
  heroOverlay: {
    flex: 1,
    paddingTop: spacing.xxxl + spacing.xxl,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  heroAvatarWrap: {
    borderRadius: 999,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
  },
  heroAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  heroInfo: {
    flex: 1,
    gap: 3,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
  },
  heroEmail: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.8)',
  },
  heroPhone: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.8)',
  },
  heroEditBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.75)',
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
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: radius.xl,
    gap: spacing.md,
    minHeight: 130,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    ...shadow.card,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSecondary,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 'auto',
  },

  // Section
  section: { gap: spacing.lg },
  sectionHeader: { paddingHorizontal: spacing.xl },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },

  // Health Cards
  healthCards: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  healthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xl,
    gap: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  healthCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSecondary,
  },
  healthCardContent: {
    flex: 1,
    gap: 2,
  },
  healthCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  healthCardSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
  },

  // Settings
  settingsCards: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xl,
    gap: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSecondary,
  },
  settingContent: {
    flex: 1,
    gap: 2,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  settingValue: {
    fontSize: 13,
    fontWeight: '400',
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
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xxxx, // VELO: larger rounded corners
    borderTopRightRadius: radius.xxxx,
    paddingHorizontal: spacing.xxl, // VELO: more generous padding
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl * 2,
    gap: spacing.xl, // VELO: more generous spacing
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
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  langOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  langOptionActive: {
    backgroundColor: colors.primary50,
    borderColor: colors.primary,
  },
  langOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  langFlagWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  langFlagWrapActive: {
    backgroundColor: '#fff',
    ...shadow.card,
  },
  langFlag: {
    width: 32,
    height: 22,
    borderRadius: 4,
  },
  langLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  langLabelActive: {
    color: colors.primary,
  },
  checkmarkWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
