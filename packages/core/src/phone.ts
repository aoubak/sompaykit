/**
 * Somali phone numbers. The normalized form is digits only with the country code:
 * `252612345678`. A phone number is personal data: log it only through `maskPhone`.
 */
import { NATIONAL_NUMBER_LENGTHS, SOMALIA_CODE } from './constants';

/** Arabic-Indic (٠-٩) and Eastern Arabic / Persian (۰-۹) digits → ASCII. */
function toAsciiDigits(input: string): string {
  return input.replace(/[٠-٩۰-۹]/g, (ch) => {
    const code = ch.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  });
}

/**
 * Accepts the ways people type a Somali number: `+252 61 234 5678`, `00252…`, `252…`,
 * `061 234 5678` or `61 234 5678`. Spaces, dashes, dots and brackets are ignored.
 * Returns `252XXXXXXXXX`, or null if the input isn't a valid Somali number.
 */
export function normalizePhone(input: string): string | null {
  if (typeof input !== 'string') return null;
  const compact = toAsciiDigits(input.trim()).replace(/[\s().\-‎‏]/g, '');

  let digits: string;
  if (/^\+\d+$/.test(compact)) {
    digits = compact.slice(1);
  } else if (/^00\d+$/.test(compact)) {
    digits = compact.slice(2);
  } else if (/^\d+$/.test(compact)) {
    const hasCountryCode =
      compact.startsWith(SOMALIA_CODE) &&
      NATIONAL_NUMBER_LENGTHS.includes(compact.length - SOMALIA_CODE.length);
    digits = hasCountryCode ? compact : `${SOMALIA_CODE}${compact.replace(/^0/, '')}`;
  } else {
    return null;
  }

  if (!digits.startsWith(SOMALIA_CODE)) return null;
  const national = digits.slice(SOMALIA_CODE.length);
  if (!/^[1-9]\d*$/.test(national) || !NATIONAL_NUMBER_LENGTHS.includes(national.length)) {
    return null;
  }
  return digits;
}

export function isValidPhone(input: string): boolean {
  return normalizePhone(input) !== null;
}

/** `252612345678` → `612345678`: the local form shown to customers and used in USSD codes. */
export function toNationalNumber(input: string): string | null {
  const normalized = normalizePhone(input);
  return normalized === null ? null : normalized.slice(SOMALIA_CODE.length);
}

/** `252612345678` → `252 61 *** 5678`: enough to recognise, not enough to reuse. */
export function maskPhone(input: string): string {
  const national = toNationalNumber(input);
  if (national === null) return '***';
  return `${SOMALIA_CODE} ${national.slice(0, 2)} *** ${national.slice(-4)}`;
}
