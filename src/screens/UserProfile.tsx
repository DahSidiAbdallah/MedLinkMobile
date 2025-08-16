import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchUserProfile, Profile } from '../core/userProfile';
import { colors, spacing, typography, radius, shadow } from '../theme';
import Card from '../components/Card';
import { ListRow } from '../components/ListRow';

export default function UserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetchUserProfile().then(setProfile).catch(() => {});
  }, []);

  if (!profile) {
    return <Text style={{ marginTop: spacing.xl, textAlign: 'center' }}>Loading...</Text>;
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
      <Card style={styles.headerCard}>
        <Image source={require('../assets/avatar-placeholder.png')} style={styles.avatar} />
        <Text style={[typography.h2, { marginTop: spacing.sm }]}>{profile.name}</Text>
        <Text style={{ color: colors.muted }}>{profile.email}</Text>
        <Text style={{ color: colors.muted }}>{profile.phone}</Text>
      </Card>
      <Card>
        <ListRow title="Medical ID" right={<Ionicons name="chevron-forward" size={20} color={colors.muted} />} />
      </Card>
      <Card>
        <ListRow title="Insurance" right={<Ionicons name="chevron-forward" size={20} color={colors.muted} />} />
      </Card>
      <Card>
        <ListRow title="Emergency Contacts" right={<Ionicons name="chevron-forward" size={20} color={colors.muted} />} />
      </Card>
      <View style={styles.buttonRow}>
        <Pressable style={styles.btn} android_ripple={{ color: colors.line }}><Text style={styles.btnTxt}>Edit Profile</Text></Pressable>
        <Pressable style={styles.btn} android_ripple={{ color: colors.line }}><Text style={styles.btnTxt}>Privacy</Text></Pressable>
        <Pressable style={[styles.btn, { backgroundColor: colors.danger }]} android_ripple={{ color: colors.primary600 }}>
          <Text style={[styles.btnTxt, { color: '#fff' }]}>Logout</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerCard: { alignItems: 'center' },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: spacing.sm },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xl },
  btn: {
    flex: 1,
    backgroundColor: colors.card,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginHorizontal: 4,
    ...shadow.card,
  },
  btnTxt: { fontWeight: '600', color: colors.primary },
});
