import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, shadow, animation } from '../theme';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled' | 'glass' | 'hero';

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
        card: { 
          ...shadow.lg, 
          backgroundColor: colors.card,
          borderRadius: radius.lg,
        },
        gradient: colors.cardGradient,
      };
    case 'outlined':
      return {
        card: { 
          borderWidth: 1, 
          borderColor: colors.line, 
          backgroundColor: colors.card,
          borderRadius: radius.md,
        },
        gradient: ['transparent', 'transparent'] as const,
      };
    case 'filled':
      return {
        card: { 
          backgroundColor: colors.surface,
          borderRadius: radius.md,
        },
        gradient: ['transparent', 'transparent'] as const,
      };
    case 'glass':
      return {
        card: { 
          backgroundColor: colors.glass,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.mutedLight,
          ...shadow.sm,
        },
        gradient: ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.8)'] as const,
      };
    case 'hero':
      return {
        card: { 
          backgroundColor: colors.primary,
          borderRadius: radius.xl,
          ...shadow.primary,
        },
        gradient: colors.heroGradient,
      };
    default:
      return {
        card: { 
          ...shadow.card,
          backgroundColor: colors.card,
          borderRadius: radius.md,
        },
        gradient: colors.cardGradient,
      };
  }
};

export default React.memo(function Card({ 
  children, 
  style, 
  variant = 'default', 
  onPress, 
  disabled 
}: CardProps) {
  const { marginStyle, contentStyle } = splitStyle(style);
  const variantStyles = getVariantStyles(variant);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const isInteractive = !!onPress && !disabled;

  const handlePressIn = () => {
    if (!isInteractive) return;
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    if (!isInteractive) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const cardContent = (
    <LinearGradient
      colors={variantStyles.gradient as readonly [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        variantStyles.card,
        contentStyle,
        {
          padding: spacing.lg,
          overflow: 'hidden',
        },
      ]}
    >
      {children}
    </LinearGradient>
  );

  if (isInteractive) {
    return (
      <Animated.View 
        style={[
          marginStyle,
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          style={({ pressed }) => [
            pressed && { opacity: 0.95 }
          ]}
        >
          {cardContent}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <View style={marginStyle}>
      {cardContent}
    </View>
  );
});