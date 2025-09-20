import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius } from '../theme';

const toneMap = {
  primary: colors.primaryGradient,
  warn: ['#FCD34D', '#F59E0B'] as const,
  neutral: ['#CBD5F5', '#94A3B8'] as const,
};

export function Pill({ children, tone = 'primary' }: { children: string; tone?: 'primary' | 'warn' | 'neutral' }) {
  const gradient = toneMap[tone] ?? colors.primaryGradient;
  return (
    <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.wrap}>
      <View style={styles.pill}>
        <Text style={styles.txt}>{children}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.pill,
    paddingHorizontal: 1,
    paddingVertical: 1,
  },
  pill: {
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  txt: { fontSize: 12, fontWeight: '700', color: colors.text },
});
