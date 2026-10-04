interface AuthLike<U> {
  auth: {
    getSession(): Promise<{ data: { session: { user: U } | null } }>;
    signInAnonymously(): Promise<{ data: { user: U | null }; error: { message: string } | null }>;
  };
}

export async function ensureSession<U>(client: AuthLike<U>): Promise<{ user: U | null; error: string | null }> {
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
