import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextInputProps,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '../theme';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ComponentProps<typeof Ionicons>['name'];
  rightIcon?: React.ComponentProps<typeof Ionicons>['name'];
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
};

export default function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = (e: any) => {
    setIsFocused(true);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    props.onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    props.onBlur?.(e);
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? colors.danger : colors.line, error ? colors.danger : colors.primary],
  });

  const shadowOpacity = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.15],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Animated.View
        style={[
          styles.inputWrapper,
          {
            borderColor,
            shadowOpacity,
            shadowColor: error ? colors.danger : colors.primary,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
          },
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={isFocused ? colors.primary : colors.muted}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          {...props}
          style={[
            styles.input,
            leftIcon && { paddingLeft: 0 },
            rightIcon && { paddingRight: 0 },
            props.style,
          ]}
          placeholderTextColor={colors.mutedLight}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {rightIcon && (
          <Pressable onPress={onRightIconPress} hitSlop={8} style={styles.rightIcon}>
            <Ionicons
              name={rightIcon}
              size={20}
              color={isFocused ? colors.primary : colors.muted}
            />
          </Pressable>
        )}
      </Animated.View>
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  leftIcon: {
    marginRight: spacing.xs,
  },
  rightIcon: {
    marginLeft: spacing.xs,
    padding: spacing.xs,
  },
  error: {
    fontSize: 13,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  hint: {
    fontSize: 13,
    color: colors.muted,
    marginTop: spacing.xs,
  },
});
