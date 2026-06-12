import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  Image as RNImage, Animated, Easing, ImageBackground,
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

  /* Animated progress fill — eases in rather than snapping */
  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

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
            style={({ pressed }) => [styles.apptBanner, pressed && { opacity: 0.92 }]}
            onPress={() => navigation.navigate('Reminders')}
          >
            <LinearGradient
              colors={[colors.primary, colors.primary700]}
              start={{ x: 0, y: 0 }} end={{ x: 0.8, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Top row: label pill + arrow */}
            <View style={styles.apptTopRow}>
              <View style={styles.apptLabelPill}>
                <Ionicons name="medical-outline" size={13} color="#fff" />
                <Text style={styles.apptLabel}>{t('dashboard.nextDose', 'Next appointment')}</Text>
              </View>
              <View style={styles.apptArrow}>
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </View>
            </View>
            {/* Bottom: title + time + CTA */}
            <View style={styles.apptBottom}>
              <Text style={styles.apptTitle} numberOfLines={2}>{activeReminders[0].title}</Text>
              <View style={styles.apptFootRow}>
                {getTime(activeReminders[0].datetime) ? (
                  <View style={styles.apptTimeRow}>
                    <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.80)" />
                    <Text style={styles.apptTime}>
                      {getTime(activeReminders[0].datetime)}
                      {activeReminders[0].frequency ? `  ·  ${activeReminders[0].frequency}` : ''}
                    </Text>
                  </View>
                ) : <View />}
                <View style={styles.apptCTA}>
                  <Text style={styles.apptCTAText}>{t('dashboard.viewSchedule', 'View schedule')}</Text>
                </View>
              </View>
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
            { lib: 'mci', icon: 'barcode-scan',    label: t('scanner.scan', 'Scan'),             nav: () => navigation.navigate('Barcode') },
            { lib: 'ion', icon: 'alarm-outline',   label: t('navigation.reminders', 'Schedule'), nav: () => navigation.navigate('Reminders') },
            { lib: 'ion', icon: 'business-outline',label: t('facilities.title', 'Clinics'),       nav: () => navigation.navigate('Clinics') },
            { lib: 'ion', icon: 'pulse-outline',   label: t('dashboard.urgentCare', 'Urgent'),    nav: () => navigation.navigate('Clinics') },
            { lib: 'ion', icon: 'person-outline',  label: t('profile.title', 'Profile'),          nav: () => navigation.navigate('UserProfile') },
          ] as const).map((cat, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [styles.catItem, pressed && { opacity: 0.7 }]}
              onPress={cat.nav}
            >
              <View style={styles.catCircle}>
                {cat.lib === 'mci'
                  ? <MaterialCommunityIcons name={cat.icon as any} size={20} color={colors.text} />
                  : <Ionicons name={cat.icon as any} size={20} color={colors.text} />}
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
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              />
            </View>
            {/* Stats */}
            <View style={styles.statRow}>
              {([
                { num: pillsDone.done, label: t('dashboard.completedToday', 'Done') },
                { num: pillsDone.total, label: t('dashboard.total', 'Total') },
                { num: Math.max(pillsDone.total - pillsDone.done, 0), label: t('dashboard.pendingReminders', 'Pending') },
              ]).map((s, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <View style={styles.statDivider} />}
                  <View style={styles.statItem}>
                    <Text style={styles.statNum}>{s.num}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                </React.Fragment>
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
                    <Ionicons name="medical-outline" size={17} color={colors.textSecondary} />
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
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.line,
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  searchText: { flex: 1, fontSize: 14, color: colors.textTertiary, fontWeight: '400' },

  /* Appointment banner — hero-sized to match the loading skeleton */
  apptBanner: {
    minHeight: 180,
    justifyContent: 'space-between',
    marginHorizontal: spacing.xl,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    overflow: 'hidden',
    ...shadow.card,
  },
  apptTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  apptLabelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  apptLabel: { fontSize: 12, fontWeight: '600', color: '#fff', letterSpacing: 0.2 },
  apptBottom: { gap: spacing.md },
  apptTitle: { fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: -0.3, lineHeight: 28 },
  apptFootRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  apptTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  apptTime:  { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.80)' },
  apptCTA: {
    backgroundColor: '#fff',
    paddingHorizontal: spacing.lg,
    height: 36,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apptCTAText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  apptArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Category pills */
  catRow:   { paddingHorizontal: spacing.xl, gap: spacing.lg },
  catItem:  { alignItems: 'center', gap: 7, minWidth: 52 },
  catCircle:{
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  catLabel: { fontSize: 11, fontWeight: '500', color: colors.textSecondary, textAlign: 'center' },

  /* Progress card */
  progressCard: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow.card,
  },
  progressCardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  progressTitle:    { fontSize: 16, fontWeight: '700', color: colors.text },
  progressSub:      { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
  allDoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  allDoneText: { fontSize: 11, fontWeight: '600', color: colors.success },
  progressTrack: { height: 6, backgroundColor: colors.bgSecondary, borderRadius: radius.pill, overflow: 'hidden' },
  progressFill:  { height: '100%' as any, backgroundColor: colors.primary, borderRadius: radius.pill },
  statRow:  { flexDirection: 'row', alignItems: 'center' },
  statDivider: { width: StyleSheet.hairlineWidth, height: 28, backgroundColor: colors.line },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: 1,
  },
  statNum:  { fontSize: 20, fontWeight: '700', color: colors.text },
  statLabel:{ fontSize: 11, fontWeight: '400', color: colors.textSecondary, textAlign: 'center' },

  /* Section */
  section:     { gap: spacing.md },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  sectionLink:  { fontSize: 13, fontWeight: '500', color: colors.primary },

  /* Reminder cards */
  cardList: { gap: spacing.sm, paddingHorizontal: spacing.xl },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: radius.xl,
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    ...shadow.card,
  },
  reminderIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderName: { fontSize: 14, fontWeight: '600', color: colors.text },
  reminderMeta: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  timePill: {
    backgroundColor: colors.bgSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.md,
  },
  timePillText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },

  /* Empty state */
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.card,
    marginHorizontal: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, textAlign: 'center' },
  emptyHint:  { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  emptyCTA: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: 11,
    borderRadius: radius.lg,
    marginTop: spacing.xs,
    height: 44,
    justifyContent: 'center',
  },
  emptyCTAText: { fontSize: 14, fontWeight: '600', color: '#fff' },

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
