import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Modal,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, shadow } from '../theme';

type LoadingOverlayProps = {
  visible: boolean;
  message?: string;
  transparent?: boolean;
  fullScreen?: boolean;
};

function AnimatedSpinner() {
  const rotation = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const rotateAnimation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    rotateAnimation.start();
    pulseAnimation.start();

    return () => {
      rotateAnimation.stop();
      pulseAnimation.stop();
    };
  }, [rotation, scale]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.spinnerContainer,
        { transform: [{ rotate: spin }, { scale }] },
      ]}
    >
      <LinearGradient
        colors={colors.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.spinnerGradient}
      >
        <View style={styles.spinnerInner} />
      </LinearGradient>
    </Animated.View>
  );
}

function LoadingDots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = animateDot(dot1, 0);
    const anim2 = animateDot(dot2, 150);
    const anim3 = animateDot(dot3, 300);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3]);

  const getDotStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.3],
        }),
      },
    ],
  });

  return (
    <View style={styles.dotsContainer}>
      <Animated.View style={[styles.dot, getDotStyle(dot1)]} />
      <Animated.View style={[styles.dot, getDotStyle(dot2)]} />
      <Animated.View style={[styles.dot, getDotStyle(dot3)]} />
    </View>
  );
}

export default function LoadingOverlay({
  visible,
  message,
  transparent = false,
  fullScreen = true,
}: LoadingOverlayProps) {
  if (!visible) return null;

  const content = (
    <View style={[styles.container, transparent && styles.transparent]}>
      <View style={styles.card}>
        <AnimatedSpinner />
        {message && <Text style={styles.message}>{message}</Text>}
        <LoadingDots />
      </View>
    </View>
  );

  if (fullScreen) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        {content}
      </Modal>
    );
  }

  return content;
}

export function InlineLoader({ message, style }: { message?: string; style?: ViewStyle }) {
  return (
    <View style={[styles.inlineContainer, style]}>
      <AnimatedSpinner />
      {message && <Text style={styles.inlineMessage}>{message}</Text>}
    </View>
  );
}

export function LoadingButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  if (loading) {
    return <LoadingDots />;
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transparent: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.lg,
    minWidth: 160,
    ...shadow.card,
  },
  spinnerContainer: {
    width: 56,
    height: 56,
  },
  spinnerGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 4,
  },
  spinnerInner: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 24,
  },
  message: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    maxWidth: 200,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  inlineMessage: {
    fontSize: 14,
    color: colors.muted,
  },
});
