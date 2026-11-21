// "Save my closet": link an email to the anonymous account (same user id, so no data moves),
// and sign in on another browser with a magic link.

interface AuthError { message: string; status?: number; code?: string }
interface AccountClient {
  auth: {
    updateUser(attrs: { email: string }, options: { emailRedirectTo: string }): Promise<{ error: AuthError | null }>;
    signInWithOtp(params: { email: string; options: { shouldCreateUser: boolean; emailRedirectTo: string } }): Promise<{ error: AuthError | null }>;
  };
}

export type AccountResult = { ok: true } | { ok: false; message: string };

export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function accountErrorMessage(error: AuthError): string {
  switch (error.code) {
    case 'email_address_not_authorized':
      return 'For now this app can only send email to its owner\'s address.';
    case 'over_email_send_rate_limit':
      return 'Too many emails were sent this hour. Please try again later.';
    case 'email_exists':
      return 'This email already has a saved closet. Use "Sign in" instead.';
    case 'otp_disabled':
    case 'user_not_found':
      return 'No saved closet uses this email yet. Save your closet first.';
    case 'email_address_invalid':
      return 'That email address can\'t be used. Please try a different one.';
    case 'manual_linking_disabled':
      return 'Saving is switched off in the Supabase settings (Manual linking).';
  }
  if (error.status === 429) return 'Too many requests. Please try again later.';
  return error.message;
}

async function call(run: () => Promise<{ error: AuthError | null }>): Promise<AccountResult> {
  try {
    const { error } = await run();
    return error ? { ok: false, message: accountErrorMessage(error) } : { ok: true };
  } catch (e) {
    return { ok: false, message: `Could not reach the server: ${e instanceof Error ? e.message : String(e)}` };
  }
}

const INVALID: AccountResult = { ok: false, message: 'Please enter a valid email address.' };

export function saveClosetWithEmail(client: AccountClient, rawEmail: string, redirectTo: string): Promise<AccountResult> {
  const email = normalizeEmail(rawEmail);
  if (!email) return Promise.resolve(INVALID);
  return call(() => client.auth.updateUser({ email }, { emailRedirectTo: redirectTo }));
}

export function sendSignInLink(client: AccountClient, rawEmail: string, redirectTo: string): Promise<AccountResult> {
  const email = normalizeEmail(rawEmail);
  if (!email) return Promise.resolve(INVALID);
  return call(() => client.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: redirectTo } }));
}

export type AccountStatus =
  | { kind: 'none' }
  | { kind: 'anonymous' }
  | { kind: 'pending'; email: string }
  | { kind: 'saved'; email: string };

export function accountStatus(user: { id?: string; is_anonymous?: boolean; email?: string; new_email?: string } | null): AccountStatus {
  if (!user) return { kind: 'none' };
  if (!user.is_anonymous && user.email) return { kind: 'saved', email: user.email };
  if (user.new_email) return { kind: 'pending', email: user.new_email };
  return { kind: 'anonymous' };
}
