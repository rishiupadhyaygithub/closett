import { describe, it, expect } from 'vitest';
import { decideProfileSync } from './profileSync';
import type { UserProfile } from '../types';

const A: UserProfile = { gender: 'male', skinTone: 'dark', undertone: 'olive', bodyType: 'oval' };
const B: UserProfile = { gender: 'female', skinTone: 'fair', undertone: 'warm', bodyType: 'pear' };

describe('decideProfileSync', () => {
  it('uses the remote profile when there is one', () => expect(decideProfileSync(null, B)).toBe('use-remote'));
  it('remote wins over a different local profile', () => expect(decideProfileSync(A, B)).toBe('use-remote'));
  it('pushes a local profile that the database does not have yet', () => expect(decideProfileSync(A, null)).toBe('push-local'));
  it('does nothing when neither exists (first run)', () => expect(decideProfileSync(null, null)).toBe('none'));
  it('does nothing when both are identical', () => expect(decideProfileSync(A, { ...A })).toBe('none'));
});
