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
import { colors, radius, spacing } from '../theme';

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
    paddingVertical: 8,
    paddingHorizontal: 18,
    fontSize: 13,
    fontWeight: '600' as const,
    minHeight: 38,
  },
  md: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    fontSize: 15,
    fontWeight: '600' as const,
    minHeight: 44,
  },
  lg: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    fontSize: 16,
    fontWeight: '600' as const,
    minHeight: 50,
  },
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true, // VELO: full-width by default
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
    Animated.timing(scaleAnim, {
      toValue: 0.98,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (isDisabled) return;
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const getButtonStyle = (): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      borderRadius: radius.lg,
      paddingVertical: sizeConfig.paddingVertical,
      paddingHorizontal: sizeConfig.paddingHorizontal,
      minHeight: sizeConfig.minHeight,
      opacity: isDisabled ? 0.5 : 1,
    };

    if (fullWidth) {
      base.width = '100%';
    }

    switch (variant) {
      case 'secondary':
        return {
          ...base,
          backgroundColor: colors.primary50,
        };
      case 'outline':
        return {
          ...base,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.lineDark,
        };
      case 'ghost':
        return {
          ...base,
          backgroundColor: 'transparent',
        };
      case 'danger':
        return {
          ...base,
          backgroundColor: colors.danger,
        };
      case 'success':
        return {
          ...base,
          backgroundColor: colors.success,
        };
      default:
        return {
          ...base,
          backgroundColor: colors.primary,
        };
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'secondary':
        return colors.primary;
      case 'outline':
        return colors.text;
      case 'ghost':
        return colors.primary;
      default:
        return '#FFFFFF';
    }
  };

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
          pressed && !isDisabled && { opacity: 0.8 },
        ]}
      >
        {buttonContent}
      </Pressable>
    </Animated.View>
  );
}