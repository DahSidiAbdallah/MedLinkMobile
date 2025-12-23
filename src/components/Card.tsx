import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Pressable, Animated } from 'react-native';
import { colors, radius, spacing, shadow } from '../theme';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled' | 'glass' | 'hero' | 'flat';

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
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        ...shadow.card,
      };
    case 'outlined':
      return {
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: colors.card,
        borderRadius: radius.md,
      };
    case 'filled':
      return {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
      };
    case 'glass':
      return {
        backgroundColor: colors.glass,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.line,
      };
    case 'hero':
      return {
        backgroundColor: colors.primary,
        borderRadius: radius.lg,
      };
    case 'flat':
      return {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.line,
      };
    default:
      return {
        backgroundColor: colors.card,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.line,
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
    Animated.timing(scaleAnim, {
      toValue: 0.98,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (!isInteractive) return;
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const cardContent = (
    <View
      style={[
        variantStyles,
        contentStyle,
        {
          padding: spacing.lg,
        },
      ]}
    >
      {children}
    </View>
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
            pressed && { opacity: 0.8 }
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