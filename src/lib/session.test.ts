import { describe, it, expect, vi } from 'vitest';
import { ensureSession } from './session';

const STORED = { data: { session: { user: { id: 'u1' } } } };

const auth = (over: Partial<Record<'getSession' | 'getUser' | 'signInAnonymously' | 'signOut', any>>) => ({
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
    signInAnonymously: vi.fn().mockResolvedValue({ data: { user: { id: 'anon' } }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    ...over,
  },
});

describe('ensureSession', () => {
  it('reuses an existing session after the server confirms the account', async () => {
    const c = auth({ getSession: vi.fn().mockResolvedValue(STORED) });
    expect(await ensureSession(c)).toEqual({ user: { id: 'u1' }, error: null, lostSession: false });
    expect(c.auth.getUser).toHaveBeenCalled();
    expect(c.auth.signInAnonymously).not.toHaveBeenCalled();
  });

  it('signs in anonymously when there is no session', async () => {
    expect(await ensureSession(auth({}))).toEqual({ user: { id: 'anon' }, error: null, lostSession: false });
  });

  it('returns an error message when sign-in fails', async () => {
    const c = auth({ signInAnonymously: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'Failed to fetch' } }) });
    const r = await ensureSession(c);
    expect(r.user).toBeNull();
    expect(r.error).toContain('Failed to fetch');
  });

  it('returns an error message when the network call throws', async () => {
    const c = auth({ getSession: vi.fn().mockRejectedValue(new Error('offline')) });
    expect((await ensureSession(c)).error).toContain('offline');
  });
});

describe('ensureSession with a stored session whose account is gone', () => {
  const gone = { data: { user: null }, error: { status: 403, code: 'user_not_found', message: 'User from sub claim in JWT does not exist' } };

  it('reports the closet as lost instead of pretending the account works', async () => {
    const c = auth({ getSession: vi.fn().mockResolvedValue(STORED), getUser: vi.fn().mockResolvedValue(gone) });
    expect(await ensureSession(c)).toEqual({ user: null, error: null, lostSession: true });
  });

  it('clears the dead sign-in from this browser only', async () => {
    const c = auth({ getSession: vi.fn().mockResolvedValue(STORED), getUser: vi.fn().mockResolvedValue(gone) });
    await ensureSession(c);
    expect(c.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('does not silently create a new empty closet', async () => {
    const c = auth({ getSession: vi.fn().mockResolvedValue(STORED), getUser: vi.fn().mockResolvedValue(gone) });
    await ensureSession(c);
    expect(c.auth.signInAnonymously).not.toHaveBeenCalled();
  });

  it('treats an expired or revoked session (401) the same way', async () => {
    const c = auth({ getSession: vi.fn().mockResolvedValue(STORED), getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { status: 401, message: 'invalid JWT' } }) });
    expect((await ensureSession(c)).lostSession).toBe(true);
  });

  it('keeps the stored session when the server simply cannot be reached', async () => {
    const c = auth({ getSession: vi.fn().mockResolvedValue(STORED), getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'Failed to fetch' } }) });
    expect(await ensureSession(c)).toEqual({ user: { id: 'u1' }, error: null, lostSession: false });
    expect(c.auth.signOut).not.toHaveBeenCalled();
  });
});

describe('ensureSession concurrency', () => {
  it('two simultaneous calls sign in only once (React StrictMode runs effects twice)', async () => {
    const c = auth({});
    const [a, b] = await Promise.all([ensureSession(c), ensureSession(c)]);
    expect(c.auth.signInAnonymously).toHaveBeenCalledTimes(1);
    expect(a).toEqual(b);
  });
  it('a later call after the first finished checks the session again', async () => {
    const c = auth({});
    await ensureSession(c);
    await ensureSession(c);
    expect(c.auth.getSession).toHaveBeenCalledTimes(2);
  });
});
