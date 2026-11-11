/**
 * Browser → your server. The hooks never talk to a payment gateway: they call your own API
 * routes, which hold the gateway keys and call `sompay.charge()` / `sompay.status()`.
 *
 * Contract for the default (URL) transport:
 * - charge: `POST <url>` with JSON `ChargeRequestBody` → 200 `ClientPaymentResult`
 * - status: `GET <url>?referenceId=…` → 200 `StatusResponse`
 * - errors: any non-2xx with JSON `{ errorCode }` (an `ErrorCode`)
 */
import {
  isErrorCode,
  isPaymentStatus,
  type ClientPaymentResult,
  type ErrorCode,
  type PaymentStatus,
  type Wallet,
} from '@sompaykit/core';

/** What the customer chose. There is no amount on purpose: your server calculates the total. */
export interface PayRequest {
  phone: string;
  wallet?: Wallet;
  /** Your order or cart ID, so the server can look up the total. */
  orderId?: string;
  /** Shown to the merchant with the order. Trimmed; empty values are left out. */
  customerName?: string;
}

export interface ChargeRequestBody extends PayRequest {
  /** Unique per payment attempt; the same value on a resend returns the same payment. */
  referenceId: string;
}

export interface StatusResponse {
  status: PaymentStatus;
  /** Set when status is `failed`. */
  errorCode?: ErrorCode;
}

export type ChargeFn = (
  body: ChargeRequestBody,
  signal: AbortSignal,
) => Promise<ClientPaymentResult>;
export type StatusFn = (referenceId: string, signal: AbortSignal) => Promise<StatusResponse>;

export interface TransportOptions {
  /** Defaults to the global `fetch`. */
  fetch?: typeof fetch;
  /** Extra request headers, e.g. a CSRF token. */
  headers?: Record<string, string>;
  /** Give up on a request after this many ms. Default 30 000 (slow mobile data). */
  timeoutMs?: number;
}

export const DEFAULT_TIMEOUT_MS = 30_000;

/** Thrown by the transports. `code` is always an `ErrorCode` you can pass to `message()`. */
export class PaymentRequestError extends Error {
  override readonly name = 'PaymentRequestError';
  constructor(readonly code: ErrorCode) {
    super(code);
  }
}

/** Any thrown value → an `ErrorCode`. Unknown failures count as connection problems. */
export function toErrorCode(error: unknown): ErrorCode {
  if (error instanceof PaymentRequestError) return error.code;
  if (typeof error === 'object' && error !== null && 'code' in error && isErrorCode(error.code)) {
    return error.code;
  }
  return 'NETWORK_ERROR';
}

function withTimeout(signal: AbortSignal, timeoutMs: number): AbortSignal {
  if (typeof AbortSignal.any === 'function' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]);
  }
  // Older Android browsers (before 2024) lack AbortSignal.any.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  signal.addEventListener(
    'abort',
    () => {
      clearTimeout(timer);
      controller.abort();
    },
    { once: true },
  );
  return controller.signal;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function errorCodeOf(body: unknown): ErrorCode | null {
  if (typeof body !== 'object' || body === null || !('errorCode' in body)) return null;
  return isErrorCode(body.errorCode) ? body.errorCode : null;
}

async function request(
  url: string,
  init: RequestInit,
  signal: AbortSignal,
  options: TransportOptions,
): Promise<unknown> {
  const fetchFn = options.fetch ?? globalThis.fetch;
  let response: Response;
  try {
    response = await fetchFn(url, {
      ...init,
      headers: { Accept: 'application/json', ...init.headers, ...options.headers },
      signal: withTimeout(signal, options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });
  } catch (error) {
    // Let a caller's own abort (unmount, reset) propagate untouched.
    if (signal.aborted) throw error;
    throw new PaymentRequestError('NETWORK_ERROR');
  }

  const body = await readJson(response);
  if (!response.ok) {
    throw new PaymentRequestError(errorCodeOf(body) ?? 'PROVIDER_ERROR');
  }
  return body;
}

function isClientResult(body: unknown): body is ClientPaymentResult {
  return (
    typeof body === 'object' &&
    body !== null &&
    'referenceId' in body &&
    typeof body.referenceId === 'string' &&
    'status' in body &&
    isPaymentStatus(body.status)
  );
}

/** Default charge transport: `POST url` with a JSON body. */
export function chargeViaUrl(url: string, options: TransportOptions = {}): ChargeFn {
  return async (body, signal) => {
    const json = await request(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      signal,
      options,
    );
    if (!isClientResult(json)) throw new PaymentRequestError('PROVIDER_ERROR');
    return json;
  };
}

/** Default status transport: `GET url?referenceId=…`. */
export function statusViaUrl(url: string, options: TransportOptions = {}): StatusFn {
  return async (referenceId, signal) => {
    const separator = url.includes('?') ? '&' : '?';
    const json = await request(
      `${url}${separator}referenceId=${encodeURIComponent(referenceId)}`,
      { method: 'GET' },
      signal,
      options,
    );
    if (typeof json !== 'object' || json === null || !('status' in json)) {
      throw new PaymentRequestError('PROVIDER_ERROR');
    }
    if (!isPaymentStatus(json.status)) throw new PaymentRequestError('PROVIDER_ERROR');
    const errorCode = errorCodeOf(json);
    return errorCode === null ? { status: json.status } : { status: json.status, errorCode };
  };
}

function randomHex(bytes: number): string {
  const values = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(values, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** `spk_` + 32 random hex characters. Fits core's referenceId rule (1–64 URL-safe chars). */
export function createReferenceId(): string {
  return `spk_${randomHex(16)}`;
}
