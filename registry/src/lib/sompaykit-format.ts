/** Display helpers for SomPayKit components. Numbers always use Latin digits, as on receipts. */
import { toNationalNumber, type Currency } from '@sompaykit/core';

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const plain = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

/** `18` → `$18.00`; `18000` SLSH → `18,000 SLSH`. */
export function formatMoney(amount: number, currency: Currency): string {
  return currency === 'USD' ? usd.format(amount) : `${plain.format(amount)} ${currency}`;
}

/** Any Somali number → `61 234 5678` (local form, grouped). Unknown input is returned as typed. */
export function formatPhone(phone: string): string {
  const national = toNationalNumber(phone);
  if (national === null) return phone;
  return national.length === 9
    ? `${national.slice(0, 2)} ${national.slice(2, 5)} ${national.slice(5)}`
    : `${national.slice(0, 2)} ${national.slice(2, 4)} ${national.slice(4)}`;
}
