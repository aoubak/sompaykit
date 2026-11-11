/**
 * USSD codes for manual mode: the customer taps "Dial to pay" and their phone opens the dialler
 * with the merchant number and amount filled in. Patterns live in constants.ts (VERIFY).
 */
import { formatAmountPlain, isValidAmount } from './amount';
import { USSD_PATTERNS } from './constants';
import { toNationalNumber } from './phone';
import type { MobileWallet } from './types';

/**
 * `('evc', '612345678', 18)` → `*712*612345678*18#`.
 * Returns null if the wallet has no known pattern or the number or amount is invalid.
 */
export function buildUssdCode(
  wallet: MobileWallet,
  merchantNumber: string,
  amount: number,
): string | null {
  const pattern = USSD_PATTERNS[wallet];
  const national = toNationalNumber(merchantNumber);
  if (pattern === undefined || national === null || !isValidAmount(amount)) return null;
  return pattern.replace('{number}', national).replace('{amount}', formatAmountPlain(amount));
}

/** `*712*612345678*18#` → `tel:*712*612345678*18%23` (`#` must be encoded in a URI). */
export function ussdLink(code: string): string {
  return `tel:${code.replace(/#/g, '%23')}`;
}
