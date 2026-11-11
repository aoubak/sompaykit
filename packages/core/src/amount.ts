/** Amount checks shared by charge() and USSD codes. Amounts are decimals, e.g. 18 or 18.5. */

const MAX_AMOUNT = 1_000_000;

/** Positive, finite, at most 2 decimal places, at most 1,000,000. */
export function isValidAmount(amount: unknown): amount is number {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return false;
  if (amount <= 0 || amount > MAX_AMOUNT) return false;
  // Compare in cents to avoid floating point surprises (e.g. 0.1 + 0.2).
  const cents = amount * 100;
  return Math.abs(cents - Math.round(cents)) < 1e-6;
}

/** Shortest plain form: 18 → "18", 18.5 → "18.5", 18.25 → "18.25". */
export function formatAmountPlain(amount: number): string {
  return String(Math.round(amount * 100) / 100);
}
