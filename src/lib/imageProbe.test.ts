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
