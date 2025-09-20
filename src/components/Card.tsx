import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, shadow } from '../theme';

const marginKeys = new Set<keyof ViewStyle>([
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginHorizontal',
  'marginVertical',
  'marginStart',
  'marginEnd',
]);

const splitStyle = (style?: StyleProp<ViewStyle>) => {
  if (!style) return { marginStyle: undefined, contentStyle: undefined };
  const flat = StyleSheet.flatten(style) || {};
  const marginStyle: ViewStyle = {};
  const contentStyle: ViewStyle = {};
  (Object.keys(flat) as (keyof ViewStyle)[]).forEach((key) => {
    const value = flat[key];
    if (value === undefined) return;
    if (marginKeys.has(key)) {
      // @ts-expect-error - dynamic assignment is safe here
      marginStyle[key] = value;
    } else {
      // @ts-expect-error - dynamic assignment is safe here
      contentStyle[key] = value;
    }
  });
  return { marginStyle, contentStyle };
};

export default function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { marginStyle, contentStyle } = splitStyle(style);
  return (
    <LinearGradient
      colors={colors.cardGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, marginStyle]}
    >
      <View style={[styles.card, contentStyle]}>
        {children}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    borderRadius: radius.lg + 2,
    padding: 1.5,
  },
  card: {
    backgroundColor: colors.glass,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.6)',
    overflow: 'hidden',
    ...shadow.soft,
  },
});
