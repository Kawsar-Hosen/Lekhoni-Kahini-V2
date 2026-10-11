import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type LibraryContextValue = {
  savedIds: string[];
  downloadedIds: string[];
  historyIds: string[];
  toggleSaved: (id: string) => void;
  toggleDownloaded: (id: string) => void;
  setDownloaded: (id: string, downloaded: boolean) => void;
  clearDownloads: () => void;
  addToHistory: (id: string) => void;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);
  const [historyIds, setHistoryIds] = useState<string[]>([]);

  useEffect(() => {
    void AsyncStorage.multiGet(['savedBooks', 'downloadedBooks', 'readingHistory']).then((entries) => {
      const values = Object.fromEntries(entries);
      setSavedIds(values.savedBooks ? JSON.parse(values.savedBooks) : []);
      setDownloadedIds(values.downloadedBooks ? JSON.parse(values.downloadedBooks) : []);
      setHistoryIds(values.readingHistory ? JSON.parse(values.readingHistory) : []);
    });
  }, []);

  useEffect(() => {
    void AsyncStorage.multiSet([
      ['savedBooks', JSON.stringify(savedIds)],
      ['downloadedBooks', JSON.stringify(downloadedIds)],
      ['readingHistory', JSON.stringify(historyIds)],
    ]);
  }, [downloadedIds, historyIds, savedIds]);

  const setDownloaded = useCallback((id: string, downloaded: boolean) => {
    setDownloadedIds((current) => downloaded
      ? current.includes(id) ? current : [...current, id]
      : current.filter((item) => item !== id));
  }, []);

  const value = useMemo(
    () => ({
      savedIds,
      downloadedIds,
      historyIds,
      toggleSaved: (id: string) => {
        void Haptics.selectionAsync();
        setSavedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
      },
      toggleDownloaded: (id: string) => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setDownloadedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
      },
      setDownloaded,
      clearDownloads: () => setDownloadedIds([]),
      addToHistory: (id: string) => setHistoryIds((current) => [id, ...current.filter((item) => item !== id)].slice(0, 12)),
    }),
    [downloadedIds, historyIds, savedIds, setDownloaded],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary must be used within LibraryProvider');
  return context;
}