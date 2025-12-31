
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Switch, ActivityIndicator, Modal, TextInput, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRTL } from '../hooks/useRTL';
import { SkeletonReminderCard } from '../components/Skeleton';
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
  const { t } = useTranslation();
  const { isRTL, textAlign } = useRTL();
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
      setToggleMsg(prev => ({ ...prev, [reminder.id]: reminder.active ? t('reminders.reminderTurnedOff', 'Reminder turned off.') : t('reminders.reminderActivated', 'Reminder activated.') }));
      refresh();
    } catch (e) {
      setToggleMsg(prev => ({ ...prev, [reminder.id]: t('reminders.failedToUpdate', 'Failed to update reminder.') }));
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
        if (!value || value.trim().length < 2) return t('reminders.titleRequired', 'Title is required.');
        break;
      case 'datetime':
        if (!value) return t('reminders.dateTimeRequired', 'Date/Time is required.');
        if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value.trim())) return t('reminders.dateTimeFormat', 'Format: YYYY-MM-DD HH:mm');
        break;
      case 'frequency':
        if (!value) return t('reminders.frequencyRequired', 'Frequency is required.');
        if (!/^(Daily|Weekly|Monthly)$/i.test(value.trim())) return t('reminders.frequencyOptions', 'Use: Daily, Weekly, or Monthly.');
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
      setFormErrors({ general: e?.message || t('reminders.failedToCreate', 'Failed to create reminder') });
    } finally {
      setCreating(false);
    }
  };

  const completedCount = Object.values(doneMap).filter(Boolean).length;

  let content;
  if (loading) {
    content = (
      <View style={styles.listContainer}>
        <SkeletonReminderCard />
        <SkeletonReminderCard />
        <SkeletonReminderCard />
      </View>
    );
  } else if (error) {
    content = (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  } else {
    content = (
      <View style={styles.listContainer}>
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={colors.mutedLight} />
            <Text style={[styles.emptyTitle, { textAlign: 'center' }]}>{t('reminders.noReminders', 'No reminders')}</Text>
            <Text style={[styles.emptyHint, { textAlign: 'center' }]}>{segment === 'Active' ? t('reminders.addReminderToStart', 'Add a reminder to get started') : t('reminders.noPastReminders', 'No past reminders to show')}</Text>
          </View>
        ) : null}
        {filtered.map(r => (
          <Card key={r.id} style={styles.reminderCard}>
            <View style={styles.reminderHeader}>
              <View style={[styles.reminderIcon, r.type === 'checkup' ? styles.reminderIconCheckup : styles.reminderIconMed]}>
                <Ionicons 
                  name={r.type === 'checkup' ? 'calendar' : 'medical'} 
                  size={18} 
                  color={r.type === 'checkup' ? '#8B5CF6' : colors.primary} 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.reminderTitle, { textAlign }]}>{r.title}</Text>
                <View style={styles.reminderMeta}>
                  <Ionicons name="time-outline" size={12} color={colors.muted} />
                  <Text style={styles.reminderMetaText}>{r.datetime}</Text>
                  {r.frequency && (
                    <>
                      <View style={styles.metaDot} />
                      <Ionicons name="repeat" size={12} color={colors.muted} />
                      <Text style={styles.reminderMetaText}>{r.frequency}</Text>
                    </>
                  )}
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Switch
                  value={r.active}
                  onValueChange={() => toggleActive(r)}
                  disabled={!!toggling[r.id]}
                  trackColor={{ false: colors.line, true: colors.primary400 }}
                  thumbColor={r.active ? colors.primary : colors.surface}
                />
                {toggling[r.id] && <ActivityIndicator size={16} color={colors.primary} />}
              </View>
            </View>
            {r.description ? (
              <Text style={[styles.description, { textAlign }]}>{r.description}</Text>
            ) : null}
            <View style={styles.actionsRow}>
              <Pressable
                onPress={() => toggleDoneToday(r.id)}
                style={[styles.doneButton, doneMap[r.id] && styles.doneButtonActive]}
              >
                <Ionicons 
                  name={doneMap[r.id] ? 'checkmark-circle' : 'checkmark-circle-outline'} 
                  size={18} 
                  color={doneMap[r.id] ? '#fff' : colors.primary} 
                />
                <Text style={[styles.doneButtonText, doneMap[r.id] && styles.doneButtonTextActive]}>
                  {doneMap[r.id] ? t('reminders.completed', 'Completed') : t('reminders.markAsDone', 'Mark as done')}
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
      <View style={styles.headerSection}>
        <Text style={[styles.screenTitle, { textAlign }]}>{t('reminders.title', 'Reminders')}</Text>
        <Text style={[styles.screenSubtitle, { textAlign }]}>{t('reminders.manageMedicationSchedule', 'Manage your medication schedule')}</Text>
      </View>

      <Card style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{filtered.length}</Text>
          <Text style={[styles.statLabel, { textAlign: 'center' }]}>{t('calendar.today', 'Today')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{completedCount}</Text>
          <Text style={[styles.statLabel, { textAlign: 'center' }]}>{t('dashboard.completedToday', 'Completed today')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{filtered.length - completedCount}</Text>
          <Text style={[styles.statLabel, { textAlign: 'center' }]}>{t('dashboard.pendingReminders', 'Pending reminders')}</Text>
        </View>
      </Card>

      <Card style={styles.filterCard}>
        <SegmentedControl options={[t('reminders.active', 'Active'), t('reminders.past', 'Past')]} value={segment} onChange={setSegment} />
        <View style={styles.calendarWrap}>
          <CalendarStrip value={selectedDate} onChange={setSelectedDate} />
        </View>
      </Card>

      {content}

      <Pressable style={styles.addButton} android_ripple={{ color: colors.primary600 }} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={22} color="#fff" />
        <Text style={styles.addButtonText}>{t('reminders.create', 'Create Reminder')}</Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[{ fontWeight: 'bold', fontSize: 18, marginBottom: spacing.md }, { textAlign }]}>{t('reminders.create', 'Create Reminder')}</Text>
            <TextInput
              style={[styles.input, formErrors.title && { borderColor: colors.danger }, { textAlign }]}
              placeholder={t('reminders.titlePlaceholder', 'Title')}
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
            {formErrors.title && <Text style={[styles.error, { textAlign }]}>{formErrors.title}</Text>}
            <TextInput
              style={[styles.input, formErrors.datetime && { borderColor: colors.danger }, { textAlign }]}
              placeholder={t('reminders.dateTimePlaceholder', 'Date/Time (YYYY-MM-DD HH:mm)')}
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
            {formErrors.datetime && <Text style={[styles.error, { textAlign }]}>{formErrors.datetime}</Text>}
            <TextInput
              style={[styles.input, formErrors.frequency && { borderColor: colors.danger }, { textAlign }]}
              placeholder={t('reminders.frequencyPlaceholder', 'Frequency (Daily, Weekly, Monthly)')}
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
            {formErrors.frequency && <Text style={[styles.error, { textAlign }]}>{formErrors.frequency}</Text>}
            <TextInput
              style={[styles.input, { textAlign }]}
              placeholder={t('reminders.descriptionPlaceholder', 'Description (optional)')}
              value={form.description}
              onChangeText={v => setForm(f => ({ ...f, description: v }))}
            />
            {formErrors.general && <Text style={[styles.error, { textAlign }]}>{formErrors.general}</Text>}
            <View style={{ flexDirection: 'row', marginTop: spacing.md, gap: 8 }}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: colors.primary, flex: 1 }, creating && { opacity: 0.6 }]}
                onPress={handleCreateReminder}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color={colors.card} size="small" />
                ) : (
                  <Text style={{ color: colors.card, fontWeight: 'bold', textAlign: 'center' }}>{t('common.save', 'Save')}</Text>
                )}
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: colors.card, flex: 1 }]}
                onPress={() => setModalVisible(false)}
                disabled={creating}
              >
                <Text style={{ color: colors.primary, fontWeight: 'bold', textAlign: 'center' }}>{t('common.cancel', 'Cancel')}</Text>
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
  headerSection: {
    marginBottom: spacing.sm,
  },
  screenTitle: {
    color: colors.text,
    marginBottom: 4,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
  },
  screenSubtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  statsCard: {
    flexDirection: 'row',
    paddingVertical: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.line,
    marginHorizontal: spacing.md,
  },
  filterCard: {
    gap: spacing.md,
  },
  calendarWrap: {
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
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  reminderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderIconMed: {
    backgroundColor: 'rgba(37,99,235,0.12)',
  },
  reminderIconCheckup: {
    backgroundColor: 'rgba(139,92,246,0.12)',
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  reminderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  reminderMetaText: {
    fontSize: 13,
    color: colors.muted,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.muted,
    marginHorizontal: 4,
  },
  description: {
    color: colors.muted,
    marginLeft: 52,
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(37,99,235,0.08)',
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
    backgroundColor: colors.card,
    padding: spacing.xl,
    borderRadius: radius.xl + 4,
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
  errorContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  errorText: {
    color: colors.danger,
    fontSize: 15,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.sm,
  },
  emptyHint: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
});
