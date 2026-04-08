import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
  ActivityIndicator,
  Modal,
  TextInput,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRTL } from '../hooks/useRTL';
import { SkeletonReminderCardXL } from '../components/SkeletonLoaders';
import { colors, spacing, shadow, radius, animation } from '../theme';
import { SegmentedControl } from '../components/SegmentedControl';
import { useReminders } from '../hooks/useReminders';
import CalendarStrip from '../components/CalendarStrip';
import { setCompleted, getDayCompletion } from '../core/completion';
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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 8, delay: 50 }),
    ]).start();
  }, []);

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
      setToggleMsg(prev => ({
        ...prev,
        [reminder.id]: reminder.active
          ? t('reminders.reminderTurnedOff', 'Reminder turned off.')
          : t('reminders.reminderActivated', 'Reminder activated.'),
      }));
      refresh();
    } catch {
      setToggleMsg(prev => ({ ...prev, [reminder.id]: t('reminders.failedToUpdate', 'Failed to update.') }));
    } finally {
      setToggling(prev => ({ ...prev, [reminder.id]: false }));
    }
  };

  const toggleDoneToday = async (reminderId: string) => {
    const next = !doneMap[reminderId];
    setDoneMap(m => ({ ...m, [reminderId]: next }));
    await setCompleted(reminderId, next, selectedDate || new Date());
  };

  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'title':
        if (!value || value.trim().length < 2) return t('reminders.titleRequired', 'Title is required.');
        break;
      case 'datetime':
        if (!value) return t('reminders.dateTimeRequired', 'Date/Time is required.');
        if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value.trim()))
          return t('reminders.dateTimeFormat', 'Format: YYYY-MM-DD HH:mm');
        break;
      case 'frequency':
        if (!value) return t('reminders.frequencyRequired', 'Frequency is required.');
        if (!/^(Daily|Weekly|Monthly)$/i.test(value.trim()))
          return t('reminders.frequencyOptions', 'Use: Daily, Weekly, or Monthly.');
        break;
    }
    return undefined;
  };

  const handleCreateReminder = async () => {
    const errors: any = {};
    ['title', 'datetime', 'frequency'].forEach(f => {
      const err = validateField(f, form[f as keyof typeof form]);
      if (err) errors[f] = err;
    });
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setCreating(true);
    try {
      await createReminder({ ...form, type: 'medication', active: true });
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
  const pendingCount = filtered.length - completedCount;

  const getTime = (dt: string) => dt?.match(/(\d{2}:\d{2})/)?.[1] ?? '--:--';
  const getDate = (dt: string) => {
    const m = dt?.match(/(\d{4}-\d{2}-\d{2})/);
    if (!m) return '';
    const [, d] = m[1].split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const parts = m[1].split('-');
    return `${d} ${months[parseInt(parts[1], 10) - 1]}`;
  };

  const TYPE_ICON: Record<string, any> = {
    medication: 'medical-outline',
    checkup: 'calendar-outline',
  };
  const TYPE_COLOR: Record<string, string> = {
    medication: colors.primary,
    checkup: '#7C6FE0',
  };
  const TYPE_BG: Record<string, string> = {
    medication: colors.primary100,
    checkup: '#EDEBFA',
  };

  const renderCard = (r: any) => {
    const isDone = !!doneMap[r.id];
    const icon = isDone ? 'checkmark-circle' : (TYPE_ICON[r.type] || TYPE_ICON.medication);
    const iconColor = isDone ? colors.success : (TYPE_COLOR[r.type] || TYPE_COLOR.medication);
    const iconBg = isDone ? colors.success100 : (TYPE_BG[r.type] || TYPE_BG.medication);

    return (
      <Animated.View
        key={r.id}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Appointment-style card inspired by the screenshot */}
        <View style={[styles.card, isDone && styles.cardDone]}>
          {/* Left teal strip */}
          <View style={[styles.cardStrip, { backgroundColor: isDone ? colors.success : iconColor }]} />

          <View style={styles.cardBody}>
            {/* Icon + title + toggle row */}
            <View style={styles.cardTop}>
              <View style={[styles.cardIconWrap, { backgroundColor: iconBg }]}>
                <Ionicons name={icon} size={22} color={iconColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, isDone && styles.cardTitleDone, { textAlign }]} numberOfLines={1}>
                  {r.title}
                </Text>
                <Text style={[styles.cardType, { color: iconColor }]}>
                  {r.type === 'checkup' ? t('reminders.checkup', 'Check-up') : t('reminders.medication', 'Medication')}
                </Text>
              </View>
              {toggling[r.id] ? (
                <ActivityIndicator size={18} color={colors.primary} />
              ) : (
                <Switch
                  value={r.active}
                  onValueChange={() => toggleActive(r)}
                  disabled={!!toggling[r.id]}
                  trackColor={{ false: colors.line, true: colors.primary400 }}
                  thumbColor={r.active ? colors.primary : colors.surface}
                />
              )}
            </View>

            {/* Time + date + frequency chips */}
            <View style={styles.cardChips}>
              <View style={styles.timeChip}>
                <Ionicons name="time-outline" size={13} color={isDone ? colors.success : colors.primary} />
                <Text style={[styles.timeChipText, isDone && { color: colors.success }]}>{getTime(r.datetime)}</Text>
              </View>
              {getDate(r.datetime) ? (
                <View style={styles.dateChip}>
                  <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
                  <Text style={styles.dateChipText}>{getDate(r.datetime)}</Text>
                </View>
              ) : null}
              {r.frequency ? (
                <View style={styles.freqChip}>
                  <Ionicons name="repeat" size={12} color={colors.textSecondary} />
                  <Text style={styles.freqChipText}>{r.frequency}</Text>
                </View>
              ) : null}
            </View>

            {r.description ? (
              <Text style={[styles.cardDesc, { textAlign }]} numberOfLines={2}>{r.description}</Text>
            ) : null}

            {/* Mark done CTA */}
            <Pressable
              style={({ pressed }) => [styles.doneCTA, isDone && styles.doneCTAActive, pressed && { opacity: 0.85 }]}
              onPress={() => toggleDoneToday(r.id)}
            >
              <Ionicons
                name={isDone ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={16}
                color={isDone ? '#fff' : colors.primary}
              />
              <Text style={[styles.doneCTAText, isDone && styles.doneCTATextActive]}>
                {isDone ? t('reminders.completed', 'Completed') : t('reminders.markAsDone', 'Mark as done')}
              </Text>
            </Pressable>

            {!!toggleMsg[r.id] && (
              <Text style={[styles.statusMsg, toggleMsg[r.id].includes('Failed') && styles.statusMsgError]}>
                {toggleMsg[r.id]}
              </Text>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  let listContent;
  if (loading) {
    listContent = (
      <View style={styles.listGap}>
        <SkeletonReminderCardXL />
        <SkeletonReminderCardXL />
        <SkeletonReminderCardXL />
      </View>
    );
  } else if (error) {
    listContent = (
      <View style={styles.empty}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.danger100 }]}>
          <Ionicons name="alert-circle-outline" size={36} color={colors.danger} />
        </View>
        <Text style={styles.emptyTitle}>{t('common.error', 'Error')}</Text>
        <Text style={styles.emptyHint}>{error}</Text>
      </View>
    );
  } else if (filtered.length === 0) {
    listContent = (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Ionicons name="calendar-outline" size={36} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>{t('reminders.noReminders', 'No reminders')}</Text>
        <Text style={styles.emptyHint}>
          {segment === 'Active'
            ? t('reminders.addReminderToStart', 'Add a reminder to get started')
            : t('reminders.noPastReminders', 'No past reminders to show')}
        </Text>
      </View>
    );
  } else {
    listContent = <View style={styles.listGap}>{filtered.map(r => renderCard(r))}</View>;
  }

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.content}>

      {/* ── Header ─────────────────────────────────────── */}
      <Animated.View
        style={[styles.headerRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.screenTitle, { textAlign }]}>{t('reminders.title', 'My')}</Text>
          <Text style={[styles.screenTitleLine2, { textAlign }]}>{t('navigation.reminders', 'Schedule')}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerIconBtn} onPress={refresh}>
            <Ionicons name="refresh-outline" size={20} color={colors.text} />
          </Pressable>
          <Pressable style={[styles.headerIconBtn, { backgroundColor: colors.primary }]} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
        </View>
      </Animated.View>

      {/* ── Stats strip ────────────────────────────────── */}
      <Animated.View
        style={[styles.statsRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        {[
          { val: filtered.length, label: t('reminders.active', 'Active'), color: colors.primary, bg: colors.primary50 },
          { val: completedCount, label: t('dashboard.completedToday', 'Done'), color: colors.success, bg: colors.success100 },
          { val: pendingCount, label: t('dashboard.pendingReminders', 'Pending'), color: pendingCount > 0 ? '#F59E0B' : colors.textSecondary, bg: pendingCount > 0 ? '#FEF3C7' : colors.bgSecondary },
        ].map((s, i) => (
          <View key={i} style={[styles.statPill, { backgroundColor: s.bg }]}>
            <Text style={[styles.statNum, { color: s.color }]}>{s.val}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* ── Filter tabs + Calendar ──────────────────────── */}
      <Animated.View
        style={[styles.filterCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <SegmentedControl
          options={[t('reminders.active', 'Active'), t('reminders.past', 'Past')]}
          value={segment}
          onChange={setSegment}
        />
        <CalendarStrip value={selectedDate} onChange={setSelectedDate} />
      </Animated.View>

      {/* ── Nearest appointments label ─────────────────── */}
      {!loading && filtered.length > 0 && (
        <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: spacing.xl }}>
          <Text style={styles.nearestLabel}>
            {t('reminders.upcomingCount', 'Upcoming')}
            {'  '}
            <Text style={styles.nearestCount}>({filtered.length})</Text>
          </Text>
        </Animated.View>
      )}

      {/* ── List ───────────────────────────────────────── */}
      {listContent}

      {/* ── Add button ─────────────────────────────────── */}
      <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: spacing.xl }}>
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.88 }]}
          onPress={() => setModalVisible(true)}
        >
          <View style={styles.addBtnIcon}>
            <Ionicons name="add" size={20} color={colors.primary} />
          </View>
          <Text style={styles.addBtnText}>{t('reminders.create', 'Create Reminder')}</Text>
        </Pressable>
      </Animated.View>

      {/* ── Create Modal ───────────────────────────────── */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalTitleRow}>
              <View style={styles.modalIconWrap}>
                <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
              </View>
              <Text style={styles.modalTitle}>{t('reminders.create', 'Create Reminder')}</Text>
            </View>

            {[
              { key: 'title', placeholder: t('reminders.titlePlaceholder', 'Medication name'), multi: false },
              { key: 'datetime', placeholder: t('reminders.dateTimePlaceholder', 'Date & time (YYYY-MM-DD HH:mm)'), multi: false },
              { key: 'frequency', placeholder: t('reminders.frequencyPlaceholder', 'Frequency (Daily, Weekly, Monthly)'), multi: false },
              { key: 'description', placeholder: t('reminders.descriptionPlaceholder', 'Notes (optional)'), multi: true },
            ].map(field => (
              <View key={field.key}>
                <TextInput
                  style={[
                    styles.input,
                    formErrors[field.key] && styles.inputError,
                    field.multi && styles.inputMulti,
                    { textAlign },
                  ]}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.placeholder}
                  value={form[field.key as keyof typeof form]}
                  onChangeText={v => {
                    setForm(f => ({ ...f, [field.key]: v }));
                    if (formErrors[field.key]) setFormErrors((e: any) => ({ ...e, [field.key]: undefined }));
                  }}
                  onBlur={() => {
                    const err = validateField(field.key, form[field.key as keyof typeof form]);
                    setFormErrors((e: any) => ({ ...e, [field.key]: err }));
                  }}
                  multiline={field.multi}
                  numberOfLines={field.multi ? 3 : 1}
                  autoFocus={field.key === 'title'}
                />
                {formErrors[field.key] && (
                  <Text style={styles.fieldError}>{formErrors[field.key]}</Text>
                )}
              </View>
            ))}

            {formErrors.general && <Text style={styles.fieldError}>{formErrors.general}</Text>}

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
                disabled={creating}
              >
                <Text style={styles.cancelBtnText}>{t('common.cancel', 'Cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.saveBtn, creating && { opacity: 0.7 }]}
                onPress={handleCreateReminder}
                disabled={creating}
              >
                {creating
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveBtnText}>{t('common.save', 'Save')}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 100, gap: spacing.xl },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  screenTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  screenTitleLine2: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.primary,
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingBottom: 4 },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    gap: 2,
  },
  statNum: { fontSize: 22, fontWeight: '800', lineHeight: 28 },
  statLabel: { fontSize: 11, fontWeight: '500', color: colors.textSecondary, textAlign: 'center' },

  // Filter card
  filterCard: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.xxl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
  },

  // Nearest label
  nearestLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  nearestCount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // Reminder cards — appointment style
  listGap: { gap: spacing.md, paddingHorizontal: spacing.xl },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardDone: { backgroundColor: colors.success100, borderColor: colors.success100 },
  cardStrip: { width: 4 },
  cardBody: { flex: 1, padding: spacing.lg, gap: spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, lineHeight: 22 },
  cardTitleDone: { color: colors.textSecondary, textDecorationLine: 'line-through' },
  cardType: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  cardChips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary50,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  timeChipText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bgSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  dateChipText: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  freqChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bgSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  freqChipText: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  cardDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  doneCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primary50,
  },
  doneCTAActive: { backgroundColor: colors.success, borderColor: colors.success },
  doneCTAText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  doneCTATextActive: { color: '#fff' },
  statusMsg: { fontSize: 12, color: colors.primary, textAlign: 'center' },
  statusMsgError: { color: colors.danger },

  // Add button
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: radius.pill,
    ...shadow.primary,
  },
  addBtnIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },

  // Empty state
  empty: { alignItems: 'center', paddingVertical: spacing.xxl * 2, gap: spacing.md, paddingHorizontal: spacing.xl },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center' },
  emptyHint: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xxl + 4,
    borderTopRightRadius: radius.xxl + 4,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.md,
    ...shadow.xl,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, alignSelf: 'center', marginBottom: spacing.md },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  modalIconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.lg,
    backgroundColor: colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  input: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    fontSize: 15,
    color: colors.text,
  },
  inputError: { borderColor: colors.danger },
  inputMulti: { height: 80, textAlignVertical: 'top' },
  fieldError: { fontSize: 12, color: colors.danger, marginTop: -spacing.xs, marginLeft: 4 },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.pill,
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: radius.pill,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
