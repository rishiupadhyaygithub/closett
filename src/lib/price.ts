/**
 * Normalise a scraped price string to digits with an optional decimal point.
 * Handles "₹1,299.00", "₹1,29,999", "1.299" (thousands dot), "12,50" (decimal comma).
 */
export function cleanPrice(raw: string): string {
  let s = raw.replace(/[^\d.,]/g, '').replace(/^[.,]+|[.,]+$/g, '');
  if (!/\d/.test(s)) return '';

  const hasComma = s.includes(',');
  const hasDot = s.includes('.');

  if (hasComma && hasDot) {
    const decimalIsDot = s.lastIndexOf('.') > s.lastIndexOf(',');
    s = decimalIsDot ? s.replace(/,/g, '') : s.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    const last = s.lastIndexOf(',');
    const lastGroup = s.slice(last + 1);
    s = lastGroup.length === 3
      ? s.replace(/,/g, '')                                        // 1,299 / 1,29,999 → thousands
      : s.slice(0, last).replace(/,/g, '') + '.' + lastGroup;      // 12,50 → decimal comma
  } else if (hasDot && /^[1-9]\d{0,2}(\.\d{3})+$/.test(s)) { // a thousands group never starts with 0 (0.001 is a decimal)
    s = s.replace(/\./g, '');
  }
  return s;
}

const MAX_PRICE = 1_000_000_000;

/** Number for a price typed or pasted into the form. Anything unusable (text, negative, absurd) is 0. */
export function parsePriceInput(raw: string): number {
  const text = raw.trim();
  if (text.startsWith('-')) return 0;
  const n = parseFloat(cleanPrice(text));
  if (!Number.isFinite(n) || n < 0) return 0;
  const rounded = Math.round(n * 100) / 100;
  return rounded > MAX_PRICE ? 0 : rounded;
}
