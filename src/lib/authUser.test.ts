import { describe, it, expect } from 'vitest';
import { keepSameUser } from './authUser';

describe('keepSameUser', () => {
  const a = { id: 'u1', email: '', is_anonymous: true };
  it('keeps the current object when the same account is announced again (tab became visible)', () => {
    expect(keepSameUser(a, { id: 'u1', email: '', is_anonymous: true })).toBe(a);
  });
  it('switches when a different account arrives', () => {
    const b = { id: 'u2' };
    expect(keepSameUser(a, b)).toBe(b);
  });
  it('switches when the same account was just saved with an email', () => {
    const saved = { id: 'u1', email: 'me@x.com', is_anonymous: false };
    expect(keepSameUser(a, saved)).toBe(saved);
  });
  it('switches when an email change is waiting for confirmation', () => {
    const pending = { id: 'u1', email: '', is_anonymous: true, new_email: 'me@x.com' };
    expect(keepSameUser(a, pending)).toBe(pending);
  });
  it('clears when signed out', () => expect(keepSameUser(a, null)).toBeNull());
  it('takes the first account', () => {
    const b = { id: 'u2' };
    expect(keepSameUser(null, b)).toBe(b);
  });
});
