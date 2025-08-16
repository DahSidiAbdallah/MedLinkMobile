import { useState, useEffect } from 'react';
import { fetchReminders, createReminder, updateReminder, deleteReminder, Reminder } from '../core/reminders';

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRemindersHook = async () => {
    try {
      const data = await fetchReminders();
      setReminders(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching reminders:', err);
      setError('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  const createReminderHook = async (reminder: Omit<Reminder, 'id'>) => {
    try {
      const data = await createReminder(reminder);
      setReminders(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error creating reminder:', err);
      throw err;
    }
  };

  const updateReminderHook = async (id: string, updates: Partial<Reminder>) => {
    try {
      await updateReminder(id, updates);
      setReminders(prev =>
        prev.map(reminder =>
          reminder.id === id ? { ...reminder, ...updates } : reminder
        )
      );
      return { id, ...updates };
    } catch (err) {
      console.error('Error updating reminder:', err);
      throw err;
    }
  };

  const deleteReminderHook = async (id: string) => {
    try {
      await deleteReminder(id);
      setReminders(prev => prev.filter(reminder => reminder.id !== id));
    } catch (err) {
      console.error('Error deleting reminder:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchRemindersHook();
  }, []);

  return {
    reminders,
    loading,
    error,
    createReminder: createReminderHook,
    updateReminder: updateReminderHook,
    deleteReminder: deleteReminderHook,
    refresh: fetchRemindersHook,
  };
}