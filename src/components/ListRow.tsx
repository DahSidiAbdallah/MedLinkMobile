import React from 'react';
import { View, Text, Pressable, Image, StyleSheet, AccessibilityRole } from 'react-native';
import { colors, spacing, radius, type } from '../theme';

export function ListRow(props: Readonly<{ title: string; subtitle?: string; imageUri?: string; right?: React.ReactNode; onPress?: () => void }>) {
  const { title, subtitle, imageUri, right, onPress } = props;
  const a11yLabel = subtitle ? title + ', ' + subtitle : title;
  return (
    <Pressable onPress={onPress} style={s.row} accessibilityRole={'button' as AccessibilityRole} accessibilityLabel={a11yLabel}>
      {imageUri ? <Image source={{uri:imageUri}} style={s.avatar}/> : <View style={[s.avatar,{backgroundColor: colors.primary + '22'}]}/>}
      <View style={{flex:1}}>
        <Text numberOfLines={1} ellipsizeMode="tail" style={s.title}>{title}</Text>
        {subtitle ? <Text numberOfLines={2} ellipsizeMode="tail" style={s.sub}>{subtitle}</Text> : null}
      </View>
      {right}
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: spacing.xs },
  title: { ...type.body, fontSize: 16, fontWeight: '600', color: colors.text },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2, lineHeight: 18 },
});
