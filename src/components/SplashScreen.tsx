import React, { useRef, useEffect } from 'react';
import {
  Animated,
  Easing,
  View,
  Image,
  Text,
  StyleSheet,
  AccessibilityInfo,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme';

// Brand blue — slightly deeper than primary for a richer splash bg
const SPLASH_BG = '#0052A3';

export default function SplashScreen({ onFinish }: { readonly onFinish: () => void }) {
  const { t } = useTranslation();

  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const logoScale    = useRef(new Animated.Value(0.78)).current;
  const textOpacity  = useRef(new Animated.Value(0)).current;
  const textSlide    = useRef(new Animated.Value(16)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const screenScale   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Step 1: logo pops in
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    // Step 2: text fades up after logo settles
    Animated.parallel([
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        delay: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(textSlide, {
        toValue: 0,
        duration: 400,
        delay: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Footer comes in last
      Animated.timing(footerOpacity, {
        toValue: 1,
        duration: 360,
        delay: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      AccessibilityInfo.announceForAccessibility('App ready');
    });

    // Hold for 2.2 s then fade the whole screen out with a gentle zoom
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(screenOpacity, {
          toValue: 0,
          duration: 380,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(screenScale, {
          toValue: 1.04,
          duration: 380,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => onFinish());
    }, 2200);

    return () => clearTimeout(timer);
  }, [onFinish, logoOpacity, logoScale, textOpacity, textSlide, footerOpacity, screenOpacity, screenScale]);

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: screenOpacity, transform: [{ scale: screenScale }] },
      ]}
      accessibilityLiveRegion="polite"
    >

      {/* Logo */}
      <Animated.View style={styles.center}>
        <Animated.Image
          accessible
          accessibilityLabel="MedLink logo"
          source={require('../assets/logo.png')}
          style={[
            styles.logo,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
          resizeMode="contain"
        />

        {/* App name + tagline */}
        <Animated.View
          style={[
            styles.textBlock,
            {
              opacity: textOpacity,
              transform: [{ translateY: textSlide }],
            },
          ]}
        >
          <Text style={styles.appName}>MedLink</Text>
          <Text style={styles.tagline}>
            {t('common.tagline', 'Your Health Companion')}
          </Text>
        </Animated.View>
      </Animated.View>

      {/* Footer */}
      <Animated.View
        style={[styles.footer, { opacity: footerOpacity }]}
        pointerEvents="none"
      >
        <Text style={styles.fromText}>{t('common.from', 'from')}</Text>
        <Image
          source={require('../assets/xahara.png')}
          style={styles.xaharaLogo}
          resizeMode="contain"
          // @ts-ignore
          tintColor="rgba(255,255,255,0.70)"
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SPLASH_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },

  center: {
    alignItems: 'center',
    gap: 24,
  },

  logo: {
    width: 120,
    height: 120,
    // white tint so logo reads on blue bg
    tintColor: '#FFFFFF',
  },

  textBlock: {
    alignItems: 'center',
    gap: 6,
  },

  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },

  tagline: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 0.2,
  },

  footer: {
    position: 'absolute',
    bottom: 44,
    alignItems: 'center',
    gap: 6,
  },

  fromText: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.45)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  xaharaLogo: {
    width: 80,
    height: 22,
  },
});
