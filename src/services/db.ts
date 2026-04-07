/**
 * Offline-first storage via AsyncStorage.
 * In production, this would sync to Supabase on reconnect.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const BREWS_KEY = '@coffeeclub:brews';
const SETTINGS_KEY = '@coffeeclub:settings';

export interface StoredBrew {
  id: string;
  name: string;
  rating: number;
  photo: string | null;
  method: string;
  doseIn: number | null;
  yieldOut: number | null;
  brewTime: string | null;
  grindSetting: number | null;
  tastingNotes: string[];
  beanId: number | null;
  createdAt: string;
  synced: boolean;
}

export async function saveBrewLocally(brew: StoredBrew): Promise<void> {
  const existing = await getLocalBrews();
  existing.unshift(brew);
  await AsyncStorage.setItem(BREWS_KEY, JSON.stringify(existing));
}

export async function getLocalBrews(): Promise<StoredBrew[]> {
  const raw = await AsyncStorage.getItem(BREWS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const raw = await AsyncStorage.getItem(`${SETTINGS_KEY}:${key}`);
  return raw ? JSON.parse(raw) : defaultValue;
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(`${SETTINGS_KEY}:${key}`, JSON.stringify(value));
}

export async function getUnsyncedBrews(): Promise<StoredBrew[]> {
  const brews = await getLocalBrews();
  return brews.filter(b => !b.synced);
}

export async function markSynced(brewId: string): Promise<void> {
  const brews = await getLocalBrews();
  const updated = brews.map(b => b.id === brewId ? { ...b, synced: true } : b);
  await AsyncStorage.setItem(BREWS_KEY, JSON.stringify(updated));
}

export async function clearSyncedBrews(): Promise<void> {
  const brews = await getLocalBrews();
  const unsynced = brews.filter(b => !b.synced);
  await AsyncStorage.setItem(BREWS_KEY, JSON.stringify(unsynced));
}
