// Offline chapter cache for downloaded books.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ApiChapter } from './api';

const key = (bookId: string) => `lk-offline-chapters:${bookId}`;

export async function saveOfflineChapters(bookId: string, chapters: ApiChapter[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key(bookId), JSON.stringify(chapters.slice(0, 200)));
  } catch {}
}

export async function getOfflineChapters(bookId: string): Promise<ApiChapter[] | null> {
  try {
    const raw = await AsyncStorage.getItem(key(bookId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ApiChapter[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function clearOfflineChapters(bookId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key(bookId));
  } catch {}
}

export async function clearAllOfflineChapters(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const ours = keys.filter((k) => k.startsWith('lk-offline-chapters:'));
    if (ours.length) await AsyncStorage.multiRemove(ours);
  } catch {}
}

export async function getOfflineBytes(): Promise<number> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const ours = keys.filter((k) => k.startsWith('lk-offline-chapters:'));
    if (!ours.length) return 0;
    const entries = await AsyncStorage.multiGet(ours);
    return entries.reduce((sum, [, v]) => sum + (v ? v.length : 0), 0);
  } catch {
    return 0;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}
