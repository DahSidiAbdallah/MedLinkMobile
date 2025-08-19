import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';

const NotificationsContext = createContext();

export function NotificationsProvider({ children, initial = [] }) {
  const [notifications, setNotifications] = useState(initial);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  );

  const addNotification = useCallback((notif) => {
    setNotifications(prev => [{ id: Date.now().toString(), read: false, ...notif }, ...prev]);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const markRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const removeOne = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    addNotification,
    markAllRead,
    clearAll,
    markRead,
    removeOne,
  }), [notifications, unreadCount, addNotification, markAllRead, clearAll, markRead, removeOne]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
