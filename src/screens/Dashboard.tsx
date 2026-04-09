import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  Image as RNImage, Animated, ImageBackground,
} from 'react-native';
import SkeletonImage from '../components/SkeletonImage';
import {
  SkeletonHeroCard,
  SkeletonProgressCard,
  SkeletonReminderCardLarge,
  SkeletonFacilityCardLarge,
} from '../components/SkeletonLoaders';
import { useLoading } from '../hooks/LoadingContext';
import { useToast } from '../hooks/useToast';
import { fetchUserProfile, type Profile } from '../core/userProfile';
import { useFacilities } from '../hooks/useFacilitiesFirestore';
import type { Facility } from '../types';
import { useReminders } from '../hooks/useReminders';
import NotificationBell from '../notifications/NotificationBell';
import NotificationsSheet from '../notifications/NotificationsSheet';
const AVATAR_PLACEHOLDER = require('../assets/avatar-placeholder.png');
import { LinearGradient } from 'expo-linear-gradient';
import ScreenContainer from '../components/ScreenContainer';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getTodayStats } from '../core/completion';
import { colors, spacing, shadow, radius } from '../theme';
import { useTranslation } from 'react-i18next';
import { useRTL } from '../hooks/useRTL';

function sortByDistance(list: Facility[]): Facility[] {
  return list.slice().sort((a, b) => {
    const da = parseFloat((a.distance || '').replace(/[^\d.]/g, ''));
    const db = parseFloat((b.distance || '').replace(/[^\d.]/g, ''));
    return da - db;
  });
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard({ navigation }: any) {
  const { t } = useTranslation();
  const { isRTL, textAlign } = useRTL();
  const { showInfo } = useToast();
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const { startLoading, finishLoading } = useLoading();
  const _prefetched = useRef(new Set<string>());
  const { reminders, loading: remindersLoading, refresh, subscribe } = useReminders();
  const { facilities, loading: facilitiesLoading } = useFacilities();

  /* ── Entrance animation ─────────────────────── */
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 8, delay: 60 }),
    ]).start();
  }, []);

  /* ── Profile fetch ──────────────────────────── */
  useEffect(() => {
    let mounted = true;
    const key = 'dashboard-profile';
    startLoading(key);
    (async () => {
      try {
        const p = await fetchUserProfile();
        if (!mounted) return;
        setProfile(p);
        const uri = (p as any)?.image || (p as any)?.avatar;
        if (uri && !_prefetched.current.has(uri)) {
          const imgKey = 'profile-image';
          startLoading(imgKey);
          try { await RNImage.prefetch(uri); _prefetched.current.add(uri); }
          catch {}
          finally { finishLoading(imgKey); }
        }
      } catch {}
      finally { finishLoading(key); }
    })();
    return () => { mounted = false; };
  }, [startLoading, finishLoading]);

  useEffect(() => {
    const unsub = subscribe(() => refresh());
    return unsub;
  }, [subscribe, refresh]);

  /* ── Computed ───────────────────────────────── */
  const activeReminders = reminders?.filter(r => r.active) ?? [];
  const [pillsDone, setPillsDone] = useState({ done: 0, total: 0 });
  useEffect(() => {
    (async () => {
      const stats = await getTodayStats(activeReminders.map(r => r.id));
      setPillsDone(stats);
    })();
  }, [activeReminders.length]);

  const progress    = pillsDone.total ? pillsDone.done / pillsDone.total : 0;
  const firstName   = profile?.name?.split(' ')[0] ?? '';
  const getTime     = (dt: string) => dt?.match(/(\d{2}:\d{2})/)?.[1] ?? '';
  const nearbyOpen  = sortByDistance(facilities.filter(f => f.isOpen)).slice(0, 5);

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.content}>

      {/* ── Header ─────────────────────────────────────────── */}
      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.welcomeText, { textAlign }]}>
            {t('dashboard.welcome', getGreeting())}
          </Text>
          <Text style={[styles.greeting, { textAlign }]} numberOfLines={1}>
            {firstName ? `Hello, ${firstName}!` : t('common.hello', 'Hello!')}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <NotificationBell onPress={() => setNotificationsVisible(true)} />
          <Pressable
            onPress={() => navigation.navigate('UserProfile')}
            style={styles.avatarBtn}
          >
            <SkeletonImage source={AVATAR_PLACEHOLDER} style={styles.avatar} resizeMode="cover" />
          </Pressable>
        </View>
      </Animated.View>

      {/* ── Search bar ─────────────────────────────────────── */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <Pressable
          style={styles.searchBar}
          onPress={() => showInfo(t('common.search', 'Search'), t('common.searchFunctionality', 'Coming soon!'))}
        >
          <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
          <Text style={styles.searchText}>
            {t('common.searchDoctorsAndClinics', 'Search medications, doctors...')}
          </Text>
        </Pressable>
      </Animated.View>

      {/* ── Next appointment banner ─────────────────────────── */}
      {remindersLoading ? (
        <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: spacing.xl }}>
          <SkeletonHeroCard />
        </Animated.View>
      ) : activeReminders.length > 0 ? (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Pressable
            style={({ pressed }) => [styles.apptBanner, pressed && { opacity: 0.9 }]}
            onPress={() => navigation.navigate('Reminders')}
          >
            <LinearGradient
              colors={[colors.primary, colors.primary700]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Icon */}
            <View style={styles.apptIconWrap}>
              <Ionicons name="medical-outline" size={20} color={colors.primary} />
            </View>
            {/* Text */}
            <View style={{ flex: 1 }}>
              <Text style={styles.apptLabel}>{t('dashboard.nextDose', 'Next appointment')}</Text>
              <Text style={styles.apptTitle} numberOfLines={1}>{activeReminders[0].title}</Text>
              {getTime(activeReminders[0].datetime) ? (
                <Text style={styles.apptTime}>
                  🕐 {getTime(activeReminders[0].datetime)}
                  {activeReminders[0].frequency ? `  ·  ${activeReminders[0].frequency}` : ''}
                </Text>
              ) : null}
            </View>
            {/* Arrow */}
            <View style={styles.apptArrow}>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </View>
          </Pressable>
        </Animated.View>
      ) : null}

      {/* ── Category pills ──────────────────────────────────── */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}
        >
          {([
            { lib: 'mci', icon: 'barcode-scan',    label: t('scanner.scan', 'Scan'),        bg: colors.primary,  nav: () => navigation.navigate('Barcode') },
            { lib: 'ion', icon: 'alarm-outline',   label: t('navigation.reminders', 'Schedule'), bg: '#7C6FE0',  nav: () => navigation.navigate('Reminders') },
            { lib: 'ion', icon: 'business-outline',label: t('facilities.title', 'Clinics'),  bg: '#F59E0B',       nav: () => navigation.navigate('Clinics') },
            { lib: 'ion', icon: 'pulse-outline',   label: t('dashboard.urgentCare', 'Urgent'), bg: '#EF4444',    nav: () => navigation.navigate('Clinics') },
            { lib: 'ion', icon: 'person-outline',  label: t('profile.title', 'Profile'),    bg: '#22C55E',        nav: () => navigation.navigate('UserProfile') },
          ] as const).map((cat, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [styles.catItem, pressed && { opacity: 0.75 }]}
              onPress={cat.nav}
            >
              <View style={[styles.catCircle, { backgroundColor: cat.bg }]}>
                {cat.lib === 'mci'
                  ? <MaterialCommunityIcons name={cat.icon as any} size={20} color="#fff" />
                  : <Ionicons name={cat.icon as any} size={20} color="#fff" />}
              </View>
              <Text style={styles.catLabel}>{cat.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>

      {/* ── Today's progress ────────────────────────────────── */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {remindersLoading ? (
          <SkeletonProgressCard />
        ) : (
          <View style={styles.progressCard}>
            <View style={styles.progressCardHead}>
              <View>
                <Text style={styles.progressTitle}>{t('dashboard.todayProgress', "Today's Progress")}</Text>
                <Text style={styles.progressSub}>
                  {pillsDone.done} {t('common.of', 'of')} {pillsDone.total} {t('dashboard.dosesCompleted', 'doses done')}
                </Text>
              </View>
              {progress >= 1 && (
                <View style={styles.allDoneBadge}>
                  <Ionicons name="checkmark-circle" size={13} color={colors.primary} />
                  <Text style={styles.allDoneText}>{t('dashboard.done', 'All done!')}</Text>
                </View>
              )}
            </View>
            {/* Track */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` as any }]} />
            </View>
            {/* Stats */}
            <View style={styles.statRow}>
              {([
                { num: pillsDone.done, label: t('dashboard.completedToday', 'Done') },
                { num: pillsDone.total, label: t('dashboard.total', 'Total') },
                { num: Math.max(pillsDone.total - pillsDone.done, 0), label: t('dashboard.pendingReminders', 'Pending') },
              ]).map((s, i) => (
                <View key={i} style={styles.statItem}>
                  <Text style={styles.statNum}>{s.num}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Animated.View>

      {/* ── Upcoming reminders ───────────────────────────────── */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>{t('dashboard.upcomingReminders', 'Upcoming')}</Text>
            <Pressable onPress={() => navigation.navigate('Reminders')}>
              <Text style={styles.sectionLink}>{t('dashboard.viewAll', 'View all')}</Text>
            </Pressable>
          </View>

          {remindersLoading ? (
            <View style={styles.cardList}>
              <SkeletonReminderCardLarge />
              <SkeletonReminderCardLarge />
            </View>
          ) : activeReminders.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="calendar-outline" size={28} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>{t('dashboard.noReminders', 'No reminders yet')}</Text>
              <Text style={styles.emptyHint}>{t('dashboard.addRemindersHint', 'Add your first reminder to get started')}</Text>
              <Pressable style={styles.emptyCTA} onPress={() => navigation.navigate('Reminders')}>
                <Text style={styles.emptyCTAText}>{t('reminders.create', 'Add Reminder')}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.cardList}>
              {activeReminders.slice(0, 3).map(rem => (
                <Pressable
                  key={rem.id}
                  style={({ pressed }) => [styles.reminderRow, pressed && { opacity: 0.82 }]}
                  onPress={() => navigation.navigate('Reminders')}
                >
                  <View style={styles.reminderIconCircle}>
                    <Ionicons name="medical-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reminderName} numberOfLines={1}>{rem.title}</Text>
                    <Text style={styles.reminderMeta}>
                      {getTime(rem.datetime) || rem.datetime}
                      {rem.frequency ? `  ·  ${rem.frequency}` : ''}
                    </Text>
                  </View>
                  {getTime(rem.datetime) ? (
                    <View style={styles.timePill}>
                      <Text style={styles.timePillText}>{getTime(rem.datetime)}</Text>
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </Animated.View>

      {/* ── Nearby facilities ────────────────────────────────── */}
      {(facilitiesLoading || nearbyOpen.length > 0) && (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>{t('facilities.nearbyFacilities', 'Nearby')}</Text>
              <Pressable onPress={() => navigation.navigate('Clinics')}>
                <Text style={styles.sectionLink}>{t('dashboard.viewAll', 'View all')}</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.facilityRow}
              decelerationRate="fast"
              snapToInterval={200 + spacing.md}
            >
              {facilitiesLoading ? (
                <><SkeletonFacilityCardLarge /><SkeletonFacilityCardLarge /></>
              ) : nearbyOpen.map(fac => (
                <Pressable
                  key={fac.id}
                  style={({ pressed }) => [styles.facilityCard, pressed && { opacity: 0.85 }]}
                  onPress={() => navigation.navigate('Clinics')}
                >
                  <ImageBackground
                    source={{ uri: fac.image || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400' }}
                    style={styles.facilityImg}
                    imageStyle={styles.facilityImgStyle}
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.60)']}
                      style={styles.facilityGrad}
                    >
                      <View style={styles.openPill}>
                        <View style={styles.openDot} />
                        <Text style={styles.openText}>{t('facilities.open', 'Open')}</Text>
                      </View>
                    </LinearGradient>
                  </ImageBackground>
                  <View style={styles.facilityInfo}>
                    <Text style={styles.facilityName} numberOfLines={1}>{fac.name}</Text>
                    <View style={styles.facilityMeta}>
                      <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
                      <Text style={styles.facilityDist}>{fac.distance || '—'}</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Animated.View>
      )}

      <NotificationsSheet visible={notificationsVisible} onClose={() => setNotificationsVisible(false)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 110, gap: spacing.xl },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.6,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },

  /* Search */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    borderRadius: radius.pill,
    gap: spacing.sm,
    ...shadow.card,
  },
  searchText: { flex: 1, fontSize: 14, color: colors.textTertiary, fontWeight: '400' },

  /* Appointment banner */
  apptBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    overflow: 'hidden',
    ...shadow.primary,
  },
  apptIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  apptLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.75)', letterSpacing: 0.3 },
  apptTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginTop: 2 },
  apptTime:  { fontSize: 12, color: 'rgba(255,255,255,0.82)', marginTop: 3 },
  apptArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Category pills */
  catRow:   { paddingHorizontal: spacing.xl, gap: spacing.xl },
  catItem:  { alignItems: 'center', gap: 6, minWidth: 52 },
  catCircle:{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  catLabel: { fontSize: 10, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },

  /* Progress card */
  progressCard: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.xl,
    padding: spacing.xl,
    borderRadius: radius.xxl,
    gap: spacing.lg,
    ...shadow.card,
  },
  progressCardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  progressTitle:    { fontSize: 16, fontWeight: '700', color: colors.text },
  progressSub:      { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
  allDoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary100,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  allDoneText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  progressTrack: { height: 8, backgroundColor: colors.bgSecondary, borderRadius: radius.pill, overflow: 'hidden' },
  progressFill:  { height: '100%' as any, backgroundColor: colors.primary, borderRadius: radius.pill },
  statRow:  { flexDirection: 'row', gap: spacing.sm },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.primary50,
    borderRadius: radius.lg,
    gap: 2,
  },
  statNum:  { fontSize: 18, fontWeight: '800', color: colors.primary },
  statLabel:{ fontSize: 10, fontWeight: '500', color: colors.textSecondary, textAlign: 'center' },

  /* Section */
  section:     { gap: spacing.md },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  sectionLink:  { fontSize: 13, fontWeight: '600', color: colors.primary },

  /* Reminder cards */
  cardList: { gap: spacing.sm, paddingHorizontal: spacing.xl },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: radius.xl,
    gap: spacing.md,
    ...shadow.card,
  },
  reminderIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderName: { fontSize: 14, fontWeight: '600', color: colors.text },
  reminderMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  timePill: {
    backgroundColor: colors.primary100,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  timePillText: { fontSize: 11, fontWeight: '700', color: colors.primary },

  /* Empty state */
  emptyBox: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.card,
    marginHorizontal: spacing.xl,
    borderRadius: radius.xxl,
    ...shadow.card,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text, textAlign: 'center' },
  emptyHint:  { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 19 },
  emptyCTA: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
    ...shadow.primary,
  },
  emptyCTAText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  /* Facilities */
  facilityRow:    { paddingHorizontal: spacing.xl, gap: spacing.md },
  facilityCard:   { width: 200, borderRadius: radius.xl, backgroundColor: colors.card, overflow: 'hidden', ...shadow.card },
  facilityImg:    { height: 120 },
  facilityImgStyle: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  facilityGrad:   { flex: 1, justifyContent: 'flex-end', padding: spacing.sm },
  openPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.93)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  openDot:  { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.success },
  openText: { fontSize: 10, fontWeight: '600', color: colors.text },
  facilityInfo: { padding: spacing.md, gap: 3 },
  facilityName: { fontSize: 13, fontWeight: '600', color: colors.text },
  facilityMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  facilityDist: { fontSize: 11, color: colors.textTertiary },
});
