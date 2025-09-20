import React from 'react';
import { Pressable, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow } from '../theme';

type Props = {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  style?: ViewStyle;
};

export default function Chip({ label, onPress, selected, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: colors.primary600 }}
      style={style}
    >
      <LinearGradient
        colors={selected ? colors.primaryGradient : colors.subtleGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: radius.pill,
          padding: 1,
          ...shadow.soft,
        }}
      >
        <View
          style={{
            backgroundColor: selected ? 'transparent' : colors.glass,
            borderRadius: radius.pill,
            paddingVertical: 9,
            paddingHorizontal: 18,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: selected ? '#ffffff' : colors.chipText,
              fontWeight: '600',
              fontSize: 13,
            }}
          >
            {label}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}
