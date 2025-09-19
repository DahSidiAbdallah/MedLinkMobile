import React from 'react';
import { Pressable, Text, ViewStyle } from 'react-native';
import { colors, spacing, radius, shadow } from '../theme';

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
      style={[
        {
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 999,
          backgroundColor: selected ? 'rgba(37,99,235,0.12)' : colors.chipBg,
          borderWidth: 1,
          borderColor: selected ? colors.primary : 'rgba(2,6,23,0.06)',
          alignItems: 'center',
          justifyContent: 'center',
          ...shadow.soft,
        },
        style,
      ]}
    >
      <Text style={{ color: selected ? colors.primary : colors.chipText, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}
