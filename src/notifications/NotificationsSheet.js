import React, { useMemo } from 'react';
import { Modal, View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useNotifications } from './NotificationsContext';
import { MaterialIcons } from '@expo/vector-icons';

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
            <MaterialIcons name="notifications-none" size={40} color="#6b7280" />
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

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
  sheet: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 14,
    maxHeight: '80%',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, elevation: 8,
  },
  grabber: {
    alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', marginBottom: 10,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: { paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8, backgroundColor: '#f3f4f6' },
  headerBtnText: { fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 28, gap: 6 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptyText: { fontSize: 13, color: '#6b7280' },
  card: {
    borderRadius: 14,
    borderWidth: 1, borderColor: '#f1f5f9',
    backgroundColor: '#fff',
    padding: 12, marginVertical: 6,
    flexDirection: 'row', gap: 12, alignItems: 'center',
  },
  cardRead: { opacity: 0.7 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardSubtitle: { fontSize: 13, color: '#374151', marginTop: 2 },
  cardTime: { fontSize: 11, color: '#6b7280', marginTop: 6 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: {
    paddingVertical: 6, paddingHorizontal: 10, borderRadius: 9999,
    backgroundColor: '#111827',
  },
  pillText: { color: 'white', fontSize: 12, fontWeight: '700' },
  pillGhost: { backgroundColor: '#f3f4f6' },
});
