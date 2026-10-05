const KEY = 'closett-last-backup';

/** Keep a copy of the closet before an import replaces it. Returns false when it could not be stored. */
export function saveLastBackup(json: string): boolean {
  try { localStorage.setItem(KEY, json); return true; } catch { return false; }
}

export function loadLastBackup(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}
