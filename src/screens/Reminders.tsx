
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Switch, ActivityIndicator, Modal, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, shadow } from '../theme';
import { SegmentedControl } from '../components/SegmentedControl';
import Card from '../components/Card';
import { ListRow } from '../components/ListRow';
import { useReminders } from '../hooks/useReminders';

export default function Reminders() {
  const [segment, setSegment] = useState('Active');
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ title: '', datetime: '', frequency: '', description: '' });
  const [formErrors, setFormErrors] = useState<any>({});
  const [creating, setCreating] = useState(false);
  const { reminders, loading, error, updateReminder, createReminder, refresh } = useReminders();

  const filtered = reminders.filter(r => (segment === 'Active' ? r.active : !r.active));

  const toggleActive = async (reminder: any) => {
    try {
      await updateReminder(reminder.id, { active: !reminder.active });
      refresh();
    } catch (e: any) {
      setFormErrors({ general: 'Failed to update reminder' });
    }
  };

  const handleCreateReminder = async () => {
    // Validation
    const errors: any = {};
    if (!form.title || form.title.trim().length < 2) errors.title = 'Title is required.';
    if (!form.datetime || form.datetime.trim().length < 2) errors.datetime = 'Date/Time is required.';
    if (!form.frequency || form.frequency.trim().length < 2) errors.frequency = 'Frequency is required.';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setCreating(true);
    try {
      await createReminder({
        ...form,
        type: 'medication',
        active: true,
      });
      setModalVisible(false);
      setForm({ title: '', datetime: '', frequency: '', description: '' });
      setFormErrors({});
      refresh();
    } catch (e: any) {
      setFormErrors({ general: e?.message || 'Failed to create reminder' });
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
        {filtered.map(r => (
          <Card key={r.id} style={{ paddingVertical: spacing.lg }}>
            <ListRow
              title={r.title}
              subtitle={`${r.datetime}${r.frequency ? ` • ${r.frequency}` : ''}`}
              right={<Switch value={r.active} onValueChange={() => toggleActive(r)} />}
            />
            {r.description ? (
              <Text style={{ color: colors.muted, marginLeft: 56, marginTop: 4 }}>{r.description}</Text>
            ) : null}
          </Card>
        ))}
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
              style={[styles.input, formErrors.title && { borderColor: colors.danger }]}
              placeholder="Title"
              value={form.title}
              onChangeText={v => setForm(f => ({ ...f, title: v }))}
              autoFocus
            />
            {formErrors.title && <Text style={styles.error}>{formErrors.title}</Text>}
            <TextInput
              style={[styles.input, formErrors.datetime && { borderColor: colors.danger }]}
              placeholder="Date/Time (e.g. 2025-08-17 08:00)"
              value={form.datetime}
              onChangeText={v => setForm(f => ({ ...f, datetime: v }))}
            />
            {formErrors.datetime && <Text style={styles.error}>{formErrors.datetime}</Text>}
            <TextInput
              style={[styles.input, formErrors.frequency && { borderColor: colors.danger }]}
              placeholder="Frequency (e.g. Daily)"
              value={form.frequency}
              onChangeText={v => setForm(f => ({ ...f, frequency: v }))}
            />
            {formErrors.frequency && <Text style={styles.error}>{formErrors.frequency}</Text>}
            <TextInput
              style={styles.input}
              placeholder="Description (optional)"
              value={form.description}
              onChangeText={v => setForm(f => ({ ...f, description: v }))}
            />
            {formErrors.general && <Text style={styles.error}>{formErrors.general}</Text>}
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
  error: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: 4,
  },
});
