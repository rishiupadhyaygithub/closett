const MAX_SIDE = 1200;
const QUALITY = 0.85;

function load(src: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Shrinks a large photo (phone cameras are 4000px+) to at most 1200px on the long
 * side as JPEG, so uploads are small and fast. Small images are returned unchanged.
 * Returns null when the browser cannot decode the file (corrupt, or HEIC outside Safari).
 */
export async function downscaleDataUrl(dataUrl: string): Promise<string | null> {
  const img = await load(dataUrl);
  if (!img) return null;
  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  if (longest <= MAX_SIDE) return dataUrl;

  const scale = MAX_SIDE / longest;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.fillStyle = '#ffffff'; // JPEG has no alpha; transparent PNGs would turn black
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', QUALITY);
}
