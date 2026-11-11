import { describe, expect, it } from 'vitest';
import { handleApi, type ApiEnv } from '../server/api.ts';
import { cartTotal } from '../server/catalog.ts';
import { apiEnvFrom } from '../server/config.ts';
import { memoryStore } from '../server/store.ts';

function setup(overrides: Partial<ApiEnv> = {}) {
  let now = 1_000_000;
  const env: ApiEnv = {
    store: memoryStore(),
    merchantNumbers: { evc: '612345678', zaad: '634567890' },
    allowDial: false,
    confirmAfterMs: 5000,
    now: () => now,
    ...overrides,
  };
  async function call(method: string, path: string, body?: unknown) {
    const response = await handleApi(
      new Request(`http://shop.test${path}`, {
        method,
        ...(body !== undefined && { body: JSON.stringify(body) }),
      }),
      env,
    );
    if (!response) throw new Error(`no route for ${method} ${path}`);
    return { status: response.status, body: (await response.json()) as Record<string, unknown> };
  }
  return {
    call,
    advance: (ms: number) => {
      now += ms;
    },
  };
}

async function newOrder(call: ReturnType<typeof setup>['call']) {
  const res = await call('POST', '/api/orders', {
    lines: [
      { productId: 'tea', quantity: 2 },
      { productId: 'charger', quantity: 1 },
    ],
  });
  return res.body.orderId as string;
}

describe('cartTotal', () => {
  it('adds prices in cents', () => {
    expect(
      cartTotal([
        { productId: 'oil', quantity: 3 },
        { productId: 'charger', quantity: 1 },
      ]),
    ).toBe(22.25);
  });

  it('rejects unknown products, bad quantities, duplicates and empty carts', () => {
    expect(cartTotal([])).toBeNull();
    expect(cartTotal([{ productId: 'nope', quantity: 1 }])).toBeNull();
    expect(cartTotal([{ productId: 'tea', quantity: 0 }])).toBeNull();
    expect(cartTotal([{ productId: 'tea', quantity: 1.5 }])).toBeNull();
    expect(cartTotal([{ productId: 'tea', quantity: 21 }])).toBeNull();
    expect(
      cartTotal([
        { productId: 'tea', quantity: 1 },
        { productId: 'tea', quantity: 1 },
      ]),
    ).toBeNull();
  });
});

describe('POST /api/orders', () => {
  it('computes the total on the server and ignores any total the browser sends', async () => {
    const { call } = setup();
    const res = await call('POST', '/api/orders', {
      lines: [{ productId: 'tea', quantity: 2 }],
      total: 0.01,
    });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 12, currency: 'USD' });
  });

  it('refuses an invalid cart', async () => {
    const { call } = setup();
    expect((await call('POST', '/api/orders', { lines: [] })).body.errorCode).toBe('INVALID_CART');
    expect((await call('POST', '/api/orders', { lines: 'x' })).status).toBe(400);
  });
});

describe('POST /api/pay', () => {
  it('charges the order total with manual instructions', async () => {
    const { call } = setup();
    const orderId = await newOrder(call);
    const res = await call('POST', '/api/pay', {
      referenceId: 'spk_1',
      orderId,
      phone: '0612345678',
      wallet: 'evc',
      amount: 0.01, // ignored: there is no amount in the contract
    });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      referenceId: 'spk_1',
      status: 'awaiting_proof',
      instructions: { wallet: 'evc', number: '612345678', amount: 21.5, ussdLink: null },
    });
    expect(res.body).not.toHaveProperty('raw');
  });

  it('keeps "Dial to pay" only when allowed', async () => {
    const { call } = setup({ allowDial: true });
    const orderId = await newOrder(call);
    const res = await call('POST', '/api/pay', {
      referenceId: 'spk_1',
      orderId,
      phone: '612345678',
      wallet: 'evc',
    });
    expect(res.body.instructions).toMatchObject({ ussdCode: '*712*612345678*21.5#' });
  });

  it('returns the same payment for a resend, and refuses a reused ID for another payment', async () => {
    const { call } = setup();
    const orderId = await newOrder(call);
    const body = { referenceId: 'spk_1', orderId, phone: '612345678', wallet: 'evc' };
    const first = await call('POST', '/api/pay', body);
    const again = await call('POST', '/api/pay', body);
    expect(again.body).toEqual(first.body);

    const other = await call('POST', '/api/pay', { ...body, phone: '613333333' });
    expect(other).toMatchObject({ status: 409, body: { errorCode: 'DUPLICATE_REFERENCE' } });
  });

  it('answers with error codes for bad input', async () => {
    const { call } = setup();
    const orderId = await newOrder(call);
    const base = { referenceId: 'spk_1', orderId, phone: '612345678' };
    expect((await call('POST', '/api/pay', { ...base, orderId: 'ord_x' })).body.errorCode).toBe(
      'NOT_FOUND',
    );
    expect((await call('POST', '/api/pay', { ...base, phone: '123' })).body.errorCode).toBe(
      'INVALID_NUMBER',
    );
    expect((await call('POST', '/api/pay', { ...base, referenceId: 'a b' })).body.errorCode).toBe(
      'INVALID_REFERENCE',
    );
    expect((await call('POST', '/api/pay', { ...base, wallet: 'card' })).body.errorCode).toBe(
      'WALLET_NOT_SUPPORTED',
    );
    // No Sahal number configured for this merchant.
    expect(
      (await call('POST', '/api/pay', { ...base, referenceId: 'spk_2', wallet: 'sahal' })).body
        .errorCode,
    ).toBe('WALLET_NOT_SUPPORTED');
  });
});

describe('proof and status', () => {
  it('goes awaiting_proof → awaiting_confirmation → paid', async () => {
    const { call, advance } = setup();
    const orderId = await newOrder(call);
    await call('POST', '/api/pay', { referenceId: 'spk_1', orderId, phone: '612345678' });

    expect((await call('GET', '/api/pay/status?referenceId=spk_1')).body).toEqual({
      status: 'awaiting_proof',
    });
    const proof = await call('POST', '/api/pay/proof', {
      referenceId: 'spk_1',
      transactionId: ' TXN12345 ',
    });
    expect(proof.body).toEqual({ status: 'awaiting_confirmation' });

    advance(4999);
    expect((await call('GET', '/api/pay/status?referenceId=spk_1')).body.status).toBe(
      'awaiting_confirmation',
    );
    advance(1);
    expect((await call('GET', '/api/pay/status?referenceId=spk_1')).body.status).toBe('paid');
    // A late resend of the proof doesn't undo it.
    expect(
      (await call('POST', '/api/pay/proof', { referenceId: 'spk_1', transactionId: 'TXN12345' }))
        .body.status,
    ).toBe('paid');
  });

  it('expires unpaid payments', async () => {
    const { call, advance } = setup();
    const orderId = await newOrder(call);
    await call('POST', '/api/pay', { referenceId: 'spk_1', orderId, phone: '612345678' });
    advance(31 * 60 * 1000);
    expect((await call('GET', '/api/pay/status?referenceId=spk_1')).body.status).toBe('expired');
  });

  it('refuses bad proof and unknown payments', async () => {
    const { call } = setup();
    expect(
      (await call('POST', '/api/pay/proof', { referenceId: 'spk_x', transactionId: 'TXN12345' }))
        .status,
    ).toBe(404);
    expect(
      (await call('POST', '/api/pay/proof', { referenceId: 'spk_x', transactionId: '<b>' })).status,
    ).toBe(400);
    expect((await call('GET', '/api/pay/status')).status).toBe(404);
  });
});

describe('routing and config', () => {
  it('ignores non-API paths and 404s unknown API paths', async () => {
    const env = apiEnvFrom({}, memoryStore());
    expect(await handleApi(new Request('http://shop.test/cart'), env)).toBeNull();
    expect((await handleApi(new Request('http://shop.test/api/nope'), env))?.status).toBe(404);
  });

  it('keeps "Dial to pay" off with placeholder numbers, even if asked', () => {
    expect(apiEnvFrom({ DEMO_ALLOW_DIAL: '1' }, memoryStore()).allowDial).toBe(false);
    expect(
      apiEnvFrom({ DEMO_ALLOW_DIAL: '1', DEMO_EVC_NUMBER: '612345678' }, memoryStore()).allowDial,
    ).toBe(true);
  });
});
