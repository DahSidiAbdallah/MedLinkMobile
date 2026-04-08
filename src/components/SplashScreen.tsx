import React, { useRef, useEffect } from 'react';
import { Animated, Easing, View, Image, Text, StyleSheet, Dimensions, AccessibilityInfo } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function SplashScreen({ onFinish }: { readonly onFinish: () => void }) {
  const { t } = useTranslation();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.82)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp),
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: 80,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp),
      }),
      // Pulsing glow
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1100, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1100, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ])
      ),
    ]).start(() => {
      AccessibilityInfo.announceForAccessibility('App ready');
    });

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 380,
        useNativeDriver: true,
      }).start(() => onFinish());
    }, 2100);

    return () => clearTimeout(timer);
  }, [onFinish, fadeAnim, scaleAnim, slideAnim, glowAnim]);

  const glowScale   = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.14, 0.06, 0.14] });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]} accessibilityLiveRegion="polite">

      {/* Subtle decorative circles */}
      <Animated.View style={[styles.glowRing, { transform: [{ scale: glowScale }], opacity: glowOpacity }]} />
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      {/* Center content */}
      <View style={styles.center}>
        {/* Main app logo — tinted teal */}
        <Animated.Image
          accessible
          accessibilityLabel="MedLink logo"
          source={require('../assets/logo.png')}
          style={[
            styles.logo,
            {
              transform: [{ scale: scaleAnim }],
              tintColor: colors.primary,
            },
          ]}
          resizeMode="contain"
        />

        {/* App name */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: 'center', gap: 4 }}>
          <Text style={styles.appName}>MedLink</Text>
          <Text style={styles.tagline}>{t('common.tagline', 'Your Health Companion')}</Text>
        </Animated.View>
      </View>

      {/* Footer — Xahara branding tinted teal */}
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

  // Decorative background elements
  glowRing: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.primary50,
    alignSelf: 'center',
    top: SCREEN_H / 2 - 180,
  },
  bgCircle1: {
    position: 'absolute',
    width: SCREEN_W * 1.3,
    height: SCREEN_W * 1.3,
    borderRadius: SCREEN_W * 0.65,
    backgroundColor: colors.primary50,
    opacity: 0.45,
    top: -SCREEN_W * 0.7,
    right: -SCREEN_W * 0.5,
  },
  bgCircle2: {
    position: 'absolute',
    width: SCREEN_W * 0.9,
    height: SCREEN_W * 0.9,
    borderRadius: SCREEN_W * 0.45,
    backgroundColor: colors.primary100,
    opacity: 0.5,
    bottom: -SCREEN_W * 0.35,
    left: -SCREEN_W * 0.25,
  },

  // Logo & text
  center: {
    alignItems: 'center',
    gap: 20,
  },
  logo: {
    width: 148,
    height: 148,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.8,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 0.1,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 36,
    alignItems: 'center',
    gap: 4,
  },
  fromText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textTertiary,
    letterSpacing: 0.3,
  },
  xaharaLogo: {
    width: 90,
    height: 26,
  },
});
