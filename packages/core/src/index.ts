/**
 * @sompaykit/core — accept EVC Plus, Zaad, Sahal and eDahab in any TypeScript app.
 * Server-side only for automatic providers: never ship gateway credentials to the browser.
 */
import { isValidAmount } from './amount';
import { REFERENCE_ID_PATTERN, SUPPORTED_CURRENCIES } from './constants';
import { DEFAULT_LOCALE, SomPayError, message } from './errors';
import { normalizePhone } from './phone';
import { createManualProvider, type ManualProviderOptions } from './providers/manual';
import { createSifaloPayProvider, type SifaloPayProviderOptions } from './providers/sifalopay';
import { createWaafiPayProvider, type WaafiPayProviderOptions } from './providers/waafipay';
import type {
  CheckoutInput,
  CheckoutResult,
  CreatePaymentResult,
  Currency,
  ErrorCode,
  HostedCheckoutProvider,
  Locale,
  PaymentProvider,
  PaymentStatus,
  ProviderId,
  VerifyInput,
  VerifyResult,
  Wallet,
} from './types';
import { detectWallet, isWallet } from './wallets';

export type SomPayConfig =
  | ({ provider: 'manual' } & ManualProviderOptions)
  | ({ provider: 'waafipay' } & WaafiPayProviderOptions)
  | ({ provider: 'sifalopay' } & SifaloPayProviderOptions);

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
  readonly provider: ProviderId;
  /**
   * Starts a payment from a phone number (manual and PIN-prompt providers). Throws `SomPayError`
   * for bad input (phone, amount, wallet…) before any payment is attempted; payment outcomes
   * (declined, timeout…) come back in the result.
   */
  charge(input: ChargeInput): Promise<CreatePaymentResult>;
  status(referenceId: string): Promise<PaymentStatus>;
  /**
   * Payment page (SifaloPay): returns the URL to send the buyer to. Throws `SomPayError` for
   * bad input and when the gateway can't start the session.
   */
  checkout(input: CheckoutInput): Promise<CheckoutResult>;
  /**
   * Payment page: asks the gateway for the real state of a payment. Call it on the return URL
   * and in your webhook, and unlock the order only when `status` is `paid`. Pass the order's
   * `amount` from your database. Throws `SomPayError` when the gateway can't be reached: the
   * state is then unknown, so try again later.
   */
  verify(input: VerifyInput): Promise<VerifyResult>;
  detectWallet(phone: string): Wallet | null;
  normalizePhone(phone: string): string | null;
  message(code: ErrorCode | string, locale?: Locale): string;
}

type AnyProvider = PaymentProvider | HostedCheckoutProvider;

function createProvider(config: SomPayConfig): AnyProvider {
  switch (config.provider) {
    case 'manual':
      return createManualProvider(config);
    case 'waafipay':
      return createWaafiPayProvider(config);
    case 'sifalopay':
      return createSifaloPayProvider(config);
    default: {
      const unknown: never = config;
      throw new SomPayError(
        'CONFIG_ERROR',
        `Unknown provider: ${String((unknown as { provider?: unknown }).provider)}`,
      );
    }
  }
}

/** The provider as a phone-number provider, or METHOD_NOT_SUPPORTED. */
function phonePayments(provider: AnyProvider): PaymentProvider {
  if ('createPayment' in provider) return provider;
  throw new SomPayError(
    'METHOD_NOT_SUPPORTED',
    `${provider.id} is a payment page: use checkout() and verify(), not charge() and status()`,
  );
}

/** The provider as a payment-page provider, or METHOD_NOT_SUPPORTED. */
function paymentPage(provider: AnyProvider): HostedCheckoutProvider {
  if ('createCheckout' in provider) return provider;
  throw new SomPayError(
    'METHOD_NOT_SUPPORTED',
    `${provider.id} has no payment page: use charge() and status(), not checkout() and verify()`,
  );
}

export function createSomPay(config: SomPayConfig): SomPay {
  const provider = createProvider(config);

  return {
    provider: provider.id,

    async checkout(input) {
      const page = paymentPage(provider);
      if (typeof input.orderId !== 'string' || !REFERENCE_ID_PATTERN.test(input.orderId)) {
        throw new SomPayError('INVALID_REFERENCE', 'Missing or invalid orderId');
      }
      if (!isValidAmount(input.amount)) throw new SomPayError('INVALID_AMOUNT');
      if (!SUPPORTED_CURRENCIES.includes(input.currency)) {
        throw new SomPayError('INVALID_CURRENCY');
      }
      return page.createCheckout(input);
    },

    async verify(input) {
      const page = paymentPage(provider);
      if (input.amount !== undefined && !isValidAmount(input.amount)) {
        throw new SomPayError('INVALID_AMOUNT');
      }
      return page.verifyPayment(input);
    },

    async charge(input) {
      const phone = phonePayments(provider);
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

      return phone.createPayment({
        orderId: input.orderId ?? input.referenceId,
        referenceId: input.referenceId,
        amount: input.amount,
        currency: input.currency,
        payerPhone,
        wallet,
        description: input.description ?? '',
      });
    },

    async status(referenceId) {
      return phonePayments(provider).checkStatus(referenceId);
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
export { createSifaloPayProvider, type SifaloPayProviderOptions } from './providers/sifalopay';
export type {
  CheckoutInput,
  CheckoutResult,
  CreatePaymentInput,
  CreatePaymentResult,
  Currency,
  ErrorCode,
  HostedCheckoutProvider,
  Locale,
  ManualInstructions,
  MobileWallet,
  PaymentProvider,
  PaymentStatus,
  ProviderId,
  VerifyInput,
  VerifyResult,
  Wallet,
} from './types';
