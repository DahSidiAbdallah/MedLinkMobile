import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, animation } from '../theme';
import { useLoading } from '../hooks/LoadingContext';

const { width: screenWidth } = Dimensions.get('window');

export default function GlobalLoader() {
  const { isLoading } = useLoading();
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-screenWidth)).current;

  useEffect(() => {
    if (isLoading) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: animation.fast,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(translateX, {
              toValue: screenWidth,
              duration: 1400,
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
      Animated.timing(opacity, {
        toValue: 0,
        duration: animation.normal,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <Animated.View style={[styles.progressContainer, { opacity }]}>
      <View style={styles.progressBar}>
        <Animated.View style={[styles.progressIndicator, { transform: [{ translateX }] }]}>
          <LinearGradient
            colors={['transparent', colors.primary, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  progressIndicator: {
    ...StyleSheet.absoluteFillObject,
    width: screenWidth * 0.4,
  },
});
