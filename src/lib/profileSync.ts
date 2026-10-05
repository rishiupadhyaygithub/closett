import type { UserProfile } from '../types';

export type ProfileSyncAction = 'use-remote' | 'push-local' | 'none';

const same = (a: UserProfile, b: UserProfile) =>
  a.gender === b.gender && a.skinTone === b.skinTone && a.undertone === b.undertone && a.bodyType === b.bodyType;

/**
 * Which copy of the style profile wins. The database copy is the source of truth when it
 * exists. A profile that only exists on this device (saved while offline, or before the
 * database was reachable) must be pushed up, otherwise it is lost when browser data clears.
 */
export function decideProfileSync(local: UserProfile | null, remote: UserProfile | null): ProfileSyncAction {
  if (remote) return local && same(local, remote) ? 'none' : 'use-remote';
  return local ? 'push-local' : 'none';
}
