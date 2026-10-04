import { describe, it, expect } from 'vitest';
import { readSupabaseConfig } from './config';

describe('readSupabaseConfig', () => {
  it('returns url and key when both are set', () => {
    expect(readSupabaseConfig({ VITE_SUPABASE_URL: 'https://a.supabase.co', VITE_SUPABASE_ANON_KEY: 'k' }))
      .toEqual({ url: 'https://a.supabase.co', anonKey: 'k' });
  });
  it('throws a helpful message when the url is missing', () => {
    expect(() => readSupabaseConfig({ VITE_SUPABASE_ANON_KEY: 'k' })).toThrow('.env.example');
  });
  it('throws when the key is missing', () => {
    expect(() => readSupabaseConfig({ VITE_SUPABASE_URL: 'https://a.supabase.co' })).toThrow('VITE_SUPABASE_ANON_KEY');
  });
});
