import { describe, it, expect } from 'vitest';
import { formatPrice } from './money';

describe('formatPrice', () => {
  it('shows "No price" for 0', () => expect(formatPrice(0, 'INR')).toBe('No price'));
  it('formats rupees', () => expect(formatPrice(1299, 'INR')).toContain('1,299'));
  it('formats dirhams without calling them rupees', () => {
    const s = formatPrice(399, 'AED');
    expect(s).toContain('399');
    expect(s).not.toContain('₹');
  });
  it('falls back to INR for an unknown code instead of throwing', () => {
    expect(() => formatPrice(100, 'ZZZZ')).not.toThrow();
    expect(formatPrice(100, 'ZZZZ')).toContain('100');
  });
  it('falls back to INR when currency is empty', () => expect(formatPrice(100, '')).toContain('₹'));
});

describe('formatPrice decimals', () => {
  it('shows two decimals for a non-integer price', () => expect(formatPrice(4999.5, 'INR')).toContain('4,999.50'));
  it('shows no decimals for a whole price', () => expect(formatPrice(1299, 'INR')).not.toContain('.'));
});
