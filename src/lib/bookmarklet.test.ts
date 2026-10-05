// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { bookmarkletHref, bookmarkletCode, parsePrefill } from './bookmarklet';

const APP = 'https://closett-delta.vercel.app';

/** Run the bookmarklet source against a page; returns the URL it tried to open. */
function runOnPage(html: string, pageUrl: string): string | null {
  document.documentElement.innerHTML = html;
  let opened: string | null = null;
  const fakeWindow = { open: (u: string) => { opened = u; return {}; } };
  const fakeLocation = { href: pageUrl, origin: new URL(pageUrl).origin };
  new Function('document', 'window', 'location', bookmarkletCode(APP))(document, fakeWindow, fakeLocation);
  return opened;
}

const ZARA_LIKE = `
<head>
  <title>RELAXED FIT PLEATED JACKET | ZARA United Arab Emirates</title>
  <meta property="og:title" content="RELAXED FIT PLEATED JACKET">
  <meta property="og:image" content="/photos/jacket.jpg">
  <script type="application/ld+json">{"@type":"Product","offers":{"@type":"Offer","price":"2,299.00","priceCurrency":"AED"}}</script>
</head><body><h1>ignored when og:title exists</h1></body>`;

describe('bookmarklet code', () => {
  it('opens Closett with title, absolute image, price and the page link', () => {
    const opened = runOnPage(ZARA_LIKE, 'https://www.zara.com/ae/en/jacket-p1.html?v1=5');
    const u = new URL(opened!);
    expect(u.origin).toBe(APP);
    expect(u.searchParams.get('add')).toBe('1');
    expect(u.searchParams.get('t')).toBe('RELAXED FIT PLEATED JACKET');
    expect(u.searchParams.get('i')).toBe('https://www.zara.com/photos/jacket.jpg');
    expect(u.searchParams.get('p')).toBe('2,299.00');
    expect(u.searchParams.get('c')).toBe('AED');
    expect(u.searchParams.get('l')).toBe('https://www.zara.com/ae/en/jacket-p1.html?v1=5');
  });

  it('falls back to <h1> / document.title when there is no og:title', () => {
    const opened = runOnPage('<head><title>Page Title</title></head><body><h1>Real Heading</h1></body>', 'https://shop.example/p');
    expect(new URL(opened!).searchParams.get('t')).toBe('Real Heading');
  });

  it('finds a price inside a JSON-LD @graph', () => {
    const html = `<head><meta property="og:title" content="X"><script type="application/ld+json">{"@graph":[{"@type":"Product","offers":{"price":"799"}}]}</script></head>`;
    expect(new URL(runOnPage(html, 'https://shop.example/p')!).searchParams.get('p')).toBe('799');
  });

  it('still opens Closett when the page has no product data', () => {
    const opened = runOnPage('<head></head><body></body>', 'https://shop.example/p');
    expect(new URL(opened!).searchParams.get('l')).toBe('https://shop.example/p');
  });

  it('reads the currency from a meta tag', () => {
    const html = `<head><meta property="og:title" content="X"><meta property="product:price:amount" content="49"><meta property="product:price:currency" content="USD"></head>`;
    expect(new URL(runOnPage(html, 'https://shop.example/p')!).searchParams.get('c')).toBe('USD');
  });

  it('survives broken JSON-LD', () => {
    const html = `<head><meta property="og:title" content="X"><script type="application/ld+json">{not json</script></head>`;
    expect(new URL(runOnPage(html, 'https://shop.example/p')!).searchParams.get('t')).toBe('X');
  });
});

describe('bookmarkletHref', () => {
  it('is a single-line javascript: url that embeds the app origin', () => {
    const href = bookmarkletHref(APP);
    expect(href.startsWith('javascript:')).toBe(true);
    expect(href).toContain(APP);
    expect(href).not.toMatch(/[\r\n]/);
    expect(href).not.toMatch(/[#%]/); // would be mangled inside a bookmark URL
  });
});

describe('parsePrefill', () => {
  it('returns null without add=1', () => expect(parsePrefill('?t=hello')).toBeNull());
  it('returns null for an empty query', () => expect(parsePrefill('')).toBeNull());

  it('reads and cleans all fields', () => {
    const q = '?add=1&t=Linen%20shirt&i=https%3A%2F%2Fcdn.x.com%2Fa.jpg&p=%E2%82%B91%2C299.00&l=https%3A%2F%2Fx.com%2Fp';
    expect(parsePrefill(q)).toEqual({ title: 'Linen shirt', images: ['https://cdn.x.com/a.jpg'], price: '1299', currency: '', link: 'https://x.com/p', colorName: '' });
  });

  it('accepts a 3-letter currency and upper-cases it', () => {
    expect(parsePrefill('?add=1&c=aed')!.currency).toBe('AED');
  });

  it('rejects a malformed currency', () => {
    expect(parsePrefill('?add=1&c=%3Cscript%3E')!.currency).toBe('');
    expect(parsePrefill('?add=1&c=EURO')!.currency).toBe('');
  });

  it('drops a javascript: link and a data: image', () => {
    const r = parsePrefill('?add=1&t=x&i=data%3Aimage%2Fpng%3Bbase64%2CAAAA&l=javascript%3Aalert(1)');
    expect(r!.images).toEqual([]);
    expect(r!.link).toBe('');
  });

  it('truncates an absurdly long title', () => {
    const r = parsePrefill('?add=1&t=' + 'a'.repeat(1000));
    expect(r!.title.length).toBe(200);
  });

  it('works with no title at all', () => expect(parsePrefill('?add=1')!.title).toBe(''));
});
