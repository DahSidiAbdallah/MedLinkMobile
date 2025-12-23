import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, shadow, typography, animation } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type ToastProps = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onDismiss: (id: string) => void;
  action?: {
    label: string;
    onPress: () => void;
  };
};

const { width: screenWidth } = Dimensions.get('window');

const getToastConfig = (type: ToastType) => {
  switch (type) {
    case 'success':
      return {
        icon: 'checkmark-circle' as const,
        colors: colors.successGradient,
        backgroundColor: colors.success,
        textColor: '#FFFFFF',
      };
    case 'error':
      return {
        icon: 'close-circle' as const,
        colors: colors.dangerGradient,
        backgroundColor: colors.danger,
        textColor: '#FFFFFF',
      };
    case 'warning':
      return {
        icon: 'warning' as const,
        colors: colors.warmGradient,
        backgroundColor: colors.warn,
        textColor: '#FFFFFF',
      };
    case 'info':
      return {
        icon: 'information-circle' as const,
        colors: colors.primaryGradient,
        backgroundColor: colors.primary,
        textColor: '#FFFFFF',
      };
  }
};

export default function Toast({
  id,
  type,
  title,
  message,
  duration = 4000,
  onDismiss,
  action,
}: ToastProps) {
  const insets = useSafeAreaInsets();
  const config = getToastConfig(type);
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: animation.normal,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();

    // Auto dismiss
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: animation.fast,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: animation.fast,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 0.9,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start(() => {
      onDismiss(id);
    });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + spacing.md,
          transform: [
            { translateY },
            { scale },
          ],
          opacity,
        },
      ]}
    >
      <Pressable onPress={handleDismiss} style={styles.pressable}>
        <LinearGradient
          colors={config.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={config.icon}
                size={24}
                color={config.textColor}
              />
            </View>
            
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: config.textColor }]}>
                {title}
              </Text>
              {message && (
                <Text style={[styles.message, { color: config.textColor }]}>
                  {message}
                </Text>
              )}
            </View>

            {action && (
              <Pressable
                onPress={action.onPress}
                style={styles.actionButton}
              >
                <Text style={[styles.actionText, { color: config.textColor }]}>
                  {action.label}
                </Text>
              </Pressable>
            )}

            <Pressable onPress={handleDismiss} style={styles.closeButton}>
              <Ionicons
                name="close"
                size={20}
                color={config.textColor}
              />
            </Pressable>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
  },
  pressable: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.lg,
  },
  gradient: {
    borderRadius: radius.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.lg,
    gap: spacing.md,
  },
  iconContainer: {
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
  message: {
    ...typography.small,
    opacity: 0.9,
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: radius.sm,
    marginTop: 2,
  },
  actionText: {
    ...typography.smallSemibold,
  },
  closeButton: {
    padding: spacing.xs,
    marginTop: -spacing.xs,
    marginRight: -spacing.xs,
  },
});