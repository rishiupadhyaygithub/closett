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
  } else if (hasDot && /^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '');
  }
  return s;
}
