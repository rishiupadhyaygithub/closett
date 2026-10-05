import { describe, it, expect, vi } from 'vitest';
import { ensureSession } from './session';

const auth = (over: Partial<Record<'getSession' | 'signInAnonymously', any>>) => ({
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    signInAnonymously: vi.fn().mockResolvedValue({ data: { user: { id: 'anon' } }, error: null }),
    ...over,
  },
});

describe('ensureSession', () => {
  it('reuses an existing session without signing in again', async () => {
    const c = auth({ getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'u1' } } } }) });
    expect(await ensureSession(c)).toEqual({ user: { id: 'u1' }, error: null });
    expect(c.auth.signInAnonymously).not.toHaveBeenCalled();
  });

  it('signs in anonymously when there is no session', async () => {
    expect(await ensureSession(auth({}))).toEqual({ user: { id: 'anon' }, error: null });
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
