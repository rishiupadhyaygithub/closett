import { describe, it, expect } from 'vitest';
import { cleanTitle } from './title';

describe('cleanTitle', () => {
  it('removes "Buy ... from <brand>"', () => expect(cleanTitle('Buy ETA Light Beige Cotton Shirt from Westside', 'westside.com')).toBe('ETA Light Beige Cotton Shirt'));
  it('removes a "| SITE ..." suffix', () => expect(cleanTitle('RELAXED FIT PLEATED JACKET | ZARA United Arab Emirates', 'www.zara.com')).toBe('RELAXED FIT PLEATED JACKET'));
  it('removes a "- SITE" suffix', () => expect(cleanTitle('Slim Jeans - Myntra', 'www.myntra.com')).toBe('Slim Jeans'));
  it('removes Buy and Online and the site together', () => expect(cleanTitle('Buy Slim Jeans Online | Myntra', 'myntra.com')).toBe('Slim Jeans'));
  it('keeps a colour that follows a dash when it is not the site', () => expect(cleanTitle('Relaxed Jacket - Brown | ZARA UAE', 'zara.com')).toBe('Relaxed Jacket - Brown'));
  it('keeps a brand at the start of the title', () => expect(cleanTitle('Westside Wardrobe Cotton Shirt', 'westside.com')).toBe('Westside Wardrobe Cotton Shirt'));
  it('does not cut a word that merely starts like the brand', () => expect(cleanTitle('Linen Shirt from Zaramella', 'zara.com')).toBe('Linen Shirt from Zaramella'));
  it('collapses whitespace', () => expect(cleanTitle('  Two   Words \n Here ', 'x.com')).toBe('Two Words Here'));
  it('never returns an empty title', () => expect(cleanTitle('Buy Westside', 'westside.com')).not.toBe(''));
  it('works with no host', () => expect(cleanTitle('Buy Shirt')).toBe('Shirt'));
});
