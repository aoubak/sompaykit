/**
 * SifaloPay provider (payment page: the buyer pays on SifaloPay's hosted checkout).
 *
 * Flow: `createCheckout` returns a URL → the buyer pays there → they come back to `returnUrl`
 * with `sid` added → `verifyPayment` asks SifaloPay for the real state.
 *
 * Only `verifyPayment` can be trusted. The return URL and the webhook body are not signed, so
 * use them only to learn which payment to verify.
 *
 * Gateway facts (hosts, codes, timeout) are in constants.ts (`SIFALOPAY`).
 * Credentials come from server env only. They are never logged or put in an error.
 */
import { SIFALOPAY } from '../constants';
import { SomPayError } from '../errors';
import type {
  CheckoutInput,
  CheckoutResult,
  ErrorCode,
  HostedCheckoutProvider,
  VerifyInput,
  VerifyResult,
} from '../types';

export interface SifaloPayProviderOptions {
  apiUser: string;
  apiKey: string;
  /** Default `staging`. Staging keys only work on staging, live keys only on live. */
  env?: 'staging' | 'live';
  /** Request timeout in ms. Default 120 000: SifaloPay calls can take long. */
  timeoutMs?: number;
  /** Custom fetch, e.g. for tests. Defaults to the global fetch. */
  fetch?: typeof fetch;
}

type Json = Record<string, unknown>;

interface GatewayResponse {
  ok: boolean;
  httpStatus: number;
  /** null when the body was not a JSON object. */
  data: Json | null;
}

const toCents = (amount: number): number => Math.round(amount * 100);

function text(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function errorName(error: unknown): string {
  return typeof error === 'object' && error !== null && 'name' in error ? String(error.name) : '';
}

/** `returnUrl` with `order_id` added (unless the merchant already set it). */
function withOrderId(returnUrl: string, orderId: string): string {
  const url = parseHttpUrl(returnUrl, 'returnUrl');
  if (!url.searchParams.has('order_id')) url.searchParams.set('order_id', orderId);
  return url.toString();
}

function parseHttpUrl(value: string, name: string): URL {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' || url.protocol === 'http:') return url;
  } catch {
    // fall through to the error below
  }
  throw new SomPayError('CONFIG_ERROR', `${name} must be a full http(s) URL`);
}

export function createSifaloPayProvider(options: SifaloPayProviderOptions): HostedCheckoutProvider {
  const { apiUser, apiKey } = options ?? {};
  if (!apiUser || !apiKey) {
    throw new SomPayError(
      'CONFIG_ERROR',
      'SifaloPay needs apiUser and apiKey (read them from server env)',
    );
  }
  const env = options.env ?? 'staging';
  if (env !== 'staging' && env !== 'live') {
    throw new SomPayError('CONFIG_ERROR', 'SifaloPay env must be "staging" or "live"');
  }

  let authorization: string;
  try {
    authorization = `Basic ${btoa(`${apiUser}:${apiKey}`)}`;
  } catch {
    throw new SomPayError('CONFIG_ERROR', 'SifaloPay apiUser or apiKey has unsupported characters');
  }

  const gatewayUrl = SIFALOPAY.gateway[env];
  const checkoutUrl = SIFALOPAY.checkout[env];
  const verifyUrl = `${gatewayUrl}${SIFALOPAY.verifyPath}`;
  const timeoutMs = options.timeoutMs ?? SIFALOPAY.timeoutMs;
  // Call the global fetch through a wrapper: Cloudflare Workers reject a detached `fetch`.
  const doFetch: typeof fetch = options.fetch ?? ((input, init) => fetch(input, init));

  async function postJson(
    url: string,
    body: Json,
    headers: Record<string, string> = {},
  ): Promise<GatewayResponse> {
    try {
      const res = await doFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
      const raw = await res.text();
      let data: Json | null = null;
      try {
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          data = parsed as Json;
        }
      } catch {
        // not JSON: data stays null
      }
      return { ok: res.ok, httpStatus: res.status, data };
    } catch (cause) {
      const name = errorName(cause);
      const timedOut = name === 'TimeoutError' || name === 'AbortError';
      throw new SomPayError(
        timedOut ? 'TIMEOUT' : 'NETWORK_ERROR',
        timedOut ? 'SifaloPay did not answer in time' : 'Could not reach SifaloPay',
        { cause },
      );
    }
  }

  /** Short gateway text for an error, with the credentials removed just in case. */
  function snippet(data: Json | null): string {
    if (data === null) return 'no JSON in the response';
    return JSON.stringify(data).slice(0, 200).split(apiKey).join('***').split(apiUser).join('***');
  }

  return {
    id: 'sifalopay',

    async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
      if (input.currency !== SIFALOPAY.currency) {
        throw new SomPayError('INVALID_CURRENCY', 'The SifaloPay payment page only takes USD');
      }
      const returnUrl = withOrderId(input.returnUrl, input.orderId);
      const webhookUrl = parseHttpUrl(input.webhookUrl, 'webhookUrl').toString();

      const { ok, httpStatus, data } = await postJson(
        gatewayUrl,
        {
          amount: input.amount.toFixed(2),
          gateway: 'checkout',
          currency: SIFALOPAY.currency,
          return_url: returnUrl,
          webhook_url: webhookUrl,
        },
        { Authorization: authorization },
      );

      if (httpStatus === 401 || httpStatus === 403) {
        throw new SomPayError(
          'CONFIG_ERROR',
          `SifaloPay rejected the credentials (HTTP ${httpStatus}). Check apiUser, apiKey and env "${env}"`,
        );
      }
      const key = text(data?.key);
      const token = text(data?.token);
      if (!ok || !key || !token) {
        throw new SomPayError(
          'PROVIDER_ERROR',
          `SifaloPay checkout failed (HTTP ${httpStatus}): ${snippet(data)}`,
        );
      }

      const redirect = new URL(checkoutUrl);
      redirect.searchParams.set('key', key);
      redirect.searchParams.set('token', token);
      return { redirectUrl: redirect.toString(), raw: data };
    },

    async verifyPayment(input: VerifyInput): Promise<VerifyResult> {
      const sid = text(input.sid);
      const orderId = text(input.orderId);
      if (!sid && !orderId) {
        throw new SomPayError('INVALID_REFERENCE', 'verify needs a sid or an orderId');
      }

      // No auth on verify, so the credentials are not sent here.
      const { httpStatus, data } = await postJson(verifyUrl, sid ? { sid } : { order_id: orderId });

      const code = text(data?.code);
      const status = text(data?.status).toLowerCase();
      if (data === null || (!code && !status)) {
        // Not an answer about the payment: its state is unknown, so don't call it failed.
        throw new SomPayError(
          'PROVIDER_ERROR',
          `SifaloPay verify gave no payment state (HTTP ${httpStatus}): ${snippet(data)}`,
        );
      }

      const amount = text(data.amount) === '' ? NaN : Number(data.amount);
      const detail = text(data.response) || text(data.status);
      const result: VerifyResult = {
        status: 'failed',
        sid: text(data.sid) || sid || null,
        amount: Number.isFinite(amount) ? amount : null,
        currency: text(data.currency).toUpperCase() || null,
        paymentType: text(data.payment_type) || null,
        ...(detail ? { detail } : {}),
        raw: data,
      };
      const failed = (errorCode: ErrorCode): VerifyResult => ({ ...result, errorCode });

      if (status === 'success' && code === SIFALOPAY.codes.paid) {
        // The gateway says paid. Trust it only if it is this payment, in USD, for this amount.
        if (sid && result.sid !== sid) return failed('INVALID_REFERENCE');
        if (result.currency !== null && result.currency !== SIFALOPAY.currency) {
          return failed('INVALID_CURRENCY');
        }
        if (
          input.amount !== undefined &&
          (result.amount === null || toCents(result.amount) !== toCents(input.amount))
        ) {
          return failed('AMOUNT_MISMATCH');
        }
        return { ...result, status: 'paid' };
      }
      if (code === SIFALOPAY.codes.pending || status === 'pending') {
        return { ...result, status: 'pending' };
      }
      if (code === SIFALOPAY.codes.insufficientFunds) return failed('INSUFFICIENT_FUNDS');
      if (code === SIFALOPAY.codes.failed) return failed('DECLINED');
      return failed('PROVIDER_ERROR');
    },
  };
}
