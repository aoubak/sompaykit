import { describe, expect, it } from 'vitest';
import { SomPayError } from '../src/errors';
import { createManualProvider } from '../src/providers/manual';
import type { CreatePaymentInput } from '../src/types';

const input: CreatePaymentInput = {
  orderId: 'order_1',
  referenceId: 'ref_1',
  amount: 18,
  currency: 'USD',
  payerPhone: '252612345678',
  wallet: 'evc',
  description: 'Order #1',
};

function setup(overrides: Partial<Parameters<typeof createManualProvider>[0]> = {}) {
  let time = 0;
  const provider = createManualProvider({
    merchantNumbers: { evc: '+252 61 999 8888', zaad: '631112222' },
    now: () => time,
    ...overrides,
  });
  return { provider, advanceHours: (h: number) => (time += h * 60 * 60 * 1000) };
}

describe('createManualProvider: setup', () => {
  it('lists only wallets with a number, in display order', () => {
    const { provider } = setup();
    expect(provider.id).toBe('manual');
    expect(provider.wallets).toEqual(['evc', 'zaad']);
  });

  it('ignores blank numbers', () => {
    const provider = createManualProvider({ merchantNumbers: { evc: '612345678', sahal: '' } });
    expect(provider.wallets).toEqual(['evc']);
  });

  it.each([
    [{ merchantNumbers: {} }, 'at least one'],
    [{ merchantNumbers: { evc: '123' } }, 'merchantNumbers.evc'],
    [{ merchantNumbers: { mpesa: '612345678' } as never }, 'unknown wallet'],
    [{ merchantNumbers: { evc: '612345678' }, expiryHours: 0 }, 'expiryHours'],
  ])('rejects bad config %#', (options, text) => {
    expect(() => createManualProvider(options)).toThrow(SomPayError);
    expect(() => createManualProvider(options)).toThrow(text);
  });

  it('does not echo the merchant number in config errors', () => {
    expect(() => createManualProvider({ merchantNumbers: { evc: '61999' } })).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining('61999') }),
    );
  });
});

describe('createPayment', () => {
  it('returns awaiting_proof with payment instructions', async () => {
    const { provider } = setup();
    const result = await provider.createPayment(input);
    expect(result).toEqual({
      referenceId: 'ref_1',
      status: 'awaiting_proof',
      instructions: {
        wallet: 'evc',
        number: '619998888',
        amount: 18,
        currency: 'USD',
        ussdCode: '*712*619998888*18#',
        ussdLink: 'tel:*712*619998888*18%23',
      },
    });
  });

  it('gives no USSD code for wallets without a known pattern', async () => {
    const { provider } = setup();
    const result = await provider.createPayment({ ...input, wallet: 'zaad' });
    expect(result.instructions).toMatchObject({
      number: '631112222',
      ussdCode: null,
      ussdLink: null,
    });
  });

  it('rejects a wallet the merchant has no number for', async () => {
    const { provider } = setup();
    await expect(provider.createPayment({ ...input, wallet: 'sahal' })).rejects.toMatchObject({
      code: 'WALLET_NOT_SUPPORTED',
    });
    await expect(provider.createPayment({ ...input, wallet: 'card' })).rejects.toMatchObject({
      code: 'WALLET_NOT_SUPPORTED',
    });
  });

  it('rejects an invalid payer phone', async () => {
    const { provider } = setup();
    await expect(provider.createPayment({ ...input, payerPhone: '123' })).rejects.toMatchObject({
      code: 'INVALID_NUMBER',
    });
  });
});

describe('idempotency', () => {
  it('returns the same payment for a repeated referenceId (double tap)', async () => {
    const { provider } = setup();
    const first = await provider.createPayment(input);
    const second = await provider.createPayment({ ...input });
    expect(second).toEqual(first);
  });

  it('rejects a reused referenceId with different details', async () => {
    const { provider } = setup();
    await provider.createPayment(input);
    await expect(provider.createPayment({ ...input, amount: 1 })).rejects.toMatchObject({
      code: 'DUPLICATE_REFERENCE',
    });
  });

  it('returned results cannot change the stored payment', async () => {
    const { provider } = setup();
    const first = await provider.createPayment(input);
    first.status = 'paid';
    expect(await provider.checkStatus('ref_1')).toBe('awaiting_proof');
  });

  it('forgets the oldest payment past maxTracked', async () => {
    const { provider } = setup({ maxTracked: 2 });
    await provider.createPayment({ ...input, referenceId: 'a' });
    await provider.createPayment({ ...input, referenceId: 'b' });
    await provider.createPayment({ ...input, referenceId: 'c' });
    await expect(provider.checkStatus('a')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(await provider.checkStatus('c')).toBe('awaiting_proof');
  });
});

describe('checkStatus', () => {
  it('throws NOT_FOUND for an unknown reference', async () => {
    const { provider } = setup();
    await expect(provider.checkStatus('nope')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('expires after 24 hours by default', async () => {
    const { provider, advanceHours } = setup();
    await provider.createPayment(input);
    advanceHours(23.9);
    expect(await provider.checkStatus('ref_1')).toBe('awaiting_proof');
    advanceHours(0.1);
    expect(await provider.checkStatus('ref_1')).toBe('expired');
    expect((await provider.createPayment(input)).status).toBe('expired');
  });

  it('honours a custom expiry window', async () => {
    const { provider, advanceHours } = setup({ expiryHours: 1 });
    await provider.createPayment(input);
    advanceHours(1);
    expect(await provider.checkStatus('ref_1')).toBe('expired');
  });
});
