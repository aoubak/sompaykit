import { describe, expect, it, vi } from 'vitest';
import {
  PaymentRequestError,
  chargeViaUrl,
  createReferenceId,
  statusViaUrl,
  toErrorCode,
} from '../src/client';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const signal = () => new AbortController().signal;
const body = { phone: '252612345678', wallet: 'evc' as const, referenceId: 'spk_1' };

describe('chargeViaUrl', () => {
  it('POSTs the request as JSON and returns the result', async () => {
    const fetch = vi.fn(async () => json({ referenceId: 'spk_1', status: 'awaiting_proof' }));
    const charge = chargeViaUrl('/api/pay', { fetch, headers: { 'X-CSRF': 't' } });

    await expect(charge(body, signal())).resolves.toEqual({
      referenceId: 'spk_1',
      status: 'awaiting_proof',
    });
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/pay');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual(body);
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json', 'X-CSRF': 't' });
  });

  it('never sends an amount', async () => {
    const fetch = vi.fn(async () => json({ referenceId: 'spk_1', status: 'pending' }));
    await chargeViaUrl('/api/pay', { fetch })(body, signal());
    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).not.toHaveProperty('amount');
  });

  it('turns an error response into its ErrorCode', async () => {
    const fetch = vi.fn(async () => json({ errorCode: 'WALLET_NOT_SUPPORTED' }, 400));
    await expect(chargeViaUrl('/api/pay', { fetch })(body, signal())).rejects.toMatchObject({
      code: 'WALLET_NOT_SUPPORTED',
    });
  });

  it('uses PROVIDER_ERROR for an error response without a known code', async () => {
    const fetch = vi.fn(async () => new Response('Bad gateway', { status: 502 }));
    await expect(chargeViaUrl('/api/pay', { fetch })(body, signal())).rejects.toMatchObject({
      code: 'PROVIDER_ERROR',
    });
  });

  it('rejects a response that is not a payment result', async () => {
    const fetch = vi.fn(async () => json({ ok: true }));
    await expect(chargeViaUrl('/api/pay', { fetch })(body, signal())).rejects.toMatchObject({
      code: 'PROVIDER_ERROR',
    });
  });

  it('reports NETWORK_ERROR when the request fails or times out', async () => {
    const offline = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
    await expect(
      chargeViaUrl('/api/pay', { fetch: offline })(body, signal()),
    ).rejects.toMatchObject({ code: 'NETWORK_ERROR' });

    const slow = vi.fn(
      (_url: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('', 'AbortError')));
        }),
    );
    await expect(
      chargeViaUrl('/api/pay', { fetch: slow, timeoutMs: 10 })(body, signal()),
    ).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });

  it("passes the caller's own abort through untouched", async () => {
    const controller = new AbortController();
    const fetch = vi.fn(async () => {
      controller.abort();
      throw new DOMException('', 'AbortError');
    });
    await expect(chargeViaUrl('/api/pay', { fetch })(body, controller.signal)).rejects.toThrow(
      DOMException,
    );
  });
});

describe('statusViaUrl', () => {
  it('GETs with the referenceId in the query', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => json({ status: 'pending' }));
    await expect(statusViaUrl('/api/status', { fetch })('spk 1', signal())).resolves.toEqual({
      status: 'pending',
    });
    expect(fetch.mock.calls[0]?.[0]).toBe('/api/status?referenceId=spk%201');

    await statusViaUrl('/api/status?shop=2', { fetch })('a', signal());
    expect(fetch.mock.calls[1]?.[0]).toBe('/api/status?shop=2&referenceId=a');
  });

  it('keeps a known errorCode and ignores unknown ones', async () => {
    const failed = vi.fn(async () => json({ status: 'failed', errorCode: 'INSUFFICIENT_FUNDS' }));
    await expect(statusViaUrl('/s', { fetch: failed })('a', signal())).resolves.toEqual({
      status: 'failed',
      errorCode: 'INSUFFICIENT_FUNDS',
    });
    const odd = vi.fn(async () => json({ status: 'failed', errorCode: 'NOPE' }));
    await expect(statusViaUrl('/s', { fetch: odd })('a', signal())).resolves.toEqual({
      status: 'failed',
    });
  });

  it('rejects an unknown status', async () => {
    const fetch = vi.fn(async () => json({ status: 'done' }));
    await expect(statusViaUrl('/s', { fetch })('a', signal())).rejects.toMatchObject({
      code: 'PROVIDER_ERROR',
    });
  });
});

describe('toErrorCode', () => {
  it('reads codes from our errors and from SomPayError-like objects', () => {
    expect(toErrorCode(new PaymentRequestError('DECLINED'))).toBe('DECLINED');
    expect(toErrorCode({ code: 'INVALID_NUMBER' })).toBe('INVALID_NUMBER');
    expect(toErrorCode({ code: 'ECONNRESET' })).toBe('NETWORK_ERROR');
    expect(toErrorCode(new Error('boom'))).toBe('NETWORK_ERROR');
  });
});

describe('createReferenceId', () => {
  it('makes unique IDs that core accepts', () => {
    const a = createReferenceId();
    expect(a).toMatch(/^spk_[0-9a-f]{32}$/);
    expect(createReferenceId()).not.toBe(a);
  });
});
