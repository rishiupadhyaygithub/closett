const KEY = 'closett-pending-merge';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export interface PendingMerge { fromUserId: string; json: string; itemCount: number }

/** Before signing in to a saved closet, remember this browser's own pieces so they can be merged afterwards. */
export function savePendingMerge(p: PendingMerge, storage: StorageLike = localStorage): void {
  try { storage.setItem(KEY, JSON.stringify(p)); } catch { /* storage blocked: nothing to merge later */ }
}

/** Returns (once) the pieces to merge, but only when the browser actually switched to another account. */
export function takePendingMerge(currentUserId: string, storage: StorageLike = localStorage): PendingMerge | null {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<PendingMerge>;
    if (typeof p.fromUserId !== 'string' || typeof p.json !== 'string' || typeof p.itemCount !== 'number') {
      storage.removeItem(KEY);
      return null;
    }
    if (p.fromUserId === currentUserId) return null;
    storage.removeItem(KEY);
    return p as PendingMerge;
  } catch { return null; }
}
