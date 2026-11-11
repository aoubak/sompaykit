/**
 * Every value in this file marked VERIFY comes from docs/PAYMENTS.md and is NOT confirmed yet.
 * Check each one against current provider docs and a live test before v1.0, then remove its
 * TODO. Keep provider facts here so they're easy to update in one place.
 */
import type { Currency, MobileWallet, Wallet } from './types';

/** Somalia's country calling code. */
export const SOMALIA_CODE = '252';

// TODO(VERIFY): national mobile number length after 252. Most numbers are 9 digits
// (61 234 5678); 8 is allowed until we confirm no wallet still issues 8-digit numbers.
export const NATIONAL_NUMBER_LENGTHS: readonly number[] = [8, 9];

// TODO(VERIFY): first two national digits → wallet. Number portability means this is only a
// suggestion: the customer must always be able to pick another wallet.
export const WALLET_PREFIXES: Readonly<Record<string, MobileWallet>> = {
  '61': 'evc',
  '77': 'evc',
  '63': 'zaad',
  '90': 'sahal',
  '62': 'edahab',
  '65': 'edahab',
};

// TODO(VERIFY): USSD "send money" patterns per wallet. Only EVC Plus is documented so far
// (`*712*{number}*{amount}#`). A wallet with no pattern shows the number + Copy button only.
export const USSD_PATTERNS: Readonly<Partial<Record<MobileWallet, string>>> = {
  evc: '*712*{number}*{amount}#',
};

// TODO(VERIFY): currency codes the gateways accept. `SLSH` (Somaliland shilling) is not an
// ISO 4217 code; confirm what WaafiPay and SifaloPay expect.
export const SUPPORTED_CURRENCIES: readonly Currency[] = ['USD', 'SLSH'];

// TODO(VERIFY): wallets each automatic provider supports (per community reports).
export const PROVIDER_WALLETS: Readonly<Record<'waafipay' | 'sifalopay', readonly Wallet[]>> = {
  waafipay: ['evc', 'zaad', 'sahal', 'card'],
  sifalopay: ['evc', 'zaad', 'edahab'],
};

// TODO(VERIFY): WaafiPay API details, against docs.waafipay.com and sandbox testing.
export const WAAFIPAY = {
  endpoints: {
    sandbox: 'https://sandbox.waafipay.net/asm',
    live: 'https://api.waafipay.net/asm',
  },
  schemaVersion: '1.0',
  channelName: 'WEB',
  serviceName: 'API_PURCHASE',
  paymentMethod: 'mwallet_account',
} as const;

/** Product default, not a provider fact: unconfirmed manual orders expire after this. */
export const DEFAULT_EXPIRY_HOURS = 24;

/** Allowed referenceId values: 1–64 URL-safe characters. */
export const REFERENCE_ID_PATTERN = /^[A-Za-z0-9_.:-]{1,64}$/;
