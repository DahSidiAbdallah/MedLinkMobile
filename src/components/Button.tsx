import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, shadow, type } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
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
  sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 13 },
  md: { paddingVertical: 12, paddingHorizontal: 20, fontSize: 15 },
  lg: { paddingVertical: 16, paddingHorizontal: 24, fontSize: 17 },
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

  const getButtonStyle = (): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      borderRadius: radius.md,
      paddingVertical: sizeConfig.paddingVertical,
      paddingHorizontal: sizeConfig.paddingHorizontal,
      opacity: isDisabled ? 0.6 : 1,
    };

    if (fullWidth) {
      base.width = '100%';
    }

    switch (variant) {
      case 'secondary':
        return { ...base, backgroundColor: colors.secondary };
      case 'outline':
        return { ...base, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary };
      case 'ghost':
        return { ...base, backgroundColor: 'transparent' };
      case 'danger':
        return { ...base, backgroundColor: colors.danger };
      default:
        return base;
    }
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      fontSize: sizeConfig.fontSize,
      fontWeight: '600',
    };

    switch (variant) {
      case 'outline':
      case 'ghost':
        return { ...base, color: colors.primary };
      case 'danger':
        return { ...base, color: '#FFFFFF' };
      default:
        return { ...base, color: '#FFFFFF' };
    }
  };

  const renderContent = () => (
    <>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : '#FFFFFF'}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </>
  );

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
          fullWidth && { width: '100%' },
          style,
        ]}
      >
        <LinearGradient
          colors={colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradientButton,
            {
              paddingVertical: sizeConfig.paddingVertical,
              paddingHorizontal: sizeConfig.paddingHorizontal,
              opacity: isDisabled ? 0.6 : 1,
            },
          ]}
        >
          {renderContent()}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        getButtonStyle(),
        { opacity: pressed ? 0.85 : isDisabled ? 0.6 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        style,
      ]}
      android_ripple={
        variant !== 'ghost'
          ? { color: variant === 'outline' ? colors.primary100 : 'rgba(255,255,255,0.3)' }
          : undefined
      }
    >
      {renderContent()}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    ...shadow.glow,
  },
});
