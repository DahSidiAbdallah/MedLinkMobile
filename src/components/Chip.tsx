import React from 'react';
import { Pressable, Text, View, ViewStyle, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, spacing } from '../theme';

type ChipVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';
type ChipSize = 'sm' | 'md';

type Props = {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  style?: ViewStyle;
  variant?: ChipVariant;
  size?: ChipSize;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  removable?: boolean;
  onRemove?: () => void;
};

const variantColors = {
  default: { bg: colors.chipBg, text: colors.chipText, selectedBg: colors.primaryGradient },
  success: { bg: colors.success100, text: colors.success, selectedBg: [colors.success, '#059669'] as const },
  warning: { bg: colors.warn100, text: '#B45309', selectedBg: [colors.warn, '#D97706'] as const },
  danger: { bg: colors.danger100, text: colors.danger, selectedBg: [colors.danger, '#DC2626'] as const },
  info: { bg: colors.primary100, text: colors.primary, selectedBg: colors.primaryGradient },
};

const sizeStyles = {
  sm: { paddingVertical: 6, paddingHorizontal: 12, fontSize: 12, iconSize: 14 },
  md: { paddingVertical: 10, paddingHorizontal: 18, fontSize: 14, iconSize: 16 },
};

export default React.memo(function Chip({ 
  label, 
  onPress, 
  selected, 
  style, 
  variant = 'default',
  size = 'md',
  icon,
  removable,
  onRemove,
}: Props) {
  const variantStyle = variantColors[variant];
  const sizeStyle = sizeStyles[size];

  if (selected) {
    return (
      <Pressable
        onPress={onPress}
        android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
        style={({ pressed }) => [
          { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
          style,
        ]}
      >
        <LinearGradient
          colors={variantStyle.selectedBg as readonly [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.chip,
            {
              paddingVertical: sizeStyle.paddingVertical,
              paddingHorizontal: sizeStyle.paddingHorizontal,
            },
          ]}
        >
          {icon && <Ionicons name={icon} size={sizeStyle.iconSize} color="#FFFFFF" style={styles.icon} />}
          <Text style={[styles.label, { fontSize: sizeStyle.fontSize, color: '#FFFFFF' }]}>
            {label}
          </Text>
          {removable && onRemove && (
            <Pressable onPress={onRemove} hitSlop={8} style={styles.removeBtn}>
              <Ionicons name="close" size={sizeStyle.iconSize} color="#FFFFFF" />
            </Pressable>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: colors.primary100 }}
      style={({ pressed }) => [
        { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
        style,
      ]}
    >
      <View
        style={[
          styles.chip,
          {
            backgroundColor: variantStyle.bg,
            paddingVertical: sizeStyle.paddingVertical,
            paddingHorizontal: sizeStyle.paddingHorizontal,
          },
        ]}
      >
        {icon && <Ionicons name={icon} size={sizeStyle.iconSize} color={variantStyle.text} style={styles.icon} />}
        <Text style={[styles.label, { fontSize: sizeStyle.fontSize, color: variantStyle.text }]}>
          {label}
        </Text>
        {removable && onRemove && (
          <Pressable onPress={onRemove} hitSlop={8} style={styles.removeBtn}>
            <Ionicons name="close" size={sizeStyle.iconSize} color={variantStyle.text} />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  label: {
    fontWeight: '600',
  },
  icon: {
    marginRight: spacing.xs,
  },
  removeBtn: {
    marginLeft: spacing.xs,
  },
});
