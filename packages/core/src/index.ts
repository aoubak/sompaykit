/**
 * @sompaykit/core — accept EVC Plus, Zaad, Sahal and eDahab in any TypeScript app.
 * Server-side only for automatic providers: never ship gateway credentials to the browser.
 */
import { isValidAmount } from './amount';
import { REFERENCE_ID_PATTERN, SUPPORTED_CURRENCIES } from './constants';
import { DEFAULT_LOCALE, SomPayError, message } from './errors';
import { normalizePhone } from './phone';
import { createManualProvider, type ManualProviderOptions } from './providers/manual';
import { createWaafiPayProvider, type WaafiPayProviderOptions } from './providers/waafipay';
import type {
  CreatePaymentResult,
  Currency,
  ErrorCode,
  Locale,
  PaymentProvider,
  PaymentStatus,
  Wallet,
} from './types';
import { detectWallet, isWallet } from './wallets';

export type SomPayConfig =
  | ({ provider: 'manual' } & ManualProviderOptions)
  | ({ provider: 'waafipay' } & WaafiPayProviderOptions);

export interface ChargeInput {
  /** Unique per payment attempt (1–64 of A-Z a-z 0-9 _ . : -). Reusing it returns the same payment. */
  referenceId: string;
  /** Defaults to referenceId. */
  orderId?: string;
  /** Any common format: `+252 61 234 5678`, `0612345678`, `612345678`. */
  phone: string;
  /** Calculate on the server from your database. Never trust a total sent by the browser. */
  amount: number;
  currency: Currency;
  /** The wallet the customer picked. If left out, it's detected from the phone prefix. */
  wallet?: Wallet;
  description?: string;
}

export interface SomPay {
  readonly provider: PaymentProvider['id'];
  /**
   * Starts a payment. Throws `SomPayError` for bad input (phone, amount, wallet…) before any
   * payment is attempted; payment outcomes (declined, timeout…) come back in the result.
   */
  charge(input: ChargeInput): Promise<CreatePaymentResult>;
  status(referenceId: string): Promise<PaymentStatus>;
  detectWallet(phone: string): Wallet | null;
  normalizePhone(phone: string): string | null;
  message(code: ErrorCode | string, locale?: Locale): string;
}

function createProvider(config: SomPayConfig): PaymentProvider {
  switch (config.provider) {
    case 'manual':
      return createManualProvider(config);
    case 'waafipay':
      return createWaafiPayProvider(config);
    default: {
      const unknown: never = config;
      throw new SomPayError(
        'CONFIG_ERROR',
        `Unknown provider: ${String((unknown as { provider?: unknown }).provider)}`,
      );
    }
  }
}

export function createSomPay(config: SomPayConfig): SomPay {
  const provider = createProvider(config);

  return {
    provider: provider.id,

    async charge(input) {
      if (typeof input.referenceId !== 'string' || !REFERENCE_ID_PATTERN.test(input.referenceId)) {
        throw new SomPayError('INVALID_REFERENCE');
      }
      if (!isValidAmount(input.amount)) throw new SomPayError('INVALID_AMOUNT');
      if (!SUPPORTED_CURRENCIES.includes(input.currency)) {
        throw new SomPayError('INVALID_CURRENCY');
      }
      const payerPhone = normalizePhone(input.phone);
      if (payerPhone === null) throw new SomPayError('INVALID_NUMBER');

      let wallet: Wallet | null;
      if (input.wallet === undefined) {
        wallet = detectWallet(payerPhone);
      } else if (isWallet(input.wallet)) {
        wallet = input.wallet;
      } else {
        throw new SomPayError('WALLET_NOT_SUPPORTED');
      }
      if (wallet === null) throw new SomPayError('WALLET_REQUIRED');

      return provider.createPayment({
        orderId: input.orderId ?? input.referenceId,
        referenceId: input.referenceId,
        amount: input.amount,
        currency: input.currency,
        payerPhone,
        wallet,
        description: input.description ?? '',
      });
    },

    status(referenceId) {
      return provider.checkStatus(referenceId);
    },

    detectWallet,
    normalizePhone,
    message: (code, locale = DEFAULT_LOCALE) => message(code, locale),
  };
}

export { buildUssdCode, ussdLink } from './ussd';
export { isValidPhone, maskPhone, normalizePhone, toNationalNumber } from './phone';
export {
  MOBILE_WALLETS,
  WALLETS,
  detectWallet,
  getWallet,
  isMobileWallet,
  isWallet,
  type WalletInfo,
} from './wallets';
export {
  DEFAULT_LOCALE,
  ERROR_MESSAGES,
  LOCALES,
  SomPayError,
  isErrorCode,
  isSomPayError,
  message,
} from './errors';
export { DEFAULT_EXPIRY_HOURS, SUPPORTED_CURRENCIES } from './constants';
export {
  PAYMENT_STATUSES,
  isFinalStatus,
  isPaymentStatus,
  toClientResult,
  type ClientPaymentResult,
} from './payment-status';
export {
  createManualProvider,
  type ManualProvider,
  type ManualProviderOptions,
} from './providers/manual';
export {
  createWaafiPayProvider,
  type WaafiPayCredentials,
  type WaafiPayProviderOptions,
} from './providers/waafipay';
export type {
  CreatePaymentInput,
  CreatePaymentResult,
  Currency,
  ErrorCode,
  Locale,
  ManualInstructions,
  MobileWallet,
  PaymentProvider,
  PaymentStatus,
  ProviderId,
  Wallet,
} from './types';
