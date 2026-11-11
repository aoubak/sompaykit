/**
 * Wallet metadata and prefix-based detection. Detection is a suggestion only (numbers can be
 * ported between operators), so UIs must always let the customer pick another wallet.
 */
import { SOMALIA_CODE, WALLET_PREFIXES } from './constants';
import { normalizePhone } from './phone';
import type { MobileWallet, Wallet } from './types';

export interface WalletInfo {
  id: Wallet;
  /** Brand name, same in every language. */
  name: string;
  /** Mobile operator behind the wallet, or null for cards. */
  operator: string | null;
  /** Short label for a logo placeholder. */
  short: string;
}

export const WALLETS: Readonly<Record<Wallet, WalletInfo>> = {
  evc: { id: 'evc', name: 'EVC Plus', operator: 'Hormuud', short: 'EVC' },
  zaad: { id: 'zaad', name: 'Zaad', operator: 'Telesom', short: 'ZD' },
  sahal: { id: 'sahal', name: 'Sahal', operator: 'Golis', short: 'SH' },
  edahab: { id: 'edahab', name: 'eDahab', operator: 'Somtel', short: 'eD' },
  card: { id: 'card', name: 'Card', operator: null, short: 'Card' },
};

export const MOBILE_WALLETS: readonly MobileWallet[] = ['evc', 'zaad', 'sahal', 'edahab'];

export function isWallet(value: unknown): value is Wallet {
  return typeof value === 'string' && Object.hasOwn(WALLETS, value);
}

export function isMobileWallet(value: unknown): value is MobileWallet {
  return typeof value === 'string' && (MOBILE_WALLETS as readonly string[]).includes(value);
}

export function getWallet(id: Wallet): WalletInfo {
  return WALLETS[id];
}

/** Suggests a wallet from the number's prefix, or null if the number or prefix is unknown. */
export function detectWallet(phone: string): MobileWallet | null {
  const normalized = normalizePhone(phone);
  if (normalized === null) return null;
  const prefix = normalized.slice(SOMALIA_CODE.length, SOMALIA_CODE.length + 2);
  return WALLET_PREFIXES[prefix] ?? null;
}
