import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = 'https://iriwbkhnvevawnppkdxu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyaXdia2hudmV2YXducHBrZHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NzExNjAsImV4cCI6MjA5NDM0NzE2MH0.kNZEiOKvIDebz0MQZYoCIcxTItOkb0sUo3YdDDDkGjg';

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
