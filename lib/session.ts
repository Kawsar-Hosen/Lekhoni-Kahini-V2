// Writer session (token) persistence + rehydration.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { verifyWriterToken, type WriterSession } from './api';

const KEY = 'lk-writer-session';

export async function readStoredToken(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as { token?: string };
    return p.token || null;
  } catch {
    return null;
  }
}

export async function storeToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ token }));
  } catch {}
}

export async function clearStoredToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {}
}

export async function rehydrateSession(): Promise<{ writer: WriterSession; token: string } | null> {
  const token = await readStoredToken();
  if (!token) return null;
  const r = await verifyWriterToken(token);
  if (r.data && 'writer' in r.data) return { writer: r.data.writer, token };
  await clearStoredToken();
  return null;
}
