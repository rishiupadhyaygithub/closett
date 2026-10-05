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

describe('bookmarklet portability', () => {
  it('is plain ASCII, so pasting it as a bookmark address cannot mangle it', () => {
    expect(bookmarkletCode(APP)).toMatch(/^[\x20-\x7e]*$/);
  });
  it('still recognises the rupee, euro and pound signs', () => {
    const run = (sym: string) => runOnPage(`<head></head><body><span class="price">${sym}499</span></body>`, 'https://shop.example/p').searchParams.get('c');
    expect(run('₹')).toBe('INR');
    expect(run('€')).toBe('EUR');
    expect(run('£')).toBe('GBP');
  });
});

describe('bookmarklet on a shop with no structured data and generic class names (Bewakoof)', () => {
  const BEWAKOOF_LIKE = `
<head><title>Buy Men's Beige Board Meeting Tee Online at Bewakoof</title>
<meta property="og:image" content="https://images.bewakoof.com/original/a.jpg"></head>
<body>
  <div class="sc-banner">Get FLAT ₹100 OFF on all Prepaid orders</div>
  <div class="sc-cart">₹0</div>
  <h1>Men's Beige Board Meeting Tee</h1>
  <h3 class="sc-d0df3db6">₹613</h3>
  <span class="sc-9e333c87 line-through mr-2">₹1,799</span>
  <b>₹550</b>
</body>`;
  const q = () => runOnPage(BEWAKOOF_LIKE, 'https://www.bewakoof.com/p/mens-beige-tee');
  it('finds the selling price even when class names say nothing about price', () => expect(q().searchParams.get('p')).toBe('613'));
  it('infers the currency from the symbol', () => expect(q().searchParams.get('c')).toBe('INR'));
  it('skips a struck-through list price', () => {
    const html = BEWAKOOF_LIKE.replace('<h3 class="sc-d0df3db6">₹613</h3>', '<del>₹1,799</del><h3>₹613</h3>');
    expect(runOnPage(html, 'https://www.bewakoof.com/p/x').searchParams.get('p')).toBe('613');
  });
  it('ignores a banner sentence that merely mentions a rupee amount', () => {
    const html = '<body><p>Get FLAT ₹100 OFF</p><h1>Tee</h1></body>';
    expect(runOnPage(html, 'https://shop.example/p/1').searchParams.get('p')).toBe('');
  });
});

describe('parsePrefill thumbnail upsizing (Shopify cdn)', () => {
  const img = (u: string) => parsePrefill('?add=1&i=' + encodeURIComponent(u))!.images[0];
  it('asks Shopify for a larger rendition when the page gave a tiny one', () => {
    expect(img('https://levi.in/cdn/shop/files/a.jpg?v=1&width=192')).toBe('https://levi.in/cdn/shop/files/a.jpg?v=1&width=1200');
  });
  it('leaves a large Shopify width alone', () => {
    expect(img('https://levi.in/cdn/shop/files/a.jpg?width=1500')).toBe('https://levi.in/cdn/shop/files/a.jpg?width=1500');
  });
  it('does not touch width parameters on other hosts', () => {
    expect(img('https://img.example.com/a.jpg?width=192')).toBe('https://img.example.com/a.jpg?width=192');
  });
});

describe('bookmarklet on a page with decoy headings and no meta tags (Amazon)', () => {
  const AMAZON_LIKE = `
<head><title>Buy BULLMER Printed Cotton Tshirt for Men - Pack of 3 at Amazon.in</title></head>
<body>
  <h1 class="a-offscreen">Product summary presents key product information Keyboard shortcut shift + alt + t</h1>
  <span id="productTitle">   BULLMER Trendy Printed Cotton Blend Crew Neck Tshirt for Men - Pack of 3   </span>
  <div id="imgTagWrapperId"><img id="landingImage" src="https://m.media-amazon.com/images/I/small._SX38_.jpg" data-old-hires="https://m.media-amazon.com/images/I/big._SL1500_.jpg"></div>
  <span class="a-price"><span class="a-offscreen">₹473.00</span></span>
</body>`;
  const q = () => runOnPage(AMAZON_LIKE, 'https://www.amazon.in/BULLMER/dp/B0DJYJNTM3');
  it('prefers the product title element over a decoy heading', () => {
    expect(q().searchParams.get('t')).toBe('BULLMER Trendy Printed Cotton Blend Crew Neck Tshirt for Men - Pack of 3');
  });
  it('uses the high-resolution product image', () => {
    expect(q().searchParams.get('i')).toBe('https://m.media-amazon.com/images/I/big._SL1500_.jpg');
  });
  it('never returns a very long heading as the title', () => {
    const html = '<head><title>Real Title | Shop</title></head><body><h1>' + 'x '.repeat(200) + '</h1></body>';
    expect(runOnPage(html, 'https://shop.example/p/1').searchParams.get('t')).toBe('Real Title | Shop');
  });
});
