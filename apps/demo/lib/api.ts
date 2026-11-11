// Browser → demo API (server/api.ts). Payment calls go through @sompaykit/react's hooks.
import { isErrorCode, isPaymentStatus, type Currency, type PaymentStatus } from '@sompaykit/core';
import { PaymentRequestError } from '@sompaykit/react';
import type { CartLine } from '~/server/catalog';

export interface CreatedOrder {
  orderId: string;
  /** Server-calculated. */
  total: number;
  currency: Currency;
}

async function post(path: string, body: unknown, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    ...(signal && { signal }),
  });
  const json: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const code = (json as { errorCode?: unknown } | null)?.errorCode;
    throw new PaymentRequestError(isErrorCode(code) ? code : 'PROVIDER_ERROR');
  }
  return json;
}

export async function createOrder(lines: CartLine[], signal?: AbortSignal): Promise<CreatedOrder> {
  const json = (await post('/api/orders', { lines }, signal)) as Partial<CreatedOrder> | null;
  if (!json || typeof json.orderId !== 'string' || typeof json.total !== 'number') {
    throw new PaymentRequestError('PROVIDER_ERROR');
  }
  return { orderId: json.orderId, total: json.total, currency: json.currency ?? 'USD' };
}

/** Sends the transaction ID; resolves to the new status (`awaiting_confirmation`). */
export async function sendProof(
  referenceId: string,
  transactionId: string,
): Promise<PaymentStatus> {
  const json = (await post('/api/pay/proof', { referenceId, transactionId })) as {
    status?: unknown;
  } | null;
  if (!json || !isPaymentStatus(json.status)) throw new PaymentRequestError('PROVIDER_ERROR');
  return json.status;
}
