import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ScrollView, Linking, Platform, Image as RNImage, TextInput, Animated, ActivityIndicator } from 'react-native';
import SkeletonImage from '../components/SkeletonImage';
import { SkeletonReminderCard, Skeleton } from '../components/Skeleton';
import { useLoading } from '../hooks/LoadingContext';
import { useToast } from '../hooks/useToast';
import { fetchUserProfile, type Profile } from '../core/userProfile';
import { facilities } from '../data';
import type { Facility } from '../types';
function sortByDistance(facilities: Facility[]): Facility[] {
  return facilities.slice().sort((a: Facility, b: Facility) => {
    const da = parseFloat((a.distance || '').replace(/[^\d.]/g, ''));
    const db = parseFloat((b.distance || '').replace(/[^\d.]/g, ''));
    return da - db;
  });
}
import { useReminders } from '../hooks/useReminders';
import NotificationBell from '../notifications/NotificationBell';
import NotificationsSheet from '../notifications/NotificationsSheet';
const AVATAR_PLACEHOLDER = require('../assets/avatar-placeholder.png');
import { LinearGradient } from 'expo-linear-gradient';
import ScreenContainer from '../components/ScreenContainer';
import MyMedicationsList from '../components/MyMedicationsList';
import Card from '../components/Card';
import Chip from '../components/Chip';
import ProgressBar from '../components/ProgressBar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getTodayStats } from '../core/completion';
import { colors, spacing, shadow, radius, animation } from '../theme';
import { useTranslation } from 'react-i18next';
import { useRTL } from '../hooks/useRTL';

export default function Dashboard({ navigation }: any) {
  const { t } = useTranslation();
  const { isRTL, textAlign } = useRTL();
  const { showSuccess, showError, showInfo } = useToast();
  const [profileModal, setProfileModal] = useState(false);
  const [urgentCareModal, setUrgentCareModal] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const { startLoading, finishLoading } = useLoading();
  const _prefetched = useRef(new Set<string>());
  const { reminders, loading: remindersLoading, error: remindersError, refresh, subscribe } = useReminders();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: animation.slow,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  }, []);

  const renderReminders = () => {
    if (remindersLoading) {
      return (
        <View style={{ gap: spacing.md }}>
          <SkeletonReminderCard />
          <SkeletonReminderCard />
        </View>
      );
    }
    if (remindersError) {
      return (
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={32} color={colors.danger} />
          <Text style={styles.errorText}>{t('common.error', 'Failed to load reminders')}</Text>
          <Pressable onPress={refresh} style={styles.retryButton}>
            <Text style={styles.retryText}>{t('actions.retry', 'Retry')}</Text>
          </Pressable>
        </View>
      );
    }
    const activeReminders = reminders?.filter(r => r.active) ?? [];
    if (activeReminders.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={32} color={colors.mutedLight} />
          <Text style={styles.emptyStateText}>{t('dashboard.noActiveReminders', 'No active reminders')}</Text>
          <Text style={styles.emptyStateHint}>{t('dashboard.addRemindersHint', 'Add reminders to track your medications')}</Text>
          <Pressable 
            onPress={() => navigation.navigate('Reminders')}
            style={styles.addReminderButton}
          >
            <Text style={styles.addReminderText}>{t('reminders.create', 'Add Reminder')}</Text>
          </Pressable>
        </View>
      );
    }
    return activeReminders.map((rem, index) => (
      <Animated.View
        key={rem.id}
        style={{
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ]
        }}
      >
        <Pressable 
          style={({ pressed }) => [
            styles.reminderCard, 
            pressed && styles.reminderCardPressed,
            { 
              transform: [{ scale: pressed ? 0.98 : 1 }]
            }
          ]}
          onPress={() => navigation.navigate('Reminders')}
        >
          <View style={styles.reminderHeader}>
            <View style={styles.reminderIconContainer}>
              <Ionicons name="medical" size={20} color={colors.primary} />
            </View>
            <View style={styles.reminderContent}>
              <Text style={styles.reminderTitle}>{rem.title}</Text>
              <Text style={styles.reminderMeta}>{rem.datetime}</Text>
              {rem.description && (
                <Text style={styles.reminderDescription}>{rem.description}</Text>
              )}
            </View>
            <View style={styles.reminderBadge}>
              <Text style={styles.reminderBadgeText}>{rem.frequency || 'Once'}</Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    ));
  };

  // Load profile on mount and when modal opens — use centralized loading
  useEffect(() => {
    let mounted = true;
    const key = 'dashboard-profile';
    startLoading(key);
    (async () => {
      try {
        console.log('Dashboard: Starting profile fetch...');
        const p = await fetchUserProfile();
        if (!mounted) return;
        console.log('Dashboard: Profile fetch result:', p ? 'found' : 'not found');
        setProfile(p);
        // prefetch avatar if present
        const uri = (p as any)?.image || (p as any)?.avatar;
        if (uri && !_prefetched.current.has(uri)) {
          const imgKey = 'profile-image';
          startLoading(imgKey);
          try {
            await RNImage.prefetch(uri);
            _prefetched.current.add(uri);
          } catch (e) {
            // Log prefetch failures for diagnostics
            // eslint-disable-next-line no-console
            console.debug('Avatar prefetch failed', e);
          }
          finally { finishLoading(imgKey); }
        }
      } catch (error) {
        console.error('Dashboard: Profile fetch error:', error);
      } finally {
        finishLoading(key);
      }
    })();
    return () => { mounted = false; };
  }, [profileModal, startLoading, finishLoading]);

  // Subscribe to reminder changes and refresh reminders automatically
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      refresh();
    });
    return unsubscribe;
  }, [subscribe, refresh]);

  // derive simple progress from active reminders completed vs total (placeholder logic)
  const activeReminders = reminders?.filter(r => r.active) ?? [];
  const [pillsDone, setPillsDone] = useState<{ done: number; total: number }>({ done: 0, total: activeReminders.length });
  useEffect(() => {
    (async () => {
      const stats = await getTodayStats(activeReminders.map(r => r.id));
      setPillsDone(stats);
    })();
  }, [activeReminders.length]);
  const progress = pillsDone.total ? pillsDone.done / pillsDone.total : 0;

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.content}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ]
        }}
      >
        <LinearGradient 
          colors={colors.heroGradient} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }} 
          style={styles.heroCard}
        >
          <View style={styles.heroTopRow}>
            <Pressable 
              onPress={() => setProfileModal(true)} 
              style={styles.avatarBtn} 
              accessibilityLabel="Open profile" 
              accessibilityRole="button"
            >
              <SkeletonImage source={AVATAR_PLACEHOLDER} style={styles.avatar} resizeMode="cover" />
            </Pressable>
            <NotificationBell onPress={() => setNotificationsVisible(true)} />
          </View>
          <Text style={[{ fontSize: 28, fontWeight: '700', lineHeight: 36 }, styles.heroTitle, { textAlign }]}>
            {t('dashboard.welcome', 'Welcome')}{profile?.name ? `, ${profile.name}` : ''}
          </Text>
          <Text style={[{ fontSize: 16, fontWeight: '400', lineHeight: 24 }, styles.heroSubtitle, { textAlign }]}>
            {t('dashboard.welcomeUser', 'How are you feeling today?')}
          </Text>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={colors.muted} style={{ marginRight: 10 }} />
            <TextInput
              placeholder={t('common.searchDoctorsAndClinics', 'Search doctors, facilities, medications...')}
              placeholderTextColor={colors.muted}
              style={[styles.searchInput, { textAlign }]}
              returnKeyType="search"
              onSubmitEditing={() => showInfo(t('common.search', 'Search'), t('common.searchFunctionality', 'Search functionality coming soon!'))}
            />
          </View>
          <View style={styles.chipsRow}>
            <Chip 
              label={t('doctors.cardiologist', 'Cardiologist')} 
              onPress={() => navigation.navigate('Clinics', { filter: 'cardiologist' })} 
            />
            <Chip 
              label={t('doctors.dentist', 'Dentist')} 
              onPress={() => navigation.navigate('Clinics', { filter: 'dentist' })} 
            />
            <Chip 
              label={t('doctors.therapist', 'Therapist')} 
              onPress={() => navigation.navigate('Clinics', { filter: 'therapist' })} 
            />
          </View>
        </LinearGradient>
      </Animated.View>

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        <Card variant="elevated" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="trending-up" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { textAlign }]}>{t('dashboard.todayProgress', "Today's Progress")}</Text>
              <Text style={[styles.sectionSubtitle, { textAlign }]}>{t('dashboard.stayConsistent', 'Stay consistent with your doses')}</Text>
            </View>
          </View>
          <ProgressBar 
            progress={progress} 
            height={12}
            showLabel 
            label={`${pillsDone.done} of ${pillsDone.total} completed`}
            variant={progress >= 1 ? 'success' : progress >= 0.5 ? 'default' : 'warning'}
            style={{ marginTop: spacing.lg }} 
          />
          {progress >= 1 && (
            <View style={styles.congratsContainer}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <Text style={[styles.congratsText, { textAlign }]}>{t('dashboard.greatJob', 'Great job! All doses completed today!')}</Text>
            </View>
          )}
        </Card>
      </Animated.View>

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        <Pressable
          onPress={() => setUrgentCareModal(true)}
          style={styles.urgentButton}
          android_ripple={{ color: colors.primary600 }}
          accessibilityRole="button"
          accessibilityLabel="Open urgent care"
          accessibilityHint="View nearby urgent care facilities and emergency contacts"
          hitSlop={8}
        >
          <LinearGradient 
            colors={colors.accentGradient} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 1 }} 
            style={styles.urgentGradient}
          >
            <Ionicons name="medical" size={24} color="#fff" style={{ marginBottom: 4 }} />
            <Text style={styles.urgentLabel}>{t('dashboard.urgentCare', 'Urgent Care')}</Text>
            <Text style={styles.urgentSub}>{t('dashboard.accessEmergency', 'Access emergency contacts & nearby facilities')}</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        <Card variant="elevated" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: colors.success100 }]}>
              <Ionicons name="notifications" size={20} color={colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { textAlign }]}>{t('dashboard.activeReminders', 'Active Reminders')}</Text>
              <Text style={[styles.sectionSubtitle, { textAlign }]}>{t('dashboard.upcomingSchedule', 'Your upcoming medication schedule')}</Text>
            </View>
            <Pressable 
              onPress={() => navigation.navigate('Reminders')}
              style={styles.sectionAction}
            >
              <Text style={styles.sectionActionText}>{t('dashboard.viewAll', 'View All')}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </Pressable>
          </View>
          <View style={styles.sectionBody}>{renderReminders()}</View>
        </Card>
      </Animated.View>

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        <Card variant="elevated" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: colors.secondary100 }]}>
              <Ionicons name="medical" size={20} color={colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { textAlign }]}>{t('dashboard.myMedications', 'My Medications')}</Text>
              <Text style={[styles.sectionSubtitle, { textAlign }]}>{t('dashboard.scannedMedications', 'Scanned and saved medications')}</Text>
            </View>
            <Pressable 
              onPress={() => navigation.navigate('Barcode')}
              style={styles.sectionAction}
            >
              <Text style={styles.sectionActionText}>{t('scanner.scanMedication', 'Scan')}</Text>
              <Ionicons name="camera" size={16} color={colors.primary} />
            </Pressable>
          </View>
          <MyMedicationsList />
        </Card>
      </Animated.View>

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        <Card variant="elevated" style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { textAlign }]}>{t('dashboard.quickServices', 'Quick Actions')}</Text>
          <View style={styles.servicesGrid}>
            <Pressable 
              style={styles.serviceItem}
              onPress={() => navigation.navigate('Barcode')}
            >
              <View style={styles.serviceIconWrap}>
                <MaterialCommunityIcons name="barcode-scan" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.serviceLabel, { textAlign: 'center' }]}>{t('scanner.scanMedication', 'Scan Medication')}</Text>
            </Pressable>
            <Pressable 
              style={styles.serviceItem}
              onPress={() => navigation.navigate('UserProfile')}
            >
              <View style={styles.serviceIconWrap}>
                <Ionicons name="medkit" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.serviceLabel, { textAlign: 'center' }]}>{t('profile.medicalId', 'Medical ID')}</Text>
            </Pressable>
            <Pressable 
              style={styles.serviceItem}
              onPress={() => navigation.navigate('Clinics')}
            >
              <View style={styles.serviceIconWrap}>
                <Ionicons name="business" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.serviceLabel, { textAlign: 'center' }]}>{t('facilities.title', 'Find Facilities')}</Text>
            </Pressable>
          </View>
        </Card>
      </Animated.View>

      <NotificationsSheet visible={notificationsVisible} onClose={() => setNotificationsVisible(false)} />

      <Modal visible={urgentCareModal} animationType="slide" transparent onRequestClose={() => setUrgentCareModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.facilityModalSheet}>
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
              <View style={styles.modalHeaderRow}>
                <Text style={[styles.modalTitle, { textAlign }]}>{t('dashboard.urgentCare', 'Urgent Care')}</Text>
                <Pressable onPress={() => setUrgentCareModal(false)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close urgent care sheet">
                  <Text style={styles.modalCloseText}>{t('common.close', 'Close')}</Text>
                </Pressable>
              </View>
              <Text style={[styles.sectionTitle, { textAlign }]}>{t('profile.emergencyContacts', 'Emergency contacts')}</Text>
              <View style={{ marginBottom: spacing.lg }}>
                {profile?.emergency_contacts && profile.emergency_contacts.length > 0 ? (
                  profile.emergency_contacts.map((contact, idx) => (
                    <View key={`${contact.phone ?? contact.name}_${idx}`} style={styles.contactBlock}>
                      <Text style={[styles.contactName, { textAlign }]}>{contact.name || t('profile.noEmergencyContacts', 'Unknown Contact')}</Text>
                      <Text style={[styles.sectionText, { textAlign }]}>{contact.phone || t('profile.noEmergencyContacts', 'No phone')}</Text>
                      <Text style={[styles.sectionText, { textAlign }]}>{contact.relationship || t('profile.noEmergencyContacts', 'No relationship specified')}</Text>
                      {contact.phone ? (
                        <Pressable onPress={() => Linking.openURL(`tel:${contact.phone}`)} style={{ marginTop: 6 }} accessibilityRole="button">
                          <Text style={styles.callLink}>{t('common.call', 'Call')}</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ))
                ) : (
                  <Text style={[styles.sectionText, { textAlign }]}>{t('profile.noEmergencyContacts', 'No emergency contacts listed.')}</Text>
                )}
              </View>
              <Text style={[styles.sectionTitle, { textAlign }]}>{t('facilities.title', 'Open & nearby facilities')}</Text>
              <View style={{ marginBottom: spacing.lg }}>
                {sortByDistance(facilities.filter(f => f.isOpen && (f.type === 'clinic' || f.type === 'hospital' || f.type === 'pharmacy'))).map((fac: Facility) => (
                  <View key={fac.id} style={styles.facilityItem}>
                    <Text style={[styles.facilityName, { textAlign }]}>{fac.name} <Text style={styles.facilityMeta}>({fac.type})</Text></Text>
                    <Text style={[styles.sectionText, { textAlign }]}>{fac.location}</Text>
                    {'phoneNumber' in fac && fac.phoneNumber && <Text style={[styles.sectionText, { textAlign }]}>{t('facilities.phone', 'Phone')}: {fac.phoneNumber}</Text>}
                    <Text style={[styles.sectionText, { textAlign }]}>{t('facilities.distance', 'Distance')}: {fac.distance || 'N/A'}</Text>
                    {'phoneNumber' in fac && fac.phoneNumber && (
                      <Pressable onPress={() => Linking.openURL(`tel:${fac.phoneNumber}`)} style={{ marginTop: 6 }} accessibilityRole="button">
                        <Text style={styles.callLink}>{t('common.call', 'Call')}</Text>
                      </Pressable>
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={profileModal} animationType="slide" transparent onRequestClose={() => setProfileModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.profileSheet}>
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
              <View style={styles.modalHeaderRow}>
                <Text style={[styles.modalTitle, { textAlign }]}>{t('profile.title', 'Profile')}</Text>
                <Pressable onPress={() => setProfileModal(false)} hitSlop={10}>
                  <Text style={styles.modalCloseText}>{t('common.close', 'Close')}</Text>
                </Pressable>
              </View>
              <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
                <SkeletonImage source={AVATAR_PLACEHOLDER} style={styles.profileAvatar} resizeMode="cover" />
                {profile ? (
                  <>
                    <Text style={[styles.profileName, { textAlign: 'center' }]}>{profile.name}</Text>
                    <Text style={[styles.sectionText, { textAlign: 'center' }]}>{profile.email}</Text>
                    <Text style={[styles.sectionText, { textAlign: 'center' }]}>{profile.phone}</Text>
                    <Text style={[styles.sectionText, { textAlign: 'center' }]}>{profile.date_of_birth}</Text>
                  </>
                ) : (
                  <View style={{ alignItems: 'center', marginTop: spacing.md }}>
                    <Text style={[styles.sectionText, { textAlign: 'center' }]}>{t('profile.noProfileData', 'No profile data available')}</Text>
                    <Text style={[styles.sectionText, { fontSize: 12, marginTop: 4, textAlign: 'center' }]}>
                      {t('profile.manageHealthInfo', 'Please create your profile in settings')}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.sectionTitle, { textAlign }]}>{t('profile.allergies', 'Allergies')}</Text>
              <View style={{ marginBottom: spacing.lg }}>
                {profile?.allergies?.length ? (
                  profile.allergies.map((allergy) => (
                    <Text key={allergy} style={[styles.sectionText, { textAlign }]}>• {allergy}</Text>
                  ))
                ) : (
                  <Text style={[styles.sectionText, { textAlign }]}>{t('profile.noProfileData', 'No allergies listed.')}</Text>
                )}
              </View>
              <Text style={[styles.sectionTitle, { textAlign }]}>{t('profile.ice', 'Urgent contact')}</Text>
              <View style={{ marginBottom: spacing.lg }}>
                {profile?.emergency_contacts?.length ? (
                  <>
                    <Text style={[styles.contactName, { textAlign }]}>{profile.emergency_contacts[0].name}</Text>
                    <Text style={[styles.sectionText, { textAlign }]}>{profile.emergency_contacts[0].phone}</Text>
                    <Text style={[styles.sectionText, { textAlign }]}>{profile.emergency_contacts[0].relationship}</Text>
                  </>
                ) : (
                  <Text style={[styles.sectionText, { textAlign }]}>{t('profile.noEmergencyContacts', 'No urgent contact listed.')}</Text>
                )}
              </View>
              <Text style={[styles.sectionTitle, { textAlign }]}>{t('profile.medicalDetails', 'Other info')}</Text>
              <View style={{ marginBottom: spacing.lg }}>
                {profile && (
                  <>
                    {profile.blood_type && <Text style={[styles.sectionText, { textAlign }]}>{t('profile.bloodType', 'Blood Type')}: {profile.blood_type}</Text>}
                    {profile.medical_conditions && profile.medical_conditions.length > 0 && (
                      <Text style={[styles.sectionText, { textAlign }]}>{t('profile.conditions.label', 'Conditions')}: {profile.medical_conditions.join(', ')}</Text>
                    )}
                    {profile.medications && profile.medications.length > 0 && (
                      <Text style={[styles.sectionText, { textAlign }]}>{t('profile.medications', 'Medications')}: {profile.medications.join(', ')}</Text>
                    )}
                  </>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: 100, // Account for tab bar
  },
  heroCard: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.lg,
    marginHorizontal: spacing.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  avatar: { 
    width: 44, 
    height: 44, 
    borderRadius: 22 
  },
  heroTitle: { 
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
  },
  heroSubtitle: { 
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sectionCard: {
    gap: spacing.lg,
    marginHorizontal: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sectionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { 
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    color: colors.text,
  },
  sectionSubtitle: { 
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.muted,
    marginTop: 2,
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  sectionActionText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: colors.primary,
  },
  sectionBody: { 
    gap: spacing.md 
  },
  congratsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.success100,
    borderRadius: radius.md,
  },
  congratsText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: colors.success,
    flex: 1,
  },
  urgentButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginHorizontal: spacing.md,
  },
  urgentGradient: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  urgentLabel: { 
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  },
  urgentSub: { 
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },
  servicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  serviceItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bgSecondary,
  },
  serviceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceLabel: { 
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: colors.text,
    textAlign: 'center',
  },
  // Reminder styles
  reminderCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow.sm,
  },
  reminderCardPressed: {
    backgroundColor: colors.hover,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  reminderIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderContent: {
    flex: 1,
    gap: spacing.xs,
  },
  reminderTitle: { 
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: colors.text,
  },
  reminderMeta: { 
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.muted,
  },
  reminderDescription: { 
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.textSecondary,
  },
  reminderBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.chipBg,
  },
  reminderBadgeText: { 
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    color: colors.chipText,
  },
  // Empty and error states
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyStateText: { 
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyStateHint: { 
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.muted,
    textAlign: 'center',
  },
  addReminderButton: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },
  addReminderText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: '#fff',
  },
  errorState: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    color: colors.danger,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.danger,
    borderRadius: radius.md,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: '#fff',
  },
  // Modal styles
  modalOverlay: { 
    flex: 1, 
    backgroundColor: colors.overlay, 
    justifyContent: 'flex-end' 
  },
  facilityModalSheet: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xl,
    paddingBottom: 48,
    backgroundColor: colors.card,
    maxHeight: '85%',
    ...shadow.xl,
  },
  profileSheet: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xl,
    paddingBottom: 48,
    backgroundColor: colors.card,
    maxHeight: '85%',
    ...shadow.xl,
  },
  modalHeaderRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: spacing.xl,
  },
  modalTitle: { 
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    color: colors.text,
  },
  modalCloseText: { 
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: colors.primary,
  },
  sectionText: { 
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.textSecondary,
    marginTop: 2,
  },
  contactBlock: { 
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
  },
  contactName: { 
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: colors.text,
  },
  callLink: { 
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: colors.primary,
  },
  facilityItem: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  facilityName: { 
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: colors.text,
  },
  facilityMeta: { 
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.muted,
  },
  profileAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: colors.line,
    marginBottom: spacing.md,
  },
  profileName: { 
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    color: colors.text,
    marginBottom: spacing.xs,
  },
});
