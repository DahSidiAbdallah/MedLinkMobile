
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Reminder } from '../core/reminders';

interface ReminderListProps {
  reminders: Reminder[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (reminder: Reminder) => void;
}

export const ReminderList: React.FC<ReminderListProps> = ({ reminders, onToggle, onDelete, onEdit }) => {
  const renderItem = ({ item }: { item: Reminder }) => (
    <View style={[styles.card, !item.active && styles.inactive]}> 
      <View style={styles.cardHeader}>
        <Ionicons name="alarm" size={28} color={item.active ? '#2196F3' : '#bbb'} style={{ marginRight: 10 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.type.charAt(0).toUpperCase() + item.type.slice(1)} Reminder</Text>
        </View>
        <TouchableOpacity onPress={() => onEdit(item)} style={styles.iconBtn}>
          <Ionicons name="pencil" size={20} color="#2196F3" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.iconBtn}>
          <Ionicons name="trash" size={20} color="#e53935" />
        </TouchableOpacity>
      </View>
      <View style={styles.cardDetails}>
        <MaterialCommunityIcons name="calendar-clock" size={18} color="#2196F3" style={{ marginRight: 6 }} />
        <Text style={styles.detail}>{item.datetime}</Text>
        <Ionicons name="repeat" size={18} color="#2196F3" style={{ marginLeft: 16, marginRight: 6 }} />
        <Text style={styles.detail}>{item.frequency}</Text>
        <TouchableOpacity onPress={() => onToggle(item.id)} style={styles.toggleBtn}>
          <Ionicons name={item.active ? 'notifications' : 'notifications-off'} size={20} color={item.active ? '#2196F3' : '#bbb'} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f6f8fa' }}>
      <FlatList
        data={reminders}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No reminders found.</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => onEdit({} as Reminder)}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  list: { padding: 20, paddingBottom: 80 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 16, elevation: 3, shadowColor: '#2196F3', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  inactive: { opacity: 0.5 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  subtitle: { fontSize: 14, color: '#888' },
  iconBtn: { marginLeft: 8, padding: 4 },
  cardDetails: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  detail: { fontSize: 14, color: '#444' },
  toggleBtn: { marginLeft: 'auto', padding: 6 },
  fab: { position: 'absolute', right: 24, bottom: 24, backgroundColor: '#2196F3', borderRadius: 32, width: 56, height: 56, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#2196F3', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
});
