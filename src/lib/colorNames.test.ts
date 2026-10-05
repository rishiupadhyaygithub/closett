import { describe, it, expect } from 'vitest';
import { colorFromName } from './colorNames';

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
