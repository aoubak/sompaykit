import type { ClientPaymentResult } from '@sompaykit/core';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  PaymentRequestError,
  type ChargeFn,
  type ChargeRequestBody,
  type StatusFn,
} from '../src/client';
import { pickReferenceId, usePayment } from '../src/use-payment';
import { usePaymentStatus } from '../src/use-payment-status';

const ids = () => {
  let n = 0;
  return () => `spk_${++n}`;
};

describe('pickReferenceId', () => {
  const create = ids();
  it('reuses the ID only to resend the same request after an unknown outcome', () => {
    const last = { referenceId: 'spk_old', requestKey: 'a', errorCode: 'NETWORK_ERROR' as const };
    expect(pickReferenceId(last, 'a', create)).toBe('spk_old');
    expect(pickReferenceId(last, 'b', create)).not.toBe('spk_old');
    expect(pickReferenceId({ ...last, errorCode: 'DECLINED' }, 'a', create)).not.toBe('spk_old');
    expect(pickReferenceId({ ...last, errorCode: null }, 'a', create)).not.toBe('spk_old');
    expect(pickReferenceId(null, 'a', create)).toMatch(/^spk_/);
  });
});

describe('usePayment', () => {
  it('sends the normalized request with a referenceId and stores the result', async () => {
    const charge = vi.fn<ChargeFn>(async (body) => ({
      referenceId: body.referenceId,
      status: 'awaiting_proof',
    }));
    const { result } = renderHook(() => usePayment({ charge, createReferenceId: ids() }));

    let returned: ClientPaymentResult | null = null;
    await act(async () => {
      returned = await result.current.pay({
        phone: '061 234 5678',
        wallet: 'evc',
        orderId: 'o1',
        customerName: '  Hodan Ali ',
      });
    });

    expect(charge.mock.calls[0]?.[0]).toEqual({
      phone: '252612345678',
      wallet: 'evc',
      orderId: 'o1',
      customerName: 'Hodan Ali',
      referenceId: 'spk_1',
    });
    expect(returned).toEqual({ referenceId: 'spk_1', status: 'awaiting_proof' });
    expect(result.current).toMatchObject({
      isSubmitting: false,
      referenceId: 'spk_1',
      errorCode: null,
      result: { status: 'awaiting_proof' },
    });
  });

  it('catches a bad phone number without calling the server', async () => {
    const charge = vi.fn<ChargeFn>();
    const { result } = renderHook(() => usePayment({ charge }));
    await act(async () => {
      await result.current.pay({ phone: '12' });
    });
    expect(charge).not.toHaveBeenCalled();
    expect(result.current.errorCode).toBe('INVALID_NUMBER');
  });

  it('ignores a double tap while a payment is running', async () => {
    let finish: (r: ClientPaymentResult) => void = () => {};
    const charge = vi.fn<ChargeFn>(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const { result } = renderHook(() => usePayment({ charge, createReferenceId: ids() }));

    let first!: Promise<unknown>;
    let second!: Promise<unknown>;
    act(() => {
      first = result.current.pay({ phone: '612345678' });
      second = result.current.pay({ phone: '612345678' });
    });
    expect(result.current.isSubmitting).toBe(true);
    expect(second).toBe(first);
    await act(async () => {
      finish({ referenceId: 'spk_1', status: 'pending' });
      await first;
    });
    expect(charge).toHaveBeenCalledTimes(1);
  });

  it('resends with the same referenceId after a connection problem', async () => {
    const charge = vi
      .fn<ChargeFn>()
      .mockRejectedValueOnce(new PaymentRequestError('NETWORK_ERROR'))
      .mockImplementation(async (body) => ({ referenceId: body.referenceId, status: 'pending' }));
    const { result } = renderHook(() => usePayment({ charge, createReferenceId: ids() }));

    await act(async () => {
      await result.current.pay({ phone: '612345678' });
    });
    expect(result.current.errorCode).toBe('NETWORK_ERROR');
    await act(async () => {
      await result.current.pay({ phone: '612345678' });
    });
    const refs = charge.mock.calls.map(([body]) => (body as ChargeRequestBody).referenceId);
    expect(refs).toEqual(['spk_1', 'spk_1']);
    expect(result.current.errorCode).toBeNull();
  });

  it('shows the errorCode of a failed payment, and reset() starts over', async () => {
    const charge = vi.fn<ChargeFn>(async (body) => ({
      referenceId: body.referenceId,
      status: 'failed',
      errorCode: 'INSUFFICIENT_FUNDS',
    }));
    const { result } = renderHook(() => usePayment({ charge, createReferenceId: ids() }));
    await act(async () => {
      await result.current.pay({ phone: '612345678' });
    });
    expect(result.current.errorCode).toBe('INSUFFICIENT_FUNDS');

    act(() => result.current.reset());
    expect(result.current).toMatchObject({ result: null, errorCode: null, referenceId: null });
  });

  it('posts to a URL when given one', async () => {
    const fetch = vi.fn(
      async () => new Response(JSON.stringify({ referenceId: 'spk_1', status: 'pending' })),
    );
    const { result } = renderHook(() =>
      usePayment({ charge: '/api/pay', fetch, createReferenceId: ids() }),
    );
    await act(async () => {
      await result.current.pay({ phone: '612345678' });
    });
    expect(fetch).toHaveBeenCalledWith('/api/pay', expect.objectContaining({ method: 'POST' }));
    expect(result.current.result?.status).toBe('pending');
  });
});

describe('usePaymentStatus', () => {
  it('polls until the payment is final', async () => {
    const answers = ['pending', 'paid'] as const;
    let calls = 0;
    const check = vi.fn<StatusFn>(async () => ({ status: answers[calls++] ?? 'paid' }));
    const { result } = renderHook(() => usePaymentStatus('spk_1', { check, intervalMs: 10 }));

    await waitFor(() => expect(result.current.status).toBe('paid'));
    expect(result.current.isFinal).toBe(true);
    await new Promise((r) => setTimeout(r, 50));
    expect(check).toHaveBeenCalledTimes(2);
  });

  it('does nothing without a referenceId, when disabled, or when already final', async () => {
    const check = vi.fn<StatusFn>(async () => ({ status: 'pending' }));
    renderHook(() => usePaymentStatus(null, { check }));
    renderHook(() => usePaymentStatus('spk_1', { check, enabled: false }));
    const { result } = renderHook(() =>
      usePaymentStatus('spk_1', { check, initialStatus: 'paid' }),
    );
    await new Promise((r) => setTimeout(r, 20));
    expect(check).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({ status: 'paid', isFinal: true });
  });

  it('reports a failed payment and connection problems separately', async () => {
    const check = vi
      .fn<StatusFn>()
      .mockRejectedValueOnce(new PaymentRequestError('NETWORK_ERROR'))
      .mockResolvedValue({ status: 'failed', errorCode: 'DECLINED' });
    const { result } = renderHook(() =>
      // After the error the wait doubles to 400 ms, long enough to see the notice.
      usePaymentStatus('spk_1', { check, intervalMs: 200, initialStatus: 'pending' }),
    );

    await waitFor(() => expect(result.current.requestError).toBe('NETWORK_ERROR'));
    expect(result.current.status).toBe('pending');
    await waitFor(() => expect(result.current.status).toBe('failed'));
    expect(result.current).toMatchObject({ errorCode: 'DECLINED', requestError: null });
  });

  it('starts clean when the referenceId changes', async () => {
    const check = vi.fn<StatusFn>(async (id) => ({ status: id === 'a' ? 'paid' : 'pending' }));
    const { result, rerender } = renderHook(({ id }) => usePaymentStatus(id, { check }), {
      initialProps: { id: 'a' },
    });
    await waitFor(() => expect(result.current.status).toBe('paid'));
    rerender({ id: 'b' });
    expect(result.current.status).toBeNull();
    await waitFor(() => expect(result.current.status).toBe('pending'));
  });
});
