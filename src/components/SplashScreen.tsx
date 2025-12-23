import React, { useRef, useEffect } from 'react';
import { Animated, Easing, View, Image, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import { colors } from '../theme';

export default function SplashScreen({ onFinish }: { readonly onFinish: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp),
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // notify screen readers the app is ready (non-intrusive)
      AccessibilityInfo.announceForAccessibility('App ready');
    });

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }).start(() => onFinish());
    }, 1800);
    return () => clearTimeout(timer);
  }, [onFinish, fadeAnim, scaleAnim]);

  return (
    <Animated.View accessibilityLiveRegion="polite" style={[styles.container, { opacity: fadeAnim }]}> 
      <Animated.Image
        accessible
        accessibilityLabel="App logo"
        source={require('../assets/logo.png')}
        style={[
          styles.logo,
          {
            transform: [
              { scale: scaleAnim },
              { rotate: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['-6deg', '0deg'],
                }) },
            ],
          },
        ]}
        resizeMode="contain"
      />
      <View style={styles.bottom} pointerEvents="none">
        <Text style={styles.fromText}>from</Text>
        <Image source={require('../assets/xahara.png')} style={styles.xaharaLogo} resizeMode="contain" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 12,
    borderRadius: 12,
  },
  bottom: {
    position: 'absolute',
    bottom: 28,
    alignItems: 'center',
    width: '100%',
  },
  fromText: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 4,
  },
  xaharaLogo: {
    width: 96,
    height: 28,
  },
});