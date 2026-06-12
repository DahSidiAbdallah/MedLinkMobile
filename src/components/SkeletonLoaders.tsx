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
      <View style={styles.quickActionSubtitle} />
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

  // Quick Action
  quickAction: {
    flex: 1,
    padding: spacing.xxl,
    borderRadius: radius.xxl,
    backgroundColor: colors.skeleton,
    gap: spacing.md,
    minHeight: 180,
    ...shadow.card,
  },
  quickActionIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.skeletonHighlight,
  },
  quickActionTitle: {
    width: '70%',
    height: 20,
    borderRadius: radius.sm,
    backgroundColor: colors.skeletonHighlight,
    marginTop: 'auto',
  },
  quickActionSubtitle: {
    width: '50%',
    height: 16,
    borderRadius: radius.sm,
    backgroundColor: colors.skeletonHighlight,
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

  // Facility Card
  facilityCard: {
    width: 240,
    borderRadius: radius.xl,
    backgroundColor: colors.skeleton,
    overflow: 'hidden',
    ...shadow.card,
  },
  facilityImage: {
    height: 160,
    backgroundColor: colors.skeleton,
    position: 'relative',
    overflow: 'hidden',
  },
  facilityInfo: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  facilityName: {
    width: '80%',
    height: 18,
    borderRadius: radius.sm,
    backgroundColor: colors.skeletonHighlight,
  },
  facilityDistance: {
    width: '50%',
    height: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.skeletonHighlight,
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
