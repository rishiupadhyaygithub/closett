import { describe, it, expect } from 'vitest';
import { deriveColorSeason, SEASON_INFO } from './seasonData';
import type { SkinTone, Undertone } from './types';

const TONES: SkinTone[] = ['fair', 'wheatish', 'dusky', 'dark'];
const UNDERTONES: Undertone[] = ['warm', 'cool', 'neutral', 'olive'];

describe('deriveColorSeason', () => {
  it('maps dark+neutral the same as dusky+neutral', () => {
    expect(deriveColorSeason('dark', 'neutral')).toBe(deriveColorSeason('dusky', 'neutral'));
  });

  it('returns a known season for every tone/undertone pair', () => {
    for (const t of TONES) for (const u of UNDERTONES) {
      expect(SEASON_INFO[deriveColorSeason(t, u)]).toBeDefined();
    }
  });
});

describe('SEASON_INFO copy', () => {
  it('does not tie a season to an ethnic group', () => {
    for (const s of Object.values(SEASON_INFO)) {
      expect(s.description).not.toMatch(/Tamil|Malayalee|Sri Lankan|heritage/i);
    }
  });
});
