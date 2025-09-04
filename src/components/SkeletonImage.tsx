import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Image, StyleSheet, ImageStyle, ImageSourcePropType } from 'react-native';
import { colors } from '../theme';

type Props = Readonly<{
  source: ImageSourcePropType;
  style?: ImageStyle | ImageStyle[];
  placeholderColor?: string;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}>;

export default function SkeletonImage({ source, style, placeholderColor, resizeMode = 'cover' }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // reset when source changes
    setLoaded(false);
    opacity.setValue(0);
  }, [source, opacity]);

  const onLoad = () => {
    setLoaded(true);
    Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  };

  const bgColor = placeholderColor || '#EEF2FF';
  return (
    <View style={[styles.container, Array.isArray(style) ? StyleSheet.flatten(style) : style]}>
      {!loaded && <View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor, borderRadius: (StyleSheet.flatten(style) as any)?.borderRadius || 0 }]} />}
      <Animated.Image
        source={source}
        onLoad={onLoad}
        style={[StyleSheet.absoluteFill, { opacity } as any]}
        resizeMode={resizeMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: colors.line,
  },
});
