import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors, radius, spacing, shadow } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

// Enhanced shimmer animation
function useShimmer() {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  return shimmerAnim;
}

// Hero Card Skeleton
export function SkeletonHeroCard() {
  const shimmer = useShimmer();
  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  return (
    <View style={styles.heroCard}>
      <View style={styles.heroCardInner}>
        <Animated.View
          style={[
            styles.shimmerOverlay,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <View style={styles.heroCardContent}>
          <View style={styles.heroCardBadge} />
          <View style={styles.heroCardTitle} />
          <View style={styles.heroCardSubtitle} />
          <View style={styles.heroCardFooter}>
            <View style={styles.heroCardFooterText} />
            <View style={styles.heroCardFooterCTA} />
          </View>
        </View>
      </View>
    </View>
  );
}

// Profile Hero Skeleton — matches the UserProfile gradient header
export function SkeletonProfileHero() {
  const shimmer = useShimmer();
  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-350, 350],
  });

  return (
    <View style={styles.profileHero}>
      <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <View style={styles.profileHeroTop}>
        <View style={styles.profileHeroAvatar} />
        <View style={{ flex: 1, gap: spacing.sm }}>
          <View style={styles.profileHeroName} />
          <View style={styles.profileHeroLine} />
        </View>
      </View>
      <View style={styles.profileHeroStats}>
        <View style={styles.profileHeroStat} />
        <View style={styles.profileHeroStat} />
        <View style={styles.profileHeroStat} />
      </View>
    </View>
  );
}

// Quick Action Card Skeleton
export function SkeletonQuickAction() {
  const shimmer = useShimmer();
  const opacity = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.3],
  });

  return (
    <Animated.View style={[styles.quickAction, { opacity }]}>
      <View style={styles.quickActionIcon} />
      <View style={styles.quickActionTitle} />
    </Animated.View>
  );
}

// Progress Card Skeleton
export function SkeletonProgressCard() {
  const shimmer = useShimmer();
  const opacity = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.3],
  });

  return (
    <Animated.View style={[styles.progressCard, { opacity }]}>
      <View style={styles.progressTitle} />
      <View style={styles.progressSubtitle} />
      <View style={styles.progressBar} />
    </Animated.View>
  );
}

// Reminder Card Skeleton
export function SkeletonReminderCardLarge() {
  const shimmer = useShimmer();
  const opacity = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.3],
  });

  return (
    <Animated.View style={[styles.reminderCardLarge, { opacity }]}>
      <View style={styles.reminderIcon} />
      <View style={styles.reminderTitle} />
      <View style={styles.reminderTime} />
    </Animated.View>
  );
}

// Facility Card Skeleton
export function SkeletonFacilityCardLarge() {
  const shimmer = useShimmer();
  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-240, 240],
  });

  return (
    <View style={styles.facilityCard}>
      <View style={styles.facilityImage}>
        <Animated.View
          style={[
            styles.shimmerOverlay,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      <View style={styles.facilityInfo}>
        <View style={styles.facilityName} />
        <View style={styles.facilityDistance} />
      </View>
    </View>
  );
}

// Full-width Facility Card Skeleton — matches the Clinics screen list cards
export function SkeletonFacilityCardList() {
  const shimmer = useShimmer();
  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-350, 350],
  });

  return (
    <View style={styles.facilityListCard}>
      <View style={styles.facilityListImage}>
        <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX }] }]}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      <View style={styles.facilityListInfo}>
        <View style={styles.facilityListName} />
        <View style={styles.facilityListSpecialty} />
        <View style={styles.facilityListMeta} />
      </View>
    </View>
  );
}

// Large Reminder Card for Reminders Screen
export function SkeletonReminderCardXL() {
  const shimmer = useShimmer();
  const opacity = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.3],
  });

  return (
    <Animated.View style={[styles.reminderCardXL, { opacity }]}>
      <View style={styles.reminderIconXL} />
      <View style={styles.reminderTitleXL} />
      <View style={styles.reminderTimeXL} />
      <View style={styles.reminderDescriptionXL} />
      <View style={styles.reminderCTA} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Hero Card
  heroCard: {
    height: 180,
    marginHorizontal: spacing.xl,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    backgroundColor: colors.skeleton,
    ...shadow.card,
  },
  heroCardInner: {
    flex: 1,
    position: 'relative',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 300,
  },
  heroCardContent: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'space-between',
  },
  heroCardBadge: {
    width: 100,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.skeletonHighlight,
  },
  heroCardTitle: {
    width: '70%',
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.skeletonHighlight,
    marginTop: 'auto',
  },
  heroCardSubtitle: {
    width: '50%',
    height: 20,
    borderRadius: radius.sm,
    backgroundColor: colors.skeletonHighlight,
    marginTop: spacing.sm,
  },
  heroCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  heroCardFooterText: {
    width: 120,
    height: 16,
    borderRadius: radius.sm,
    backgroundColor: colors.skeletonHighlight,
  },
  heroCardFooterCTA: {
    width: 80,
    height: 16,
    borderRadius: radius.sm,
    backgroundColor: colors.skeletonHighlight,
  },

  // Profile Hero — full-bleed gradient header placeholder
  profileHero: {
    height: 330,
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    backgroundColor: colors.skeleton,
    overflow: 'hidden',
    paddingHorizontal: spacing.xl,
    paddingTop: 96,
    paddingBottom: spacing.xxl,
    justifyContent: 'space-between',
  },
  profileHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  profileHeroAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.skeletonHighlight,
  },
  profileHeroName: {
    width: '60%',
    height: 20,
    borderRadius: radius.sm,
    backgroundColor: colors.skeletonHighlight,
  },
  profileHeroLine: {
    width: '45%',
    height: 13,
    borderRadius: radius.sm,
    backgroundColor: colors.skeletonHighlight,
  },
  profileHeroStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  profileHeroStat: {
    flex: 1,
    height: 84,
    borderRadius: radius.lg,
    backgroundColor: colors.skeletonHighlight,
  },

  // Quick Action — matches the 2-up profile cards (minHeight 130, icon 48)
  quickAction: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.skeleton,
    gap: spacing.md,
    minHeight: 130,
    ...shadow.card,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.skeletonHighlight,
  },
  quickActionTitle: {
    width: '70%',
    height: 16,
    borderRadius: radius.sm,
    backgroundColor: colors.skeletonHighlight,
    marginTop: 'auto',
  },

  // Progress Card
  progressCard: {
    backgroundColor: colors.skeleton,
    marginHorizontal: spacing.xl,
    padding: spacing.xxl,
    borderRadius: radius.xxl,
    gap: spacing.lg,
    ...shadow.card,
  },
  progressTitle: {
    width: '60%',
    height: 24,
    borderRadius: radius.sm,
    backgroundColor: colors.skeletonHighlight,
  },
  progressSubtitle: {
    width: '40%',
    height: 18,
    borderRadius: radius.sm,
    backgroundColor: colors.skeletonHighlight,
  },
  progressBar: {
    width: '100%',
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.skeletonHighlight,
    marginTop: spacing.sm,
  },

  // Reminder Card Large
  reminderCardLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.skeleton,
    padding: spacing.lg,
    borderRadius: radius.xl,
    gap: spacing.lg,
    ...shadow.sm,
  },
  reminderIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.skeletonHighlight,
  },
  reminderTitle: {
    width: 120,
    height: 18,
    borderRadius: radius.sm,
    backgroundColor: colors.skeletonHighlight,
  },
  reminderTime: {
    width: 80,
    height: 16,
    borderRadius: radius.sm,
    backgroundColor: colors.skeletonHighlight,
    marginTop: spacing.xs,
  },

  // Facility Card — matches the Dashboard horizontal cards (200 wide, image 120)
  facilityCard: {
    width: 200,
    borderRadius: radius.xl,
    backgroundColor: colors.skeleton,
    overflow: 'hidden',
    ...shadow.card,
  },
  facilityImage: {
    height: 120,
    backgroundColor: colors.skeleton,
    position: 'relative',
    overflow: 'hidden',
  },
  facilityInfo: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  facilityName: {
    width: '80%',
    height: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.skeletonHighlight,
  },
  facilityDistance: {
    width: '40%',
    height: 11,
    borderRadius: radius.sm,
    backgroundColor: colors.skeletonHighlight,
  },

  // Facility List Card — matches the Clinics screen cards (full width, image 180)
  facilityListCard: {
    borderRadius: radius.xxl,
    backgroundColor: colors.skeleton,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  facilityListImage: {
    height: 180,
    backgroundColor: colors.skeleton,
    position: 'relative',
    overflow: 'hidden',
  },
  facilityListInfo: {
    padding: spacing.xl,
    gap: spacing.sm,
  },
  facilityListName: {
    width: '65%',
    height: 17,
    borderRadius: radius.sm,
    backgroundColor: colors.skeletonHighlight,
  },
  facilityListSpecialty: {
    width: '45%',
    height: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.skeletonHighlight,
  },
  facilityListMeta: {
    width: '35%',
    height: 13,
    borderRadius: radius.sm,
    backgroundColor: colors.skeletonHighlight,
    marginTop: spacing.xs,
  },

  // Reminder Card XL
  reminderCardXL: {
    backgroundColor: colors.skeleton,
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    gap: spacing.lg,
    ...shadow.card,
  },
  reminderIconXL: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.skeletonHighlight,
  },
  reminderTitleXL: {
    width: '70%',
    height: 24,
    borderRadius: radius.sm,
    backgroundColor: colors.skeletonHighlight,
  },
  reminderTimeXL: {
    width: 120,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.skeletonHighlight,
  },
  reminderDescriptionXL: {
    width: '90%',
    height: 16,
    borderRadius: radius.sm,
    backgroundColor: colors.skeletonHighlight,
  },
  reminderCTA: {
    width: '100%',
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.skeletonHighlight,
  },
});
