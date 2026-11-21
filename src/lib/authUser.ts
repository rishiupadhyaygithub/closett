interface UserLike { id: string; email?: string; is_anonymous?: boolean; new_email?: string }

/**
 * Supabase re-announces the same sign-in whenever the tab becomes visible; keep the same object so nothing reloads.
 * A real change to the account (saved with an email, confirmation pending) still comes through.
 */
export function keepSameUser<U extends UserLike>(prev: U | null, next: U | null): U | null {
  if (prev && next && prev.id === next.id && prev.email === next.email
    && prev.is_anonymous === next.is_anonymous && prev.new_email === next.new_email) return prev;
  return next;
}
