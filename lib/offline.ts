// Offline chapter cache for downloaded books.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ApiChapter } from './api';

const key = (bookId: string) => `lk-offline-chapters:${bookId}`;
const pendingWrites = new Map<string, Promise<boolean>>();

function enqueueWrite(bookId: string, write: () => Promise<void>): Promise<boolean> {
  const previous = pendingWrites.get(bookId) ?? Promise.resolve(true);
  const current = previous
    .catch(() => false)
    .then(async () => {
      await write();
      return true;
    })
    .catch(() => false);
  pendingWrites.set(bookId, current);
  void current.finally(() => {
    if (pendingWrites.get(bookId) === current) pendingWrites.delete(bookId);
  });
  return current;
}

async function readOfflineChapters(bookId: string): Promise<ApiChapter[] | null> {
  try {
    const raw = await AsyncStorage.getItem(key(bookId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ApiChapter[];
    return Array.isArray(parsed) ? parsed.sort((a, b) => a.position - b.position) : null;
  } catch {
    return null;
  }
}

export function saveOfflineChapters(bookId: string, chapters: ApiChapter[]): Promise<boolean> {
  return enqueueWrite(bookId, () => AsyncStorage.setItem(key(bookId), JSON.stringify(chapters.slice(0, 200))));
}

export function saveOfflineChapter(bookId: string, chapter: ApiChapter): Promise<boolean> {
  return enqueueWrite(bookId, async () => {
    const current = await readOfflineChapters(bookId) ?? [];
    const byId = new Map(current.map((item) => [item.id, item]));
    byId.set(chapter.id, chapter);
    await AsyncStorage.setItem(key(bookId), JSON.stringify([...byId.values()].slice(-200)));
  });
}

export async function getOfflineChapters(bookId: string): Promise<ApiChapter[] | null> {
  await pendingWrites.get(bookId);
  return readOfflineChapters(bookId);
}

export function clearOfflineChapters(bookId: string): Promise<boolean> {
  return enqueueWrite(bookId, () => AsyncStorage.removeItem(key(bookId)));
}

export async function clearAllOfflineChapters(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const ours = keys.filter((k) => k.startsWith('lk-offline-chapters:'));
    if (ours.length) await AsyncStorage.multiRemove(ours);
  } catch {
    // Keep the app usable if the device storage is temporarily unavailable.
  }
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
