// Recent search terms (device-only).
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'lk-search-history';
const MAX = 8;

export async function getSearchHistory(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

export async function addSearchTerm(term: string): Promise<string[]> {
  const clean = term.trim().slice(0, 60);
  if (!clean) return getSearchHistory();
  const current = await getSearchHistory();
  const next = [clean, ...current.filter((s) => s.toLocaleLowerCase() !== clean.toLocaleLowerCase())].slice(0, MAX);
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  return next;
}

export async function clearSearchHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {}
}

// Simple device notepad (device-only).
const NOTES_KEY = 'lk-notes';

export type NoteItem = { id: string; text: string; createdAt: number };

export async function getNotes(): Promise<NoteItem[]> {
  try {
    const raw = await AsyncStorage.getItem(NOTES_KEY);
    const parsed = raw ? (JSON.parse(raw) as NoteItem[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addNote(text: string): Promise<NoteItem[]> {
  const clean = text.trim().slice(0, 500);
  if (!clean) return getNotes();
  const current = await getNotes();
  const next = [{ id: `${Date.now()}`, text: clean, createdAt: Date.now() }, ...current].slice(0, 100);
  try {
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(next));
  } catch {}
  return next;
}

export async function deleteNote(id: string): Promise<NoteItem[]> {
  const current = await getNotes();
  const next = current.filter((n) => n.id !== id);
  try {
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(next));
  } catch {}
  return next;
}
