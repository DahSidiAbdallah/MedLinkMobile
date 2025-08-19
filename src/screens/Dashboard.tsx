import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Image, Modal, ActivityIndicator, ScrollView, Linking } from 'react-native';
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
import Card from '../components/Card';
import MyMedicationsList from '../components/MyMedicationsList';
import { colors, spacing, type, shadow } from '../theme';


export default function Dashboard({ navigation }: any) {
  const [profileModal, setProfileModal] = useState(false);
  const [urgentCareModal, setUrgentCareModal] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const { reminders, loading: remindersLoading, error: remindersError, refresh, subscribe } = useReminders();

  // Always load profile on mount for welcome message
  useEffect(() => {
    setProfileLoading(true);
    fetchUserProfile().then(p => {
      setProfile(p);
      setProfileLoading(false);
    });
  }, []);

  // Also refresh profile when modal is opened
  useEffect(() => {
    if (profileModal) {
      setProfileLoading(true);
      fetchUserProfile().then(p => {
        setProfile(p);
        setProfileLoading(false);
      });
    }
  }, [profileModal]);

  // Subscribe to reminder changes and refresh reminders automatically
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      refresh();
    });
    return unsubscribe;
  }, [subscribe, refresh]);

  return (
    <LinearGradient colors={["#EEF4FF", "#FFFFFF"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.dashboardHeader}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Pressable onPress={() => setProfileModal(true)} style={styles.avatarBtn} accessibilityLabel="Profile">
              <Image
                source={AVATAR_PLACEHOLDER}
                style={styles.avatar}
              />
            </Pressable>
            <NotificationBell onPress={() => setNotificationsVisible(true)} />
  <NotificationsSheet visible={notificationsVisible} onClose={() => setNotificationsVisible(false)} />
          </View>
          <Text style={[type.h1, { marginTop: 18 }]}>Welcome{profile && profile.name ? `, ${profile.name}` : ''}</Text>
          <Text style={[type.meta, { marginBottom: 18 }]}>How is it going today?</Text>
          <Pressable style={styles.cta} android_ripple={{ color: colors.primary600 }} onPress={() => setUrgentCareModal(true)}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Urgent Care</Text>
          </Pressable>
        {/* Urgent Care Modal/Sheet */}
        <Modal visible={urgentCareModal} animationType="slide" transparent onRequestClose={() => setUrgentCareModal(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.08)', justifyContent: 'flex-end' }}>
            <View style={styles.facilityModalSheet}>
              <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 22, color: colors.text }}>Urgent Care</Text>
                  <Pressable onPress={() => setUrgentCareModal(false)} hitSlop={10}>
                    <Text style={{ color: colors.muted, fontWeight: '600', fontSize: 16 }}>Close</Text>
                  </Pressable>
                </View>
                {/* Emergency Contacts */}
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: colors.text }}>Emergency Contacts</Text>
                <View style={{ marginBottom: spacing.lg }}>
                  {profile && profile.emergency_contacts && profile.emergency_contacts.length > 0 ? (
                    profile.emergency_contacts.map((contact, idx) => (
                      <View key={idx} style={{ marginBottom: 8 }}>
                        <Text style={{ color: colors.text, fontWeight: '600' }}>{contact.name}</Text>
                        <Text style={{ color: colors.muted }}>{contact.phone}</Text>
                        <Text style={{ color: colors.muted }}>{contact.relationship}</Text>
                        <Pressable onPress={() => Linking.openURL(`tel:${contact.phone}`)} style={{ marginTop: 2 }}>
                          <Text style={{ color: colors.primary, fontWeight: '600' }}>Call</Text>
                        </Pressable>
                      </View>
                    ))
                  ) : (
                    <Text style={{ color: colors.muted }}>No emergency contacts listed.</Text>
                  )}
                </View>
                {/* Open & Nearby Facilities */}
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: colors.text }}>Open & Nearby Facilities</Text>
                <View style={{ marginBottom: spacing.lg }}>
                  {sortByDistance(facilities.filter(f => f.isOpen && (f.type === 'clinic' || f.type === 'hospital' || f.type === 'pharmacy'))).map((fac: Facility) => (
                    <View key={fac.id} style={{ marginBottom: 12 }}>
                      <Text style={{ color: colors.text, fontWeight: '600' }}>{fac.name} <Text style={{ color: colors.muted, fontWeight: '400' }}>({fac.type})</Text></Text>
                      <Text style={{ color: colors.muted }}>{fac.location}</Text>
                      {'phoneNumber' in fac && fac.phoneNumber && <Text style={{ color: colors.muted }}>Phone: {fac.phoneNumber}</Text>}
                      <Text style={{ color: colors.muted }}>Distance: {fac.distance || 'N/A'}</Text>
                      {'phoneNumber' in fac && fac.phoneNumber && (
                        <Pressable onPress={() => Linking.openURL(`tel:${fac.phoneNumber}`)} style={{ marginTop: 2 }}>
                          <Text style={{ color: colors.primary, fontWeight: '600' }}>Call</Text>
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
              <Text style={styles.serviceLabel}>Consultation</Text>
            </View>
            <View style={styles.serviceItem}>
              <Text style={styles.serviceIcon}>💊</Text>
              <Text style={styles.serviceLabel}>Medicines</Text>
            </View>
            <View style={styles.serviceItem}>
              <Text style={styles.serviceIcon}>🚑</Text>
              <Text style={styles.serviceLabel}>Ambulance</Text>
            </View>
          </View>
        </View>

        <View style={styles.appointmentCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontWeight: '700', fontSize: 17, color: colors.text }}>Reminders</Text>
          </View>
          {remindersLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : remindersError ? (
            <Text style={{ color: colors.danger }}>{remindersError}</Text>
          ) : reminders.filter(r => r.active).length === 0 ? (
            <Text style={{ color: colors.muted }}>No reminders found.</Text>
          ) : reminders.filter(r => r.active).map(rem => (
            <View key={rem.id} style={{ backgroundColor: '#F3F4F6', borderRadius: 16, padding: 14, marginBottom: 10 }}>
              <Text style={{ fontWeight: '600', color: colors.text }}>{rem.title}</Text>
              <Text style={{ color: colors.muted, fontSize: 13 }}>{rem.datetime}{rem.frequency ? `  b7 ${rem.frequency}` : ''}</Text>
              {rem.description && <Text style={{ color: colors.muted, fontSize: 13 }}>{rem.description}</Text>}
            </View>
          ))}
        </View>
        {/* My Medications Section */}
        <View style={styles.appointmentCard}>
          <Text style={{ fontWeight: '700', fontSize: 17, color: colors.text, marginBottom: 8 }}>My Medications</Text>
          <MyMedicationsList />
        </View>

        {/* Profile Modal */}
        <Modal visible={profileModal} animationType="slide" transparent onRequestClose={() => setProfileModal(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.08)', justifyContent: 'flex-end' }}>
            <View style={styles.facilityModalSheet}>
              <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 22, color: colors.text }}>Profile</Text>
                  <Pressable onPress={() => setProfileModal(false)} hitSlop={10}>
                    <Text style={{ color: colors.muted, fontWeight: '600', fontSize: 16 }}>Close</Text>
                  </Pressable>
                </View>
                <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
                  <Image
                    source={AVATAR_PLACEHOLDER}
                    style={styles.profileAvatar}
                  />
                  {profileLoading ? (
                    <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />
                  ) : profile ? (
                    <>
                      <Text style={{ fontWeight: '700', fontSize: 22, color: colors.text, marginTop: 8 }}>{profile.name}</Text>
                      <Text style={{ color: colors.muted }}>{profile.email}</Text>
                      <Text style={{ color: colors.muted }}>{profile.phone}</Text>
                      <Text style={{ color: colors.muted }}>{profile.date_of_birth}</Text>
                    </>
                  ) : (
                    <Text style={{ color: colors.muted, marginTop: 12 }}>No profile found</Text>
                  )}
                </View>
                {/* Allergies Section */}
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: colors.text }}>Allergies</Text>
                <View style={{ marginBottom: spacing.lg }}>
                  {profile && profile.allergies && profile.allergies.length > 0 ? (
                    profile.allergies.map((allergy, idx) => (
                      <Text key={idx} style={{ color: colors.muted, fontSize: 15, marginBottom: 2 }}>• {allergy}</Text>
                    ))
                  ) : (
                    <Text style={{ color: colors.muted }}>No allergies listed.</Text>
                  )}
                </View>
                {/* Urgent Contact Section */}
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: colors.text }}>Urgent Contact</Text>
                <View style={{ marginBottom: spacing.lg }}>
                  {profile && profile.emergency_contacts && profile.emergency_contacts.length > 0 ? (
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
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: '#fff',
    borderRadius: 24,
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
    backgroundColor: '#fff',
    borderRadius: 24,
    marginHorizontal: spacing.xl,
    marginTop: 24,
    padding: 18,
    ...shadow.card,
  },
  appointmentItem: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 14,
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
    backgroundColor: '#fff',
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
    backgroundColor: '#fff',
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
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
    marginBottom: 8,
    resizeMode: 'cover',
  },
  cta: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadow.card,
  },
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
