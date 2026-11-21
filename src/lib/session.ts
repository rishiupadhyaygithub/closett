interface AuthError { message: string; status?: number; code?: string }

interface AuthLike<U> {
  auth: {
    getSession(): Promise<{ data: { session: { user: U } | null } }>;
    getUser(): Promise<{ data: { user: U | null }; error: AuthError | null }>;
    signInAnonymously(): Promise<{ data: { user: U | null }; error: AuthError | null }>;
    signOut(options: { scope: 'local' }): Promise<unknown>;
  };
}

/** lostSession: this browser held a sign-in whose account no longer exists, so its closet cannot be reached. */
export type SessionResult<U> = { user: U | null; error: string | null; lostSession: boolean };

// React StrictMode runs effects twice in dev; without this, two sign-ins race and create two anonymous users.
const inFlight = new WeakMap<object, Promise<SessionResult<any>>>();

export function ensureSession<U>(client: AuthLike<U>): Promise<SessionResult<U>> {
  const running = inFlight.get(client);
  if (running) return running as Promise<SessionResult<U>>;
  const p = startSession(client).finally(() => inFlight.delete(client));
  inFlight.set(client, p);
  return p;
}

// The server answered that the account or its session is gone (deleted, revoked, expired), as opposed to a network failure.
function accountGone(error: AuthError): boolean {
  return error.status === 401 || error.status === 403 || error.code === 'user_not_found' || error.code === 'session_not_found';
}

async function startSession<U>(client: AuthLike<U>): Promise<SessionResult<U>> {
  try {
    const { data } = await client.auth.getSession();
    if (data.session?.user) {
      // The stored token alone is not proof the account still exists; ask the server.
      const { data: verified, error } = await client.auth.getUser();
      if (error && accountGone(error)) {
        await client.auth.signOut({ scope: 'local' });
        return { user: null, error: null, lostSession: true };
      }
      return { user: verified?.user ?? data.session.user, error: null, lostSession: false };
    }
    const { data: anon, error } = await client.auth.signInAnonymously();
    if (error) return { user: null, error: `Could not start a session: ${error.message}`, lostSession: false };
    return { user: anon.user, error: null, lostSession: false };
  } catch (e) {
    return { user: null, error: `Could not reach the server: ${e instanceof Error ? e.message : String(e)}`, lostSession: false };
  }
}
