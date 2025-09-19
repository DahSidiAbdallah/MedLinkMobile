import React from 'react';
import { View, ViewStyle } from 'react-native';
import { colors } from '../theme';

type Props = {
  progress: number; // 0..1
  height?: number;
  style?: ViewStyle;
};

export default function ProgressBar({ progress, height = 8, style }: Props) {
  const pct = Math.max(0, Math.min(1, progress));
  return (
    <View
      style={[
        {
          width: '100%',
          height,
          backgroundColor: colors.progressTrack,
          borderRadius: height,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <View
        style={{
          width: `${pct * 100}%`,
          height: '100%',
          backgroundColor: colors.progressFill,
        }}
      />
    </View>
  );
}
