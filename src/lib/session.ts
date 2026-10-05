interface AuthLike<U> {
  auth: {
    getSession(): Promise<{ data: { session: { user: U } | null } }>;
    signInAnonymously(): Promise<{ data: { user: U | null }; error: { message: string } | null }>;
  };
}

type SessionResult<U> = { user: U | null; error: string | null };

// React StrictMode runs effects twice in dev; without this, two sign-ins race and create two anonymous users.
const inFlight = new WeakMap<object, Promise<SessionResult<any>>>();

export function ensureSession<U>(client: AuthLike<U>): Promise<SessionResult<U>> {
  const running = inFlight.get(client);
  if (running) return running as Promise<SessionResult<U>>;
  const p = startSession(client).finally(() => inFlight.delete(client));
  inFlight.set(client, p);
  return p;
}

async function startSession<U>(client: AuthLike<U>): Promise<SessionResult<U>> {
  try {
    const { data } = await client.auth.getSession();
    if (data.session?.user) return { user: data.session.user, error: null };
    const { data: anon, error } = await client.auth.signInAnonymously();
    if (error) return { user: null, error: `Could not start a session: ${error.message}` };
    return { user: anon.user, error: null };
  } catch (e) {
    return { user: null, error: `Could not reach the server: ${e instanceof Error ? e.message : String(e)}` };
  }
}
