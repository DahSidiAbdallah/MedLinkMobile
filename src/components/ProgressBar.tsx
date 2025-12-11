import React, { useEffect, useRef } from 'react';
import { View, ViewStyle, Animated, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing } from '../theme';

type ProgressVariant = 'default' | 'success' | 'warning' | 'danger';

type Props = {
  progress: number; // 0..1
  height?: number;
  style?: ViewStyle;
  variant?: ProgressVariant;
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
};

const variantGradients = {
  default: colors.primaryGradient,
  success: [colors.success, '#059669'] as const,
  warning: [colors.warn, '#D97706'] as const,
  danger: [colors.danger, '#DC2626'] as const,
};

export default function ProgressBar({ 
  progress, 
  height = 8, 
  style, 
  variant = 'default',
  showLabel = false,
  label,
  animated = true,
}: Props) {
  const pct = Math.max(0, Math.min(1, progress));
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: pct,
        duration: 500,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(pct);
    }
  }, [pct, animated, animatedWidth]);

  const widthInterpolate = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const gradientColors = variantGradients[variant];

  return (
    <View style={style}>
      {(showLabel || label) && (
        <View style={styles.labelRow}>
          {label && <Text style={styles.label}>{label}</Text>}
          {showLabel && <Text style={styles.percentage}>{Math.round(pct * 100)}%</Text>}
        </View>
      )}
      <View
        style={[
          styles.track,
          { height, borderRadius: height / 2 },
        ]}
      >
        <Animated.View style={[styles.fill, { width: widthInterpolate, height: '100%' }]}>
          <LinearGradient
            colors={gradientColors as readonly [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: colors.progressTrack,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  percentage: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
});
