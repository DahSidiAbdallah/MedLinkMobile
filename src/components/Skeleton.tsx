import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../theme';

type SkeletonProps = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

type SkeletonVariant = 'text' | 'title' | 'avatar' | 'button' | 'card' | 'image';

export function Skeleton({ width = '100%', height = 16, borderRadius = radius.md, style }: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.skeleton,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonText({ lines = 3, lastLineWidth = '60%' }: { lines?: number; lastLineWidth?: string }) {
  return (
    <View style={styles.textContainer}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? lastLineWidth : '100%'}
          height={14}
          borderRadius={radius.xs}
          style={{ marginBottom: i < lines - 1 ? 8 : 0 }}
        />
      ))}
    </View>
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={44} height={44} borderRadius={22} />
        <View style={styles.cardHeaderText}>
          <Skeleton width="70%" height={16} borderRadius={radius.xs} />
          <Skeleton width="50%" height={12} borderRadius={radius.xs} style={{ marginTop: 6 }} />
        </View>
      </View>
      <SkeletonText lines={2} lastLineWidth="80%" />
    </View>
  );
}

export function SkeletonListItem() {
  return (
    <View style={styles.listItem}>
      <Skeleton width={48} height={48} borderRadius={radius.lg} />
      <View style={styles.listItemContent}>
        <Skeleton width="65%" height={16} borderRadius={radius.xs} />
        <Skeleton width="40%" height={12} borderRadius={radius.xs} style={{ marginTop: 6 }} />
      </View>
      <Skeleton width={60} height={28} borderRadius={radius.pill} />
    </View>
  );
}

export function SkeletonFacilityCard() {
  return (
    <View style={styles.facilityCard}>
      <View style={styles.facilityHeader}>
        <View style={{ flex: 1 }}>
          <Skeleton width="80%" height={18} borderRadius={radius.xs} />
          <Skeleton width="60%" height={14} borderRadius={radius.xs} style={{ marginTop: 8 }} />
        </View>
        <Skeleton width={70} height={26} borderRadius={radius.pill} />
      </View>
      <Skeleton width="100%" height={100} borderRadius={radius.md} style={{ marginTop: spacing.md }} />
      <Skeleton width="90%" height={12} borderRadius={radius.xs} style={{ marginTop: spacing.sm }} />
    </View>
  );
}

export function SkeletonReminderCard() {
  return (
    <View style={styles.reminderCard}>
      <View style={styles.reminderHeader}>
        <Skeleton width="60%" height={16} borderRadius={radius.xs} />
        <Skeleton width={70} height={24} borderRadius={radius.pill} />
      </View>
      <Skeleton width="40%" height={12} borderRadius={radius.xs} style={{ marginTop: 8 }} />
      <Skeleton width="80%" height={12} borderRadius={radius.xs} style={{ marginTop: 6 }} />
      <View style={styles.reminderFooter}>
        <Skeleton width={120} height={36} borderRadius={radius.pill} />
      </View>
    </View>
  );
}

export function SkeletonHistoryItem() {
  return (
    <View style={styles.historyItem}>
      <Skeleton width="30%" height={12} borderRadius={radius.xs} />
      <Skeleton width="100%" height={16} borderRadius={radius.xs} style={{ marginTop: 6 }} />
      <Skeleton width="70%" height={14} borderRadius={radius.xs} style={{ marginTop: 6 }} />
      <Skeleton width="25%" height={10} borderRadius={radius.xs} style={{ marginTop: 8, alignSelf: 'flex-end' }} />
    </View>
  );
}

export function SkeletonProfileHeader() {
  return (
    <View style={styles.profileHeader}>
      <Skeleton width={88} height={88} borderRadius={44} />
      <View style={styles.profileInfo}>
        <Skeleton width="70%" height={22} borderRadius={radius.xs} />
        <Skeleton width="50%" height={14} borderRadius={radius.xs} style={{ marginTop: 8 }} />
        <Skeleton width="40%" height={14} borderRadius={radius.xs} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

export function SkeletonStatPill() {
  return <Skeleton width={100} height={32} borderRadius={radius.pill} />;
}

export function SkeletonButton() {
  return <Skeleton width="100%" height={48} borderRadius={radius.md} />;
}

export function SkeletonChip() {
  return <Skeleton width={80} height={36} borderRadius={radius.pill} />;
}

const styles = StyleSheet.create({
  textContainer: {
    gap: 0,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardHeaderText: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  listItemContent: {
    flex: 1,
  },
  facilityCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  facilityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  reminderCard: {
    backgroundColor: 'rgba(37,99,235,0.08)',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
  },
  historyItem: {
    backgroundColor: colors.glass,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  profileInfo: {
    flex: 1,
  },
});

export default Skeleton;
