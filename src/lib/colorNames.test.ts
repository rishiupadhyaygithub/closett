import { describe, it, expect } from 'vitest';
import { colorFromName, pickColor } from './colorNames';

describe('colorFromName', () => {
  it.each([
    ['Beige', 'beige'], ['Light Beige', 'beige'], ['BLACK', 'black'], ['Navy Blue', 'navy_blue'], ['Navy', 'navy_blue'],
    ['Off White', 'cream'], ['Off-White', 'cream'], ['White', 'white'], ['Ivory', 'cream'], ['Grey Melange', 'grey'], ['Gray', 'grey'],
    ['Olive Green', 'olive_green'], ['Maroon', 'maroon'], ['Burgundy', 'burgundy'], ['Sky Blue', 'sky'], ['Mustard', 'amber'], ['Rust', 'flame'],
    ['Khaki', 'beige'], ['Charcoal', 'charcoal'], ['Brown', 'brown'], ['Red', 'ruby'], ['Lavender', 'violet'],
  ])('%s -> %s', (name, id) => expect(colorFromName(name)).toBe(id));

  it('returns null for an unknown word', () => expect(colorFromName('Foliage')).toBeNull());
  it('returns null for empty', () => expect(colorFromName('')).toBeNull());
  it('uses the first colour word in a compound name', () => expect(colorFromName('Beige / Brown')).toBe('beige'));
});

describe('pickColor', () => {
  it('uses the colour the page gives', () => expect(pickColor('Light Beige', 'Linen trousers')).toBe('beige'));
  it('falls back to the title when the page gives none', () =>
    expect(pickColor('', "Men's Navy Blue Oversized Joggers")).toBe('navy_blue'));
  it('reads olive from the title', () => expect(pickColor('', 'Double Cuff Olive Shirt')).toBe('olive_green'));
  it('ignores a page colour that lists every variant and uses the title', () =>
    expect(pickColor('Black, Blue, Grey, Olive', 'Double Cuff Olive Shirt')).toBe('olive_green'));
  it('ignores a variant list and returns nothing when the title has no colour', () =>
    expect(pickColor('Black / Blue / Grey', 'Double Cuff Shirt')).toBeNull());
  it('does not read colour from brand names', () => {
    expect(pickColor('', 'Red Tape Men Sneakers')).toBeNull();
    expect(pickColor('', 'Blackberrys Slim Trousers')).toBeNull();
    expect(pickColor('', 'Black Berrys Formal Shirt')).toBeNull();
    expect(pickColor('', 'Blue Tokai Mug')).toBeNull();
  });
  it('does not read stone-washed as a stone colour', () => expect(pickColor('', 'Stone Washed Jeans')).toBeNull());
  it('returns null when nothing names a colour', () => expect(pickColor('', 'H&M Loose Jeans')).toBeNull());
});
