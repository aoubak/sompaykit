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
  | 'METHOD_NOT_SUPPORTED'
  | 'CONFIG_ERROR'
  // Payment page: the gateway says "paid" but for a different amount than the order
  | 'AMOUNT_MISMATCH';

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

/** Manual and PIN-prompt providers: the customer pays from a phone number. */
export interface PaymentProvider {
  readonly id: ProviderId;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  checkStatus(referenceId: string): Promise<PaymentStatus>;
}

/** Input for a payment page (hosted checkout). No phone number: the buyer picks on the page. */
export interface CheckoutInput {
  /** Your order ID. Added to `returnUrl` as `order_id` so you know which order came back. */
  orderId: string;
  /** Server-calculated. Never pass a total sent by the browser. */
  amount: number;
  currency: Currency;
  /** Where the buyer lands after paying. The gateway adds the payment's `sid` to it. */
  returnUrl: string;
  /** Server URL the gateway calls after payment. Its body is not signed: always call `verify`. */
  webhookUrl: string;
}

export interface CheckoutResult {
  /** Send the buyer here to pay. */
  redirectUrl: string;
  /** Raw gateway response. Never shown to customers. */
  raw?: unknown;
}

/** Give `sid` (from the return URL or webhook). `orderId` is the fallback when there is no sid. */
export interface VerifyInput {
  sid?: string;
  orderId?: string;
  /**
   * The order's amount from your database. Pass it every time: a payment for a different
   * amount then comes back as `failed` with `AMOUNT_MISMATCH`.
   */
  amount?: number;
}

export interface VerifyResult {
  /** `paid` only when the gateway confirms it and every check passes. */
  status: Extract<PaymentStatus, 'paid' | 'pending' | 'failed'>;
  /** The gateway's payment ID. Store it with a unique constraint so it can't unlock two orders. */
  sid: string | null;
  amount: number | null;
  currency: string | null;
  /** How the buyer paid, as the gateway names it (wallet or card). */
  paymentType: string | null;
  /** Set when status is `failed`. Turn it into text with `message(code, locale)`. */
  errorCode?: ErrorCode;
  /** The gateway's own text, for logs. Never shown to customers. */
  detail?: string;
  /** Raw gateway response, for disputes. Never shown to customers. */
  raw?: unknown;
}

/** Payment-page providers: send the buyer to `redirectUrl`, then confirm with `verifyPayment`. */
export interface HostedCheckoutProvider {
  readonly id: ProviderId;
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  verifyPayment(input: VerifyInput): Promise<VerifyResult>;
}
