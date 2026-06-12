import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import i18next from 'i18next';
import { fetchReminders, createReminder, updateReminder, deleteReminder, Reminder } from '../core/reminders';

interface RemindersContextType {
  reminders: Reminder[];
  loading: boolean;
  error: string | null;
  createReminder: (reminder: Omit<Reminder, 'id'>) => Promise<Reminder>;
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<any>;
  deleteReminder: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  subscribe: (cb: () => void) => () => void;
  notify: () => void;
}

const RemindersContext = createContext<RemindersContextType | undefined>(undefined);

// Simple event emitter for reminder changes
const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function notify() {
  listeners.forEach(cb => cb());
}

export const RemindersProvider = ({ children }: { children: ReactNode }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRemindersHook = async () => {
    try {
      const data = await fetchReminders();
      setReminders(data || []);
      setError(null);
    } catch (err) {
      setError(i18next.t('errors.loadRemindersFailed', 'Failed to load reminders'));
    } finally {
      setLoading(false);
    }
  };

  const createReminderHook = async (reminder: Omit<Reminder, 'id'>) => {
    try {
      const data = await createReminder(reminder);
      setReminders(prev => [...prev, data]);
      notify();
      return data;
    } catch (err) {
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
      notify();
      return { id, ...updates };
    } catch (err) {
      throw err;
    }
  };

  const deleteReminderHook = async (id: string) => {
    try {
      await deleteReminder(id);
      setReminders(prev => prev.filter(reminder => reminder.id !== id));
      notify();
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchRemindersHook();
  }, []);

  return (
    <RemindersContext.Provider
      value={{ reminders, loading, error, createReminder: createReminderHook, updateReminder: updateReminderHook, deleteReminder: deleteReminderHook, refresh: fetchRemindersHook, subscribe, notify }}
    >
      {children}
    </RemindersContext.Provider>
  );
};

export function useReminders() {
  const context = useContext(RemindersContext);
  if (!context) {
    throw new Error('useReminders must be used within a RemindersProvider');
  }
  return context;
}
