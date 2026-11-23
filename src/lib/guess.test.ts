import { describe, it, expect } from 'vitest';
import { guessCategory, guessGarmentType } from './guess';

describe('guessCategory', () => {
  it('finds pants from a plural', () => expect(guessCategory('Slim fit chinos', '', '')).toBe('pants'));
  it('does not read "brand" as innerwear', () => expect(guessCategory('Premium brand wallet', '', '')).toBe(''));
  it('does not read "street" as a tee', () => expect(guessCategory('Street style cap', '', '')).toBe('accessories'));
  it('does not read "spring" as a ring', () => expect(guessCategory('Spring collection notebook', '', '')).toBe(''));
  it('finds a hoodie as tops', () => expect(guessCategory('Oversized hoodie', '', '')).toBe('tops'));
  it('finds shoes', () => expect(guessCategory('White leather sneakers', '', '')).toBe('shoes'));
});

describe('guessGarmentType', () => {
  it('shirt is a top', () => expect(guessGarmentType('Linen shirt', '', '')).toBe('top'));
  it('jeans are a bottom', () => expect(guessGarmentType('Straight jeans', '', '')).toBe('bottom'));
  it('blazer is a layer', () => expect(guessGarmentType('Navy blazer', '', '')).toBe('layer'));
  it('watch is an accessory', () => expect(guessGarmentType('Steel watch', '', '')).toBe('accessory'));
  it('kurta is a top', () => expect(guessGarmentType('Cotton kurta', '', '')).toBe('top'));
  it('unknown is other', () => expect(guessGarmentType('Mystery item', '', '')).toBe('other'));
  it('does not read "street" as a top', () => expect(guessGarmentType('Streetwear drop', '', '')).toBe('other'));
});

describe('guessing from real shop data (brand words and URLs must not win)', () => {
  const ajio = ['Men Graphic Print Regular Fit T-shirt', '', 'https://www.ajio.com/buda-jeans-co-men-graphic-print-regular-fit-t-shirt/p/704249965_white'] as const;
  it('a T-shirt from the brand "Buda Jeans Co" is a top', () => expect(guessGarmentType(...ajio)).toBe('top'));
  it('and its category is tops', () => expect(guessCategory(...ajio)).toBe('tops'));
  it('the last garment word in the title is the product: denim shirt jacket is a layer', () =>
    expect(guessGarmentType('Denim Shirt Jacket', '', '')).toBe('layer'));
  it('jeans jacket is a layer, not a bottom', () => expect(guessGarmentType('Washed Jeans Jacket', '', '')).toBe('layer'));
  it('shirt dress is a dress', () => expect(guessCategory('Striped Shirt Dress', '', '')).toBe('dresses'));
  it('falls back to the URL when the title has no garment word', () =>
    expect(guessGarmentType('CAHOOT Comfort Buffalo Checks', '', 'https://www.myntra.com/shirts/cahoot/x/123/buy')).toBe('top'));
});

// Regression: ISSUE-001 — "H&M Grey Overshirt" was guessed as "other" and landed on the Accessories shelf
// Found by /qa on 2026-11-23
describe('guessing layers that are named after shirts or fills', () => {
  it.each(['H&M Grey Overshirt', 'Corduroy Shacket', 'Black Puffer', 'Quilted Gilet', 'Beige Trench', 'Linen Nehru Jacket', 'Nehru vest'])(
    '%s is a layer', title => expect(guessGarmentType(title, '', '')).toBe('layer'));
  it('an overshirt files under outerwear', () => expect(guessCategory('H&M Grey Overshirt', '', '')).toBe('outerwear'));
  it('a plain shirt is still a top', () => expect(guessGarmentType('Oxford shirt', '', '')).toBe('top'));
});
