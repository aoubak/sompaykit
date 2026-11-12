import { describe, expect, it, vi } from 'vitest';
import { SomPayError } from '../src/errors';
import { createSifaloPayProvider } from '../src/providers/sifalopay';
import type { CheckoutInput } from '../src/types';

const API_USER = 'test-user';
const API_KEY = 'sk_test_SECRET';

type FetchArgs = [url: string, init: RequestInit];

/** A mocked fetch that answers every call with the same JSON (or text) body. */
function mockFetch(body: unknown, status = 200) {
  return vi.fn<(...args: FetchArgs) => Promise<Response>>(
    async () => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }),
  );
}

function provider(fetch: ReturnType<typeof mockFetch>, env?: 'staging' | 'live') {
  return createSifaloPayProvider({
    apiUser: API_USER,
    apiKey: API_KEY,
    ...(env ? { env } : {}),
    fetch: fetch as unknown as typeof globalThis.fetch,
  });
}

function sentBody(fetch: ReturnType<typeof mockFetch>): Record<string, unknown> {
  return JSON.parse(String(fetch.mock.calls[0]?.[1].body)) as Record<string, unknown>;
}

function sentHeaders(fetch: ReturnType<typeof mockFetch>): Record<string, string> {
  return fetch.mock.calls[0]?.[1].headers as Record<string, string>;
}

const checkout: CheckoutInput = {
  orderId: 'order_42',
  amount: 3,
  currency: 'USD',
  returnUrl: 'https://shop.example/checkout/return',
  webhookUrl: 'https://shop.example/api/webhook',
};

const paid = {
  status: 'success',
  code: '601',
  sid: 'SID_abc',
  amount: '3.00',
  currency: 'USD',
  payment_type: 'eDahab',
  response: 'Payment Successful',
};

describe('createSifaloPayProvider', () => {
  it('requires apiUser and apiKey', () => {
    for (const bad of [
      { apiUser: '', apiKey: API_KEY },
      { apiUser: API_USER, apiKey: '' },
    ]) {
      expect(() => createSifaloPayProvider(bad)).toThrow(
        expect.objectContaining({ code: 'CONFIG_ERROR' }),
      );
    }
  });

  it('rejects an unknown env', () => {
    expect(() =>
      createSifaloPayProvider({ apiUser: API_USER, apiKey: API_KEY, env: 'prod' as never }),
    ).toThrow(expect.objectContaining({ code: 'CONFIG_ERROR' }));
  });

  it('never puts the API key in a config error', () => {
    let error: unknown;
    try {
      createSifaloPayProvider({ apiUser: '', apiKey: API_KEY });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(SomPayError);
    expect(String(error)).not.toContain(API_KEY);
  });
});

describe('createCheckout', () => {
  it('starts a session on staging and returns the payment page URL', async () => {
    const fetch = mockFetch({ key: 'K1', token: 'T1' });
    const result = await provider(fetch).createCheckout(checkout);

    expect(result.redirectUrl).toBe('https://pay.sifalo.net/checkout/?key=K1&token=T1');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0]?.[0]).toBe('https://spay-api.sifalo.net/gateway/');
    expect(fetch.mock.calls[0]?.[1].method).toBe('POST');
    expect(sentHeaders(fetch).Authorization).toBe(`Basic ${btoa(`${API_USER}:${API_KEY}`)}`);
    expect(sentBody(fetch)).toEqual({
      amount: '3.00',
      gateway: 'checkout',
      currency: 'USD',
      return_url: 'https://shop.example/checkout/return?order_id=order_42',
      webhook_url: 'https://shop.example/api/webhook',
    });
  });

  it('uses the live hosts when env is live', async () => {
    const fetch = mockFetch({ key: 'K1', token: 'T1' });
    const result = await provider(fetch, 'live').createCheckout(checkout);
    expect(fetch.mock.calls[0]?.[0]).toBe('https://api.sifalopay.com/gateway/');
    expect(result.redirectUrl).toBe('https://pay.sifalo.com/checkout/?key=K1&token=T1');
  });

  it('sends the amount with two decimals', async () => {
    const fetch = mockFetch({ key: 'K1', token: 'T1' });
    await provider(fetch).createCheckout({ ...checkout, amount: 18.5 });
    expect(sentBody(fetch).amount).toBe('18.50');
  });

  it('keeps an order_id the merchant already put in returnUrl', async () => {
    const fetch = mockFetch({ key: 'K1', token: 'T1' });
    await provider(fetch).createCheckout({
      ...checkout,
      returnUrl: 'https://shop.example/return?order_id=mine&lang=so',
    });
    expect(sentBody(fetch).return_url).toBe('https://shop.example/return?order_id=mine&lang=so');
  });

  it('refuses a currency other than USD without calling the gateway', async () => {
    const fetch = mockFetch({ key: 'K1', token: 'T1' });
    await expect(
      provider(fetch).createCheckout({ ...checkout, currency: 'SLSH' }),
    ).rejects.toMatchObject({ code: 'INVALID_CURRENCY' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    ['returnUrl', { returnUrl: '/checkout/return' }],
    ['webhookUrl', { webhookUrl: 'javascript:alert(1)' }],
  ])('refuses a bad %s without calling the gateway', async (_name, patch) => {
    const fetch = mockFetch({ key: 'K1', token: 'T1' });
    await expect(provider(fetch).createCheckout({ ...checkout, ...patch })).rejects.toMatchObject({
      code: 'CONFIG_ERROR',
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('reports rejected credentials as CONFIG_ERROR', async () => {
    const fetch = mockFetch({ error: 'Unauthorized' }, 401);
    await expect(provider(fetch).createCheckout(checkout)).rejects.toMatchObject({
      code: 'CONFIG_ERROR',
    });
  });

  it('throws PROVIDER_ERROR when the gateway returns no key or token', async () => {
    for (const fetch of [mockFetch({ key: 'K1' }), mockFetch('<html>502</html>', 502)]) {
      await expect(provider(fetch).createCheckout(checkout)).rejects.toMatchObject({
        code: 'PROVIDER_ERROR',
      });
    }
  });

  it('never puts the credentials in an error, even if the gateway echoes them', async () => {
    const fetch = mockFetch({ error: `bad key ${API_KEY} for ${API_USER}` }, 400);
    const error = (await provider(fetch)
      .createCheckout(checkout)
      .catch((e: unknown) => e)) as SomPayError;
    expect(error).toBeInstanceOf(SomPayError);
    expect(error.message).not.toContain(API_KEY);
    expect(error.message).not.toContain(API_USER);
  });
});

describe('verifyPayment', () => {
  it('calls verify.php with the sid and no credentials', async () => {
    const fetch = mockFetch(paid);
    await provider(fetch).verifyPayment({ sid: 'SID_abc', amount: 3 });

    expect(fetch.mock.calls[0]?.[0]).toBe('https://spay-api.sifalo.net/gateway/verify.php');
    expect(sentBody(fetch)).toEqual({ sid: 'SID_abc' });
    expect(sentHeaders(fetch)).not.toHaveProperty('Authorization');
  });

  it('uses the live verify URL when env is live', async () => {
    const fetch = mockFetch(paid);
    await provider(fetch, 'live').verifyPayment({ sid: 'SID_abc' });
    expect(fetch.mock.calls[0]?.[0]).toBe('https://api.sifalopay.com/gateway/verify.php');
  });

  it('falls back to order_id when there is no sid', async () => {
    const fetch = mockFetch(paid);
    const result = await provider(fetch).verifyPayment({ orderId: 'order_42', amount: 3 });
    expect(sentBody(fetch)).toEqual({ order_id: 'order_42' });
    expect(result).toMatchObject({ status: 'paid', sid: 'SID_abc' });
  });

  it('needs a sid or an orderId', async () => {
    const fetch = mockFetch(paid);
    await expect(provider(fetch).verifyPayment({})).rejects.toMatchObject({
      code: 'INVALID_REFERENCE',
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('601 + success → paid', async () => {
    const result = await provider(mockFetch(paid)).verifyPayment({ sid: 'SID_abc', amount: 3 });
    expect(result).toMatchObject({
      status: 'paid',
      sid: 'SID_abc',
      amount: 3,
      currency: 'USD',
      paymentType: 'eDahab',
    });
    expect(result.errorCode).toBeUndefined();
    expect(result.raw).toEqual(paid);
  });

  it('601 as a number also counts', async () => {
    const result = await provider(mockFetch({ ...paid, code: 601, amount: 3 })).verifyPayment({
      sid: 'SID_abc',
      amount: 3,
    });
    expect(result.status).toBe('paid');
  });

  it('601 without status "success" is not paid', async () => {
    const result = await provider(mockFetch({ ...paid, status: 'error' })).verifyPayment({
      sid: 'SID_abc',
      amount: 3,
    });
    expect(result).toMatchObject({ status: 'failed', errorCode: 'PROVIDER_ERROR' });
  });

  it('status "success" without 601 is not paid', async () => {
    const result = await provider(mockFetch({ ...paid, code: '600' })).verifyPayment({
      sid: 'SID_abc',
      amount: 3,
    });
    expect(result).toMatchObject({ status: 'failed', errorCode: 'DECLINED' });
  });

  it('603 → pending', async () => {
    const fetch = mockFetch({ status: 'pending', code: '603', sid: 'SID_abc' });
    const result = await provider(fetch).verifyPayment({ sid: 'SID_abc', amount: 3 });
    expect(result.status).toBe('pending');
    expect(result.errorCode).toBeUndefined();
  });

  it('600 → failed / DECLINED', async () => {
    const fetch = mockFetch({
      status: 'error',
      code: '600',
      sid: 'SID_abc',
      response: 'Payment Failed (sandbox)',
    });
    const result = await provider(fetch).verifyPayment({ sid: 'SID_abc', amount: 3 });
    expect(result).toMatchObject({
      status: 'failed',
      errorCode: 'DECLINED',
      detail: 'Payment Failed (sandbox)',
    });
  });

  it('604 → failed / INSUFFICIENT_FUNDS', async () => {
    const fetch = mockFetch({ status: 'error', code: '604', sid: 'SID_abc' });
    const result = await provider(fetch).verifyPayment({ sid: 'SID_abc', amount: 3 });
    expect(result).toMatchObject({ status: 'failed', errorCode: 'INSUFFICIENT_FUNDS' });
  });

  it('an unknown code → failed / PROVIDER_ERROR', async () => {
    const fetch = mockFetch({ status: 'error', code: '699' });
    const result = await provider(fetch).verifyPayment({ sid: 'SID_abc' });
    expect(result).toMatchObject({ status: 'failed', errorCode: 'PROVIDER_ERROR' });
  });

  it('paid for a different amount → failed / AMOUNT_MISMATCH', async () => {
    const fetch = mockFetch({ ...paid, amount: '1.00' });
    const result = await provider(fetch).verifyPayment({ sid: 'SID_abc', amount: 3 });
    expect(result).toMatchObject({ status: 'failed', errorCode: 'AMOUNT_MISMATCH', amount: 1 });
  });

  it('paid with no amount in the answer → failed / AMOUNT_MISMATCH', async () => {
    const { amount: _amount, ...noAmount } = paid;
    const result = await provider(mockFetch(noAmount)).verifyPayment({ sid: 'SID_abc', amount: 3 });
    expect(result).toMatchObject({ status: 'failed', errorCode: 'AMOUNT_MISMATCH' });
  });

  it('compares amounts in cents', async () => {
    const fetch = mockFetch({ ...paid, amount: '0.30' });
    const result = await provider(fetch).verifyPayment({ sid: 'SID_abc', amount: 0.1 + 0.2 });
    expect(result.status).toBe('paid');
  });

  it('paid for another sid → failed / INVALID_REFERENCE', async () => {
    const fetch = mockFetch({ ...paid, sid: 'SID_other' });
    const result = await provider(fetch).verifyPayment({ sid: 'SID_abc', amount: 3 });
    expect(result).toMatchObject({ status: 'failed', errorCode: 'INVALID_REFERENCE' });
  });

  it('paid in another currency → failed / INVALID_CURRENCY', async () => {
    const fetch = mockFetch({ ...paid, currency: 'SOS' });
    const result = await provider(fetch).verifyPayment({ sid: 'SID_abc', amount: 3 });
    expect(result).toMatchObject({ status: 'failed', errorCode: 'INVALID_CURRENCY' });
  });

  it('throws when the answer has no payment state, instead of saying failed', async () => {
    for (const fetch of [mockFetch('<html>502</html>', 502), mockFetch({}), mockFetch([])]) {
      await expect(provider(fetch).verifyPayment({ sid: 'SID_abc' })).rejects.toMatchObject({
        code: 'PROVIDER_ERROR',
      });
    }
  });
});

describe('network problems', () => {
  const failing = (error: Error) =>
    vi.fn(async () => {
      throw error;
    }) as unknown as ReturnType<typeof mockFetch>;

  it('a timeout throws TIMEOUT', async () => {
    const timeout = new DOMException('The operation timed out', 'TimeoutError');
    await expect(
      provider(failing(timeout)).verifyPayment({ sid: 'SID_abc' }),
    ).rejects.toMatchObject({ code: 'TIMEOUT' });
    await expect(provider(failing(timeout)).createCheckout(checkout)).rejects.toMatchObject({
      code: 'TIMEOUT',
    });
  });

  it('a connection failure throws NETWORK_ERROR', async () => {
    const down = new TypeError('fetch failed');
    await expect(provider(failing(down)).verifyPayment({ sid: 'SID_abc' })).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });

  it('really aborts a call that takes longer than timeoutMs', async () => {
    const hanging = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(init.signal?.reason as Error));
        }),
    );
    const slow = createSifaloPayProvider({
      apiUser: API_USER,
      apiKey: API_KEY,
      timeoutMs: 20,
      fetch: hanging as unknown as typeof globalThis.fetch,
    });
    await expect(slow.verifyPayment({ sid: 'SID_abc' })).rejects.toMatchObject({ code: 'TIMEOUT' });
  });

  it('allows 120 s by default', async () => {
    const spy = vi.spyOn(AbortSignal, 'timeout');
    await provider(mockFetch(paid)).verifyPayment({ sid: 'SID_abc' });
    expect(spy).toHaveBeenCalledWith(120_000);
    spy.mockRestore();
  });
});
