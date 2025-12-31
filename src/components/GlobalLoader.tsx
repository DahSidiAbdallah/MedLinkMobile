import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Text, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, animation, radius, shadow } from '../theme';
import { useLoading } from '../hooks/LoadingContext';

const { width: screenWidth } = Dimensions.get('window');

export default function GlobalLoader() {
  const { isLoading } = useLoading();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const translateX = useRef(new Animated.Value(-screenWidth)).current;

  useEffect(() => {
    if (isLoading) {
      // Show loader with entrance animation
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: animation.fast,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        // Progress bar animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(translateX, {
              toValue: screenWidth,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(translateX, {
              toValue: -screenWidth,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    } else {
      // Hide loader with exit animation
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: animation.normal,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 0.9,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
    }
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <>
      {/* Top progress bar */}
      <Animated.View style={[styles.progressContainer, { opacity }]}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressIndicator,
              { transform: [{ translateX }] }
            ]}
          >
            <LinearGradient
              colors={['transparent', colors.primary, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      </Animated.View>

      {/* Center loading modal */}
      <Animated.View 
        style={[
          styles.overlay, 
          { 
            opacity,
            transform: [{ scale }]
          }
        ]} 
        accessibilityElementsHidden={false} 
        importantForAccessibility="no-hide-descendants"
      >
        <LinearGradient
          colors={colors.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.container}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.text}>Loading…</Text>
        </LinearGradient>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9998,
  },
  progressBar: {
    height: 3,
    backgroundColor: colors.line,
    overflow: 'hidden',
  },
  progressIndicator: {
    ...StyleSheet.absoluteFillObject,
    width: screenWidth * 0.3,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.overlay,
    zIndex: 9999,
  },
  container: {
    padding: 24,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 160,
    ...shadow.xl,
  },
  text: {
    marginTop: 16,
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
});
