/** Storage path for an item photo. The version suffix gives every save a new URL, so no cache serves an old photo. */
export function imageObjectPath(userId: string, itemId: string, mime: string, now = Date.now()): string {
  const ext = mime.split('/')[1] || 'jpg';
  return `${userId}/${itemId}-${now.toString(36)}.${ext}`;
}
