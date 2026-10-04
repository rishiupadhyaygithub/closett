export function readSupabaseConfig(env: Record<string, string | undefined>): { url: string; anonKey: string } {
  const url = env.VITE_SUPABASE_URL;
  const anonKey = env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill them in.');
  }
  return { url, anonKey };
}
