import { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, limit, Query } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import type { Reminder } from '../types';

export function useOptimizedReminders(filters?: {
  active?: boolean;
  date?: Date;
  limit?: number;
}) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReminders() {
      setLoading(true);
      try {
        const auth = getAuth();
        const userId = auth.currentUser?.uid;
        
        if (!userId) {
          setReminders([]);
          return;
        }

        let remindersQuery: Query = collection(db, 'reminders');
        const constraints = [];
        
        // Always filter by user for security and performance
        constraints.push(where('user_id', '==', userId));
        
        if (filters?.active !== undefined) {
          constraints.push(where('active', '==', filters.active));
        }
        
        // Add ordering for consistent results
        constraints.push(orderBy('createdAt', 'desc'));
        
        if (filters?.limit) {
          constraints.push(limit(filters.limit));
        }
        
        remindersQuery = query(remindersQuery, ...constraints);
        
        const querySnapshot = await getDocs(remindersQuery);
        const data: Reminder[] = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as Reminder[];
        
        // Filter by date if provided (client-side for now)
        if (filters?.date) {
          const filterDate = new Date(filters.date);
          filterDate.setHours(0, 0, 0, 0);
          const nextDay = new Date(filterDate);
          nextDay.setDate(nextDay.getDate() + 1);
          
          // Convert Firestore timestamps to dates
          const filtered = data.filter(r => {
            const reminderDate = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
            return reminderDate >= filterDate && reminderDate < nextDay;
          });
          setReminders(filtered);
        } else {
          setReminders(data);
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load reminders');
      } finally {
        setLoading(false);
      }
    }
    fetchReminders();
  }, [filters?.active, filters?.date, filters?.limit]);

  // Memoized statistics
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return {
      total: reminders.length,
      active: reminders.filter(r => r.active).length,
      today: reminders.filter(r => {
        const reminderDate = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
        return reminderDate >= today && reminderDate < tomorrow;
      }).length,
    };
  }, [reminders]);

  return { reminders, loading, error, stats };
}
