import { describe, it, expect } from 'vitest';
import { shelfOf, rankForTop, groupShelves, SHELVES } from './wardrobe';
import type { ColorRule, Item, UserProfile } from '../types';

function item(p: Partial<Item>): Item {
  return { id: p.title ?? 'x', image: '', title: '', price: 0, currency: 'INR', link: '', notes: '', categoryId: 'c', createdAt: 0, color: '', garmentType: 'top', ...p };
}

const me: UserProfile = { gender: 'male', skinTone: 'wheatish', undertone: 'cool', bodyType: 'rectangle' };
const rules: ColorRule[] = [{ id: 'r', topColor: 'white', bottomColors: ['navy_blue', 'black'] }];

describe('shelfOf', () => {
  it('puts garment types on their shelves', () => {
    expect(shelfOf(item({ garmentType: 'top' }), '')).toBe('tops');
    expect(shelfOf(item({ garmentType: 'bottom' }), '')).toBe('bottoms');
    expect(shelfOf(item({ garmentType: 'layer' }), '')).toBe('layers');
  });
  it('tells shoes from other accessories by title', () => {
    expect(shelfOf(item({ garmentType: 'accessory', title: 'Bata Penny Loafers' }), 'Accessories')).toBe('shoes');
    expect(shelfOf(item({ garmentType: 'accessory', title: 'Puma Smashic Sneakers' }), '')).toBe('shoes');
    expect(shelfOf(item({ garmentType: 'accessory', title: 'Fastrack watch' }), 'Accessories')).toBe('accessories');
  });
  it('tells shoes by the collection name when the title does not say', () => {
    expect(shelfOf(item({ garmentType: 'accessory', title: 'Smashic Comfort' }), 'Shoes')).toBe('shoes');
  });
  it('puts "other" with accessories', () => {
    expect(shelfOf(item({ garmentType: 'other' }), '')).toBe('accessories');
  });
  it('lists shelves top to bottom in wardrobe order', () => {
    expect(SHELVES.map(s => s.id)).toEqual(['tops', 'bottoms', 'layers', 'shoes', 'accessories']);
  });
});

describe('groupShelves', () => {
  it('groups items and keeps their order', () => {
    const g = groupShelves([item({ title: 'a', garmentType: 'bottom' }), item({ title: 'b' }), item({ title: 'c', garmentType: 'bottom' })], () => '');
    expect(g.bottoms.map(i => i.title)).toEqual(['a', 'c']);
    expect(g.tops.map(i => i.title)).toEqual(['b']);
    expect(g.shoes).toEqual([]);
  });
});

describe('rankForTop', () => {
  const top = item({ title: 'white tee', color: 'white' });
  const beige = item({ title: 'beige', garmentType: 'bottom', color: 'beige' });
  const navy = item({ title: 'navy', garmentType: 'bottom', color: 'navy_blue' });
  const black = item({ title: 'black', garmentType: 'bottom', color: 'black' });
  const grey = item({ title: 'grey', garmentType: 'bottom', color: 'grey' });

  it('moves colours your rules pair with the top to the front', () => {
    const r = rankForTop(top, [beige, grey, navy, black], rules, me);
    expect(r.map(x => x.item.title).slice(0, 2)).toEqual(['navy', 'black']);
    expect(r[0].match).toBe(true);
  });

  it('puts pieces that do not suit you last', () => {
    const r = rankForTop(top, [beige, grey], rules, me);
    expect(r.map(x => x.item.title)).toEqual(['grey', 'beige']);
    expect(r[1].match).toBe(false);
  });

  it('keeps the original order between equal scores', () => {
    const r = rankForTop(top, [black, navy], rules, me);
    expect(r.map(x => x.item.title)).toEqual(['black', 'navy']);
  });

  it('keeps the order as is when no top is chosen', () => {
    expect(rankForTop(null, [beige, navy], rules, me).map(x => x.item.title)).toEqual(['beige', 'navy']);
  });
});
