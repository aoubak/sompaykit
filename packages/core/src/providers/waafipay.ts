/**
 * WaafiPay provider (automatic mode: the customer gets a PIN prompt on their phone).
 *
 * TODO(WAAFIPAY): not built yet, waiting for sandbox credentials. When building it:
 * - Follow docs/PAYMENTS.md § WaafiPay and AGENTS.md "Adding a provider".
 * - Request shape and endpoints are in constants.ts (`WAAFIPAY`, all VERIFY).
 * - Use `fetch` with a timeout (AbortSignal.timeout); map decline / insufficient funds /
 *   timeout / network errors to ErrorCodes; return the raw response in `raw`.
 * - Duplicate referenceId must return the existing payment, not charge twice.
 * - Credentials come from server env only. Never log them or the full payer phone.
 * - Tests: mock fetch for success, decline, timeout and duplicate referenceId.
 */
import { SomPayError } from '../errors';
import type { PaymentProvider } from '../types';

export interface WaafiPayCredentials {
  merchantUid: string;
  apiUserId: string;
  apiKey: string;
}

export interface WaafiPayProviderOptions {
  credentials: WaafiPayCredentials;
  /** Default `sandbox`. */
  environment?: 'sandbox' | 'live';
  /** Request timeout in ms. */
  timeoutMs?: number;
  /** Custom fetch, e.g. for tests. Defaults to the global fetch. */
  fetch?: typeof fetch;
}

export function createWaafiPayProvider(options: WaafiPayProviderOptions): PaymentProvider {
  const { merchantUid, apiUserId, apiKey } = options.credentials ?? {};
  if (!merchantUid || !apiUserId || !apiKey) {
    throw new SomPayError(
      'CONFIG_ERROR',
      'WaafiPay needs merchantUid, apiUserId and apiKey (read them from server env)',
    );
  }

  return {
    id: 'waafipay',
    async createPayment() {
      throw new SomPayError('NOT_IMPLEMENTED', 'The WaafiPay provider is not built yet');
    },
    async checkStatus() {
      throw new SomPayError('NOT_IMPLEMENTED', 'The WaafiPay provider is not built yet');
    },
  };
}
