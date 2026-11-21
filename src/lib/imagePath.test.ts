import { describe, it, expect } from 'vitest';
import { imageObjectPath } from './imagePath';

describe('imageObjectPath', () => {
  it('puts the file under the user folder with the item id and a version', () => {
    expect(imageObjectPath('u1', 'i1', 'image/jpeg', 1700000000000)).toBe('u1/i1-loyw3v28.jpeg');
  });
  it('gives a different name for a later save, so browsers never show a cached old photo', () => {
    expect(imageObjectPath('u1', 'i1', 'image/png', 1)).not.toBe(imageObjectPath('u1', 'i1', 'image/png', 2));
  });
  it('falls back to jpg for an odd mime type', () => {
    expect(imageObjectPath('u1', 'i1', 'image/', 1)).toBe('u1/i1-1.jpg');
  });
});
