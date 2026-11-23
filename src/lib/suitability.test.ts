import { describe, it, expect } from 'vitest';
import { assessItem } from './suitability';
import type { Item, UserProfile } from '../types';

const me: UserProfile = { gender: 'male', skinTone: 'wheatish', undertone: 'cool', bodyType: 'rectangle' };

function item(p: Partial<Item>): Item {
  return { id: 'x', image: '', title: '', price: 0, currency: 'INR', link: '', notes: '', categoryId: 'c', createdAt: 0, color: '', garmentType: 'top', ...p };
}

describe('assessItem: fit', () => {
  it('flags skinny jeans for a rectangle build', () => {
    const a = assessItem(item({ title: 'Blue Skinny Jeans', garmentType: 'bottom' }), me);
    expect(a.avoid).toBe(true);
    expect(a.issues.some(i => i.kind === 'fit' && /skinny/i.test(i.text))).toBe(true);
  });

  it('flags oversized pieces when the build says avoid oversized fits', () => {
    expect(assessItem(item({ title: "Men's Navy Oversized Joggers", garmentType: 'bottom' }), me).avoid).toBe(true);
  });

  it('does not apply a jeans rule to a top', () => {
    expect(assessItem(item({ title: 'Skinny fit polo', garmentType: 'top' }), me).issues.filter(i => i.kind === 'fit')).toEqual([]);
  });

  it('skips combination advice it cannot judge from one piece ("baggy tops with tapered bottoms")', () => {
    expect(assessItem(item({ title: 'Baggy Jeans', garmentType: 'bottom' }), me).issues.filter(i => i.kind === 'fit')).toEqual([]);
  });

  it('flags wide pants for a triangle build that avoids wide-leg pants', () => {
    const tri: UserProfile = { ...me, bodyType: 'triangle' };
    expect(assessItem(item({ title: 'Pleated Relaxed Wide Pants', garmentType: 'bottom' }), tri).avoid).toBe(true);
  });

  it('never judges accessories on fit', () => {
    expect(assessItem(item({ title: 'Oversized watch', garmentType: 'accessory' }), me).issues.filter(i => i.kind === 'fit')).toEqual([]);
  });

  it('a plain straight jean is fine', () => {
    expect(assessItem(item({ title: 'Straight Jeans', garmentType: 'bottom', color: 'navy_blue' }), me).avoid).toBe(false);
  });
});

describe('assessItem: colour', () => {
  it('flags a colour your undertone should avoid', () => {
    const a = assessItem(item({ title: 'Linen pants', garmentType: 'bottom', color: 'beige' }), me);
    expect(a.avoid).toBe(true);
    expect(a.issues[0].kind).toBe('color');
    expect(a.issues[0].text).toMatch(/beige/i);
  });

  it('lists a recommended colour as a good point', () => {
    const a = assessItem(item({ title: 'Linen shirt', color: 'navy_blue' }), me);
    expect(a.avoid).toBe(false);
    expect(a.goods.join(' ')).toMatch(/navy/i);
  });

  it('judges colour on accessories too', () => {
    expect(assessItem(item({ title: 'Loafers', garmentType: 'accessory', color: 'brown' }), me).avoid).toBe(true);
  });
});

describe('assessItem: no profile', () => {
  it('flags nothing without a profile', () => {
    expect(assessItem(item({ title: 'Skinny jeans', garmentType: 'bottom', color: 'beige' }), null)).toEqual({ avoid: false, issues: [], goods: [] });
  });
});
