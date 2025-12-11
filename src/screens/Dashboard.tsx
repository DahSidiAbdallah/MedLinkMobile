import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ScrollView, Linking, Platform, Image as RNImage, TextInput, Animated, ActivityIndicator } from 'react-native';
import SkeletonImage from '../components/SkeletonImage';
import { SkeletonReminderCard, Skeleton } from '../components/Skeleton';
import { useLoading } from '../hooks/LoadingContext';
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
import { colors, spacing, type, shadow, radius } from '../theme';


export default function Dashboard({ navigation }: any) {
  const [profileModal, setProfileModal] = useState(false);
  const [urgentCareModal, setUrgentCareModal] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const { startLoading, finishLoading } = useLoading();
  const _prefetched = useRef(new Set<string>());
  const { reminders, loading: remindersLoading, error: remindersError, refresh, subscribe } = useReminders();

  const renderReminders = () => {
    if (remindersLoading) {
      return (
        <View style={{ gap: spacing.md }}>
          <SkeletonReminderCard />
          <SkeletonReminderCard />
        </View>
      );
    }
    if (remindersError) return <Text style={{ color: colors.danger }}>{remindersError}</Text>;
    const activeReminders = reminders?.filter(r => r.active) ?? [];
    if (activeReminders.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={32} color={colors.mutedLight} />
          <Text style={styles.emptyStateText}>No active reminders</Text>
          <Text style={styles.emptyStateHint}>Add reminders to track your medications</Text>
        </View>
      );
    }
    return activeReminders.map(rem => (
      <Pressable 
        key={rem.id} 
        style={({ pressed }) => [styles.reminderCard, pressed && styles.reminderCardPressed]}
        onPress={() => navigation.navigate('Reminders')}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.reminderTitle}>{rem.title}</Text>
          <View style={styles.reminderBadge}>
            <Text style={styles.reminderBadgeText}>{rem.frequency || 'Once'}</Text>
          </View>
        </View>
        <Text style={styles.reminderMeta}>{rem.datetime}</Text>
        {rem.description ? <Text style={styles.reminderDescription}>{rem.description}</Text> : null}
      </Pressable>
    ));
  };

  // Load profile on mount and when modal opens — use centralized loading
  useEffect(() => {
    let mounted = true;
    const key = 'dashboard-profile';
    startLoading(key);
    (async () => {
      try {
        const p = await fetchUserProfile();
        if (!mounted) return;
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
      <LinearGradient colors={colors.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <Pressable onPress={() => setProfileModal(true)} style={styles.avatarBtn} accessibilityLabel="Open profile" accessibilityRole="button">
            <SkeletonImage source={AVATAR_PLACEHOLDER} style={styles.avatar} resizeMode="cover" />
          </Pressable>
          <NotificationBell onPress={() => setNotificationsVisible(true)} />
        </View>
        <Text style={[type.h1, styles.heroTitle]}>Welcome{profile?.name ? `, ${profile.name}` : ''}</Text>
        <Text style={[type.meta, styles.heroSubtitle]}>How is it going today?</Text>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.muted} style={{ marginRight: 10 }} />
          <TextInput
            placeholder="Search doctors, facilities, meds"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            returnKeyType="search"
          />
        </View>
        <View style={styles.chipsRow}>
          <Chip label="Cardiologist" onPress={() => navigation.navigate('Clinics', { filter: 'cardiologist' })} />
          <Chip label="Dentist" onPress={() => navigation.navigate('Clinics', { filter: 'dentist' })} />
          <Chip label="Therapist" onPress={() => navigation.navigate('Clinics', { filter: 'therapist' })} />
          <Chip label="Geneticist" onPress={() => navigation.navigate('Clinics', { filter: 'geneticist' })} />
        </View>
      </LinearGradient>

      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's progress</Text>
          <Text style={styles.sectionMeta}>{pillsDone.done}/{pillsDone.total}</Text>
        </View>
        <ProgressBar progress={progress} style={{ marginTop: 12 }} />
        <Text style={styles.sectionHint}>Stay consistent and keep logging your doses.</Text>
      </Card>

      <Pressable
        onPress={() => setUrgentCareModal(true)}
        style={styles.urgentButton}
        android_ripple={{ color: colors.primary600 }}
        accessibilityRole="button"
        accessibilityLabel="Open urgent care"
        accessibilityHint="View nearby urgent care facilities and emergency contacts"
        hitSlop={8}
      >
        <LinearGradient colors={colors.accentGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.urgentGradient}>
          <Text style={styles.urgentLabel}>Urgent Care</Text>
          <Text style={styles.urgentSub}>Access emergency contacts & open facilities nearby</Text>
        </LinearGradient>
      </Pressable>

      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active reminders</Text>
        </View>
        <View style={styles.sectionBody}>{renderReminders()}</View>
      </Card>

      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My medications</Text>
        </View>
        <MyMedicationsList />
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Our services</Text>
        <View style={styles.servicesGrid}>
          <View style={styles.serviceItem}>
            <View style={styles.serviceIconWrap}><MaterialCommunityIcons name="barcode-scan" size={22} color={colors.primary} /></View>
            <Text style={styles.serviceLabel}>Meds verification</Text>
          </View>
          <View style={styles.serviceItem}>
            <View style={styles.serviceIconWrap}><Ionicons name="medkit" size={20} color={colors.primary} /></View>
            <Text style={styles.serviceLabel}>Medical ID</Text>
          </View>
          <View style={styles.serviceItem}>
            <View style={styles.serviceIconWrap}><Ionicons name="business" size={20} color={colors.primary} /></View>
            <Text style={styles.serviceLabel}>Facilities</Text>
          </View>
        </View>
      </Card>

      <NotificationsSheet visible={notificationsVisible} onClose={() => setNotificationsVisible(false)} />

      <Modal visible={urgentCareModal} animationType="slide" transparent onRequestClose={() => setUrgentCareModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.facilityModalSheet}>
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Urgent Care</Text>
                <Pressable onPress={() => setUrgentCareModal(false)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close urgent care sheet">
                  <Text style={styles.modalCloseText}>Close</Text>
                </Pressable>
              </View>
              <Text style={styles.sectionTitle}>Emergency contacts</Text>
              <View style={{ marginBottom: spacing.lg }}>
                {profile?.emergency_contacts && profile.emergency_contacts.length > 0 ? (
                  profile.emergency_contacts.map((contact, idx) => (
                    <View key={`${contact.phone ?? contact.name}_${idx}`} style={styles.contactBlock}>
                      <Text style={styles.contactName}>{contact.name || 'Unknown Contact'}</Text>
                      <Text style={styles.sectionText}>{contact.phone || 'No phone'}</Text>
                      <Text style={styles.sectionText}>{contact.relationship || 'No relationship specified'}</Text>
                      {contact.phone ? (
                        <Pressable onPress={() => Linking.openURL(`tel:${contact.phone}`)} style={{ marginTop: 6 }} accessibilityRole="button">
                          <Text style={styles.callLink}>Call</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ))
                ) : (
                  <Text style={styles.sectionText}>No emergency contacts listed.</Text>
                )}
              </View>
              <Text style={styles.sectionTitle}>Open & nearby facilities</Text>
              <View style={{ marginBottom: spacing.lg }}>
                {sortByDistance(facilities.filter(f => f.isOpen && (f.type === 'clinic' || f.type === 'hospital' || f.type === 'pharmacy'))).map((fac: Facility) => (
                  <View key={fac.id} style={styles.facilityItem}>
                    <Text style={styles.facilityName}>{fac.name} <Text style={styles.facilityMeta}>({fac.type})</Text></Text>
                    <Text style={styles.sectionText}>{fac.location}</Text>
                    {'phoneNumber' in fac && fac.phoneNumber && <Text style={styles.sectionText}>Phone: {fac.phoneNumber}</Text>}
                    <Text style={styles.sectionText}>Distance: {fac.distance || 'N/A'}</Text>
                    {'phoneNumber' in fac && fac.phoneNumber && (
                      <Pressable onPress={() => Linking.openURL(`tel:${fac.phoneNumber}`)} style={{ marginTop: 6 }} accessibilityRole="button">
                        <Text style={styles.callLink}>Call</Text>
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
                <Text style={styles.modalTitle}>Profile</Text>
                <Pressable onPress={() => setProfileModal(false)} hitSlop={10}>
                  <Text style={styles.modalCloseText}>Close</Text>
                </Pressable>
              </View>
              <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
                <SkeletonImage source={AVATAR_PLACEHOLDER} style={styles.profileAvatar} resizeMode="cover" />
                {profile ? (
                  <>
                    <Text style={styles.profileName}>{profile.name}</Text>
                    <Text style={styles.sectionText}>{profile.email}</Text>
                    <Text style={styles.sectionText}>{profile.phone}</Text>
                    <Text style={styles.sectionText}>{profile.date_of_birth}</Text>
                  </>
                ) : (
                  <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />
                )}
              </View>
              <Text style={styles.sectionTitle}>Allergies</Text>
              <View style={{ marginBottom: spacing.lg }}>
                {profile?.allergies?.length ? (
                  profile.allergies.map((allergy) => (
                    <Text key={allergy} style={styles.sectionText}>• {allergy}</Text>
                  ))
                ) : (
                  <Text style={styles.sectionText}>No allergies listed.</Text>
                )}
              </View>
              <Text style={styles.sectionTitle}>Urgent contact</Text>
              <View style={{ marginBottom: spacing.lg }}>
                {profile?.emergency_contacts?.length ? (
                  <>
                    <Text style={styles.contactName}>{profile.emergency_contacts[0].name}</Text>
                    <Text style={styles.sectionText}>{profile.emergency_contacts[0].phone}</Text>
                    <Text style={styles.sectionText}>{profile.emergency_contacts[0].relationship}</Text>
                  </>
                ) : (
                  <Text style={styles.sectionText}>No urgent contact listed.</Text>
                )}
              </View>
              <Text style={styles.sectionTitle}>Other info</Text>
              <View style={{ marginBottom: spacing.lg }}>
                {profile && (
                  <>
                    {profile.blood_type && <Text style={styles.sectionText}>Blood Type: {profile.blood_type}</Text>}
                    {profile.medical_conditions && profile.medical_conditions.length > 0 && (
                      <Text style={styles.sectionText}>Conditions: {profile.medical_conditions.join(', ')}</Text>
                    )}
                    {profile.medications && profile.medications.length > 0 && (
                      <Text style={styles.sectionText}>Medications: {profile.medications.join(', ')}</Text>
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
    paddingBottom: spacing.xxl,
  },
  heroCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadow.card,
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
    borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  heroTitle: { color: '#FFFFFF' },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)' },
  searchWrap: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: spacing.md,
  },
  sectionCard: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontWeight: '700', fontSize: 17, color: colors.text },
  sectionMeta: { color: colors.muted, fontWeight: '600' },
  sectionHint: { color: colors.muted, fontSize: 13 },
  sectionBody: { gap: spacing.md },
  urgentButton: {
    borderRadius: radius.pill,
    overflow: 'hidden',
    ...shadow.card,
  },
  urgentGradient: {
    paddingVertical: 18,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  urgentLabel: { color: '#fff', fontWeight: '700', fontSize: 17 },
  urgentSub: { color: 'rgba(255,255,255,0.85)', marginTop: 4, fontSize: 13, textAlign: 'center' },
  servicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  serviceItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  serviceIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(37,99,235,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceLabel: { fontSize: 13, color: colors.text, fontWeight: '600', textAlign: 'center' },
  notifications: {},
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  facilityModalSheet: {
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    padding: spacing.xl,
    paddingBottom: 48,
    backgroundColor: colors.card,
    maxHeight: '85%',
    ...shadow.card,
  },
  profileSheet: {
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    padding: spacing.xl,
    paddingBottom: 48,
    backgroundColor: colors.card,
    maxHeight: '85%',
    ...shadow.card,
  },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { fontWeight: 'bold', fontSize: 22, color: colors.text },
  modalCloseText: { color: colors.muted, fontWeight: '600', fontSize: 16 },
  sectionText: { color: colors.muted, fontSize: 14, marginTop: 2 },
  contactBlock: { marginBottom: spacing.md },
  contactName: { color: colors.text, fontWeight: '600' },
  callLink: { color: colors.primary, fontWeight: '600' },
  facilityItem: {
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  facilityName: { color: colors.text, fontWeight: '600' },
  facilityMeta: { color: colors.muted },
  profileAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: colors.surface,
    marginBottom: 8,
  },
  profileName: { fontWeight: '700', fontSize: 22, color: colors.text, marginTop: 8 },
  reminderCard: {
    backgroundColor: 'rgba(37,99,235,0.08)',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 6,
  },
  reminderTitle: { color: colors.text, fontWeight: '600', fontSize: 15 },
  reminderMeta: { color: colors.muted, fontSize: 13 },
  reminderDescription: { color: colors.muted, fontSize: 13 },
  reminderBadge: {
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  reminderBadgeText: { color: colors.primary, fontWeight: '600', fontSize: 12 },
  reminderCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  emptyStateHint: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
});
