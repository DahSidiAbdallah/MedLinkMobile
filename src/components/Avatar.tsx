import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius } from '../theme';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type AvatarProps = {
  source?: { uri: string } | number;
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle;
  showBorder?: boolean;
  borderColor?: string;
};

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 64,
  xl: 88,
};

const fontSizeMap = {
  xs: 10,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export default function Avatar({
  source,
  name,
  size = 'md',
  style,
  showBorder = false,
  borderColor = colors.card,
}: AvatarProps) {
  const dimension = sizeMap[size];
  const fontSize = fontSizeMap[size];
  const borderWidth = showBorder ? Math.max(2, dimension * 0.05) : 0;

  const containerStyle: ViewStyle = {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
    borderWidth,
    borderColor,
    overflow: 'hidden',
  };

  if (source) {
    return (
      <View style={[containerStyle, style]}>
        <Image
          source={source}
          style={styles.image}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={colors.primaryGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[containerStyle, styles.placeholder, style]}
    >
      <Text style={[styles.initials, { fontSize }]}>
        {name ? getInitials(name) : '?'}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
