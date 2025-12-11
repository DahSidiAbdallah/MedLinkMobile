import React from 'react';
import { Image, View, Text } from 'react-native';
import { colors } from '../theme';

interface CachedImageProps {
  uri: string;
  style?: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  fallback?: React.ReactNode;
}

// React Native's Image component has built-in caching on iOS and Android
// No need for custom caching implementation
export default React.memo(function CachedImage({ 
  uri, 
  style, 
  resizeMode = 'cover',
  fallback 
}: CachedImageProps) {
  if (!uri) {
    return fallback || (
      <View style={[style, { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.muted, fontSize: 12 }}>No Image</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      resizeMode={resizeMode}
      // React Native automatically caches images
      // On iOS: caches images in memory and disk
      // On Android: uses Glide for caching
    />
  );
});
