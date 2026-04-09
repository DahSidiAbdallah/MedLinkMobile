import React, { useRef, useEffect } from 'react';
import { Animated, Easing, View, Image, Text, StyleSheet, Dimensions, AccessibilityInfo } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function SplashScreen({ onFinish }: { readonly onFinish: () => void }) {
  const { t } = useTranslation();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.86)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const ringAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 580,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp),
      }),
      Animated.spring(scaleAnim, {
        toValue: 1, friction: 7, tension: 75, useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 560, delay: 80,
        useNativeDriver: true, easing: Easing.out(Easing.exp),
      }),
      // Subtle pulsing ring
      Animated.loop(
        Animated.sequence([
          Animated.timing(ringAnim, { toValue: 1, duration: 1300, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(ringAnim, { toValue: 0, duration: 1300, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ])
      ),
    ]).start(() => AccessibilityInfo.announceForAccessibility('App ready'));

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0, duration: 350, useNativeDriver: true,
      }).start(() => onFinish());
    }, 2000);

    return () => clearTimeout(timer);
  }, [onFinish, fadeAnim, scaleAnim, slideAnim, ringAnim]);

  const ringScale   = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] });
  const ringOpacity = ringAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.18, 0.06, 0.18] });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]} accessibilityLiveRegion="polite">

      {/* Soft background accent circles */}
      <View style={styles.bgCircleTop} />
      <View style={styles.bgCircleBottom} />

      {/* Center */}
      <View style={styles.center}>
        {/* Pulsing teal ring behind logo */}
        <Animated.View
          style={[
            styles.pulseRing,
            { transform: [{ scale: ringScale }], opacity: ringOpacity },
          ]}
        />

        {/* Logo image — tinted teal */}
        <Animated.Image
          accessible
          accessibilityLabel="MedLink logo"
          source={require('../assets/logo.png')}
          style={[
            styles.logo,
            { transform: [{ scale: scaleAnim }], tintColor: colors.primary },
          ]}
          resizeMode="contain"
        />

        {/* App name + tagline */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Text style={styles.appName}>MedLink</Text>
          <Text style={styles.tagline}>{t('common.tagline', 'Your Health Companion')}</Text>
        </Animated.View>
      </View>

      {/* Footer — Xahara logo tinted teal */}
      <Animated.View
        style={[styles.footer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        pointerEvents="none"
      >
        <Text style={styles.fromText}>{t('common.from', 'from')}</Text>
        <Image
          source={require('../assets/xahara.png')}
          style={styles.xaharaLogo}
          resizeMode="contain"
          tintColor={colors.primary}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Background decorative circles — very subtle */
  bgCircleTop: {
    position: 'absolute',
    width: SCREEN_W * 1.2,
    height: SCREEN_W * 1.2,
    borderRadius: SCREEN_W * 0.6,
    backgroundColor: colors.primary50,
    top: -SCREEN_W * 0.55,
    right: -SCREEN_W * 0.4,
    opacity: 0.7,
  },
  bgCircleBottom: {
    position: 'absolute',
    width: SCREEN_W * 0.9,
    height: SCREEN_W * 0.9,
    borderRadius: SCREEN_W * 0.45,
    backgroundColor: colors.primary100,
    bottom: -SCREEN_W * 0.3,
    left: -SCREEN_W * 0.2,
    opacity: 0.5,
  },

  /* Center content */
  center: { alignItems: 'center', gap: 20 },
  pulseRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.primary100,
    top: -8,
  },
  logo: { width: 144, height: 144 },
  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.8,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 0.1,
  },

  /* Footer */
  footer: {
    position: 'absolute',
    bottom: 38,
    alignItems: 'center',
    gap: 4,
  },
  fromText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textTertiary,
    letterSpacing: 0.4,
  },
  xaharaLogo: { width: 88, height: 26 },
});
