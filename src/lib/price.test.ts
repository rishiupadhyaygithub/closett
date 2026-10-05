import { describe, it, expect } from 'vitest';
import { cleanPrice } from './price';

describe('cleanPrice', () => {
  it('plain number', () => expect(cleanPrice('1299')).toBe('1299'));
  it('indian commas with decimals', () => expect(cleanPrice('₹1,299.00')).toBe('1299.00'));
  it('indian lakh grouping', () => expect(cleanPrice('₹1,29,999')).toBe('129999'));
  it('keeps a real decimal', () => expect(cleanPrice('499.50')).toBe('499.50'));
  it('does not inflate three decimals', () => expect(cleanPrice('1299.500')).toBe('1299.500'));
  it('european thousands dot', () => expect(cleanPrice('1.299')).toBe('1299'));
  it('european decimal comma', () => expect(cleanPrice('12,50')).toBe('12.50'));
  it('strips symbols and spaces', () => expect(cleanPrice('Rs. 799 /-')).toBe('799'));
  it('empty when no digits', () => expect(cleanPrice('free')).toBe(''));
});

import { parsePriceInput } from './price';

describe('parsePriceInput', () => {
  it('pasted rupee price', () => expect(parsePriceInput('₹1,299')).toBe(1299));
  it('decimals', () => expect(parsePriceInput('499.50')).toBe(499.5));
  it('empty is 0', () => expect(parsePriceInput('')).toBe(0));
  it('text is 0', () => expect(parsePriceInput('free')).toBe(0));
  it('negative is 0, not silently positive', () => expect(parsePriceInput('-50')).toBe(0));
  it('rounds to 2 decimals', () => expect(parsePriceInput('0.001')).toBe(0));
  it('caps absurd values', () => expect(parsePriceInput('9'.repeat(30))).toBe(0));
});

describe('cleanPrice leading zero', () => {
  it('0.500 stays a decimal, not 0500', () => expect(cleanPrice('0.500')).toBe('0.500'));
  it('1.299 is still a thousands dot', () => expect(cleanPrice('1.299')).toBe('1299'));
});
