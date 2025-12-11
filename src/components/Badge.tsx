import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../theme';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral';
type BadgeSize = 'sm' | 'md';

type BadgeProps = {
  count?: number;
  label?: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  style?: ViewStyle;
  maxCount?: number;
};

const variantStyles = {
  primary: { bg: colors.primary, text: '#FFFFFF' },
  secondary: { bg: colors.secondary, text: '#FFFFFF' },
  success: { bg: colors.success, text: '#FFFFFF' },
  warning: { bg: colors.warn, text: '#FFFFFF' },
  danger: { bg: colors.danger, text: '#FFFFFF' },
  neutral: { bg: colors.muted, text: '#FFFFFF' },
};

const sizeStyles = {
  sm: { minWidth: 16, height: 16, fontSize: 10, paddingHorizontal: 4, dotSize: 8 },
  md: { minWidth: 20, height: 20, fontSize: 12, paddingHorizontal: 6, dotSize: 10 },
};

export default function Badge({
  count,
  label,
  variant = 'primary',
  size = 'sm',
  dot = false,
  style,
  maxCount = 99,
}: BadgeProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  if (dot) {
    return (
      <View
        style={[
          styles.dot,
          {
            width: sizeStyle.dotSize,
            height: sizeStyle.dotSize,
            borderRadius: sizeStyle.dotSize / 2,
            backgroundColor: variantStyle.bg,
          },
          style,
        ]}
      />
    );
  }

  const displayText = label ?? (count !== undefined ? (count > maxCount ? `${maxCount}+` : String(count)) : '');

  if (!displayText) return null;

  return (
    <View
      style={[
        styles.badge,
        {
          minWidth: sizeStyle.minWidth,
          height: sizeStyle.height,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          backgroundColor: variantStyle.bg,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { fontSize: sizeStyle.fontSize, color: variantStyle.text }]}>
        {displayText}
      </Text>
    </View>
  );
}

type BadgeWrapperProps = {
  children: React.ReactNode;
  badge: React.ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
};

export function BadgeWrapper({ children, badge, position = 'top-right' }: BadgeWrapperProps) {
  const positionStyle = {
    'top-right': { top: -4, right: -4 },
    'top-left': { top: -4, left: -4 },
    'bottom-right': { bottom: -4, right: -4 },
    'bottom-left': { bottom: -4, left: -4 },
  };

  return (
    <View style={styles.wrapper}>
      {children}
      <View style={[styles.badgePosition, positionStyle[position]]}>
        {badge}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
  },
  dot: {},
  wrapper: {
    position: 'relative',
  },
  badgePosition: {
    position: 'absolute',
  },
});
