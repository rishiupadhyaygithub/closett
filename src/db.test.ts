import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeBuilder, OK, FAIL } from './test/fakeSupabase';

const h = vi.hoisted(() => ({
  from: vi.fn(),
  remove: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock('./lib/supabase', () => ({
  supabase: {
    from: h.from,
    auth: { getSession: h.getSession },
    storage: { from: () => ({ remove: h.remove }) },
  },
  uploadImage: vi.fn(),
}));

import { addItem, deleteItem, must, storagePathFromUrl } from './db';
import type { Item } from './types';

const ITEM: Item = {
  id: 'i1', image: '', title: 'Shirt', price: 0, currency: 'INR', link: '', notes: '',
  categoryId: 'uncategorized', createdAt: 1, color: 'white', garmentType: 'top',
};

const BUCKET_URL = 'https://x.supabase.co/storage/v1/object/public/item-images/u1/i1.png';

beforeEach(() => {
  h.from.mockReset();
  h.remove.mockReset();
  h.remove.mockResolvedValue({ error: null });
  h.getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
});

describe('must', () => {
  it('throws with context when the response has an error', () => {
    expect(() => must({ error: { message: 'boom' } }, 'insert item')).toThrow('insert item: boom');
  });
  it('returns the response when there is no error', () => {
    const res = { error: null, data: 1 };
    expect(must(res, 'x')).toBe(res);
  });
});

describe('storagePathFromUrl', () => {
  it('extracts the path from a public bucket URL', () => {
    expect(storagePathFromUrl(BUCKET_URL)).toBe('u1/i1.png');
  });
  it('returns null for an external URL', () => {
    expect(storagePathFromUrl('https://cdn.zara.com/a.jpg')).toBeNull();
  });
});

describe('addItem', () => {
  it('rejects when the insert fails', async () => {
    h.from.mockReturnValue(makeBuilder(FAIL));
    await expect(addItem(ITEM)).rejects.toThrow('insert item: boom');
  });
});

describe('deleteItem', () => {
  it('removes the stored image after deleting the row', async () => {
    h.from
      .mockReturnValueOnce(makeBuilder({ data: { image: BUCKET_URL }, error: null }))
      .mockReturnValueOnce(makeBuilder(OK));
    await deleteItem('i1');
    expect(h.remove).toHaveBeenCalledWith(['u1/i1.png']);
  });

  it('does not touch storage for an external image URL', async () => {
    h.from
      .mockReturnValueOnce(makeBuilder({ data: { image: 'https://cdn.zara.com/a.jpg' }, error: null }))
      .mockReturnValueOnce(makeBuilder(OK));
    await deleteItem('i1');
    expect(h.remove).not.toHaveBeenCalled();
  });

  it('still succeeds when storage removal fails', async () => {
    h.remove.mockResolvedValue({ error: { message: 'storage down' } });
    h.from
      .mockReturnValueOnce(makeBuilder({ data: { image: BUCKET_URL }, error: null }))
      .mockReturnValueOnce(makeBuilder(OK));
    await expect(deleteItem('i1')).resolves.toBeUndefined();
  });

  it('rejects when the row delete fails', async () => {
    h.from
      .mockReturnValueOnce(makeBuilder({ data: null, error: null }))
      .mockReturnValueOnce(makeBuilder(FAIL));
    await expect(deleteItem('i1')).rejects.toThrow('delete item: boom');
  });
});

import { importData, saveColorRules, validateBackup } from './db';

const GOOD = JSON.stringify({
  categories: [{ id: 'uncategorized', name: 'Uncategorized', order: 0, parentId: null }],
  items: [{ id: 'i1', title: 'Shirt' }],
  colorRules: [{ id: 'rule_white', topColor: 'white', bottomColors: ['black'] }],
});

describe('validateBackup', () => {
  it('rejects an item without an id', () => {
    expect(() => validateBackup({ categories: [], items: [{ title: 'x' }] })).toThrow('item 0');
  });
  it('rejects an item with a non-string title', () => {
    expect(() => validateBackup({ categories: [], items: [{ id: 'a', title: 5 }] })).toThrow('item 0');
  });
  it('accepts zero items', () => {
    expect(validateBackup({ categories: [], items: [] }).items).toEqual([]);
  });
});

describe('importData', () => {
  it('returns false and writes nothing for invalid JSON', async () => {
    expect(await importData('not json')).toBe(false);
    expect(h.from).not.toHaveBeenCalled();
  });

  it('returns false and deletes nothing when an upsert fails', async () => {
    const b = makeBuilder(FAIL);
    h.from.mockReturnValue(b);
    expect(await importData(GOOD)).toBe(false);
    expect(b.delete).not.toHaveBeenCalled();
  });

  it('upserts everything, then prunes rows not in the backup', async () => {
    const b = makeBuilder(OK);
    h.from.mockReturnValue(b);
    expect(await importData(GOOD)).toBe(true);
    expect(b.upsert).toHaveBeenCalledTimes(3);
    expect(b.delete).toHaveBeenCalledTimes(3);
    expect(b.not).toHaveBeenCalled();
  });

  it('clears a table when the backup has zero rows for it', async () => {
    const b = makeBuilder(OK);
    h.from.mockReturnValue(b);
    const empty = JSON.stringify({ categories: [], items: [], colorRules: [] });
    expect(await importData(empty)).toBe(true);
    expect(b.delete).toHaveBeenCalled();
  });
});

describe('saveColorRules', () => {
  it('throws and deletes nothing when the upsert fails', async () => {
    const b = makeBuilder(FAIL);
    h.from.mockReturnValue(b);
    await expect(saveColorRules([{ id: 'r', topColor: 'white', bottomColors: [] }])).rejects.toThrow('save color rules');
    expect(b.delete).not.toHaveBeenCalled();
  });
});

import { deleteCategory, saveUserProfileRemote } from './db';

describe('deleteCategory', () => {
  const cats = [
    { id: 'c1', user_id: 'u1', name: 'A', sort_order: 0, parent_id: null },
    { id: 'c2', user_id: 'u1', name: 'B', sort_order: 1, parent_id: 'c1' },
  ];

  it('rejects when moving items to uncategorized fails', async () => {
    h.from
      .mockReturnValueOnce(makeBuilder({ data: cats, error: null }))
      .mockReturnValueOnce(makeBuilder(FAIL));
    await expect(deleteCategory('c1')).rejects.toThrow('move items');
  });

  it('does not delete categories when moving items failed', async () => {
    const del = makeBuilder(OK);
    h.from
      .mockReturnValueOnce(makeBuilder({ data: cats, error: null }))
      .mockReturnValueOnce(makeBuilder(FAIL))
      .mockReturnValueOnce(del);
    await expect(deleteCategory('c1')).rejects.toThrow();
    expect(del.delete).not.toHaveBeenCalled();
  });

  it('rejects when the category delete fails', async () => {
    h.from
      .mockReturnValueOnce(makeBuilder({ data: cats, error: null }))
      .mockReturnValueOnce(makeBuilder(OK))
      .mockReturnValueOnce(makeBuilder(FAIL));
    await expect(deleteCategory('c1')).rejects.toThrow('delete category');
  });
});

describe('saveUserProfileRemote', () => {
  it('rejects when the upsert fails', async () => {
    h.from.mockReturnValue(makeBuilder(FAIL));
    await expect(
      saveUserProfileRemote({ gender: 'male', skinTone: 'fair', undertone: 'warm', bodyType: 'rectangle' }),
    ).rejects.toThrow('save profile');
  });
});
