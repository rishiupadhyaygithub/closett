import { COLOR_PALETTE } from '../colorData';

export type RGB = [number, number, number];

const BG_DISTANCE = 40;      // RGB distance under which a pixel counts as background
const MIN_FG_SHARE = 0.05;   // below this share of opaque pixels, the "garment" is the background colour itself
const MIN_BG_BORDER = 0.6;   // share of opaque border pixels that must agree to call it a background

export function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToLab([r, g, b]: RGB): RGB {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const [lr, lg, lb] = [lin(r), lin(g), lin(b)];
  const x = (lr * 0.4124 + lg * 0.3576 + lb * 0.1805) / 0.95047;
  const y = lr * 0.2126 + lg * 0.7152 + lb * 0.0722;
  const z = (lr * 0.0193 + lg * 0.1192 + lb * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

const PALETTE_LAB = COLOR_PALETTE.map(c => ({ id: c.id as string, lab: rgbToLab(hexToRgb(c.hex)) }));

/** Id of the palette colour perceptually closest to `rgb`. */
export function nearestPaletteColor(rgb: RGB): string {
  const lab = rgbToLab(rgb);
  let best = PALETTE_LAB[0].id;
  let bestD = Infinity;
  for (const p of PALETTE_LAB) {
    const d = (lab[0] - p.lab[0]) ** 2 + (lab[1] - p.lab[1]) ** 2 + (lab[2] - p.lab[2]) ** 2;
    if (d < bestD) { bestD = d; best = p.id; }
  }
  return best;
}

interface Bucket { n: number; r: number; g: number; b: number }

function addTo(map: Map<number, Bucket>, r: number, g: number, b: number) {
  const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
  const cur = map.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
  cur.n++; cur.r += r; cur.g += g; cur.b += b;
  map.set(key, cur);
}

function biggest(map: Map<number, Bucket>): Bucket | null {
  let best: Bucket | null = null;
  for (const b of map.values()) if (!best || b.n > best.n) best = b;
  return best;
}

const mean = (b: Bucket): RGB => [Math.round(b.r / b.n), Math.round(b.g / b.n), Math.round(b.b / b.n)];

/**
 * Dominant garment colour of an RGBA image. Skips transparent pixels and a
 * uniform border background (typical product photo). Returns null when
 * nothing can be read.
 */
export function dominantColor(pixels: ArrayLike<number>, width: number, height: number): RGB | null {
  if (width <= 0 || height <= 0 || pixels.length < width * height * 4) return null;

  const border = new Map<number, Bucket>();
  let borderOpaque = 0;
  let opaque = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (pixels[i + 3] < 128) continue;
      opaque++;
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        borderOpaque++;
        addTo(border, pixels[i], pixels[i + 1], pixels[i + 2]);
      }
    }
  }
  if (opaque === 0) return null;

  const bgBucket = biggest(border);
  const bg: RGB | null = bgBucket && bgBucket.n / borderOpaque >= MIN_BG_BORDER ? mean(bgBucket) : null;

  const fg = new Map<number, Bucket>();
  let fgCount = 0;
  for (let i = 0; i < width * height * 4; i += 4) {
    if (pixels[i + 3] < 128) continue;
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    if (bg && Math.hypot(r - bg[0], g - bg[1], b - bg[2]) < BG_DISTANCE) continue;
    fgCount++;
    addTo(fg, r, g, b);
  }

  if (fgCount / opaque < MIN_FG_SHARE) return bg ?? (biggest(fg) ? mean(biggest(fg)!) : null);
  const top = biggest(fg);
  return top ? mean(top) : null;
}
