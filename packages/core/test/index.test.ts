import { describe, expect, it, vi } from 'vitest';
import * as core from '../src/index';
import { SomPayError, createSomPay, type ChargeInput } from '../src/index';

const manual = () =>
  createSomPay({ provider: 'manual', merchantNumbers: { evc: '619998888', zaad: '631112222' } });

const charge: ChargeInput = {
  referenceId: 'order_42-attempt_1',
  phone: '+252 61 234 5678',
  amount: 18,
  currency: 'USD',
};

describe('createSomPay (manual)', () => {
  it('charges with wallet detected from the phone prefix', async () => {
    const sompay = manual();
    expect(sompay.provider).toBe('manual');
    const result = await sompay.charge(charge);
    expect(result.status).toBe('awaiting_proof');
    expect(result.referenceId).toBe('order_42-attempt_1');
    expect(result.instructions).toMatchObject({
      wallet: 'evc',
      number: '619998888',
      ussdLink: 'tel:*712*619998888*18%23',
    });
  });

  it('uses the wallet the customer picked over the detected one', async () => {
    const result = await manual().charge({ ...charge, wallet: 'zaad' });
    expect(result.instructions?.wallet).toBe('zaad');
  });

  it('is idempotent on referenceId', async () => {
    const sompay = manual();
    const [a, b] = await Promise.all([sompay.charge(charge), sompay.charge(charge)]);
    expect(b).toEqual(a);
  });

  it('reports status', async () => {
    const sompay = manual();
    await sompay.charge(charge);
    expect(await sompay.status(charge.referenceId)).toBe('awaiting_proof');
  });

  it('exposes helpers', () => {
    const sompay = manual();
    expect(sompay.normalizePhone('061 234 5678')).toBe('252612345678');
    expect(sompay.detectWallet('63 123 4567')).toBe('zaad');
    expect(sompay.message('INVALID_NUMBER')).toBe('Lambarka taleefanka sax maaha.');
    expect(sompay.message('INVALID_NUMBER', 'en')).toBe('Invalid phone number.');
  });
});

describe('charge validation', () => {
  it.each<[string, Partial<ChargeInput>, string]>([
    ['missing reference', { referenceId: '' }, 'INVALID_REFERENCE'],
    ['reference with spaces', { referenceId: 'order 1' }, 'INVALID_REFERENCE'],
    ['reference too long', { referenceId: 'x'.repeat(65) }, 'INVALID_REFERENCE'],
    ['zero amount', { amount: 0 }, 'INVALID_AMOUNT'],
    ['3 decimals', { amount: 1.005 }, 'INVALID_AMOUNT'],
    ['amount as string', { amount: '18' as unknown as number }, 'INVALID_AMOUNT'],
    ['currency', { currency: 'EUR' as never }, 'INVALID_CURRENCY'],
    ['phone', { phone: '12345' }, 'INVALID_NUMBER'],
    ['unknown wallet', { wallet: 'mpesa' as never }, 'WALLET_NOT_SUPPORTED'],
    ['undetectable wallet', { phone: '69 123 4567' }, 'WALLET_REQUIRED'],
    ['wallet without merchant number', { wallet: 'sahal' }, 'WALLET_NOT_SUPPORTED'],
  ])('throws for %s', async (_name, patch, code) => {
    const error = await manual()
      .charge({ ...charge, ...patch })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(SomPayError);
    expect((error as SomPayError).code).toBe(code);
  });

  it('never puts the full phone number in an error', async () => {
    const error = (await manual()
      .charge({ ...charge, phone: '69 123 4567' })
      .catch((e: unknown) => e)) as Error;
    expect(error.message).not.toContain('691234567');
  });
});

describe('createSomPay (waafipay stub)', () => {
  const credentials = { merchantUid: 'M1', apiUserId: 'U1', apiKey: 'K1' };

  it('requires credentials', () => {
    expect(() =>
      createSomPay({ provider: 'waafipay', credentials: { ...credentials, apiKey: '' } }),
    ).toThrow(expect.objectContaining({ code: 'CONFIG_ERROR' }));
  });

  it('does not call the network and reports NOT_IMPLEMENTED', async () => {
    const fetch = vi.fn();
    const sompay = createSomPay({ provider: 'waafipay', credentials, fetch });
    await expect(sompay.charge(charge)).rejects.toMatchObject({ code: 'NOT_IMPLEMENTED' });
    await expect(sompay.status('x')).rejects.toMatchObject({ code: 'NOT_IMPLEMENTED' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('never leaks credentials in errors', () => {
    try {
      createSomPay({ provider: 'waafipay', credentials: { ...credentials, merchantUid: '' } });
    } catch (error) {
      expect(String(error)).not.toContain('K1');
    }
  });
});

describe('createSomPay (sifalopay payment page)', () => {
  const json = (body: unknown) => new Response(JSON.stringify(body));
  const sifalo = (fetch: typeof globalThis.fetch) =>
    createSomPay({
      provider: 'sifalopay',
      apiUser: 'user',
      apiKey: 'sk_SECRET',
      env: 'staging',
      fetch,
    });
  const order = {
    orderId: 'order_42',
    amount: 3,
    currency: 'USD' as const,
    returnUrl: 'https://shop.example/return',
    webhookUrl: 'https://shop.example/webhook',
  };

  it('checkout returns the URL to send the buyer to', async () => {
    const fetch = vi.fn(async () => json({ key: 'K1', token: 'T1' }));
    const sompay = sifalo(fetch);
    expect(sompay.provider).toBe('sifalopay');
    const { redirectUrl } = await sompay.checkout(order);
    expect(redirectUrl).toBe('https://pay.sifalo.net/checkout/?key=K1&token=T1');
  });

  it('verify confirms a payment by sid', async () => {
    const fetch = vi.fn(async () =>
      json({ status: 'success', code: '601', sid: 'SID_1', amount: '3.00', currency: 'USD' }),
    );
    const result = await sifalo(fetch).verify({ sid: 'SID_1', amount: 3 });
    expect(result).toMatchObject({ status: 'paid', sid: 'SID_1', amount: 3 });
  });

  it('verify reports an amount mismatch as failed', async () => {
    const fetch = vi.fn(async () =>
      json({ status: 'success', code: '601', sid: 'SID_1', amount: '1.00', currency: 'USD' }),
    );
    const result = await sifalo(fetch).verify({ sid: 'SID_1', amount: 3 });
    expect(result).toMatchObject({ status: 'failed', errorCode: 'AMOUNT_MISMATCH' });
  });

  it('requires credentials', () => {
    expect(() => createSomPay({ provider: 'sifalopay', apiUser: 'user', apiKey: '' })).toThrow(
      expect.objectContaining({ code: 'CONFIG_ERROR' }),
    );
  });

  it.each<[string, object, string]>([
    ['missing orderId', { orderId: '' }, 'INVALID_REFERENCE'],
    ['orderId with spaces', { orderId: 'order 1' }, 'INVALID_REFERENCE'],
    ['zero amount', { amount: 0 }, 'INVALID_AMOUNT'],
    ['amount as string', { amount: '3.00' }, 'INVALID_AMOUNT'],
    ['unknown currency', { currency: 'EUR' }, 'INVALID_CURRENCY'],
    ['non-USD currency', { currency: 'SLSH' }, 'INVALID_CURRENCY'],
  ])('checkout throws for %s without calling the gateway', async (_name, patch, code) => {
    const fetch = vi.fn();
    await expect(sifalo(fetch).checkout({ ...order, ...patch } as never)).rejects.toMatchObject({
      code,
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('verify throws for a bad expected amount without calling the gateway', async () => {
    const fetch = vi.fn();
    await expect(sifalo(fetch).verify({ sid: 'SID_1', amount: -3 })).rejects.toMatchObject({
      code: 'INVALID_AMOUNT',
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('charge and status are not supported on a payment page', async () => {
    const fetch = vi.fn();
    const sompay = sifalo(fetch);
    await expect(sompay.charge(charge)).rejects.toMatchObject({ code: 'METHOD_NOT_SUPPORTED' });
    await expect(sompay.status('x')).rejects.toMatchObject({ code: 'METHOD_NOT_SUPPORTED' });
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('checkout and verify on phone-number providers', () => {
  it('throw METHOD_NOT_SUPPORTED on manual and waafipay', async () => {
    const waafi = createSomPay({
      provider: 'waafipay',
      credentials: { merchantUid: 'M1', apiUserId: 'U1', apiKey: 'K1' },
    });
    for (const sompay of [manual(), waafi]) {
      await expect(
        sompay.checkout({
          orderId: 'order_42',
          amount: 3,
          currency: 'USD',
          returnUrl: 'https://shop.example/return',
          webhookUrl: 'https://shop.example/webhook',
        }),
      ).rejects.toMatchObject({ code: 'METHOD_NOT_SUPPORTED' });
      await expect(sompay.verify({ sid: 'SID_1' })).rejects.toMatchObject({
        code: 'METHOD_NOT_SUPPORTED',
      });
    }
  });
});

describe('unknown provider', () => {
  it('throws CONFIG_ERROR', () => {
    expect(() => createSomPay({ provider: 'mpesa' } as never)).toThrow(
      expect.objectContaining({ code: 'CONFIG_ERROR' }),
    );
  });
});

describe('public exports', () => {
  it('exposes the documented API', () => {
    for (const name of [
      'createSomPay',
      'createManualProvider',
      'createWaafiPayProvider',
      'createSifaloPayProvider',
      'normalizePhone',
      'maskPhone',
      'detectWallet',
      'buildUssdCode',
      'ussdLink',
      'message',
      'SomPayError',
      'WALLETS',
      'isFinalStatus',
      'isPaymentStatus',
      'toClientResult',
    ]) {
      expect(core, name).toHaveProperty(name);
    }
  });
});
