import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ThemeChoice } from '@/constants/colors';

const KEY = 'lk-theme-choice';

type ThemeContextValue = {
  choice: ThemeChoice;
  ready: boolean;
  setChoice: (choice: ThemeChoice) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [choice, setChoiceState] = useState<ThemeChoice>('default-light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(KEY);
        if (stored === 'default-light' || stored === 'deep-night' || stored === 'sepia' || stored === 'cartoon' || stored === 'forest' || stored === 'lavender') {
          setChoiceState(stored);
        }
      } catch {}
      setReady(true);
    })();
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      choice,
      ready,
      setChoice: async (next: ThemeChoice) => {
        setChoiceState(next);
        try {
          await AsyncStorage.setItem(KEY, next);
        } catch {}
      },
    }),
    [choice],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useAppTheme must be used within ThemeProvider');
  return context;
}
