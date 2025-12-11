import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, shadow } from '../theme';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: CardVariant;
  onPress?: () => void;
  disabled?: boolean;
};

const marginKeys = new Set<keyof ViewStyle>([
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginHorizontal',
  'marginVertical',
  'marginStart',
  'marginEnd',
]);

const splitStyle = (style?: StyleProp<ViewStyle>) => {
  if (!style) return { marginStyle: undefined, contentStyle: undefined };
  const flat = StyleSheet.flatten(style) || {};
  const marginStyle: ViewStyle = {};
  const contentStyle: ViewStyle = {};
  (Object.keys(flat) as (keyof ViewStyle)[]).forEach((key) => {
    const value = flat[key];
    if (value === undefined) return;
    if (marginKeys.has(key)) {
      // @ts-expect-error - dynamic assignment is safe here
      marginStyle[key] = value;
    } else {
      // @ts-expect-error - dynamic assignment is safe here
      contentStyle[key] = value;
    }
  });
  return { marginStyle, contentStyle };
};

const getVariantStyles = (variant: CardVariant) => {
  switch (variant) {
    case 'elevated':
      return {
        card: { ...shadow.card, backgroundColor: colors.card },
        gradient: colors.cardGradient,
      };
    case 'outlined':
      return {
        card: { borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.card },
        gradient: ['transparent', 'transparent'] as const,
      };
    case 'filled':
      return {
        card: { backgroundColor: colors.surface },
        gradient: ['transparent', 'transparent'] as const,
      };
    default:
      return {
        card: { ...shadow.soft },
        gradient: colors.cardGradient,
      };
  }
};

export default function Card({ children, style, variant = 'default', onPress, disabled }: CardProps) {
  const { marginStyle, contentStyle } = splitStyle(style);
  const variantStyles = getVariantStyles(variant);

  const cardContent = (
    <LinearGradient
      colors={variantStyles.gradient as readonly [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, marginStyle]}
    >
      <View style={[styles.card, variantStyles.card, contentStyle]}>
        {children}
      </View>
    </LinearGradient>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] },
        ]}
      >
        {cardContent}
      </Pressable>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  gradient: {
    borderRadius: radius.lg + 4,
    padding: 1,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg + 2,
    padding: spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.7)',
    overflow: 'hidden',
  },
});
