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
