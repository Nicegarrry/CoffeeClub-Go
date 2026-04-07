import { supabase } from './supabase';
import { getUnsyncedBrews, markSynced } from './db';
import { uploadBrewPhoto } from './storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REMOTE_BREWS_KEY = '@coffeeclub:brews:remote';
let isSyncing = false;

export async function syncBrews(): Promise<{ synced: number; failed: number }> {
  if (isSyncing) return { synced: 0, failed: 0 };
  isSyncing = true;

  let synced = 0;
  let failed = 0;

  try {
    const unsynced = await getUnsyncedBrews();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { synced: 0, failed: 0 };

    for (const brew of unsynced) {
      try {
        let photoUrl: string | null = null;
        if (brew.photo) {
          photoUrl = await uploadBrewPhoto(brew.photo, brew.id);
        }

        const { error } = await supabase.from('brews').upsert({
          id: brew.id,
          user_id: user.id,
          name: brew.name,
          rating: brew.rating,
          photo_url: photoUrl,
          brew_type: brew.method || 'other',
          dose_in_grams: brew.doseIn,
          yield_out_grams: brew.yieldOut,
          brew_time_seconds: brew.brewTime ? parseInt(brew.brewTime, 10) : null,
          grind_setting: brew.grindSetting?.toString() ?? null,
          tasting_notes: brew.tastingNotes,
          bean_id: brew.beanId,
          is_public: true,
          created_at: brew.createdAt,
        });

        if (error) {
          console.error('[sync] Failed to sync brew:', error.message);
          failed++;
        } else {
          await markSynced(brew.id);
          synced++;
        }
      } catch (err) {
        console.error('[sync] Error syncing brew:', err);
        failed++;
      }
    }
  } finally {
    isSyncing = false;
  }

  return { synced, failed };
}

export async function pullBrews(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data } = await supabase
    .from('brews')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (data) {
    await AsyncStorage.setItem(REMOTE_BREWS_KEY, JSON.stringify(data));
  }
}
