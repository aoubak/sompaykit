/**
 * Shared types for @sompaykit/core. Every provider implements `PaymentProvider`.
 * See docs/PAYMENTS.md for the flows these types describe.
 */

/** Mobile wallets (and cards, via a gateway's hosted page). */
export type Wallet = 'evc' | 'zaad' | 'sahal' | 'edahab' | 'card';

/** Wallets a customer pays from with a phone number. */
export type MobileWallet = Exclude<Wallet, 'card'>;

export type Currency = 'USD' | 'SLSH';

/** UI languages: Somali, English, Arabic. */
export type Locale = 'so' | 'en' | 'ar';

export type ProviderId = 'manual' | 'waafipay' | 'sifalopay';

/**
 * - `pending`: automatic mode, waiting for the customer to enter their PIN
 * - `awaiting_proof`: manual mode, waiting for the customer to pay and send a transaction ID
 * - `awaiting_confirmation`: manual mode, proof sent, waiting for the merchant
 * - `paid`, `failed`, `expired`: final
 */
export type PaymentStatus =
  'pending' | 'awaiting_proof' | 'awaiting_confirmation' | 'paid' | 'failed' | 'expired';

/** Stable error codes. Each has a so/en/ar message in errors.ts. */
export type ErrorCode =
  // Payment outcomes (returned in a result)
  | 'INSUFFICIENT_FUNDS'
  | 'DECLINED'
  | 'CANCELLED'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'PROVIDER_ERROR'
  // Input and setup problems (thrown as SomPayError before any payment is attempted)
  | 'INVALID_NUMBER'
  | 'INVALID_AMOUNT'
  | 'INVALID_CURRENCY'
  | 'INVALID_REFERENCE'
  | 'WALLET_REQUIRED'
  | 'WALLET_NOT_SUPPORTED'
  | 'DUPLICATE_REFERENCE'
  | 'NOT_FOUND'
  | 'NOT_IMPLEMENTED'
  | 'CONFIG_ERROR';

/** What the customer needs to pay by hand in manual mode. */
export interface ManualInstructions {
  wallet: MobileWallet;
  /** Merchant number in local form, e.g. `612345678`. */
  number: string;
  amount: number;
  currency: Currency;
  /** USSD code to dial, e.g. `*712*612345678*18#`, or null if unknown for this wallet. */
  ussdCode: string | null;
  /** `tel:` link for a "Dial to pay" button, or null if unknown for this wallet. */
  ussdLink: string | null;
}

/** Normalized input a provider receives. `createSomPay().charge()` builds it. */
export interface CreatePaymentInput {
  orderId: string;
  /** Unique per payment attempt; repeated calls with the same value are idempotent. */
  referenceId: string;
  /** Server-calculated. Never pass a total sent by the browser. */
  amount: number;
  currency: Currency;
  /** Normalized, e.g. `252612345678`. */
  payerPhone: string;
  wallet: Wallet;
  description: string;
}

export interface CreatePaymentResult {
  referenceId: string;
  status: PaymentStatus;
  providerTxnId?: string;
  /** Manual mode only. */
  instructions?: ManualInstructions;
  /** Set when status is `failed`. Turn it into text with `message(code, locale)`. */
  errorCode?: ErrorCode;
  /** Raw gateway response, for disputes. Never shown to customers. */
  raw?: unknown;
}

export interface PaymentProvider {
  readonly id: ProviderId;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  checkStatus(referenceId: string): Promise<PaymentStatus>;
}
