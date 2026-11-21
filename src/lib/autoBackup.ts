const KEY = 'closett-auto-backup';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
interface ClosetData { categories: unknown[]; items: unknown[]; colorRules: unknown[] }
export interface AutoBackup { json: string; itemCount: number; savedAt: number }

/** Keeps the latest non-empty closet in this browser, in the export format, so a lost session can be restored. */
export function saveAutoBackup(data: ClosetData, storage: StorageLike = localStorage, now = Date.now()): void {
  if (data.items.length === 0) return; // an empty closet (e.g. a fresh account) must never replace a real backup
  const backup: AutoBackup = { json: JSON.stringify(data), itemCount: data.items.length, savedAt: now };
  try { storage.setItem(KEY, JSON.stringify(backup)); } catch { /* storage full or blocked: skip */ }
}

export function loadAutoBackup(storage: StorageLike = localStorage): AutoBackup | null {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return null;
    const b = JSON.parse(raw) as Partial<AutoBackup>;
    return typeof b.json === 'string' && typeof b.itemCount === 'number' && typeof b.savedAt === 'number' ? (b as AutoBackup) : null;
  } catch { return null; }
}

/** Signing out of a saved closet: it is safe on the server, so leave no copy in this browser. */
export function clearAutoBackup(storage: Pick<Storage, 'removeItem'> = localStorage): void {
  try { storage.removeItem(KEY); } catch { /* storage blocked */ }
}
