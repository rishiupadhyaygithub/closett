import { describe, it, expect } from 'vitest';
import { filterAndSortItems, categoryCounts, flattenCategories } from './items';
import type { Item, Category } from '../types';

const item = (o: Partial<Item>): Item => ({
  id: o.id ?? 'x', image: '', title: 'T', price: 0, currency: 'INR', link: '', notes: '',
  categoryId: 'uncategorized', createdAt: 1, color: '', garmentType: 'other', ...o,
});
const ITEMS = [
  item({ id: 'a', title: 'White Tee', price: 1299, createdAt: 1, notes: 'summer' }),
  item({ id: 'b', title: 'Navy Chinos', price: 0, createdAt: 2 }),
  item({ id: 'c', title: 'Black Jacket', price: 4999, createdAt: 3, categoryId: 'c1' }),
];
const ids = (r: Item[]) => r.map(i => i.id);
const base = { categoryIds: null as string[] | null, query: '', sortBy: 'newest' as const };

describe('filterAndSortItems', () => {
  it('search trims surrounding spaces', () => expect(ids(filterAndSortItems(ITEMS, { ...base, query: '  tee  ' }))).toEqual(['a']));
  it('search is case-insensitive', () => expect(ids(filterAndSortItems(ITEMS, { ...base, query: 'JACKET' }))).toEqual(['c']));
  it('search matches notes', () => expect(ids(filterAndSortItems(ITEMS, { ...base, query: 'summer' }))).toEqual(['a']));
  it('regex characters are plain text', () => expect(filterAndSortItems(ITEMS, { ...base, query: '(.*' })).toEqual([]));
  it('filters by category ids', () => expect(ids(filterAndSortItems(ITEMS, { ...base, categoryIds: ['c1'] }))).toEqual(['c']));
  it('newest first', () => expect(ids(filterAndSortItems(ITEMS, base))).toEqual(['c', 'b', 'a']));
  it('price ascending puts unpriced items last', () => expect(ids(filterAndSortItems(ITEMS, { ...base, sortBy: 'priceAsc' }))).toEqual(['a', 'c', 'b']));
  it('price descending puts unpriced items last', () => expect(ids(filterAndSortItems(ITEMS, { ...base, sortBy: 'priceDesc' }))).toEqual(['c', 'a', 'b']));
  it('name ascending', () => expect(ids(filterAndSortItems(ITEMS, { ...base, sortBy: 'nameAsc' }))).toEqual(['c', 'b', 'a']));
  it('does not mutate its input', () => { const copy = [...ITEMS]; filterAndSortItems(ITEMS, { ...base, sortBy: 'nameDesc' }); expect(ITEMS).toEqual(copy); });
});

const CATS: Category[] = [
  { id: 'uncategorized', name: 'Uncategorized', order: 0, parentId: null },
  { id: 'c1', name: 'Summer', order: 1, parentId: null },
  { id: 'c2', name: 'Linen', order: 0, parentId: 'c1' },
  { id: 'c3', name: 'Shirts', order: 0, parentId: 'c2' },
  { id: 'c4', name: 'Winter', order: 2, parentId: null },
];

describe('categoryCounts', () => {
  it('counts a parent including all descendants', () => {
    const counts = categoryCounts(CATS, [item({ categoryId: 'c3' }), item({ categoryId: 'c2' }), item({ categoryId: 'c4' })]);
    expect(counts.get('c1')).toBe(2);
    expect(counts.get('c2')).toBe(2);
    expect(counts.get('c3')).toBe(1);
    expect(counts.get('c4')).toBe(1);
    expect(counts.get('uncategorized')).toBe(0);
  });
  it('ignores items whose category no longer exists', () => {
    expect(categoryCounts(CATS, [item({ categoryId: 'gone' })]).get('c1')).toBe(0);
  });
});

describe('flattenCategories', () => {
  it('orders parents before children and indents by depth', () => {
    const flat = flattenCategories(CATS);
    expect(flat.map(f => f.id)).toEqual(['uncategorized', 'c1', 'c2', 'c3', 'c4']);
    expect(flat.find(f => f.id === 'c1')!.depth).toBe(0);
    expect(flat.find(f => f.id === 'c3')!.depth).toBe(2);
  });
  it('is safe against a parent cycle', () => {
    const cyc: Category[] = [{ id: 'a', name: 'A', order: 0, parentId: 'b' }, { id: 'b', name: 'B', order: 0, parentId: 'a' }];
    expect(() => flattenCategories(cyc)).not.toThrow();
  });
});

import { descendantIds } from './items';

describe('descendantIds', () => {
  const cats = [
    { id: 'a', name: 'A', order: 0, parentId: null },
    { id: 'b', name: 'B', order: 0, parentId: 'a' },
    { id: 'c', name: 'C', order: 0, parentId: 'b' },
    { id: 'd', name: 'D', order: 0, parentId: null },
  ];
  it('returns children and grandchildren', () => expect(descendantIds(cats, 'a').sort()).toEqual(['b', 'c']));
  it('returns nothing for a leaf', () => expect(descendantIds(cats, 'd')).toEqual([]));
  it('does not loop forever on a cycle', () => {
    const cyclic = [{ id: 'x', name: 'X', order: 0, parentId: 'y' }, { id: 'y', name: 'Y', order: 0, parentId: 'x' }];
    expect(descendantIds(cyclic, 'x').sort()).toEqual(['x', 'y']);
  });
});
