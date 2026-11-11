/**
 * The demo shop's API, as plain `Request → Response` so it runs on Cloudflare Pages Functions,
 * any other Worker runtime, or Node (scripts/dev-api.ts).
 *
 *   POST /api/orders        { lines: [{ productId, quantity }] } → { orderId, total, currency }
 *   POST /api/pay           usePayment() body                     → ClientPaymentResult
 *   GET  /api/pay/status    ?referenceId=…                        → { status, errorCode? }
 *   POST /api/pay/proof     { referenceId, transactionId }        → { status }
 *
 * Manual mode only, no gateway keys. Totals always come from server/catalog.ts.
 */
import {
  createSomPay,
  isMobileWallet,
  isSomPayError,
  maskPhone,
  normalizePhone,
  toClientResult,
  type ErrorCode,
  type MobileWallet,
} from '@sompaykit/core';
import { CURRENCY, cartTotal, type CartLine } from './catalog.ts';
import type { Order, Payment, Store } from './store.ts';

export interface ApiEnv {
  store: Store;
  /** Merchant wallet numbers, e.g. `{ evc: '612345678' }`. */
  merchantNumbers: Partial<Record<MobileWallet, string>>;
  /**
   * Show the "Dial to pay" button. Off unless the numbers are your own: the button sends real
   * money to whoever owns the number.
   */
  allowDial: boolean;
  /** Pretend merchant confirms this long after the proof arrives. */
  confirmAfterMs: number;
  now?: () => number;
}

/** Unpaid manual payments expire after this in the demo. */
const EXPIRE_AFTER_MS = 30 * 60 * 1000;
const MAX_BODY_BYTES = 4096;
const TRANSACTION_ID = /^[A-Za-z0-9._:-]{4,64}$/;
const REFERENCE_ID = /^[A-Za-z0-9_.:-]{1,64}$/;

const HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: HEADERS });
}

function fail(errorCode: ErrorCode | 'INVALID_CART' | 'BAD_REQUEST', status = 400): Response {
  return json({ errorCode }, status);
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return null;
  try {
    const value: unknown = JSON.parse(text);
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function readLines(value: unknown): CartLine[] | null {
  if (!Array.isArray(value)) return null;
  const lines: CartLine[] = [];
  for (const item of value) {
    if (typeof item !== 'object' || item === null) return null;
    const { productId, quantity } = item as Record<string, unknown>;
    if (typeof productId !== 'string' || typeof quantity !== 'number') return null;
    lines.push({ productId, quantity });
  }
  return lines;
}

function randomId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return `${prefix}_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

/** Moves a stored payment forward in time: demo auto-confirmation and expiry. */
function advance(payment: Payment, now: number): Payment {
  if (payment.status === 'awaiting_confirmation' && payment.confirmAt !== undefined) {
    return now >= payment.confirmAt ? { ...payment, status: 'paid' } : payment;
  }
  if (payment.status === 'awaiting_proof' && now - payment.createdAt > EXPIRE_AFTER_MS) {
    return { ...payment, status: 'expired' };
  }
  return payment;
}

async function createOrder(request: Request, env: ApiEnv): Promise<Response> {
  const body = await readBody(request);
  const lines = body && readLines(body.lines);
  if (!lines) return fail('BAD_REQUEST');
  const total = cartTotal(lines);
  if (total === null) return fail('INVALID_CART');

  const order: Order = {
    id: randomId('ord'),
    lines,
    total,
    currency: CURRENCY,
    createdAt: (env.now ?? Date.now)(),
  };
  await env.store.putOrder(order);
  return json({ orderId: order.id, total: order.total, currency: order.currency });
}

async function charge(request: Request, env: ApiEnv): Promise<Response> {
  const body = await readBody(request);
  if (!body) return fail('BAD_REQUEST');
  const { referenceId, orderId, phone, wallet } = body;
  if (typeof referenceId !== 'string' || !REFERENCE_ID.test(referenceId)) {
    return fail('INVALID_REFERENCE');
  }
  if (typeof orderId !== 'string') return fail('NOT_FOUND', 404);
  if (typeof phone !== 'string') return fail('INVALID_NUMBER');
  if (wallet !== undefined && !isMobileWallet(wallet)) return fail('WALLET_NOT_SUPPORTED');

  const order = await env.store.getOrder(orderId);
  if (!order) return fail('NOT_FOUND', 404);

  const normalized = normalizePhone(phone);
  if (normalized === null) return fail('INVALID_NUMBER');
  const fingerprint = [order.id, normalized, wallet ?? ''].join('|');

  // Same referenceId again (double tap, resend after a dropped connection): same payment.
  const existing = await env.store.getPayment(referenceId);
  if (existing) {
    if (existing.fingerprint !== fingerprint) return fail('DUPLICATE_REFERENCE', 409);
    const { referenceId: ref, status, instructions, errorCode } = existing;
    return json({
      referenceId: ref,
      status,
      ...(instructions && { instructions }),
      ...(errorCode && { errorCode }),
    });
  }

  const sompay = createSomPay({ provider: 'manual', merchantNumbers: env.merchantNumbers });
  try {
    const result = await sompay.charge({
      referenceId,
      orderId: order.id,
      phone: normalized,
      amount: order.total, // from the server's own order, never from the browser
      currency: order.currency,
      ...(wallet !== undefined && { wallet }),
      description: `Demo order ${order.id}`,
    });
    // Manual mode always returns instructions.
    if (!result.instructions) return fail('PROVIDER_ERROR', 502);
    const instructions = env.allowDial
      ? result.instructions
      : { ...result.instructions, ussdCode: null, ussdLink: null };
    const payment: Payment = {
      referenceId,
      orderId: order.id,
      payerPhone: maskPhone(normalized),
      wallet: instructions.wallet,
      amount: order.total,
      currency: order.currency,
      status: result.status,
      ...(result.errorCode && { errorCode: result.errorCode }),
      instructions,
      fingerprint,
      createdAt: (env.now ?? Date.now)(),
    };
    await env.store.putPayment(payment);
    return json(toClientResult({ ...result, instructions }));
  } catch (error) {
    if (isSomPayError(error)) return fail(error.code);
    throw error;
  }
}

async function status(request: Request, env: ApiEnv): Promise<Response> {
  const referenceId = new URL(request.url).searchParams.get('referenceId');
  const stored = referenceId ? await env.store.getPayment(referenceId) : null;
  if (!stored) return fail('NOT_FOUND', 404);

  const payment = advance(stored, (env.now ?? Date.now)());
  if (payment.status !== stored.status) await env.store.putPayment(payment);
  return json({
    status: payment.status,
    ...(payment.errorCode && { errorCode: payment.errorCode }),
  });
}

async function proof(request: Request, env: ApiEnv): Promise<Response> {
  const body = await readBody(request);
  if (!body) return fail('BAD_REQUEST');
  const { referenceId, transactionId } = body;
  if (typeof referenceId !== 'string' || typeof transactionId !== 'string') {
    return fail('BAD_REQUEST');
  }
  const trimmed = transactionId.trim();
  if (!TRANSACTION_ID.test(trimmed)) return fail('BAD_REQUEST');

  const stored = await env.store.getPayment(referenceId);
  if (!stored) return fail('NOT_FOUND', 404);
  const now = (env.now ?? Date.now)();
  const payment = advance(stored, now);

  if (payment.status === 'awaiting_proof') {
    const next: Payment = {
      ...payment,
      status: 'awaiting_confirmation',
      transactionId: trimmed,
      confirmAt: now + env.confirmAfterMs,
    };
    await env.store.putPayment(next);
    return json({ status: next.status });
  }
  // Already sent (a resend) or already final: answer with what we have.
  if (payment !== stored) await env.store.putPayment(payment);
  return json({ status: payment.status });
}

/** Routes /api/* requests. Returns null for anything else. */
export async function handleApi(request: Request, env: ApiEnv): Promise<Response | null> {
  const { pathname } = new URL(request.url);
  const route = `${request.method} ${pathname.replace(/\/$/, '')}`;
  switch (route) {
    case 'POST /api/orders':
      return createOrder(request, env);
    case 'POST /api/pay':
      return charge(request, env);
    case 'GET /api/pay/status':
      return status(request, env);
    case 'POST /api/pay/proof':
      return proof(request, env);
    default:
      return pathname.startsWith('/api/') ? fail('NOT_FOUND', 404) : null;
  }
}
