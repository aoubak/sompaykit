/** Builds the API settings from environment variables (Cloudflare `env` or Node `process.env`). */
import type { MobileWallet } from '@sompaykit/core';
import type { ApiEnv } from './api.ts';
import type { Store } from './store.ts';

export type EnvVars = Readonly<Record<string, string | undefined>>;

/**
 * Placeholder numbers, used when no DEMO_*_NUMBER is set. "Dial to pay" stays off with these:
 * never invite visitors to send money to a number we don't own.
 */
const PLACEHOLDER_NUMBERS: Readonly<Record<MobileWallet, string>> = {
  evc: '610000001',
  zaad: '630000001',
  sahal: '900000001',
  edahab: '620000001',
};

const WALLET_VARS: Readonly<Record<MobileWallet, string>> = {
  evc: 'DEMO_EVC_NUMBER',
  zaad: 'DEMO_ZAAD_NUMBER',
  sahal: 'DEMO_SAHAL_NUMBER',
  edahab: 'DEMO_EDAHAB_NUMBER',
};

export function apiEnvFrom(vars: EnvVars, store: Store): ApiEnv {
  // Your own numbers if any are set (only those wallets are offered), else all placeholders.
  const own: Partial<Record<MobileWallet, string>> = {};
  for (const wallet of Object.keys(WALLET_VARS) as MobileWallet[]) {
    const value = vars[WALLET_VARS[wallet]]?.trim();
    if (value) own[wallet] = value;
  }
  const ownNumbers = Object.keys(own).length > 0;
  const merchantNumbers = ownNumbers ? own : { ...PLACEHOLDER_NUMBERS };
  const confirmAfter = Number(vars.DEMO_CONFIRM_AFTER_MS ?? '');
  return {
    store,
    merchantNumbers,
    allowDial: ownNumbers && vars.DEMO_ALLOW_DIAL === '1',
    confirmAfterMs: Number.isFinite(confirmAfter) && confirmAfter >= 0 ? confirmAfter : 6000,
  };
}
