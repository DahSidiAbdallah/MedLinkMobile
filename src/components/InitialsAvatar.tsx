import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme';

type Props = {
  readonly name?: string | null;
  readonly uri?: string | null;
  readonly size?: number;
  /** 'light' = soft blue circle with blue initials (on light backgrounds).
   *  'onPrimary' = translucent white circle with white initials (on blue heroes). */
  readonly variant?: 'light' | 'onPrimary';
  readonly style?: ViewStyle;
};

function getInitials(name?: string | null): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function InitialsAvatar({ name, uri, size = 44, variant = 'light', style }: Props) {
  const radius = size / 2;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[{ width: size, height: size, borderRadius: radius }, style]}
        resizeMode="cover"
      />
    );
  }

  const initials = getInitials(name);
  const bg = variant === 'onPrimary' ? 'rgba(255,255,255,0.22)' : colors.primary50;
  const fg = variant === 'onPrimary' ? '#FFFFFF' : colors.primary;

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: radius, backgroundColor: bg },
        style,
      ]}
      accessibilityLabel={name ?? undefined}
    >
      <Text style={{ color: fg, fontWeight: '700', fontSize: Math.round(size * 0.36), letterSpacing: 0.5 }}>
        {initials || '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
