import { describe, it, expect, beforeEach } from 'vitest';
import { savePendingMerge, takePendingMerge } from './pendingMerge';

const mem = new Map<string, string>();
const storage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => { mem.set(k, v); },
  removeItem: (k: string) => { mem.delete(k); },
};
beforeEach(() => mem.clear());

describe('pieces waiting to be merged after signing in on this browser', () => {
  it('remembers this browser closet with the account it came from', () => {
    savePendingMerge({ fromUserId: 'anon1', json: '{"items":[1,2]}', itemCount: 2 }, storage);
    expect(takePendingMerge('saved1', storage)).toEqual({ fromUserId: 'anon1', json: '{"items":[1,2]}', itemCount: 2 });
  });
  it('is handed out only once', () => {
    savePendingMerge({ fromUserId: 'anon1', json: '{}', itemCount: 1 }, storage);
    takePendingMerge('saved1', storage);
    expect(takePendingMerge('saved1', storage)).toBeNull();
  });
  it('is ignored when the account did not actually change (link opened but same closet)', () => {
    savePendingMerge({ fromUserId: 'anon1', json: '{}', itemCount: 1 }, storage);
    expect(takePendingMerge('anon1', storage)).toBeNull();
  });
  it('survives corrupt storage', () => {
    mem.set('closett-pending-merge', 'nope');
    expect(takePendingMerge('x', storage)).toBeNull();
  });
});
