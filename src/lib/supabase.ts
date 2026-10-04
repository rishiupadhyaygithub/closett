import { createClient } from '@supabase/supabase-js';
import { readSupabaseConfig } from './config';

const { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } = readSupabaseConfig(import.meta.env);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function uploadImage(userId: string, itemId: string, base64: string): Promise<string> {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  const mimeMatch  = base64.match(/^data:(image\/\w+);base64,/);
  const mime       = mimeMatch?.[1] || 'image/jpeg';
  const ext        = mime.split('/')[1] || 'jpg';
  const path       = `${userId}/${itemId}.${ext}`;

  const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  const blob  = new Blob([bytes], { type: mime });

  const { error } = await supabase.storage
    .from('item-images')
    .upload(path, blob, { upsert: true, contentType: mime });

  if (error) throw error;

  const { data } = supabase.storage.from('item-images').getPublicUrl(path);
  return data.publicUrl;
}
