/** Helpers for `PaymentStatus` values and for sending payment results to a browser. */
import type { CreatePaymentResult, PaymentStatus } from './types';

export const PAYMENT_STATUSES: readonly PaymentStatus[] = [
  'pending',
  'awaiting_proof',
  'awaiting_confirmation',
  'paid',
  'failed',
  'expired',
];

const FINAL_STATUSES: readonly PaymentStatus[] = ['paid', 'failed', 'expired'];

export function isPaymentStatus(value: unknown): value is PaymentStatus {
  return typeof value === 'string' && (PAYMENT_STATUSES as readonly string[]).includes(value);
}

/** `paid`, `failed` and `expired` never change again, so stop polling. */
export function isFinalStatus(status: PaymentStatus): boolean {
  return FINAL_STATUSES.includes(status);
}

/** A payment result without `raw` (the gateway response): safe to send to the browser. */
export type ClientPaymentResult = Omit<CreatePaymentResult, 'raw'>;

/**
 * Drops `raw` before you return a charge result from your API route. Keep `raw` in your database
 * for disputes; customers never need it.
 */
export function toClientResult(result: CreatePaymentResult): ClientPaymentResult {
  const { raw: _raw, ...rest } = result;
  return rest;
}
