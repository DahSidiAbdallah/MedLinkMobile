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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRTL } from '../hooks/useRTL';
import { SkeletonReminderCardXL } from '../components/SkeletonLoaders';
import { colors, spacing, shadow, radius } from '../theme';
import { useReminders } from '../hooks/useReminders';
import { setCompleted, getDayCompletion } from '../core/completion';
import ScreenContainer from '../components/ScreenContainer';

const { width: SCREEN_W } = Dimensions.get('window');
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/* ── Inline month calendar ──────────────────────────────────────────────── */
function MonthCalendar({
  selectedDate,
  onSelectDate,
  markedDates = [],
}: {
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  markedDates?: string[]; // 'YYYY-MM-DD' strings
}) {
  const today = new Date();
  const [month, setMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  const prevMonth = () => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const nextMonth = () => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  // Monday-based: (0=Mon … 6=Sun)
  const startDow = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const toKey = (d: Date) => d.toISOString().slice(0, 10);

  return (
    <View style={calStyles.wrap}>
      {/* Month navigation */}
      <View style={calStyles.nav}>
        <Pressable onPress={prevMonth} style={calStyles.navBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={18} color={colors.text} />
        </Pressable>
        <Text style={calStyles.monthLabel}>
          {MONTH_NAMES[month.getMonth()]} {month.getFullYear()}
        </Text>
        <Pressable onPress={nextMonth} style={calStyles.navBtn} hitSlop={8}>
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </Pressable>
      </View>

      {/* Day-of-week headers */}
      <View style={calStyles.dowRow}>
        {DAY_LABELS.map(d => (
          <View key={d} style={calStyles.dowCell}>
            <Text style={calStyles.dowText}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Date grid */}
      <View style={calStyles.grid}>
        {cells.map((day, i) => {
          if (day === null) {
            return <View key={`e-${i}`} style={calStyles.cell} />;
          }
          const cellDate = new Date(month.getFullYear(), month.getMonth(), day);
          const isToday    = toKey(cellDate) === toKey(today);
          const isSelected = toKey(cellDate) === toKey(selectedDate);
          const hasEvent   = markedDates.includes(toKey(cellDate));

          return (
            <Pressable
              key={day}
              style={calStyles.cell}
              onPress={() => onSelectDate(cellDate)}
            >
              <View
                style={[
                  calStyles.dateCircle,
                  isSelected && calStyles.dateCircleSelected,
                  isToday && !isSelected && calStyles.dateCircleToday,
                ]}
              >
                <Text
                  style={[
                    calStyles.dateText,
                    isSelected && calStyles.dateTextSelected,
                    isToday && !isSelected && calStyles.dateTextToday,
                  ]}
                >
                  {day}
                </Text>
              </View>
              {hasEvent && !isSelected && (
                <View style={calStyles.eventDot} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const CELL_SIZE = Math.floor((SCREEN_W - spacing.xl * 2 - spacing.xl * 2) / 7);

const calStyles = StyleSheet.create({
  wrap:    { gap: spacing.md },
  nav:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navBtn:  { padding: 6 },
  monthLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  dowRow:  { flexDirection: 'row' },
  dowCell: { width: CELL_SIZE, alignItems: 'center', paddingBottom: 6 },
  dowText: { fontSize: 11, fontWeight: '600', color: colors.textTertiary },
  grid:    { flexDirection: 'row', flexWrap: 'wrap' },
  cell:    { width: CELL_SIZE, height: CELL_SIZE, alignItems: 'center', justifyContent: 'center' },
  dateCircle: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  dateCircleSelected: { backgroundColor: colors.text },
  dateCircleToday:    { backgroundColor: colors.primary100 },
  dateText:         { fontSize: 13, fontWeight: '400', color: colors.text },
  dateTextSelected: { fontWeight: '700', color: '#fff' },
  dateTextToday:    { fontWeight: '700', color: colors.primary },
  eventDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 1,
  },
});

/* ── Main screen ────────────────────────────────────────────────────────── */
export default function Reminders() {
  const { t } = useTranslation();
  const { isRTL, textAlign } = useRTL();
  const [segment, setSegment]           = useState<'Active' | 'Past'>('Active');
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm]   = useState({ title: '', datetime: '', frequency: '', description: '' });
  const [formErrors, setFormErrors] = useState<any>({});
  const [creating, setCreating]         = useState(false);
  const [toggling, setToggling]         = useState<Record<string, boolean>>({});
  const [toggleMsg, setToggleMsg]       = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [doneMap, setDoneMap]           = useState<Record<string, boolean>>({});

  const { reminders, loading, error, updateReminder, createReminder, refresh } = useReminders();

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 8, delay: 40 }),
    ]).start();
  }, []);

  useEffect(() => {
    (async () => {
      const map = await getDayCompletion(selectedDate);
      setDoneMap(map);
    })();
  }, [selectedDate, reminders.length]);

  const filtered = reminders.filter(r => segment === 'Active' ? r.active : !r.active);

  // Dates that have reminders — for calendar dots
  const markedDates = reminders
    .map(r => r.datetime?.match(/(\d{4}-\d{2}-\d{2})/)?.[1])
    .filter(Boolean) as string[];

  /* ── Actions ─────────────────────────────────────────────────────────── */
  const toggleActive = async (reminder: any) => {
    setToggling(prev => ({ ...prev, [reminder.id]: true }));
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

  const toggleDoneToday = async (id: string) => {
    const next = !doneMap[id];
    setDoneMap(m => ({ ...m, [id]: next }));
    await setCompleted(id, next, selectedDate);
  };

  const validateField = (field: string, value: string) => {
    if (field === 'title'    && (!value || value.trim().length < 2)) return t('reminders.titleRequired', 'Title is required.');
    if (field === 'datetime' && !value) return t('reminders.dateTimeRequired', 'Date/Time is required.');
    if (field === 'datetime' && !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value.trim()))
      return t('reminders.dateTimeFormat', 'Format: YYYY-MM-DD HH:mm');
    if (field === 'frequency' && !value) return t('reminders.frequencyRequired', 'Frequency is required.');
    if (field === 'frequency' && !/^(Daily|Weekly|Monthly)$/i.test(value.trim()))
      return t('reminders.frequencyOptions', 'Use: Daily, Weekly, or Monthly.');
    return undefined;
  };

  const handleCreate = async () => {
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
  const pendingCount   = Math.max(filtered.length - completedCount, 0);
  const getTime = (dt: string) => dt?.match(/(\d{2}:\d{2})/)?.[1] ?? '--:--';
  const getDateShort = (dt: string) => {
    const m = dt?.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return '';
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${m[3]} ${months[parseInt(m[2], 10) - 1]}`;
  };
  const getDayName = (dt: string) => {
    const m = dt?.match(/(\d{4}-\d{2}-\d{2})/);
    if (!m) return '';
    return new Date(m[1]).toLocaleDateString('en', { weekday: 'short' });
  };

  /* ── Card renderer ───────────────────────────────────────────────────── */
  const renderCard = (r: any) => {
    const isDone     = !!doneMap[r.id];
    const isLoading  = !!toggling[r.id];
    const typeColor  = r.type === 'checkup' ? colors.info : colors.primary;
    const iconName   = isDone ? 'checkmark-circle' : (r.type === 'checkup' ? 'calendar-outline' : 'medical-outline');
    const iconColor  = isDone ? colors.success : colors.textSecondary;

    return (
      <Animated.View key={r.id} style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={[styles.card, isDone && styles.cardDone]}>
          {/* Colored left strip */}
          <View style={[styles.cardStrip, { backgroundColor: isDone ? colors.success : typeColor }]} />

          <View style={styles.cardBody}>
            {/* Top row: icon + title + toggle */}
            <View style={styles.cardTopRow}>
              <View style={styles.cardIcon}>
                <Ionicons name={iconName} size={20} color={iconColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, isDone && styles.cardTitleDone]} numberOfLines={1}>
                  {r.title}
                </Text>
                <Text style={styles.cardTypeLabel}>
                  {r.type === 'checkup' ? t('reminders.checkup', 'Check-up') : t('reminders.medication', 'Medication')}
                </Text>
              </View>
              {isLoading
                ? <ActivityIndicator size={18} color={colors.primary} />
                : (
                  <Switch
                    value={r.active}
                    onValueChange={() => toggleActive(r)}
                    disabled={isLoading}
                    trackColor={{ false: colors.line, true: colors.primary300 }}
                    thumbColor={r.active ? colors.primary : '#fff'}
                  />
                )}
            </View>

            {/* Time + frequency */}
            <View style={styles.chipRow}>
              <View style={styles.chip}>
                <Ionicons name="time-outline" size={11} color={colors.textTertiary} />
                <Text style={styles.chipText}>{getTime(r.datetime)}</Text>
              </View>
              {r.frequency ? (
                <View style={styles.chip}>
                  <Ionicons name="repeat" size={11} color={colors.textTertiary} />
                  <Text style={styles.chipText}>{r.frequency}</Text>
                </View>
              ) : null}
            </View>

            {r.description ? (
              <Text style={styles.cardDesc} numberOfLines={2}>{r.description}</Text>
            ) : null}

            {/* Mark done */}
            <Pressable
              style={({ pressed }) => [
                styles.doneCTA,
                isDone && styles.doneCTADone,
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => toggleDoneToday(r.id)}
            >
              <Ionicons
                name={isDone ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={15}
                color={isDone ? '#fff' : colors.primary}
              />
              <Text style={[styles.doneCTAText, isDone && { color: '#fff' }]}>
                {isDone ? t('reminders.completed', 'Done') : t('reminders.markAsDone', 'Mark as done')}
              </Text>
            </Pressable>

            {!!toggleMsg[r.id] && (
              <Text style={[styles.statusMsg, toggleMsg[r.id].includes('Failed') && { color: colors.danger }]}>
                {toggleMsg[r.id]}
              </Text>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  /* ── List content ────────────────────────────────────────────────────── */
  let listContent: React.ReactNode;
  if (loading) {
    listContent = (
      <View style={styles.cardGap}>
        <SkeletonReminderCardXL />
        <SkeletonReminderCardXL />
        <SkeletonReminderCardXL />
      </View>
    );
  } else if (error) {
    listContent = (
      <View style={styles.emptyBox}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.danger100 }]}>
          <Ionicons name="alert-circle-outline" size={28} color={colors.danger} />
        </View>
        <Text style={styles.emptyTitle}>{t('common.error', 'Error')}</Text>
        <Text style={styles.emptyHint}>{error}</Text>
      </View>
    );
  } else if (filtered.length === 0) {
    listContent = (
      <View style={styles.emptyBox}>
        <View style={styles.emptyIcon}>
          <Ionicons name="calendar-outline" size={28} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>{t('reminders.noReminders', 'No reminders')}</Text>
        <Text style={styles.emptyHint}>
          {segment === 'Active'
            ? t('reminders.addReminderToStart', 'Add a reminder to get started')
            : t('reminders.noPastReminders', 'No past reminders')}
        </Text>
      </View>
    );
  } else {
    listContent = <View style={styles.cardGap}>{filtered.map(r => renderCard(r))}</View>;
  }

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <ScreenContainer scrollable contentContainerStyle={styles.content}>

      {/* ── Header ─────────────────────────────────────────── */}
      <Animated.View style={[styles.headerRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.screenSub}>{t('reminders.title', 'Calendar')}</Text>
          <Text style={styles.screenTitle}>{t('navigation.reminders', 'Appointments')}</Text>
        </View>
        <View style={styles.headerBtns}>
          <Pressable style={styles.headerBtn} onPress={refresh}>
            <Ionicons name="refresh-outline" size={18} color={colors.text} />
          </Pressable>
          <Pressable
            style={[styles.headerBtn, { backgroundColor: colors.primary }]}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={18} color="#fff" />
          </Pressable>
        </View>
      </Animated.View>

      {/* ── Stats pills ────────────────────────────────────── */}
      <Animated.View style={[styles.statsRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {([
          { val: filtered.length, label: t('reminders.active', 'Active') },
          { val: completedCount,  label: t('dashboard.completedToday', 'Done') },
          { val: pendingCount,    label: t('dashboard.pendingReminders', 'Pending') },
        ]).map((s, i) => (
          <React.Fragment key={i}>
            {i > 0 && <View style={styles.statDivider} />}
            <View style={styles.statPill}>
              <Text style={styles.statNum}>{s.val}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          </React.Fragment>
        ))}
      </Animated.View>

      {/* ── Segment tabs ───────────────────────────────────── */}
      <Animated.View style={[styles.segTabs, { opacity: fadeAnim }]}>
        {(['Active', 'Past'] as const).map(tab => (
          <Pressable
            key={tab}
            style={[styles.segTab, segment === tab && styles.segTabActive]}
            onPress={() => setSegment(tab)}
          >
            <Text style={[styles.segTabText, segment === tab && styles.segTabTextActive]}>
              {tab === 'Active' ? t('reminders.active', 'Active') : t('reminders.past', 'Past')}
            </Text>
          </Pressable>
        ))}
      </Animated.View>

      {/* ── Full month calendar ─────────────────────────────── */}
      <Animated.View style={[styles.calCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <MonthCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          markedDates={markedDates}
        />
      </Animated.View>

      {/* ── Nearest appointments label ─────────────────────── */}
      {!loading && filtered.length > 0 && (
        <Animated.View style={[styles.nearestRow, { opacity: fadeAnim }]}>
          <Text style={styles.nearestLabel}>
            {t('reminders.upcomingCount', 'Nearest appointments')}
          </Text>
          <View style={styles.nearestBadge}>
            <Text style={styles.nearestBadgeText}>{filtered.length}</Text>
          </View>
        </Animated.View>
      )}

      {/* ── Appointments list ───────────────────────────────── */}
      {listContent}

      {/* ── Add reminder button ─────────────────────────────── */}
      <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: spacing.xl }}>
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.88 }]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={styles.addBtnText}>{t('reminders.create', 'Create Reminder')}</Text>
        </Pressable>
      </Animated.View>

      {/* ── Create modal ────────────────────────────────────── */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalTitleRow}>
              <View style={styles.modalIconWrap}>
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              </View>
              <Text style={styles.modalTitle}>{t('reminders.create', 'New Reminder')}</Text>
            </View>

            {([
              { key: 'title',       placeholder: t('reminders.titlePlaceholder', 'Medication name'), multi: false },
              { key: 'datetime',    placeholder: t('reminders.dateTimePlaceholder', 'Date & time  YYYY-MM-DD HH:mm'), multi: false },
              { key: 'frequency',   placeholder: t('reminders.frequencyPlaceholder', 'Frequency: Daily, Weekly or Monthly'), multi: false },
              { key: 'description', placeholder: t('reminders.descriptionPlaceholder', 'Notes (optional)'), multi: true },
            ]).map(field => (
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
              <Pressable style={styles.cancelBtn} onPress={() => setModalVisible(false)} disabled={creating}>
                <Text style={styles.cancelText}>{t('common.cancel', 'Cancel')}</Text>
              </Pressable>
              <Pressable style={[styles.saveBtn, creating && { opacity: 0.7 }]} onPress={handleCreate} disabled={creating}>
                {creating
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveText}>{t('common.save', 'Save')}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  content: { paddingBottom: 110, gap: spacing.xl },

  /* Header */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  screenSub: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  headerBtns: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingBottom: 2 },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Stats */
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: 0,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: 1,
  },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.line, alignSelf: 'stretch', marginVertical: 4 },
  statNum:   { fontSize: 20, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 11, fontWeight: '400', color: colors.textSecondary, textAlign: 'center' },

  /* Segment tabs */
  segTabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.xl,
    padding: 4,
    gap: 4,
  },
  segTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  segTabActive: { backgroundColor: colors.primary },
  segTabText: { fontSize: 13, fontWeight: '600', color: colors.textTertiary },
  segTabTextActive: { color: '#fff' },

  /* Calendar card */
  calCard: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.xl,
    padding: spacing.xl,
    borderRadius: radius.xxl,
    ...shadow.card,
  },

  /* Nearest label */
  nearestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  nearestLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  nearestBadge: {
    backgroundColor: colors.bgSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.md,
  },
  nearestBadgeText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },

  /* Appointment cards */
  cardGap: { gap: spacing.md, paddingHorizontal: spacing.xl },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.card,
  },
  cardDone: { opacity: 0.7 },
  cardStrip: { width: 3 },
  cardBody: { flex: 1, padding: spacing.lg, gap: spacing.md },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSecondary,
  },
  cardTitle:     { fontSize: 15, fontWeight: '600', color: colors.text, lineHeight: 21 },
  cardTitleDone: { color: colors.textTertiary, textDecorationLine: 'line-through' },
  cardTypeLabel: { fontSize: 11, fontWeight: '500', color: colors.textTertiary, marginTop: 1 },

  chipRow: { flexDirection: 'row', gap: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.md,
    backgroundColor: colors.bgSecondary,
  },
  chipText: { fontSize: 11, fontWeight: '500', color: colors.textSecondary },
  cardDesc: { fontSize: 12, color: colors.textTertiary, lineHeight: 18 },

  doneCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: radius.lg,
    backgroundColor: colors.bgSecondary,
  },
  doneCTADone:  { backgroundColor: colors.success },
  doneCTAText:  { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  statusMsg:    { fontSize: 11, color: colors.textTertiary, textAlign: 'center' },

  /* Add button */
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    height: 44,
    borderRadius: radius.lg,
  },
  addBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },

  /* Empty */
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.card,
    marginHorizontal: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 13,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, textAlign: 'center' },
  emptyHint:  { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xxxl,
    borderTopRightRadius: radius.xxxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl * 2,
    gap: spacing.md,
    ...shadow.xl,
  },
  modalHandle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, alignSelf: 'center', marginBottom: spacing.sm },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xs },
  modalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  input: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.bgSecondary,
    fontSize: 14,
    color: colors.text,
  },
  inputError: { borderColor: colors.danger },
  inputMulti: { height: 76, textAlignVertical: 'top' },
  fieldError: { fontSize: 11, color: colors.danger, marginTop: -spacing.xs, marginLeft: 4 },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cancelText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  saveBtn: {
    flex: 2,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  saveText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
