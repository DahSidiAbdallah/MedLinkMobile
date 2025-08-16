import { Text, View, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme';
export function Pill({ text, tone = 'primary' }: { text: string; tone?: 'primary' | 'warn' }) {
  const map: any = { primary: ['#E8F0FF', colors.primary], warn: ['#FFF7E6', colors.warn] };
  const [bg, fg] = map[tone];
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.txt, { color: fg }]}>{text}</Text>
    </View>
  );
}
const styles = StyleSheet.create({ pill: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 999 }, txt: { fontSize: 12, fontWeight: '600' } });
