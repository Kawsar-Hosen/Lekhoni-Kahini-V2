import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

// expo-notifications is not available inside Expo Go (remote push was removed
// from Expo Go in SDK 53+), so load it lazily and degrade gracefully.
type NotificationsModule = typeof import('expo-notifications');
let Notifications: NotificationsModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications') as NotificationsModule;
} catch {
  Notifications = null;
}

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  icon: 'book-open' | 'headphones' | 'bell' | 'check-circle';
  bookId?: string;
  read: boolean;
};

const initialNotifications: AppNotification[] = [
  {
    id: 'new-episode-mohamaya',
    title: 'নতুন পর্ব প্রকাশিত',
    body: 'মহামায়া সিজন ১-এর নতুন পর্ব এখন পড়তে পারবেন।',
    time: '১০ মিনিট আগে',
    icon: 'book-open',
    bookId: 'mohamaya-season-1',
    read: false,
  },
  {
    id: 'audio-kismot',
    title: 'নতুন অডিও গল্প',
    body: 'কিসমত কা সফরের অডিও ভার্সন শুনে দেখুন।',
    time: '২ ঘণ্টা আগে',
    icon: 'headphones',
    bookId: 'kismot-ka-sobor',
    read: false,
  },
  {
    id: 'welcome',
    title: 'লেখনি কাহিনীতে স্বাগতম',
    body: 'আপনার পছন্দের বই সেভ করলে সেগুলো লাইব্রেরিতে পাওয়া যাবে।',
    time: 'গতকাল',
    icon: 'bell',
    read: true,
  },
];

type NotificationContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  permissionStatus: 'unknown' | 'granted' | 'denied' | 'undetermined';
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  enableDeviceNotifications: () => Promise<boolean>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

if (Platform.OS !== 'web' && Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: true,
      }),
    });
  } catch {
    // Expo Go or devices without notification support: ignore.
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);
  const [permissionStatus, setPermissionStatus] = useState<NotificationContextValue['permissionStatus']>('unknown');

  useEffect(() => {
    void AsyncStorage.getItem('lekhoniNotifications').then((value) => {
      if (!value) return;
      try {
        setNotifications(JSON.parse(value) as AppNotification[]);
      } catch {
        setNotifications(initialNotifications);
      }
    });
  }, []);

  useEffect(() => {
    void AsyncStorage.setItem('lekhoniNotifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    if (Platform.OS === 'web' || !Notifications) {
      setPermissionStatus('denied');
      return;
    }
    try {
      void Notifications.getPermissionsAsync().then((response) => {
        setPermissionStatus(response.granted ? 'granted' : response.status === 'undetermined' ? 'undetermined' : 'denied');
      });
    } catch {
      setPermissionStatus('denied');
    }
  }, []);

  const value = useMemo<NotificationContextValue>(() => ({
    notifications,
    unreadCount: notifications.filter((item) => !item.read).length,
    permissionStatus,
    markAsRead: (id) => setNotifications((current) => current.map((item) => item.id === id ? { ...item, read: true } : item)),
    markAllAsRead: () => setNotifications((current) => current.map((item) => ({ ...item, read: true }))),
    clearNotifications: () => setNotifications([]),
    enableDeviceNotifications: async () => {
      if (Platform.OS === 'web' || !Notifications) return false;
      try {
        let response = await Notifications.getPermissionsAsync();
        if (!response.granted && response.canAskAgain) {
          response = await Notifications.requestPermissionsAsync();
        }
        const granted = response.granted;
        setPermissionStatus(granted ? 'granted' : 'denied');
        if (granted) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'লেখনি কাহিনী',
              body: 'নোটিফিকেশন চালু হয়েছে। নতুন গল্প প্রকাশ হলে জানতে পারবেন।',
              data: { screen: 'notifications' },
            },
            trigger: null,
          });
        }
        return granted;
      } catch {
        setPermissionStatus('denied');
        return false;
      }
    },
  }), [notifications, permissionStatus]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}