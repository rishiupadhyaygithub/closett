import { describe, it, expect } from 'vitest';
import { bodyTypesForGender } from './bodyTypeData';

describe('bodyTypesForGender', () => {
  it('male list has no duplicate ids', () => {
    const ids = bodyTypesForGender('male').map(b => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('"other" has no duplicate ids (rectangle exists for both genders)', () => {
    const ids = bodyTypesForGender('other').map(b => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('"other" still offers every distinct build', () => {
    const all = new Set([...bodyTypesForGender('male'), ...bodyTypesForGender('female')].map(b => b.id));
    expect(new Set(bodyTypesForGender('other').map(b => b.id))).toEqual(all);
  });
});
