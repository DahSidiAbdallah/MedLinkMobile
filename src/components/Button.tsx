import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, shadow, typography } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
};

const sizeStyles = {
  sm: { 
    paddingVertical: 10, 
    paddingHorizontal: 16, 
    ...typography.small,
    minHeight: 36,
  },
  md: { 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    ...typography.bodyMedium,
    minHeight: 44,
  },
  lg: { 
    paddingVertical: 16, 
    paddingHorizontal: 24, 
    ...typography.bodySemibold,
    minHeight: 52,
  },
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const sizeConfig = sizeStyles[size];
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (isDisabled) return;
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    if (isDisabled) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const getButtonStyle = (): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      borderRadius: radius.md,
      paddingVertical: sizeConfig.paddingVertical,
      paddingHorizontal: sizeConfig.paddingHorizontal,
      minHeight: sizeConfig.minHeight,
      opacity: isDisabled ? 0.6 : 1,
    };

    if (fullWidth) {
      base.width = '100%';
    }

    switch (variant) {
      case 'secondary':
        return { 
          ...base, 
          backgroundColor: colors.secondary,
          ...shadow.card,
        };
      case 'outline':
        return { 
          ...base, 
          backgroundColor: 'transparent', 
          borderWidth: 1.5, 
          borderColor: colors.primary,
        };
      case 'ghost':
        return { 
          ...base, 
          backgroundColor: colors.hover,
        };
      case 'danger':
        return { 
          ...base, 
          backgroundColor: colors.danger,
          ...shadow.danger,
        };
      case 'success':
        return { 
          ...base, 
          backgroundColor: colors.success,
          ...shadow.success,
        };
      default:
        return {
          ...base,
          ...shadow.primary,
        };
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'outline':
        return colors.primary;
      case 'ghost':
        return colors.text;
      default:
        return '#FFFFFF';
    }
  };

  const getGradientColors = (): readonly [string, string, ...string[]] => {
    switch (variant) {
      case 'danger':
        return colors.dangerGradient;
      case 'success':
        return colors.successGradient;
      case 'secondary':
        return [colors.secondary, colors.secondary] as const;
      default:
        return colors.primaryGradient;
    }
  };

  const shouldUseGradient = variant === 'primary' || variant === 'danger' || variant === 'success';

  const buttonContent = (
    <>
      {loading && (
        <ActivityIndicator 
          size="small" 
          color={getTextColor()} 
          style={{ marginRight: icon || title ? spacing.xs : 0 }}
        />
      )}
      {!loading && icon && iconPosition === 'left' && icon}
      {!loading && title && (
        <Text 
          style={[
            {
              color: getTextColor(),
              fontSize: sizeConfig.fontSize,
              fontWeight: sizeConfig.fontWeight,
              lineHeight: sizeConfig.lineHeight,
            },
            textStyle
          ]}
        >
          {title}
        </Text>
      )}
      {!loading && icon && iconPosition === 'right' && icon}
    </>
  );

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={({ pressed }) => [
          getButtonStyle(),
          pressed && !isDisabled && { opacity: 0.9 },
        ]}
      >
        {shouldUseGradient && !isDisabled ? (
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: radius.md }
            ]}
          />
        ) : null}
        {buttonContent}
      </Pressable>
    </Animated.View>
  );
}