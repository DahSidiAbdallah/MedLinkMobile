import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ActivityIndicator, ScrollView, Linking, Platform, Image as RNImage } from 'react-native';
import SkeletonImage from '../components/SkeletonImage';
import { useLoading } from '../hooks/LoadingContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchUserProfile, type Profile } from '../core/userProfile';
import { facilities } from '../data';
import type { Facility } from '../types';
// Helper to sort by distance (if user location available, replace with real calculation)
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
// Expo’s gradient works on web, iOS, and Android
import { LinearGradient } from 'expo-linear-gradient';
// Card import removed (not used in this file)
import MyMedicationsList from '../components/MyMedicationsList';
import { colors, spacing, type, shadow, radius } from '../theme';


export default function Dashboard({ navigation }: any) {
  const [profileModal, setProfileModal] = useState(false);
  const [urgentCareModal, setUrgentCareModal] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const { startLoading, finishLoading } = useLoading();
  const _prefetched = useRef(new Set<string>());
  const { reminders, loading: remindersLoading, error: remindersError, refresh, subscribe } = useReminders();

  // Render reminders via a small helper to avoid nested ternaries
  const renderReminders = () => {
    if (remindersLoading) return <ActivityIndicator color={colors.primary} />;
    if (remindersError) return <Text style={{ color: colors.danger }}>{remindersError}</Text>;
    const activeReminders = reminders?.filter(r => r.active) ?? [];
    if (activeReminders.length === 0) return <Text style={{ color: colors.muted }}>No reminders found.</Text>;
    return activeReminders.map(rem => (
      <View key={rem.id} style={{ backgroundColor: colors.line, borderRadius: radius.md, padding: spacing.lg, marginBottom: 10 }}>
        <Text style={{ fontWeight: '600', color: colors.text }}>{rem.title}</Text>
        <Text style={{ color: colors.muted, fontSize: 13 }}>{rem.datetime}{rem.frequency ? `  ${rem.frequency}` : ''}</Text>
        {rem.description && <Text style={{ color: colors.muted, fontSize: 13 }}>{rem.description}</Text>}
      </View>
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

  return (
    <SafeAreaView style={[styles.container]} edges={['top', 'left', 'right']}>
      <LinearGradient colors={[colors.bg, colors.surface]} style={styles.flex}>
        <ScrollView contentContainerStyle={[styles.scrollContent, Platform.OS === 'ios' ? { paddingBottom: 32 } : { paddingBottom: 16 }]}> 
        <View style={styles.dashboardHeader}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => setProfileModal(true)} style={styles.avatarBtn} accessibilityLabel="Open profile" accessibilityRole="button">
              <SkeletonImage source={AVATAR_PLACEHOLDER} style={styles.avatar} resizeMode="cover" />
            </Pressable>
            <NotificationBell onPress={() => setNotificationsVisible(true)} />
  <NotificationsSheet visible={notificationsVisible} onClose={() => setNotificationsVisible(false)} />
          </View>
          <Text style={[type.h1, styles.welcome]}>Welcome{profile?.name ? `, ${profile.name}` : ''}</Text>
          <Text style={[type.meta, styles.subheading]}>How is it going today?</Text>
          <Pressable
            onPress={() => setUrgentCareModal(true)}
            style={styles.cta}
            android_ripple={{ color: colors.primary600 }}
            accessibilityRole="button"
            accessibilityLabel="Open urgent care"
            accessibilityHint="View nearby urgent care facilities and emergency contacts"
            hitSlop={8}
          >
            <Text style={styles.ctaText}>Urgent Care</Text>
          </Pressable>
        {/* Urgent Care Modal/Sheet */}
          <Modal visible={urgentCareModal} animationType="slide" transparent onRequestClose={() => setUrgentCareModal(false)}>
          <View style={[styles.modalOverlay]}>
            <View style={styles.facilityModalSheet}>
              <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>Urgent Care</Text>
                  <Pressable onPress={() => setUrgentCareModal(false)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close urgent care sheet">
                    <Text style={styles.modalCloseText}>Close</Text>
                  </Pressable>
                </View>
                {/* Emergency Contacts */}
                <Text style={styles.sectionTitle}>Emergency Contacts</Text>
                <View style={{ marginBottom: spacing.lg }}>
                  {profile?.emergency_contacts?.length ? (
                    profile.emergency_contacts.map(contact => (
                      <View key={contact.phone ?? contact.name} style={styles.contactBlock}>
                        <Text style={styles.contactName}>{contact.name}</Text>
                        <Text style={styles.sectionText}>{contact.phone}</Text>
                        <Text style={styles.sectionText}>{contact.relationship}</Text>
                        <Pressable onPress={() => Linking.openURL(`tel:${contact.phone}`)} style={{ marginTop: 6 }} accessibilityRole="button">
                          <Text style={styles.callLink}>Call</Text>
                        </Pressable>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.sectionText}>No emergency contacts listed.</Text>
                  )}
                </View>
                {/* Open & Nearby Facilities */}
                <Text style={styles.sectionTitle}>Open & Nearby Facilities</Text>
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
          {/* Removed Xahara logo */}
        </View>

        <View style={styles.servicesCard}>
          <Text style={{ fontWeight: '700', fontSize: 17, marginBottom: 12, color: colors.text }}>Our Services</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <View style={styles.serviceItem}>
              <Text style={styles.serviceIcon}>🩺</Text>
              <Text style={styles.serviceLabel}>Meds Verification</Text>
            </View>
            <View style={styles.serviceItem}>
              <Text style={styles.serviceIcon}>💊</Text>
              <Text style={styles.serviceLabel}>Medical ID</Text>
            </View>
            <View style={styles.serviceItem}>
              <Text style={styles.serviceIcon}>🚑</Text>
              <Text style={styles.serviceLabel}>Facilities </Text>
            </View>
          </View>
        </View>

        <View style={styles.appointmentCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontWeight: '700', fontSize: 17, color: colors.text }}>Reminders</Text>
          </View>
          {renderReminders()}
        </View>
        {/* My Medications Section */}
        <View style={styles.appointmentCard}>
          <Text style={{ fontWeight: '700', fontSize: 17, color: colors.text, marginBottom: 8 }}>My Medications</Text>
          <MyMedicationsList />
        </View>

        {/* Profile Modal */}
        <Modal visible={profileModal} animationType="slide" transparent onRequestClose={() => setProfileModal(false)}>
          <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
            <View style={styles.facilityModalSheet}>
              <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 22, color: colors.text }}>Profile</Text>
                  <Pressable onPress={() => setProfileModal(false)} hitSlop={10}>
                    <Text style={{ color: colors.muted, fontWeight: '600', fontSize: 16 }}>Close</Text>
                  </Pressable>
                </View>
                <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
                  <SkeletonImage source={AVATAR_PLACEHOLDER} style={styles.profileAvatar} resizeMode="cover" />
                  {profile ? (
                    <>
                      <Text style={{ fontWeight: '700', fontSize: 22, color: colors.text, marginTop: 8 }}>{profile.name}</Text>
                      <Text style={{ color: colors.muted }}>{profile.email}</Text>
                      <Text style={{ color: colors.muted }}>{profile.phone}</Text>
                      <Text style={{ color: colors.muted }}>{profile.date_of_birth}</Text>
                    </>
                  ) : (
                    <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />
                  )}
                </View>
                {/* Allergies Section */}
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: colors.text }}>Allergies</Text>
                <View style={{ marginBottom: spacing.lg }}>
                  {profile?.allergies?.length ? (
                    profile.allergies.map((allergy) => (
                      <Text key={allergy} style={{ color: colors.muted, fontSize: 15, marginBottom: 2 }}>• {allergy}</Text>
                    ))
                  ) : (
                    <Text style={{ color: colors.muted }}>No allergies listed.</Text>
                  )}
                </View>
                {/* Urgent Contact Section */}
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: colors.text }}>Urgent Contact</Text>
                <View style={{ marginBottom: spacing.lg }}>
                  {profile?.emergency_contacts?.length ? (
                    <>
                      <Text style={{ color: colors.text, fontWeight: '600' }}>{profile.emergency_contacts[0].name}</Text>
                      <Text style={{ color: colors.muted }}>{profile.emergency_contacts[0].phone}</Text>
                      <Text style={{ color: colors.muted }}>{profile.emergency_contacts[0].relationship}</Text>
                    </>
                  ) : (
                    <Text style={{ color: colors.muted }}>No urgent contact listed.</Text>
                  )}
                </View>
                {/* Other Info Section */}
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: colors.text }}>Other Info</Text>
                <View style={{ marginBottom: spacing.lg }}>
                  {profile && (
                    <>
                      {profile.blood_type && <Text style={{ color: colors.muted }}>Blood Type: {profile.blood_type}</Text>}
                      {profile.medical_conditions && profile.medical_conditions.length > 0 && (
                        <Text style={{ color: colors.muted }}>Conditions: {profile.medical_conditions.join(', ')}</Text>
                      )}
                      {profile.medications && profile.medications.length > 0 && (
                        <Text style={{ color: colors.muted }}>Medications: {profile.medications.join(', ')}</Text>
                      )}
                    </>
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
  </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  dashboardHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: 0,
    position: 'relative',
    minHeight: 260,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  doctorImage: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 140,
    height: 160,
    resizeMode: 'contain',
    opacity: 0.95,
  },
  servicesCard: {
  backgroundColor: colors.surface,
  borderRadius: radius.xl,
    marginHorizontal: spacing.xl,
    marginTop: -32,
    padding: 18,
    ...shadow.card,
  },
  serviceItem: {
    alignItems: 'center',
    flex: 1,
  },
  serviceIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  serviceLabel: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '600',
  },
  appointmentCard: {
  backgroundColor: colors.surface,
  borderRadius: radius.xl,
    marginHorizontal: spacing.xl,
    marginTop: 24,
    padding: 18,
    ...shadow.card,
  },
  appointmentItem: {
    backgroundColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: 8,
  },
  appointmentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: 'cover',
  },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginLeft: 8,
  backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    resizeMode: 'cover',
  },
  facilityModalSheet: {
  borderTopLeftRadius: 32,
  borderTopRightRadius: 32,
  paddingTop: 32,
  paddingHorizontal: 28,
  minHeight: '60%',
  maxHeight: '90%',
  backgroundColor: colors.surface,
  overflow: 'hidden',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: colors.card,
    marginBottom: 8,
    resizeMode: 'cover',
  },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { fontWeight: '700', fontSize: 22, color: colors.text },
  modalCloseText: { color: colors.muted, fontWeight: '600', fontSize: 16 },
  sectionTitle: { fontWeight: '700', fontSize: 16, marginBottom: 8, color: colors.text },
  contactBlock: { marginBottom: 8 },
  contactName: { color: colors.text, fontWeight: '600' },
  sectionText: { color: colors.muted },
  callLink: { color: colors.primary, fontWeight: '600' },
  facilityItem: { marginBottom: 12 },
  facilityName: { color: colors.text, fontWeight: '600' },
  facilityMeta: { color: colors.muted, fontWeight: '400' },
  cta: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadow.card,
  },
  ctaText: { color: colors.card, fontWeight: '700' },
  welcome: { marginTop: 18 },
  subheading: { marginBottom: 18 },
  grid: {
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xl,
  },
  tile: {
    width: '46%',
    alignSelf: 'stretch',
  },
});
