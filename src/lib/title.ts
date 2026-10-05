const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Product pages put boilerplate in their titles: "Buy X from Westside", "X | ZARA United Arab Emirates",
 * "Buy X Online | Myntra". Strip the "Buy", "Online" and the site name, keep the product.
 */
export function cleanTitle(raw: string, host = ''): string {
  const original = raw.replace(/\s+/g, ' ').trim();
  let t = original.replace(/^(?:buy|shop)\s+/i, '');
  const brand = host.replace(/^www\./i, '').split('.')[0];
  if (brand) {
    t = t.replace(new RegExp(`\\s*(?:\\||[-–—:]|\\b(?:from|at|on)\\b)\\s*${escapeRe(brand)}\\b.*$`, 'i'), '');
  }
  t = t.replace(/\s+online$/i, '').trim();
  return t || original;
}
