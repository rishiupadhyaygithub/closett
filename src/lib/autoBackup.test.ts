import { describe, it, expect, beforeEach } from 'vitest';
import { saveAutoBackup, loadAutoBackup } from './autoBackup';

const mem = new Map<string, string>();
const storage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => { mem.set(k, v); },
  removeItem: (k: string) => { mem.delete(k); },
};
const CAT = [{ id: 'uncategorized', name: 'Uncategorized', order: 0, parentId: null }];
const item = (id: string) => ({ id, title: 'T' + id });

beforeEach(() => mem.clear());

describe('automatic closet backup', () => {
  it('saves a snapshot in the export format with its item count and time', () => {
    saveAutoBackup({ categories: CAT, items: [item('1'), item('2')], colorRules: [] }, storage, 1000);
    const b = loadAutoBackup(storage)!;
    expect(b.itemCount).toBe(2);
    expect(b.savedAt).toBe(1000);
    expect(JSON.parse(b.json).items).toHaveLength(2);
  });

  it('never replaces a good backup with an empty closet (a fresh account after a lost session)', () => {
    saveAutoBackup({ categories: CAT, items: [item('1')], colorRules: [] }, storage, 1000);
    saveAutoBackup({ categories: CAT, items: [], colorRules: [] }, storage, 2000);
    expect(loadAutoBackup(storage)!.itemCount).toBe(1);
  });

  it('returns null when nothing was saved or the stored value is corrupt', () => {
    expect(loadAutoBackup(storage)).toBeNull();
    mem.set('closett-auto-backup', '{not json');
    expect(loadAutoBackup(storage)).toBeNull();
  });

  it('does not throw when storage is full or blocked', () => {
    const full = { ...storage, setItem: () => { throw new Error('QuotaExceededError'); } };
    expect(() => saveAutoBackup({ categories: CAT, items: [item('1')], colorRules: [] }, full, 1)).not.toThrow();
  });
});
