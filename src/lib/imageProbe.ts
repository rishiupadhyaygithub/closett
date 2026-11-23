const TIMEOUT_MS = 8000;

/** Width of the image once loaded, 0 when it fails. No referrer is sent, which defeats most hotlink checks. */
function domProbe(url: string): Promise<number> {
  return new Promise(resolve => {
    const img = new Image();
    img.referrerPolicy = 'no-referrer';
    const timer = setTimeout(() => resolve(0), TIMEOUT_MS);
    img.onload = () => { clearTimeout(timer); resolve(img.naturalWidth > 1 ? img.naturalWidth : 0); };
    img.onerror = () => { clearTimeout(timer); resolve(0); };
    img.src = url;
  });
}

/** Photos narrower than this are thumbnails (Ajio hands over a 78px one first). */
const MIN_WIDTH = 300;

/**
 * First url in the list that loads at a usable size; when only thumbnails load, the widest of them;
 * null when none load. A probe answers true (loaded, size unknown), a width, or 0/false (failed);
 * a probe that throws counts as a failed image.
 */
export async function firstLoadableImage(
  urls: string[],
  probe: (url: string) => Promise<boolean | number> = domProbe,
): Promise<string | null> {
  let best: { url: string; width: number } | null = null;
  for (const url of urls) {
    let r: boolean | number = 0;
    try { r = await probe(url); } catch { /* try the next one */ }
    if (r === true) return url;
    const width = typeof r === 'number' ? r : 0;
    if (width >= MIN_WIDTH) return url;
    if (width > 0 && (!best || width > best.width)) best = { url, width };
  }
  return best?.url ?? null;
}

const MAX_DOWNLOAD_BYTES = 8 * 1024 * 1024;

/**
 * Download a shop's photo so Closett can keep its own copy (hotlinked photos disappear when a shop
 * renames or removes them). Only works when the shop's server allows other sites to read the image;
 * returns null otherwise and the caller keeps the plain link.
 */
export async function fetchImageAsDataUrl(
  url: string,
  fetchFn: typeof fetch = fetch,
  maxBytes = MAX_DOWNLOAD_BYTES,
): Promise<string | null> {
  try {
    const res = await fetchFn(url, { mode: 'cors', referrerPolicy: 'no-referrer' });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith('image/') || blob.size === 0 || blob.size > maxBytes) return null;
    return await new Promise<string | null>(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
