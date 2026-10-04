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
