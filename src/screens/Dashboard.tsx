import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadow } from '../theme';
import Card from '../components/Card';

export default function Dashboard({ navigation }: any) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient colors={["#EEF4FF", "#FFFFFF"]} style={styles.header}>
        <View>
          <Text style={[typography.h1, { color: colors.text }]}>Welcome, Rajesh</Text>
          <Text style={typography.meta}>Your health, your safety, your MedLink.</Text>
        </View>
        <Pressable accessibilityLabel="Notifications" style={styles.bell}>🔔</Pressable>
      </LinearGradient>

      <Pressable style={styles.cta} android_ripple={{ color: colors.primary600 }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Urgent Care</Text>
      </Pressable>

      <View style={styles.grid}>
        {[
          { label: 'Drug Info', route: 'DrugInfo' },
          { label: 'Reminders', route: 'Reminders' },
          { label: 'Clinics', route: 'ClinicsHospitalsPharmacies' },
          { label: 'Profile', route: 'UserProfile' },
        ].map(item => (
          <Card key={item.route} style={styles.tile}>
            <Pressable
              style={{ alignItems: 'center' }}
              onPress={() => navigation.navigate(item.route)}
              android_ripple={{ color: colors.line }}>
              <Text style={{ fontSize: 28, marginBottom: 8 }}>🏥</Text>
              <Text style={{ fontWeight: '600' }}>{item.label}</Text>
            </Pressable>
          </Card>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  cta: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadow.card,
  },
  grid: {
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xl,
  },
  tile: {
    width: '46%',
    alignSelf: 'stretch',
  },
});
