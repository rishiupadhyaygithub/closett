// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { bookmarkletCode, parsePrefill } from './bookmarklet';

const APP = 'https://closett-delta.vercel.app';

function runOnPage(html: string, pageUrl: string): URL {
  document.documentElement.innerHTML = html;
  let opened = '';
  const fakeWindow = { open: (u: string) => { opened = u; return {}; } };
  const fakeLocation = { href: pageUrl, origin: new URL(pageUrl).origin };
  new Function('document', 'window', 'location', bookmarkletCode(APP))(document, fakeWindow, fakeLocation);
  return new URL(opened);
}

const WESTSIDE_LIKE = `
<head>
  <title>Buy ETA Light Beige Foliage Printed Relaxed-Fit Cotton Shirt from Westside</title>
  <meta property="og:title" content="Buy ETA Light Beige Foliage Printed Relaxed-Fit Cotton Shirt from Westside">
  <meta property="og:image:secure_url" content="https://cdn.shopify.com/files/301088322STONE_1.jpg?v=1">
  <script type="application/ld+json">[{"@type":"Product","name":"ETA Light Beige Foliage Printed Relaxed-Fit Cotton Shirt",
   "image":["https://cdn.shopify.com/files/301088322STONE_1.jpg?v=1","https://cdn.shopify.com/files/301088322STONE_2.jpg?v=2","https://cdn.shopify.com/files/301088322STONE_3.jpg?v=3","https://cdn.shopify.com/files/301088322STONE_4.jpg?v=4"],
   "color":"Beige","offers":{"@type":"Offer","priceCurrency":"INR","price":"1499.0"}},{"@type":"Organization","name":"Westside"}]</script>
</head><body><h1>ETA Light Beige Foliage Printed Relaxed-Fit Cotton Shirt</h1></body>`;

describe('bookmarklet on a shop with no og:image (Westside)', () => {
  const u = () => runOnPage(WESTSIDE_LIKE, 'https://westside.com/products/eta-shirt-301088322?Color=Beige&Size=XS');
  it('uses the structured product name', () => expect(u().searchParams.get('t')).toBe('ETA Light Beige Foliage Printed Relaxed-Fit Cotton Shirt'));
  it('takes the first product image from the structured data', () => expect(u().searchParams.get('i')).toBe('https://cdn.shopify.com/files/301088322STONE_1.jpg?v=1'));
  it('passes further candidates as fallbacks, at most 3 in total', () => {
    expect(u().searchParams.get('i2')).toBe('https://cdn.shopify.com/files/301088322STONE_2.jpg?v=2');
    expect(u().searchParams.get('i3')).toBe('https://cdn.shopify.com/files/301088322STONE_3.jpg?v=3');
    expect(u().searchParams.has('i4')).toBe(false);
  });
  it('reads price and currency from the offer', () => {
    expect(u().searchParams.get('p')).toBe('1499.0');
    expect(u().searchParams.get('c')).toBe('INR');
  });
  it('reads the product colour', () => expect(u().searchParams.get('k')).toBe('Beige'));
});

describe('bookmarklet edge cases that used to break', () => {
  const run = (html: string, url = 'https://shop.example/p/1') => runOnPage(html, url);

  it('sends NO image (not the page address) when the page has none', () => {
    expect(run('<head><meta property="og:title" content="X"></head>').searchParams.get('i')).toBe('');
  });
  it('accepts an ImageObject in structured data', () => {
    const html = `<head><script type="application/ld+json">{"@type":"Product","name":"N","image":{"@type":"ImageObject","url":"https://cdn.x.com/a.jpg"}}</script></head>`;
    expect(run(html).searchParams.get('i')).toBe('https://cdn.x.com/a.jpg');
  });
  it('finds the Product inside @graph', () => {
    const html = `<head><script type="application/ld+json">{"@graph":[{"@type":"WebSite","name":"Shop"},{"@type":["Product","Thing"],"name":"Graph Shirt","offers":{"price":"250","priceCurrency":"USD"}}]}</script></head>`;
    const q = run(html);
    expect(q.searchParams.get('t')).toBe('Graph Shirt');
    expect(q.searchParams.get('p')).toBe('250');
  });
  it('reads an AggregateOffer low price', () => {
    const html = `<head><script type="application/ld+json">{"@type":"Product","name":"N","offers":{"@type":"AggregateOffer","lowPrice":"99","priceCurrency":"EUR"}}</script></head>`;
    expect(run(html).searchParams.get('p')).toBe('99');
  });
  it('ignores a price on a non-product object', () => {
    const html = `<head><script type="application/ld+json">[{"@type":"Organization","price":"1"},{"@type":"Product","name":"N","offers":{"price":"777"}}]</script></head>`;
    expect(run(html).searchParams.get('p')).toBe('777');
  });
  it('falls back to a price shown in the page text', () => {
    const q = run('<head><meta property="og:title" content="X"></head><body><span class="product-price">MRP Rs. 1,299</span></body>');
    expect(q.searchParams.get('p')).toBe('1,299');
    expect(q.searchParams.get('c')).toBe('INR');
  });
  it('reads a dollar price and infers USD', () => {
    const q = run('<head></head><body><div id="price-box">$49.99</div></body>');
    expect(q.searchParams.get('p')).toBe('49.99');
    expect(q.searchParams.get('c')).toBe('USD');
  });
  it('reads the colour from the address when the page has none', () => {
    expect(run('<head></head>', 'https://shop.example/p/1?Colour=Navy&Size=M').searchParams.get('k')).toBe('Navy');
  });
  it('leaves colour empty when unknown', () => expect(run('<head></head>').searchParams.get('k')).toBe(''));
});

describe('parsePrefill (extended)', () => {
  it('cleans site boilerplate from the title using the link host', () => {
    expect(parsePrefill('?add=1&t=Buy%20ETA%20Shirt%20from%20Westside&l=https%3A%2F%2Fwestside.com%2Fp')!.title).toBe('ETA Shirt');
  });
  it('normalises a price like 1499.0', () => expect(parsePrefill('?add=1&p=1499.0')!.price).toBe('1499'));
  it('keeps decimals that matter', () => expect(parsePrefill('?add=1&p=499.50')!.price).toBe('499.5'));
  it('drops duplicate and unsafe image urls', () => {
    const q = '?add=1&i=https%3A%2F%2Fa.com%2F1.jpg&i2=https%3A%2F%2Fa.com%2F1.jpg&i3=javascript%3Aalert(1)';
    expect(parsePrefill(q)!.images).toEqual(['https://a.com/1.jpg']);
  });
  it('keeps image order across i, i2, i3', () => {
    const q = '?add=1&i=https%3A%2F%2Fa.com%2F1.jpg&i2=https%3A%2F%2Fa.com%2F2.jpg&i3=https%3A%2F%2Fa.com%2F3.jpg';
    expect(parsePrefill(q)!.images).toEqual(['https://a.com/1.jpg', 'https://a.com/2.jpg', 'https://a.com/3.jpg']);
  });
  it('reads a short colour name and drops anything odd', () => {
    expect(parsePrefill('?add=1&k=Light%20Beige')!.colorName).toBe('Light Beige');
    expect(parsePrefill('?add=1&k=%3Cscript%3E')!.colorName).toBe('');
    expect(parsePrefill('?add=1&k=' + 'a'.repeat(80))!.colorName).toBe('');
  });
});

describe('bookmarklet on a ProductGroup with variants (H&M)', () => {
  const HM_LIKE = `
  <head>
    <meta property="og:title" content="Men's White Regular Fit Oxford shirt | H&M IN">
    <script type="application/ld+json">{"@type":"BreadcrumbList","itemListElement":[]}</script>
    <script type="application/ld+json">{"@type":"ProductGroup","name":"Regular Fit Oxford shirt","brand":{"@type":"Brand","name":"H&M"},
      "hasVariant":[
        {"@type":"Product","color":"White","image":"https://image.hm.com/assets/a.jpg","name":"Regular Fit Oxford shirt - White","size":"XS",
         "offers":{"@type":"Offer","price":1799,"priceCurrency":"INR"}},
        {"@type":"Product","color":"White","image":"https://image.hm.com/assets/a.jpg","size":"S","offers":{"@type":"Offer","price":1799,"priceCurrency":"INR"}}
      ]}</script>
  </head><body><h1>Regular Fit Oxford shirt</h1></body>`;
  const q = () => runOnPage(HM_LIKE, 'https://www2.hm.com/en_in/productpage.1257417001.html');

  it('reads the title from the group', () => expect(q().searchParams.get('t')).toBe('Regular Fit Oxford shirt'));
  it('reads a numeric price from a variant offer', () => expect(q().searchParams.get('p')).toBe('1799'));
  it('reads the currency from the variant offer', () => expect(q().searchParams.get('c')).toBe('INR'));
  it('reads the colour from the variant', () => expect(q().searchParams.get('k')).toBe('White'));
  it('reads the image from the variant', () => expect(q().searchParams.get('i')).toBe('https://image.hm.com/assets/a.jpg'));
  it('does not repeat the same image', () => expect(q().searchParams.has('i2')).toBe(false));
});
