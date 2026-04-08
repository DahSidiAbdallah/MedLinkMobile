import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  Image as RNImage, Animated, ImageBackground,
} from 'react-native';
import SkeletonImage from '../components/SkeletonImage';
import {
  SkeletonHeroCard,
  SkeletonQuickAction,
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
import { colors, spacing, shadow, radius, animation } from '../theme';
import { useTranslation } from 'react-i18next';
import { useRTL } from '../hooks/useRTL';

function sortByDistance(list: Facility[]): Facility[] {
  return list.slice().sort((a, b) => {
    const da = parseFloat((a.distance || '').replace(/[^\d.]/g, ''));
    const db = parseFloat((b.distance || '').replace(/[^\d.]/g, ''));
    return da - db;
  });
}

export default function Dashboard({ navigation }: any) {
  const { t } = useTranslation();
  const { isRTL, textAlign } = useRTL();
  const { showInfo } = useToast();
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const { startLoading, finishLoading } = useLoading();
  const _prefetched = useRef(new Set<string>());
  const { reminders, loading: remindersLoading, error: remindersError, refresh, subscribe } = useReminders();
  const { facilities, loading: facilitiesLoading } = useFacilities();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 8, delay: 60 }),
    ]).start();
  }, []);

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
          catch (e) { console.debug('Avatar prefetch failed', e); }
          finally { finishLoading(imgKey); }
        }
      } catch (e) { console.error('Profile fetch error', e); }
      finally { finishLoading(key); }
    })();
    return () => { mounted = false; };
  }, [startLoading, finishLoading]);

  useEffect(() => {
    const unsub = subscribe(() => refresh());
    return unsub;
  }, [subscribe, refresh]);

  const activeReminders = reminders?.filter(r => r.active) ?? [];
  const [pillsDone, setPillsDone] = useState({ done: 0, total: 0 });
  useEffect(() => {
    (async () => {
      const stats = await getTodayStats(activeReminders.map(r => r.id));
      setPillsDone(stats);
    })();
  }, [activeReminders.length]);
  const progress = pillsDone.total ? pillsDone.done / pillsDone.total : 0;
  const firstName = profile?.name?.split(' ')[0] ?? '';

  const getTime = (dt: string) => dt?.match(/(\d{2}:\d{2})/)?.[1] ?? '';

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.content}>

      {/* ── Header ─────────────────────────────────────── */}
      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greetingSub, { textAlign }]}>{t('dashboard.welcome', 'Good morning')} 👋</Text>
          <Text style={[styles.greeting, { textAlign }]} numberOfLines={1}>
            {firstName
              ? `${t('common.hello', 'Hello')}, ${firstName}!`
              : `${t('common.hello', 'Hello')}!`}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <NotificationBell onPress={() => setNotificationsVisible(true)} />
          <Pressable onPress={() => navigation.navigate('UserProfile')} style={styles.avatarBtn}>
            <SkeletonImage source={AVATAR_PLACEHOLDER} style={styles.avatar} resizeMode="cover" />
          </Pressable>
        </View>
      </Animated.View>

      {/* ── Search Bar ─────────────────────────────────── */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <Pressable
          style={styles.searchBar}
          onPress={() => showInfo(t('common.search', 'Search'), t('common.searchFunctionality', 'Coming soon!'))}
        >
          <Ionicons name="search-outline" size={20} color={colors.textTertiary} />
          <Text style={styles.searchText}>
            {t('common.searchDoctorsAndClinics', 'Search medications, doctors...')}
          </Text>
        </Pressable>
      </Animated.View>

      {/* ── Next Dose Banner ───────────────────────────── */}
      {remindersLoading ? (
        <Animated.View style={{ opacity: fadeAnim }}>
          <SkeletonHeroCard />
        </Animated.View>
      ) : activeReminders.length > 0 ? (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Pressable
            style={({ pressed }) => [styles.nextDoseCard, pressed && { opacity: 0.9 }]}
            onPress={() => navigation.navigate('Reminders')}
          >
            <View style={styles.nextDoseIconWrap}>
              <Ionicons name="medkit-outline" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nextDoseLabel}>{t('dashboard.nextDose', 'Next dose')}</Text>
              <Text style={styles.nextDoseTitle} numberOfLines={1}>{activeReminders[0].title}</Text>
              {getTime(activeReminders[0].datetime) ? (
                <Text style={styles.nextDoseTime}>
                  {getTime(activeReminders[0].datetime)}
                  {activeReminders[0].frequency ? `  ·  ${activeReminders[0].frequency}` : ''}
                </Text>
              ) : null}
            </View>
            <View style={styles.nextDoseArrow}>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </View>
          </Pressable>
        </Animated.View>
      ) : null}

      {/* ── Category Strip ─────────────────────────────── */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {([
            { lib: 'mci', icon: 'barcode-scan', label: t('scanner.scan', 'Scan'), bg: colors.primary, nav: () => navigation.navigate('Barcode') },
            { lib: 'ion', icon: 'alarm-outline', label: t('navigation.reminders', 'Schedule'), bg: '#7C6FE0', nav: () => navigation.navigate('Reminders') },
            { lib: 'ion', icon: 'business-outline', label: t('facilities.title', 'Clinics'), bg: '#F59E0B', nav: () => navigation.navigate('Clinics') },
            { lib: 'ion', icon: 'pulse-outline', label: t('dashboard.urgentCare', 'Urgent'), bg: '#EF4444', nav: () => navigation.navigate('Clinics') },
            { lib: 'ion', icon: 'person-outline', label: t('profile.title', 'Profile'), bg: '#22C55E', nav: () => navigation.navigate('UserProfile') },
          ] as const).map((cat, i) => (
            <Pressable key={i} style={({ pressed }) => [styles.categoryItem, pressed && { opacity: 0.75 }]} onPress={cat.nav}>
              <View style={[styles.categoryCircle, { backgroundColor: cat.bg }]}>
                {cat.lib === 'mci'
                  ? <MaterialCommunityIcons name={cat.icon as any} size={22} color="#fff" />
                  : <Ionicons name={cat.icon as any} size={22} color="#fff" />}
              </View>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>

      {/* ── Today's Progress ───────────────────────────── */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {remindersLoading ? <SkeletonProgressCard /> : (
          <View style={styles.progressCard}>
            <View style={styles.progressCardHeader}>
              <View>
                <Text style={styles.progressTitle}>{t('dashboard.todayProgress', "Today's Progress")}</Text>
                <Text style={styles.progressSubtitle}>
                  {pillsDone.done} {t('common.of', 'of')} {pillsDone.total} {t('dashboard.dosesCompleted', 'doses done')}
                </Text>
              </View>
              {progress >= 1 && (
                <View style={styles.doneBadge}>
                  <Ionicons name="checkmark-circle" size={15} color={colors.primary} />
                  <Text style={styles.doneBadgeText}>{t('dashboard.done', 'Done!')}</Text>
                </View>
              )}
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` as any }]} />
            </View>
            <View style={styles.progressStats}>
              {([
                { num: pillsDone.done, label: t('dashboard.completedToday', 'Done') },
                { num: pillsDone.total, label: t('dashboard.total', 'Total') },
                { num: Math.max(pillsDone.total - pillsDone.done, 0), label: t('dashboard.pendingReminders', 'Pending') },
              ]).map((s, i) => (
                <View key={i} style={styles.progressStat}>
                  <Text style={styles.progressStatNum}>{s.num}</Text>
                  <Text style={styles.progressStatLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Animated.View>

      {/* ── Upcoming Reminders ─────────────────────────── */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('dashboard.upcomingReminders', 'Upcoming')}</Text>
            <Pressable onPress={() => navigation.navigate('Reminders')}>
              <Text style={styles.sectionLink}>{t('dashboard.viewAll', 'View all')}</Text>
            </Pressable>
          </View>

          {remindersLoading ? (
            <View style={styles.list}>
              <SkeletonReminderCardLarge />
              <SkeletonReminderCardLarge />
            </View>
          ) : activeReminders.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="calendar-outline" size={36} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>{t('dashboard.noReminders', 'No reminders yet')}</Text>
              <Text style={styles.emptyHint}>{t('dashboard.addRemindersHint', 'Add your first reminder to get started')}</Text>
              <Pressable style={styles.emptyCTA} onPress={() => navigation.navigate('Reminders')}>
                <Text style={styles.emptyCTAText}>{t('reminders.create', 'Add Reminder')}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.list}>
              {activeReminders.slice(0, 3).map(rem => (
                <Pressable
                  key={rem.id}
                  style={({ pressed }) => [styles.reminderCard, pressed && { opacity: 0.85 }]}
                  onPress={() => navigation.navigate('Reminders')}
                >
                  <View style={styles.reminderIconWrap}>
                    <Ionicons name="medical-outline" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.reminderContent}>
                    <Text style={styles.reminderTitle} numberOfLines={1}>{rem.title}</Text>
                    <Text style={styles.reminderMeta}>
                      {getTime(rem.datetime) || rem.datetime}
                      {rem.frequency ? `  ·  ${rem.frequency}` : ''}
                    </Text>
                  </View>
                  {getTime(rem.datetime) ? (
                    <View style={styles.reminderTimeBadge}>
                      <Text style={styles.reminderTimeBadgeText}>{getTime(rem.datetime)}</Text>
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </Animated.View>

      {/* ── Nearby Facilities ──────────────────────────── */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('facilities.nearbyFacilities', 'Nearby')}</Text>
            <Pressable onPress={() => navigation.navigate('Clinics')}>
              <Text style={styles.sectionLink}>{t('dashboard.viewAll', 'View all')}</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.facilityScroll}
            decelerationRate="fast"
            snapToInterval={210 + spacing.md}
          >
            {facilitiesLoading ? (
              <><SkeletonFacilityCardLarge /><SkeletonFacilityCardLarge /></>
            ) : sortByDistance(facilities.filter(f => f.isOpen)).slice(0, 5).map(fac => (
              <Pressable
                key={fac.id}
                style={({ pressed }) => [styles.facilityCard, pressed && { opacity: 0.88 }]}
                onPress={() => navigation.navigate('Clinics')}
              >
                <ImageBackground
                  source={{ uri: fac.image || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400' }}
                  style={styles.facilityImage}
                  imageStyle={styles.facilityImageStyle}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.65)']}
                    style={styles.facilityGradient}
                  >
                    <View style={styles.facilityOpenBadge}>
                      <View style={styles.facilityOpenDot} />
                      <Text style={styles.facilityOpenText}>{t('facilities.open', 'Open')}</Text>
                    </View>
                  </LinearGradient>
                </ImageBackground>
                <View style={styles.facilityInfo}>
                  <Text style={styles.facilityName} numberOfLines={1}>{fac.name}</Text>
                  <View style={styles.facilityMeta}>
                    <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
                    <Text style={styles.facilityDist}>{fac.distance || '—'}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Animated.View>

      <NotificationsSheet visible={notificationsVisible} onClose={() => setNotificationsVisible(false)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 100, gap: spacing.xxl },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  greetingSub: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 2,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatarBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: colors.primary,
  },
  avatar: { width: 41, height: 41, borderRadius: 21 },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    marginHorizontal: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: radius.pill,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
  },
  searchText: { flex: 1, fontSize: 15, color: colors.textTertiary },

  // Next Dose banner
  nextDoseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.primary,
  },
  nextDoseIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextDoseLabel: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.75)' },
  nextDoseTitle: { fontSize: 16, fontWeight: '700', color: '#fff', lineHeight: 22, marginTop: 2 },
  nextDoseTime: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  nextDoseArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Category strip
  categoryRow: { paddingHorizontal: spacing.xl, gap: spacing.xl },
  categoryItem: { alignItems: 'center', gap: spacing.xs, minWidth: 56 },
  categoryCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  categoryLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },

  // Progress card
  progressCard: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.xl,
    padding: spacing.xl,
    borderRadius: radius.xxl,
    gap: spacing.lg,
    ...shadow.card,
  },
  progressCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  progressTitle: { fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  progressSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 3 },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary100,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  doneBadgeText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  progressTrack: { height: 10, backgroundColor: colors.bgSecondary, borderRadius: radius.pill, overflow: 'hidden' },
  progressFill: { height: '100%' as any, backgroundColor: colors.primary, borderRadius: radius.pill },
  progressStats: { flexDirection: 'row', gap: spacing.sm },
  progressStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.primary50,
    borderRadius: radius.xl,
    gap: 2,
  },
  progressStatNum: { fontSize: 20, fontWeight: '800', color: colors.primary },
  progressStatLabel: { fontSize: 11, fontWeight: '500', color: colors.textSecondary, textAlign: 'center' },

  // Section
  section: { gap: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  sectionLink: { fontSize: 14, fontWeight: '600', color: colors.primary },

  // Reminders list
  list: { gap: spacing.sm, paddingHorizontal: spacing.xl },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: radius.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  reminderIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderContent: { flex: 1, gap: 3 },
  reminderTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  reminderMeta: { fontSize: 13, color: colors.textSecondary },
  reminderTimeBadge: {
    backgroundColor: colors.primary100,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  reminderTimeBadgeText: { fontSize: 12, fontWeight: '700', color: colors.primary },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center' },
  emptyHint: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },
  emptyCTA: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  emptyCTAText: { fontSize: 15, fontWeight: '600', color: '#fff' },

  // Facilities
  facilityScroll: { paddingHorizontal: spacing.xl, gap: spacing.md },
  facilityCard: { width: 210, borderRadius: radius.xl, backgroundColor: colors.card, overflow: 'hidden', ...shadow.card },
  facilityImage: { height: 130 },
  facilityImageStyle: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  facilityGradient: { flex: 1, justifyContent: 'flex-end', padding: spacing.sm },
  facilityOpenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  facilityOpenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  facilityOpenText: { fontSize: 11, fontWeight: '600', color: colors.text },
  facilityInfo: { padding: spacing.md, gap: 3 },
  facilityName: { fontSize: 14, fontWeight: '600', color: colors.text },
  facilityMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  facilityDist: { fontSize: 12, color: colors.textSecondary },
});
