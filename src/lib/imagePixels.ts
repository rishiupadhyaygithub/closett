import { dominantColor, nearestPaletteColor } from './color';

const SAMPLE_SIZE = 64;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Palette colour id suggested from a photo, or null when it cannot be read.
 * Cross-origin images without CORS headers taint the canvas, so product-URL
 * photos from some shops return null; uploads and pastes always work.
 */
export async function suggestColorFromImage(src: string): Promise<string | null> {
  const img = await loadImage(src);
  if (!img || !img.naturalWidth || !img.naturalHeight) return null;
  try {
    const scale = Math.min(1, SAMPLE_SIZE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    const rgb = dominantColor(ctx.getImageData(0, 0, w, h).data, w, h);
    return rgb ? nearestPaletteColor(rgb) : null;
  } catch {
    return null; // tainted canvas
  }
}
