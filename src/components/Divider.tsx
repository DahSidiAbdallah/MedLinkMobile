import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '../theme';

type DividerProps = {
  style?: ViewStyle;
  color?: string;
  thickness?: number;
  vertical?: boolean;
  spacing?: number;
};

export default function Divider({
  style,
  color = colors.line,
  thickness = StyleSheet.hairlineWidth,
  vertical = false,
  spacing: spacingProp,
}: DividerProps) {
  const marginStyle = spacingProp
    ? vertical
      ? { marginHorizontal: spacingProp }
      : { marginVertical: spacingProp }
    : vertical
    ? { marginHorizontal: spacing.md }
    : { marginVertical: spacing.md };

  return (
    <View
      style={[
        vertical ? styles.vertical : styles.horizontal,
        { backgroundColor: color },
        vertical ? { width: thickness } : { height: thickness },
        marginStyle,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    width: '100%',
  },
  vertical: {
    height: '100%',
  },
});
