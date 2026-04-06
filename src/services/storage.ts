import { supabase } from './supabase';

export async function uploadBrewPhoto(uri: string, brewId: string): Promise<string | null> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const ext = uri.split('.').pop() ?? 'jpg';
    const path = `${brewId}.${ext}`;

    const { error } = await supabase.storage
      .from('brew-photos')
      .upload(path, blob, {
        contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
        upsert: true,
      });

    if (error) {
      console.error('[storage] Upload failed:', error.message);
      return null;
    }

    const { data } = supabase.storage.from('brew-photos').getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.error('[storage] Upload error:', err);
    return null;
  }
}
