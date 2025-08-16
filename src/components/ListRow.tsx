import { View, Text, StyleSheet, Pressable, Image, ReactNode } from 'react-native';
import { colors, spacing } from '../theme';

export function ListRow({ title, subtitle, leftIcon, right, onPress, imageUri }: {
  title: string;
  subtitle?: string;
  leftIcon?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
  imageUri?: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.row} android_ripple={{ color: colors.line }}>
      {imageUri ? <Image source={{ uri: imageUri }} style={{ width: 44, height: 44, borderRadius: 22 }} /> : leftIcon}
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { fontSize: 16, fontWeight: '600' },
  subtitle: { fontSize: 13, color: colors.muted },
});
