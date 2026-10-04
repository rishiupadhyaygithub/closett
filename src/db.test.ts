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
