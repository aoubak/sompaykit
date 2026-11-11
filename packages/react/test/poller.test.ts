import type { PaymentStatus } from '@sompaykit/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PaymentRequestError, type StatusResponse } from '../src/client';
import { startStatusPoller } from '../src/poller';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

/** A check that answers with the given steps in order (a status, or an error code to throw). */
function scripted(steps: (PaymentStatus | `error:${string}`)[]) {
  return vi.fn(async (): Promise<StatusResponse> => {
    const step = steps.shift() ?? 'pending';
    if (step.startsWith('error:')) throw new PaymentRequestError('NETWORK_ERROR');
    return { status: step as PaymentStatus };
  });
}

function setup(check: ReturnType<typeof scripted>) {
  const statuses: PaymentStatus[] = [];
  const errors: string[] = [];
  const poller = startStatusPoller({
    referenceId: 'spk_1',
    check,
    intervalMs: 1000,
    maxIntervalMs: 4000,
    onStatus: (r) => statuses.push(r.status),
    onRequestError: (code) => errors.push(code),
  });
  return { poller, statuses, errors };
}

describe('startStatusPoller', () => {
  it('checks right away, then every interval until the status is final', async () => {
    const check = scripted(['pending', 'pending', 'paid']);
    const { statuses } = setup(check);

    await vi.advanceTimersByTimeAsync(0);
    expect(statuses).toEqual(['pending']);
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(1000);
    expect(statuses).toEqual(['pending', 'pending', 'paid']);

    await vi.advanceTimersByTimeAsync(10_000);
    expect(check).toHaveBeenCalledTimes(3);
  });

  it('backs off after failed requests, up to the max, and resets on success', async () => {
    const check = scripted(['error:1', 'error:2', 'error:3', 'pending', 'pending']);
    const { errors, statuses } = setup(check);

    await vi.advanceTimersByTimeAsync(0); // error → wait 2000
    await vi.advanceTimersByTimeAsync(2000); // error → wait 4000
    await vi.advanceTimersByTimeAsync(4000); // error → wait 4000 (max)
    expect(errors).toHaveLength(3);
    await vi.advanceTimersByTimeAsync(3999);
    expect(check).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(1); // pending → back to 1000
    await vi.advanceTimersByTimeAsync(1000);
    expect(statuses).toEqual(['pending', 'pending']);
  });

  it('stop() ends polling and aborts the running check', async () => {
    let seen: AbortSignal | undefined;
    const check = vi.fn(
      (_id: string, signal: AbortSignal) =>
        new Promise<StatusResponse>(() => {
          seen = signal;
        }),
    );
    const poller = startStatusPoller({
      referenceId: 'spk_1',
      check,
      intervalMs: 1000,
      maxIntervalMs: 4000,
      onStatus: vi.fn(),
      onRequestError: vi.fn(),
    });
    poller.stop();
    expect(seen?.aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(5000);
    expect(check).toHaveBeenCalledTimes(1);
  });

  it('refresh() checks now instead of waiting', async () => {
    const check = scripted(['pending', 'awaiting_confirmation']);
    const { poller, statuses } = setup(check);
    await vi.advanceTimersByTimeAsync(0);
    poller.refresh();
    await vi.advanceTimersByTimeAsync(0);
    expect(statuses).toEqual(['pending', 'awaiting_confirmation']);
    poller.stop();
  });
});
