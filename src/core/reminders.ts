// Core reminders logic for cross-platform use
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.js';

export interface Reminder {
  id: string;
  type: 'medication' | 'checkup';
  title: string;
  description?: string;
  datetime: string;
  frequency: string;
  active: boolean;
}

export async function fetchReminders(): Promise<Reminder[]> {
  const remindersCollection = collection(db, 'reminders');
  const querySnapshot = await getDocs(remindersCollection);
  return querySnapshot.docs.map(doc => {
    const reminder = doc.data();
    return {
      id: doc.id,
      type: reminder.type || 'medication',
      title: reminder.title || 'Untitled',
      description: reminder.description || '',
      datetime: reminder.datetime || new Date().toISOString(),
      frequency: reminder.frequency || 'once',
      active: reminder.active || false,
    };
  });
}

export async function createReminder(reminder: Omit<Reminder, 'id'>): Promise<Reminder> {
  const remindersCollection = collection(db, 'reminders');
  const docRef = await addDoc(remindersCollection, reminder);
  return { id: docRef.id, ...reminder };
}

export async function updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder> {
  const reminderDoc = doc(db, 'reminders', id);
  await updateDoc(reminderDoc, updates);
  return { id, ...updates } as Reminder;
}

export async function deleteReminder(id: string): Promise<void> {
  const reminderDoc = doc(db, 'reminders', id);
  await deleteDoc(reminderDoc);
}
