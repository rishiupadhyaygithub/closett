import { describe, it, expect } from 'vitest';
import { hexToRgb, nearestPaletteColor, dominantColor } from './color';

/** Build an RGBA image: `bg` everywhere, then a filled rect of `fg`. */
function image(w: number, h: number, bg: number[], fg?: { color: number[]; x0: number; y0: number; x1: number; y1: number }) {
  const px = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const inFg = fg && x >= fg.x0 && x < fg.x1 && y >= fg.y0 && y < fg.y1;
    const c = inFg ? fg!.color : bg;
    px.set(c.length === 4 ? c : [...c, 255], (y * w + x) * 4);
  }
  return px;
}

describe('hexToRgb', () => {
  it('parses a hex colour', () => {
    expect(hexToRgb('#1C2841')).toEqual([28, 40, 65]);
  });
});

describe('nearestPaletteColor', () => {
  it('maps near-white to white', () => expect(nearestPaletteColor([250, 250, 250])).toBe('white'));
  it('maps the exact navy to navy_blue', () => expect(nearestPaletteColor([28, 40, 65])).toBe('navy_blue'));
  it('maps cobalt', () => expect(nearestPaletteColor([0, 71, 171])).toBe('cobalt'));
  it('maps a dark red to a red-family chip, not a blue', () => {
    expect(['ruby', 'maroon', 'burgundy']).toContain(nearestPaletteColor([140, 20, 35]));
  });
});

describe('dominantColor', () => {
  const NAVY = [28, 40, 65];

  it('ignores a white background and returns the garment colour', () => {
    const px = image(10, 10, [255, 255, 255], { color: NAVY, x0: 3, y0: 3, x1: 7, y1: 7 });
    const rgb = dominantColor(px, 10, 10)!;
    expect(nearestPaletteColor(rgb)).toBe('navy_blue');
  });

  it('ignores a transparent background', () => {
    const px = image(10, 10, [0, 0, 0, 0], { color: [155, 17, 30, 255], x0: 2, y0: 2, x1: 8, y1: 8 });
    expect(nearestPaletteColor(dominantColor(px, 10, 10)!)).toBe('ruby');
  });

  it('returns white for a white garment on a white background', () => {
    const px = image(10, 10, [250, 250, 250]);
    expect(nearestPaletteColor(dominantColor(px, 10, 10)!)).toBe('white');
  });

  it('returns null when the image is fully transparent', () => {
    expect(dominantColor(image(10, 10, [0, 0, 0, 0]), 10, 10)).toBeNull();
  });

  it('returns null for an empty image', () => {
    expect(dominantColor(new Uint8ClampedArray(0), 0, 0)).toBeNull();
  });
});
