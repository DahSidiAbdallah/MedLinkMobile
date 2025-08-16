import React, { useRef, useEffect } from 'react';
import { Animated, Easing, View, Image, Text, StyleSheet } from 'react-native';

export default function SplashScreen({ onFinish }: { readonly onFinish: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp),
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => onFinish());
    }, 2000);
    return () => clearTimeout(timer);
  }, [onFinish, fadeAnim, scaleAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}> 
      <Animated.Image
        source={require('./src/assets/logo.png')}
        style={[
          styles.logo,
          {
            transform: [
              { scale: scaleAnim },
              { rotate: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['-10deg', '0deg'],
                }) },
            ],
          },
        ]}
        resizeMode="contain"
      />
      <View style={styles.bottom}>
        <Text style={styles.fromText}>from</Text>
        <Image source={require('./src/assets/xahara.png')} style={styles.xaharaLogo} resizeMode="contain" />
      </View>
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
  logo: {
    width: 180,
    height: 180,
    marginBottom: 16,
  },
  favicon: {
    width: 48,
    height: 48,
    marginBottom: 32,
  },
  bottom: {
    position: 'absolute',
    bottom: 32,
    alignItems: 'center',
    width: '100%',
  },
  fromText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 4,
  },
  xaharaLogo: {
    width: 100,
    height: 32,
  },
});
