// Stable per-device id for guest interactions (likes, comments, follows).
// Stored locally only; doubles as the backend device_key.
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'lk-device-id';
let cached: string | null = null;

function uuid(): string {
  const h = '0123456789abcdef';
  const s = (n: number) => Array.from({ length: n }, () => h[Math.floor(Math.random() * 16)]).join('');
  return `${s(8)}-${s(4)}-4${s(3)}-${['8', '9', 'a', 'b'][Math.floor(Math.random() * 4)]}${s(3)}-${s(12)}`;
}

export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  try {
    let id = await AsyncStorage.getItem(KEY);
    if (!id) {
      id = uuid();
      await AsyncStorage.setItem(KEY, id);
    }
    cached = id;
    return id;
  } catch {
    if (!cached) cached = uuid();
    return cached;
  }
}

const NAME_KEY = 'lk-display-name';

export async function getDisplayName(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(NAME_KEY)) || '';
  } catch {
    return '';
  }
}

export async function setDisplayName(name: string): Promise<void> {
  try {
    await AsyncStorage.setItem(NAME_KEY, name);
  } catch {}
}
