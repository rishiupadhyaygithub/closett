// Public Supabase config for this project. The anon key is public by design:
// data is protected by Row Level Security, not by hiding this key.
// VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (from .env or Vercel) override these.
export const DEFAULT_SUPABASE = {
  url: 'https://iriwbkhnvevawnppkdxu.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyaXdia2hudmV2YXducHBrZHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NzExNjAsImV4cCI6MjA5NDM0NzE2MH0.kNZEiOKvIDebz0MQZYoCIcxTItOkb0sUo3YdDDDkGjg',
};
