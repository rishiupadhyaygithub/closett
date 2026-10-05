const TIMEOUT_MS = 8000;

/** Does the browser manage to load this image? No referrer is sent, which defeats most hotlink checks. */
function domProbe(url: string): Promise<boolean> {
  return new Promise(resolve => {
    const img = new Image();
    img.referrerPolicy = 'no-referrer';
    const timer = setTimeout(() => resolve(false), TIMEOUT_MS);
    img.onload = () => { clearTimeout(timer); resolve(img.naturalWidth > 1); };
    img.onerror = () => { clearTimeout(timer); resolve(false); };
    img.src = url;
  });
}

/** First url in the list that actually loads, or null. A probe that throws counts as a failed image. */
export async function firstLoadableImage(
  urls: string[],
  probe: (url: string) => Promise<boolean> = domProbe,
): Promise<string | null> {
  for (const url of urls) {
    try { if (await probe(url)) return url; } catch { /* try the next one */ }
  }
  return null;
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
