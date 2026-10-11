import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { loadAsync } from 'expo-font';
import {
  NotoSerifBengali_400Regular,
  NotoSerifBengali_500Medium,
  NotoSerifBengali_600SemiBold,
  NotoSerifBengali_700Bold,
} from '@expo-google-fonts/noto-serif-bengali';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { LibraryProvider } from '@/context/LibraryContext';
import { DisplayProvider } from '@/context/DisplayContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { WriterAccessProvider } from '@/context/WriterAccessContext';
import { WriterContentProvider } from '@/context/WriterContentContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, headerBackTitle: 'Back' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="book/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="reader/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="writer/verification" options={{ headerShown: false }} />
      <Stack.Screen name="writer/panel" options={{ headerShown: false }} />
      <Stack.Screen name="writer/monetization" options={{ headerShown: false }} />
      <Stack.Screen name="writer/support" options={{ headerShown: false }} />
    </Stack>
  );
}

const APP_FONTS = {
  NotoSerifBengali_400Regular,
  NotoSerifBengali_500Medium,
  NotoSerifBengali_600SemiBold,
  NotoSerifBengali_700Bold,
};

// Web font loading (fontfaceobserver) throws "6000ms timeout exceeded" when a
// font file is slow/blocked. Retry a few times, then render anyway with
// fallback fonts — a font hiccup must never red-screen the app.
function useAppFonts() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      for (let attempt = 0; attempt < 4 && alive; attempt++) {
        try {
          await loadAsync(APP_FONTS);
          break;
        } catch {
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }
      if (alive) setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return ready;
}

export default function RootLayout() {
  const fontsReady = useAppFonts();

  useEffect(() => {
    if (fontsReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsReady]);

  if (!fontsReady) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <LibraryProvider>
              <DisplayProvider>
                <NotificationProvider>
                  <WriterAccessProvider>
                    <WriterContentProvider>
                      <RootLayoutNav />
                    </WriterContentProvider>
                  </WriterAccessProvider>
                </NotificationProvider>
              </DisplayProvider>
            </LibraryProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
