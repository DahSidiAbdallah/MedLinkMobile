import { View, Pressable, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme';

export function SegmentedControl({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.wrap}>
      {options.map(opt => {
        const active = opt === value;
        return (
          <Pressable key={opt} onPress={() => onChange(opt)} style={[styles.btn, active && styles.active]} android_ripple={{ color: colors.line }}>
            <Text style={[styles.label, active && styles.activeLabel]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: '#EFF3FF', borderRadius: radius.lg, padding: 4, gap: 6 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: radius.md, alignItems: 'center' },
  active: { backgroundColor: colors.card },
  label: { color: colors.muted, fontWeight: '600' },
  activeLabel: { color: colors.primary },
});
