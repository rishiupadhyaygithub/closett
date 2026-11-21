/** Supabase re-announces the same sign-in whenever the tab becomes visible; keep the same object so nothing reloads. */
export function keepSameUser<U extends { id: string }>(prev: U | null, next: U | null): U | null {
  if (prev && next && prev.id === next.id) return prev;
  return next;
}
