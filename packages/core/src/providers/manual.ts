/**
 * Manual mode ($0 API fee): the customer sends money to the merchant's own wallet number,
 * then submits a transaction ID. The merchant confirms in their dashboard.
 *
 * Core only creates the instructions and remembers recent payments in memory (per process) so
 * a double-tapped Pay button returns the same payment. Proof, confirmation and persistence
 * belong to the app's database (the `payments` table with a UNIQUE reference_id).
 */
import { DEFAULT_EXPIRY_HOURS } from '../constants';
import { SomPayError } from '../errors';
import { normalizePhone, toNationalNumber } from '../phone';
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  ManualInstructions,
  MobileWallet,
  PaymentProvider,
  PaymentStatus,
} from '../types';
import { buildUssdCode, ussdLink } from '../ussd';
import { MOBILE_WALLETS, isMobileWallet } from '../wallets';

export interface ManualProviderOptions {
  /** The merchant's own wallet numbers, e.g. `{ evc: '612345678' }`. Leave a wallet out to hide it. */
  merchantNumbers: Partial<Record<MobileWallet, string>>;
  /** Unconfirmed payments expire after this many hours. Default 24. */
  expiryHours?: number;
  /** How many recent payments to remember for idempotency. Default 1000. */
  maxTracked?: number;
  /** Current time in ms. For tests. */
  now?: () => number;
}

export interface ManualProvider extends PaymentProvider {
  readonly id: 'manual';
  /** Wallets the merchant has a number for, in display order. */
  readonly wallets: readonly MobileWallet[];
}

interface TrackedPayment {
  fingerprint: string;
  createdAt: number;
  result: CreatePaymentResult;
}

function fingerprint(input: CreatePaymentInput): string {
  return [input.orderId, input.amount, input.currency, input.wallet, input.payerPhone].join('|');
}

export function createManualProvider(options: ManualProviderOptions): ManualProvider {
  const expiryHours = options.expiryHours ?? DEFAULT_EXPIRY_HOURS;
  if (!Number.isFinite(expiryHours) || expiryHours <= 0) {
    throw new SomPayError('CONFIG_ERROR', 'expiryHours must be a positive number');
  }
  const maxTracked = options.maxTracked ?? 1000;
  const now = options.now ?? Date.now;
  const expiryMs = expiryHours * 60 * 60 * 1000;

  const numbers = new Map<MobileWallet, string>();
  for (const [wallet, raw] of Object.entries(options.merchantNumbers ?? {})) {
    if (raw === undefined || raw === '') continue;
    if (!isMobileWallet(wallet)) {
      throw new SomPayError('CONFIG_ERROR', `merchantNumbers has an unknown wallet: ${wallet}`);
    }
    const national = toNationalNumber(raw);
    if (national === null) {
      throw new SomPayError(
        'CONFIG_ERROR',
        `merchantNumbers.${wallet} is not a valid Somali number`,
      );
    }
    numbers.set(wallet, national);
  }
  if (numbers.size === 0) {
    throw new SomPayError('CONFIG_ERROR', 'merchantNumbers needs at least one wallet number');
  }

  const tracked = new Map<string, TrackedPayment>();

  function currentStatus(payment: TrackedPayment): PaymentStatus {
    return now() - payment.createdAt >= expiryMs ? 'expired' : payment.result.status;
  }

  return {
    id: 'manual',
    wallets: MOBILE_WALLETS.filter((wallet) => numbers.has(wallet)),

    async createPayment(input) {
      const existing = tracked.get(input.referenceId);
      if (existing) {
        if (existing.fingerprint !== fingerprint(input)) {
          throw new SomPayError('DUPLICATE_REFERENCE');
        }
        return { ...existing.result, status: currentStatus(existing) };
      }

      const merchantNumber = isMobileWallet(input.wallet) ? numbers.get(input.wallet) : undefined;
      if (merchantNumber === undefined || !isMobileWallet(input.wallet)) {
        throw new SomPayError('WALLET_NOT_SUPPORTED');
      }
      if (normalizePhone(input.payerPhone) === null) {
        throw new SomPayError('INVALID_NUMBER');
      }

      const ussdCode = buildUssdCode(input.wallet, merchantNumber, input.amount);
      const instructions: ManualInstructions = {
        wallet: input.wallet,
        number: merchantNumber,
        amount: input.amount,
        currency: input.currency,
        ussdCode,
        ussdLink: ussdCode === null ? null : ussdLink(ussdCode),
      };
      const result: CreatePaymentResult = {
        referenceId: input.referenceId,
        status: 'awaiting_proof',
        instructions,
      };

      tracked.set(input.referenceId, { fingerprint: fingerprint(input), createdAt: now(), result });
      if (tracked.size > maxTracked) {
        const oldest = tracked.keys().next().value;
        if (oldest !== undefined) tracked.delete(oldest);
      }
      return { ...result };
    },

    async checkStatus(referenceId) {
      const payment = tracked.get(referenceId);
      if (!payment) throw new SomPayError('NOT_FOUND');
      return currentStatus(payment);
    },
  };
}
