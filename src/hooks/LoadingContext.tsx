import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type LoadingContextType = {
  startLoading: (key: string) => void;
  finishLoading: (key: string) => void;
  isLoading: boolean;
  activeKeys: string[];
};

const LoadingContext = createContext<LoadingContextType | null>(null);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<Set<string>>(new Set());

  const startLoading = useCallback((key: string) => {
    setActive(a => {
      const next = new Set(a);
      next.add(key);
      return next;
    });
  }, []);

  const finishLoading = useCallback((key: string) => {
    setActive(a => {
      const next = new Set(a);
      next.delete(key);
      return next;
    });
  }, []);

  const value = useMemo(() => ({
    startLoading,
    finishLoading,
    isLoading: active.size > 0,
    activeKeys: Array.from(active),
  }), [startLoading, finishLoading, active]);

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
}

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useLoading must be used within LoadingProvider');
  return ctx;
}

export default LoadingContext;
