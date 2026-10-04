export interface SupabaseConfig { url: string; anonKey: string }

export function readSupabaseConfig(
  env: Record<string, string | undefined>,
  defaults?: SupabaseConfig,
): SupabaseConfig {
  const url = env.VITE_SUPABASE_URL || defaults?.url;
  const anonKey = env.VITE_SUPABASE_ANON_KEY || defaults?.anonKey;
  if (!url || !anonKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill them in.');
  }
  return { url, anonKey };
}
