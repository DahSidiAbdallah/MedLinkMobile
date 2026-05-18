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
import { colors, radius, spacing, shadow } from '../theme';

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
    paddingHorizontal: 20, 
    fontSize: 14,
    fontWeight: '600' as const,
    minHeight: 40,
  },
  md: { 
    paddingVertical: 14, 
    paddingHorizontal: 24, 
    fontSize: 16,
    fontWeight: '700' as const,
    minHeight: 52,
  },
  lg: { 
    paddingVertical: 18, 
    paddingHorizontal: 28, 
    fontSize: 18,
    fontWeight: '700' as const,
    minHeight: 56,
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
      borderRadius: radius.xl, // VELO: larger rounded corners
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
          backgroundColor: colors.accent, // VELO: use accent color for secondary
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
          backgroundColor: colors.bg,
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
          ...shadow.primary, // VELO: add shadow to primary buttons
        };
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'outline':
        return colors.primary;
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