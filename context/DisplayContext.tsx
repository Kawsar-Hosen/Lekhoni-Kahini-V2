import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const KEY = 'lk-display-mode';

type DisplayContextValue = {
  compactCards: boolean;
  toggleCompactCards: () => void;
};

const DisplayContext = createContext<DisplayContextValue | null>(null);

export function DisplayProvider({ children }: { children: React.ReactNode }) {
  const [compactCards, setCompactCards] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(KEY);
        if (stored === 'compact') setCompactCards(true);
      } catch {}
    })();
  }, []);

  const value = useMemo<DisplayContextValue>(
    () => ({
      compactCards,
      toggleCompactCards: () => {
        setCompactCards((current) => {
          const next = !current;
          void AsyncStorage.setItem(KEY, next ? 'compact' : 'default').catch(() => {});
          return next;
        });
      },
    }),
    [compactCards],
  );

  return <DisplayContext.Provider value={value}>{children}</DisplayContext.Provider>;
}

export function useDisplay() {
  const context = useContext(DisplayContext);
  if (!context) throw new Error('useDisplay must be used within DisplayProvider');
  return context;
}
