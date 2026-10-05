/** "₹1,299", "AED 399", or "No price". Unknown or empty currency codes fall back to INR instead of throwing. */
export function formatPrice(price: number, currency: string): string {
  if (!price) return 'No price';
  const code = /^[A-Z]{3}$/.test(currency) ? currency : 'INR';
  const options = { style: 'currency' as const, minimumFractionDigits: Number.isInteger(price) ? 0 : 2, maximumFractionDigits: 2 };
  try {
    return new Intl.NumberFormat('en-IN', { ...options, currency: code }).format(price);
  } catch {
    return new Intl.NumberFormat('en-IN', { ...options, currency: 'INR' }).format(price);
  }
}
