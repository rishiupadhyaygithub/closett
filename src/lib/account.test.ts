import { describe, it, expect, vi } from 'vitest';
import { normalizeEmail, accountErrorMessage, saveClosetWithEmail, sendSignInLink, accountStatus } from './account';

describe('normalizeEmail', () => {
  it('trims and lowercases a valid address', () => expect(normalizeEmail('  Me@Example.COM ')).toBe('me@example.com'));
  it('rejects text that is not an email', () => {
    expect(normalizeEmail('me@')).toBeNull();
    expect(normalizeEmail('hello')).toBeNull();
    expect(normalizeEmail('a b@c.com')).toBeNull();
    expect(normalizeEmail('')).toBeNull();
  });
});

describe('accountErrorMessage', () => {
  const msg = (e: object) => accountErrorMessage(e as any);
  it('explains the built-in email service only reaches the owner', () =>
    expect(msg({ code: 'email_address_not_authorized', message: 'x' })).toMatch(/owner/i));
  it('explains the hourly email limit', () => {
    expect(msg({ code: 'over_email_send_rate_limit', message: 'x' })).toMatch(/try again later/i);
    expect(msg({ status: 429, message: 'x' })).toMatch(/try again later/i);
  });
  it('points to Sign in when the email already has a saved closet', () =>
    expect(msg({ code: 'email_exists', message: 'x' })).toMatch(/sign in/i));
  it('points to Save when signing in with an email that has no closet', () =>
    expect(msg({ code: 'otp_disabled', message: 'Signups not allowed for otp' })).toMatch(/save your closet first/i));
  it('names the dashboard switch when manual linking is off', () =>
    expect(msg({ code: 'manual_linking_disabled', message: 'x' })).toMatch(/manual linking/i));
  it('explains an address the server will not accept (its own message is blank)', () =>
    expect(msg({ code: 'email_address_invalid', message: 'Email address "" is invalid' })).toMatch(/can.t be used/i));
  it('falls back to the server message', () => expect(msg({ message: 'Something odd' })).toBe('Something odd'));
});

const client = (over: Record<string, any> = {}) => ({
  auth: {
    updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signInWithOtp: vi.fn().mockResolvedValue({ data: {}, error: null }),
    ...over,
  },
});

describe('saveClosetWithEmail', () => {
  it('links the email to the current account and sends the confirmation back to this site', async () => {
    const c = client();
    expect(await saveClosetWithEmail(c, ' Me@X.com ', 'https://closett-delta.vercel.app')).toEqual({ ok: true });
    expect(c.auth.updateUser).toHaveBeenCalledWith({ email: 'me@x.com' }, { emailRedirectTo: 'https://closett-delta.vercel.app' });
  });
  it('refuses an invalid email without calling the server', async () => {
    const c = client();
    expect((await saveClosetWithEmail(c, 'nope', 'https://a.b')).ok).toBe(false);
    expect(c.auth.updateUser).not.toHaveBeenCalled();
  });
  it('returns a plain message when the server refuses', async () => {
    const c = client({ updateUser: vi.fn().mockResolvedValue({ data: {}, error: { code: 'email_exists', message: 'x' } }) });
    const r = await saveClosetWithEmail(c, 'me@x.com', 'https://a.b');
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.message).toMatch(/sign in/i);
  });
});

describe('sendSignInLink', () => {
  it('sends a magic link that never creates a new account', async () => {
    const c = client();
    expect(await sendSignInLink(c, 'me@x.com', 'https://a.b')).toEqual({ ok: true });
    expect(c.auth.signInWithOtp).toHaveBeenCalledWith({ email: 'me@x.com', options: { shouldCreateUser: false, emailRedirectTo: 'https://a.b' } });
  });
  it('turns a network failure into a message', async () => {
    const c = client({ signInWithOtp: vi.fn().mockRejectedValue(new Error('Failed to fetch')) });
    const r = await sendSignInLink(c, 'me@x.com', 'https://a.b');
    expect(r.ok === false && r.message).toMatch(/Failed to fetch/);
  });
});

describe('accountStatus', () => {
  it('is anonymous for a closet without email', () => expect(accountStatus({ id: 'u', is_anonymous: true })).toEqual({ kind: 'anonymous' }));
  it('is pending while the confirmation email is unanswered', () =>
    expect(accountStatus({ id: 'u', is_anonymous: true, new_email: 'me@x.com' })).toEqual({ kind: 'pending', email: 'me@x.com' }));
  it('is saved once the email is confirmed', () =>
    expect(accountStatus({ id: 'u', is_anonymous: false, email: 'me@x.com' })).toEqual({ kind: 'saved', email: 'me@x.com' }));
  it('is none without a user', () => expect(accountStatus(null)).toEqual({ kind: 'none' }));
});
