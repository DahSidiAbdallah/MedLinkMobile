import React, { useMemo } from 'react';
import { Modal, View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useNotifications } from './NotificationsContext';
import { colors, spacing, radius } from '../theme';
import { MaterialIcons } from '@expo/vector-icons';
import PropTypes from 'prop-types';

export default function NotificationsSheet({ visible, onClose }) {
  const { notifications, markAllRead, clearAll, markRead, removeOne } = useNotifications();

  const summary = useMemo(() => notifications, [notifications]);

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <View style={styles.headerRow}>
          <Text style={styles.title}>Notifications</Text>
          <View style={styles.headerActions}>
            {summary.length > 0 && (
              <>
                <Pressable onPress={markAllRead} style={styles.headerBtn}>
                  <Text style={styles.headerBtnText}>Mark all read</Text>
                </Pressable>
                <Pressable onPress={clearAll} style={styles.headerBtn}>
                  <Text style={styles.headerBtnText}>Clear</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
        {summary.length === 0 ? (
      <View style={styles.empty}>
        <MaterialIcons name="notifications-none" size={40} color={colors.muted} />
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptyText}>You have no notifications.</Text>
          </View>
        ) : (
          <FlatList
            data={summary}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item }) => (
              <View style={[styles.card, item.read && styles.cardRead]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title || 'Notification'}
                  </Text>
                  {item.subtitle ? (
                    <Text style={styles.cardSubtitle} numberOfLines={2}>
                      {item.subtitle}
                    </Text>
                  ) : null}
                  {item.time ? (
                    <Text style={styles.cardTime}>{item.time}</Text>
                  ) : null}
                </View>
                <View style={styles.cardActions}>
                  {!item.read && (
                    <Pressable onPress={() => markRead(item.id)} style={styles.pill}>
                      <Text style={styles.pillText}>Read</Text>
                    </Pressable>
                  )}
                  <Pressable onPress={() => removeOne(item.id)} style={[styles.pill, styles.pillGhost]}>
                    <MaterialIcons name="close" size={16} />
                  </Pressable>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

NotificationsSheet.propTypes = {
  visible: PropTypes.bool,
  onClose: PropTypes.func,
};

NotificationsSheet.defaultProps = {
  visible: false,
  onClose: () => {},
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl + 4, borderTopRightRadius: radius.xl + 4,
    paddingTop: 12,
    paddingHorizontal: spacing.xl,
    paddingBottom: 48,
    maxHeight: '85%',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16, elevation: 12,
  },
  grabber: {
    alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: colors.line, marginBottom: spacing.sm,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: { paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8, backgroundColor: colors.line },
  headerBtnText: { fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 28, gap: 6 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  emptyText: { fontSize: 13, color: colors.muted },
  card: {
    borderRadius: 14,
    borderWidth: 1, borderColor: colors.line,
    backgroundColor: colors.card,
    padding: 12, marginVertical: 6,
    flexDirection: 'row', gap: 12, alignItems: 'center',
  },
  cardRead: { opacity: 0.7 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  cardSubtitle: { fontSize: 13, color: colors.text, marginTop: 2 },
  cardTime: { fontSize: 11, color: colors.muted, marginTop: 6 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: {
    paddingVertical: 6, paddingHorizontal: 10, borderRadius: 9999,
    backgroundColor: colors.text,
  },
  pillText: { color: colors.card, fontSize: 12, fontWeight: '700' },
  pillGhost: { backgroundColor: colors.line },
});
