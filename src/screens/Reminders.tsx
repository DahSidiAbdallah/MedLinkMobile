
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Switch, ActivityIndicator, Alert, Modal, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, shadow } from '../theme';
import { SegmentedControl } from '../components/SegmentedControl';
import Card from '../components/Card';
import { ListRow } from '../components/ListRow';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export default function Reminders() {
  const [segment, setSegment] = useState('Active');
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ medication: '', time: '', frequency: '', dosage: '', instructions: '', refillDate: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchReminders = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = auth.currentUser;
        if (!user) {
          setReminders([]);
          setLoading(false);
          return;
        }
        const q = query(collection(db, 'reminders'), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReminders(data);
      } catch (e: any) {
        setError(e && e.message ? e.message : 'Failed to load reminders');
      } finally {
        setLoading(false);
      }
    };
    fetchReminders();
  }, []);

  const filtered = reminders.filter(r => (segment === 'Active' ? r.active : !r.active));

  const toggleActive = async (reminder: any) => {
    try {
      await updateDoc(doc(db, 'reminders', reminder.id), { active: !reminder.active });
      setReminders(reminders => reminders.map(r => r.id === reminder.id ? { ...r, active: !r.active } : r));
    } catch (e: any) {
      setError('Failed to update reminder');
    }
  };

  const handleCreateReminder = async () => {
    setCreating(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      const newReminder = {
        ...form,
        userId: user.uid,
        active: true,
        createdAt: new Date().toISOString(),
      };
      const remindersCol = collection(db, 'reminders');
      const docRef = await (await import('firebase/firestore')).addDoc(remindersCol, newReminder);
      setReminders(reminders => [...reminders, { ...newReminder, id: docRef.id }]);
      setModalVisible(false);
      setForm({ medication: '', time: '', frequency: '', dosage: '', instructions: '', refillDate: '' });
    } catch (e: any) {
      setError(e && e.message ? e.message : 'Failed to create reminder');
    } finally {
      setCreating(false);
    }
  };

  let content;
  if (loading) {
    content = <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.primary} />;
  } else if (error) {
    content = <Text style={{ color: colors.danger, textAlign: 'center', marginTop: spacing.xl }}>{error}</Text>;
  } else {
    content = (
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
        {filtered.length === 0 ? (
          <Text style={{ textAlign: 'center', color: colors.muted }}>No reminders</Text>
        ) : null}
        {filtered.map(r => {
          let subtitle = r.time;
          if (r.frequency) subtitle += ` • ${r.frequency}`;
          if (r.dosage) subtitle += ` • ${r.dosage}`;
          return (
            <Card key={r.id} style={{ paddingVertical: spacing.lg }}>
              <ListRow
                title={r.medication}
                subtitle={subtitle}
                right={<Switch value={r.active} onValueChange={() => toggleActive(r)} />}
              />
              {r.instructions ? (
                <Text style={{ color: colors.muted, marginLeft: 56, marginTop: 4 }}>{r.instructions}</Text>
              ) : null}
              {r.refillDate ? (
                <Text style={{ color: colors.muted, marginLeft: 56, marginTop: 2, fontSize: 12 }}>Refill by: {r.refillDate}</Text>
              ) : null}
            </Card>
          );
        })}
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: spacing.xl }}>
        <SegmentedControl options={['Active', 'Past']} value={segment} onChange={setSegment} />
      </View>
      {content}
      <Pressable style={styles.fab} android_ripple={{ color: colors.primary600 }} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[{ fontWeight: 'bold', fontSize: 18, marginBottom: spacing.md }]}>Add Reminder</Text>
            <TextInput
              style={styles.input}
              placeholder="Medication"
              value={form.medication}
              onChangeText={v => setForm(f => ({ ...f, medication: v }))}
              autoFocus
            />
            <TextInput
              style={styles.input}
              placeholder="Time (e.g. 8:00)"
              value={form.time}
              onChangeText={v => setForm(f => ({ ...f, time: v }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Frequency (e.g. Daily)"
              value={form.frequency}
              onChangeText={v => setForm(f => ({ ...f, frequency: v }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Dosage (optional)"
              value={form.dosage}
              onChangeText={v => setForm(f => ({ ...f, dosage: v }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Instructions (optional)"
              value={form.instructions}
              onChangeText={v => setForm(f => ({ ...f, instructions: v }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Refill Date (optional, YYYY-MM-DD)"
              value={form.refillDate}
              onChangeText={v => setForm(f => ({ ...f, refillDate: v }))}
            />
            <View style={{ flexDirection: 'row', marginTop: spacing.md }}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: colors.primary, flex: 1 }]}
                onPress={handleCreateReminder}
                disabled={creating}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>{creating ? 'Saving...' : 'Save'}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: colors.card, flex: 1, marginLeft: 8 }]}
                onPress={() => setModalVisible(false)}
                disabled={creating}
              >
                <Text style={{ color: colors.primary, fontWeight: 'bold', textAlign: 'center' }}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    zIndex: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.bg,
    padding: spacing.xl,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    ...shadow.card,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: Platform.OS === 'web' ? 12 : spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.card,
    fontSize: 16,
  },
  modalBtn: {
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
