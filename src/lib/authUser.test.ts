import { describe, it, expect } from 'vitest';
import { keepSameUser } from './authUser';

describe('keepSameUser', () => {
  const a = { id: 'u1', email: '' };
  it('keeps the current object when the same account is announced again (tab became visible)', () => {
    expect(keepSameUser(a, { id: 'u1', email: '' })).toBe(a);
  });
  it('switches when a different account arrives', () => {
    const b = { id: 'u2' };
    expect(keepSameUser(a, b)).toBe(b);
  });
  it('clears when signed out', () => expect(keepSameUser(a, null)).toBeNull());
  it('takes the first account', () => {
    const b = { id: 'u2' };
    expect(keepSameUser(null, b)).toBe(b);
  });
});
