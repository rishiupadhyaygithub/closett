import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveLastBackup, loadLastBackup } from './backup';

/** In-memory Storage. Node 25 ships its own experimental localStorage that shadows jsdom's, so tests supply one. */
function memoryStorage(overrides: Partial<Storage> = {}): Storage {
  const data = new Map<string, string>();
  return {
    getItem: k => (data.has(k) ? data.get(k)! : null),
    setItem: (k, v) => { data.set(k, String(v)); },
    removeItem: k => { data.delete(k); },
    clear: () => data.clear(),
    key: i => [...data.keys()][i] ?? null,
    get length() { return data.size; },
    ...overrides,
  } as Storage;
}

beforeEach(() => { vi.stubGlobal('localStorage', memoryStorage()); });

describe('last backup', () => {
  it('returns null when nothing was saved', () => expect(loadLastBackup()).toBeNull());
  it('round-trips the saved json', () => {
    expect(saveLastBackup('{"a":1}')).toBe(true);
    expect(loadLastBackup()).toBe('{"a":1}');
  });
  it('overwrites the previous backup', () => {
    saveLastBackup('one'); saveLastBackup('two');
    expect(loadLastBackup()).toBe('two');
  });
  it('reports failure instead of throwing when storage is full', () => {
    vi.stubGlobal('localStorage', memoryStorage({ setItem: () => { throw new Error('QuotaExceededError'); } }));
    expect(saveLastBackup('x')).toBe(false);
  });
  it('returns null instead of throwing when storage is blocked', () => {
    vi.stubGlobal('localStorage', memoryStorage({ getItem: () => { throw new Error('SecurityError'); } }));
    expect(loadLastBackup()).toBeNull();
  });
});
