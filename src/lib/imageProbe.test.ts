import { describe, it, expect, vi } from 'vitest';
import { firstLoadableImage } from './imageProbe';

describe('firstLoadableImage', () => {
  it('returns the first url that loads', async () => {
    const probe = vi.fn(async (u: string) => u.endsWith('2.jpg'));
    expect(await firstLoadableImage(['a/1.jpg', 'a/2.jpg', 'a/3.jpg'], probe)).toBe('a/2.jpg');
    expect(probe).toHaveBeenCalledTimes(2);
  });
  it('returns null when none load', async () => expect(await firstLoadableImage(['x', 'y'], async () => false)).toBeNull());
  it('returns null for an empty list without probing', async () => {
    const probe = vi.fn(async () => true);
    expect(await firstLoadableImage([], probe)).toBeNull();
    expect(probe).not.toHaveBeenCalled();
  });
  it('treats a probe that throws as a failed image and keeps going', async () => {
    const probe = async (u: string) => { if (u === 'bad') throw new Error('boom'); return true; };
    expect(await firstLoadableImage(['bad', 'good'], probe)).toBe('good');
  });
});

describe('firstLoadableImage skips thumbnails', () => {
  const widths: Record<string, number> = { thumb: 78, big: 473, other: 900, small2: 120 };
  const probe = async (u: string) => widths[u] ?? 0;
  it('passes over a tiny thumbnail when a bigger photo follows (Ajio gives a 78px one first)', async () =>
    expect(await firstLoadableImage(['thumb', 'big', 'other'], probe)).toBe('big'));
  it('falls back to the biggest small photo when nothing is big', async () =>
    expect(await firstLoadableImage(['thumb', 'small2', 'missing'], probe)).toBe('small2'));
  it('still returns null when nothing loads', async () =>
    expect(await firstLoadableImage(['missing'], probe)).toBeNull());
});
