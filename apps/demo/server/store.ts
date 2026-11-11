/**
 * Where the demo keeps orders and payments. Cloudflare KV when bound (survives across Workers),
 * otherwise memory (local dev). A real shop uses its database with a UNIQUE reference_id.
 */
import type {
  Currency,
  ErrorCode,
  ManualInstructions,
  MobileWallet,
  PaymentStatus,
} from '@sompaykit/core';
import type { CartLine } from './catalog.ts';

export interface Order {
  id: string;
  lines: CartLine[];
  /** Server-calculated. */
  total: number;
  currency: Currency;
  createdAt: number;
}

export interface Payment {
  referenceId: string;
  orderId: string;
  /** Masked (`252 61 *** 5678`): the demo never stores full numbers. */
  payerPhone: string;
  wallet: MobileWallet;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  errorCode?: ErrorCode;
  instructions?: ManualInstructions;
  transactionId?: string;
  /** Demo only: when the pretend merchant confirms the payment. */
  confirmAt?: number;
  /** Identifies the request, so a reused referenceId for another payment is refused. */
  fingerprint: string;
  createdAt: number;
}

export interface Store {
  getOrder(id: string): Promise<Order | null>;
  putOrder(order: Order): Promise<void>;
  getPayment(referenceId: string): Promise<Payment | null>;
  putPayment(payment: Payment): Promise<void>;
}

/** Keep demo data for a day. */
export const TTL_SECONDS = 24 * 60 * 60;

/** The part of Cloudflare's KVNamespace the demo uses. */
export interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export function kvStore(kv: KVLike): Store {
  async function read<T>(key: string): Promise<T | null> {
    const value = await kv.get(key);
    return value === null ? null : (JSON.parse(value) as T);
  }
  const write = (key: string, value: unknown) =>
    kv.put(key, JSON.stringify(value), { expirationTtl: TTL_SECONDS });

  return {
    getOrder: (id) => read<Order>(`order:${id}`),
    putOrder: (order) => write(`order:${order.id}`, order),
    getPayment: (ref) => read<Payment>(`payment:${ref}`),
    putPayment: (payment) => write(`payment:${payment.referenceId}`, payment),
  };
}

/** Per-process memory, capped so a busy dev server can't grow forever. */
export function memoryStore(max = 1000): Store {
  const data = new Map<string, string>();
  const kv: KVLike = {
    get: (key) => Promise.resolve(data.get(key) ?? null),
    put: (key, value) => {
      data.delete(key);
      data.set(key, value);
      if (data.size > max) {
        const oldest = data.keys().next().value;
        if (oldest !== undefined) data.delete(oldest);
      }
      return Promise.resolve();
    },
  };
  return kvStore(kv);
}
