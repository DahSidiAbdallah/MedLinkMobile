import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, shadow } from '../theme';
import { SegmentedControl } from '../components/SegmentedControl';
import Card from '../components/Card';
import { ListRow } from '../components/ListRow';

export default function Reminders() {
  const [segment, setSegment] = useState('Active');
  const [items, setItems] = useState<any[]>([]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: spacing.xl }}>
        <SegmentedControl options={['Active', 'Past']} value={segment} onChange={setSegment} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
        {items.length === 0 && (
          <Text style={{ textAlign: 'center', color: colors.muted }}>No reminders</Text>
        )}
        {items.map(r => (
          <Card key={r.id} style={{ paddingVertical: spacing.lg }}>
            <ListRow
              title={r.title}
              subtitle={r.schedule}
              leftIcon={<Ionicons name="medkit" size={24} color={colors.primary} />}
              right={<Switch value={r.active} onValueChange={() => {}} />}
            />
          </Card>
        ))}
      </ScrollView>
      <Pressable style={styles.fab} android_ripple={{ color: colors.primary600 }}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
});
