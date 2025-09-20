
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Switch, ActivityIndicator, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, shadow, radius } from '../theme';
import { SegmentedControl } from '../components/SegmentedControl';
import Card from '../components/Card';
import { ListRow } from '../components/ListRow';
import { useReminders } from '../hooks/useReminders';
import Chip from '../components/Chip';
import CalendarStrip from '../components/CalendarStrip';
import { getTodayStats, setCompleted, getDayCompletion } from '../core/completion';
import ScreenContainer from '../components/ScreenContainer';

export default function Reminders() {
  const [segment, setSegment] = useState('Active');
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ title: '', datetime: '', frequency: '', description: '' });
  const [formErrors, setFormErrors] = useState<any>({});
  const [creating, setCreating] = useState(false);
  const [toggling, setToggling] = useState<{ [id: string]: boolean }>({});
  const [toggleMsg, setToggleMsg] = useState<{ [id: string]: string }>({});
  const { reminders, loading, error, updateReminder, createReminder, refresh } = useReminders();

  const filtered = reminders.filter(r => (segment === 'Active' ? r.active : !r.active));
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [doneMap, setDoneMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const map = await getDayCompletion(selectedDate || new Date());
      setDoneMap(map);
    })();
  }, [selectedDate, reminders.length]);

  const toggleActive = async (reminder: any) => {
    setToggling(prev => ({ ...prev, [reminder.id]: true }));
    setToggleMsg(prev => ({ ...prev, [reminder.id]: '' }));
    try {
      await updateReminder(reminder.id, { active: !reminder.active });
      setToggleMsg(prev => ({ ...prev, [reminder.id]: reminder.active ? 'Reminder turned off.' : 'Reminder activated.' }));
      refresh();
    } catch (e) {
      // Log error for diagnostics
      // eslint-disable-next-line no-console
      console.error('Failed to toggle reminder', e);
      setToggleMsg(prev => ({ ...prev, [reminder.id]: 'Failed to update reminder.' }));
    } finally {
      setToggling(prev => ({ ...prev, [reminder.id]: false }));
    }
  };

  const toggleDoneToday = async (reminderId: string) => {
    const next = !doneMap[reminderId];
    setDoneMap(m => ({ ...m, [reminderId]: next }));
    await setCompleted(reminderId, next, selectedDate || new Date());
  };

  // Real-time validation helpers
  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'title':
        if (!value || value.trim().length < 2) return 'Title is required.';
        break;
      case 'datetime':
        if (!value) return 'Date/Time is required.';
        if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value.trim())) return 'Format: YYYY-MM-DD HH:mm';
        break;
      case 'frequency':
        if (!value) return 'Frequency is required.';
        if (!/^(Daily|Weekly|Monthly)$/i.test(value.trim())) return 'Use: Daily, Weekly, or Monthly.';
        break;
      default:
        return undefined;
    }
    return undefined;
  };

  const handleCreateReminder = async () => {
    // Validation
    const errors: any = {};
    ['title', 'datetime', 'frequency'].forEach(field => {
      const err = validateField(field, form[field as keyof typeof form]);
      if (err) errors[field] = err;
    });
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

  const completedCount = Object.values(doneMap).filter(Boolean).length;

  let content;
  if (loading) {
    content = <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.primary} />;
  } else if (error) {
    content = <Text style={{ color: colors.danger, textAlign: 'center', marginTop: spacing.xl }}>{error}</Text>;
  } else {
    content = (
      <View style={styles.listContainer}>
        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>No reminders</Text>
        ) : null}
        {filtered.map(r => (
          <Card key={r.id} style={styles.reminderCard}>
            <ListRow
              title={r.title}
              subtitle={r.frequency ? `${r.datetime} • ${r.frequency}` : r.datetime}
              right={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Switch
                    value={r.active}
                    onValueChange={() => toggleActive(r)}
                    disabled={!!toggling[r.id]}
                  />
                  {toggling[r.id] && <ActivityIndicator size={16} color={colors.primary} />}
                </View>
              }
            />
            {r.description ? (
              <Text style={styles.description}>{r.description}</Text>
            ) : null}
            <View style={styles.actionsRow}>
              <Pressable
                onPress={() => toggleDoneToday(r.id)}
                style={[styles.doneButton, doneMap[r.id] && styles.doneButtonActive]}
              >
                <Text style={[styles.doneButtonText, doneMap[r.id] && styles.doneButtonTextActive]}>
                  {doneMap[r.id] ? 'Done today' : 'Mark done today'}
                </Text>
              </Pressable>
            </View>
            {!!toggleMsg[r.id] && (
              <Text style={[styles.statusText, toggleMsg[r.id].includes('Failed') && styles.statusTextError]}>{toggleMsg[r.id]}</Text>
            )}
          </Card>
        ))}
      </View>
    );
  }

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.content}>
      <Card style={styles.headerCard}>
        <SegmentedControl options={['Active', 'Past']} value={segment} onChange={setSegment} />
        <View style={styles.calendarWrap}>
          <CalendarStrip value={selectedDate} onChange={setSelectedDate} />
        </View>
        <View style={styles.filterRow}>
          <Chip label="Active" selected={segment === 'Active'} onPress={() => setSegment('Active')} />
          <Chip label="Past" selected={segment === 'Past'} onPress={() => setSegment('Past')} />
        </View>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>Reminders today</Text>
            <Text style={styles.summaryValue}>{filtered.length}</Text>
          </View>
          <View>
            <Text style={styles.summaryLabel}>Completed</Text>
            <Text style={styles.summaryValue}>{completedCount}</Text>
          </View>
        </View>
      </Card>

      {content}

      <Pressable style={styles.addButton} android_ripple={{ color: colors.primary600 }} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={22} color="#fff" />
        <Text style={styles.addButtonText}>Add reminder</Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        animationType="fade"
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
              onChangeText={v => {
                setForm(f => ({ ...f, title: v }));
                if (formErrors.title) setFormErrors((e: any) => ({ ...e, title: undefined }));
              }}
              onBlur={() => {
                const err = validateField('title', form.title);
                setFormErrors((e: any) => ({ ...e, title: err }));
              }}
              autoFocus
            />
            {formErrors.title && <Text style={styles.error}>{formErrors.title}</Text>}
            <TextInput
              style={[styles.input, formErrors.datetime && { borderColor: colors.danger }]}
              placeholder="Date/Time (YYYY-MM-DD HH:mm)"
              value={form.datetime}
              onChangeText={v => {
                setForm(f => ({ ...f, datetime: v }));
                if (formErrors.datetime) setFormErrors((e: any) => ({ ...e, datetime: undefined }));
              }}
              onBlur={() => {
                const err = validateField('datetime', form.datetime);
                setFormErrors((e: any) => ({ ...e, datetime: err }));
              }}
            />
            {formErrors.datetime && <Text style={styles.error}>{formErrors.datetime}</Text>}
            <TextInput
              style={[styles.input, formErrors.frequency && { borderColor: colors.danger }]}
              placeholder="Frequency (Daily, Weekly, Monthly)"
              value={form.frequency}
              onChangeText={v => {
                setForm(f => ({ ...f, frequency: v }));
                if (formErrors.frequency) setFormErrors((e: any) => ({ ...e, frequency: undefined }));
              }}
              onBlur={() => {
                const err = validateField('frequency', form.frequency);
                setFormErrors((e: any) => ({ ...e, frequency: err }));
              }}
            />
            {formErrors.frequency && <Text style={styles.error}>{formErrors.frequency}</Text>}
            <TextInput
              style={styles.input}
              placeholder="Description (optional)"
              value={form.description}
              onChangeText={v => setForm(f => ({ ...f, description: v }))}
            />
            {formErrors.general && <Text style={styles.error}>{formErrors.general}</Text>}
            <View style={{ flexDirection: 'row', marginTop: spacing.md, gap: 8 }}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: colors.primary, flex: 1 }]}
                onPress={handleCreateReminder}
                disabled={creating}
              >
                <Text style={{ color: colors.card, fontWeight: 'bold', textAlign: 'center' }}>{creating ? 'Saving...' : 'Save'}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: colors.card, flex: 1 }]}
                onPress={() => setModalVisible(false)}
                disabled={creating}
              >
                <Text style={{ color: colors.primary, fontWeight: 'bold', textAlign: 'center' }}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  headerCard: {
    gap: spacing.md,
  },
  calendarWrap: {
    marginTop: spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  summaryLabel: { color: colors.muted, fontSize: 13 },
  summaryValue: { color: colors.text, fontWeight: '700', fontSize: 20, marginTop: 4 },
  listContainer: {
    gap: spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: spacing.lg,
  },
  reminderCard: {
    gap: spacing.sm,
  },
  description: {
    color: colors.muted,
    marginLeft: spacing.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
  },
  doneButton: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.glass,
  },
  doneButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  doneButtonText: { color: colors.text, fontWeight: '600' },
  doneButtonTextActive: { color: '#fff' },
  statusText: { marginTop: 6, color: colors.primary, fontSize: 13 },
  statusTextError: { color: colors.danger },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    ...shadow.card,
  },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.glass,
    padding: spacing.xl,
    borderRadius: radius.xl,
    width: '90%',
    maxWidth: 420,
    ...shadow.card,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    fontSize: 16,
  },
  modalBtn: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: 4,
  },
});
