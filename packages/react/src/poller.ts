/**
 * Polls a payment's status until it is final (paid, failed, expired). Framework-free so it can be
 * tested on its own; `usePaymentStatus` wraps it.
 */
import { isFinalStatus, type ErrorCode } from '@sompaykit/core';
import { toErrorCode, type StatusFn, type StatusResponse } from './client';

export interface StatusPollerOptions {
  referenceId: string;
  check: StatusFn;
  /** Wait between checks. */
  intervalMs: number;
  /** After failed requests the wait doubles, up to this. */
  maxIntervalMs: number;
  onStatus: (response: StatusResponse) => void;
  /** A check failed (e.g. no signal). Polling continues with a longer wait. */
  onRequestError: (code: ErrorCode) => void;
}

export interface StatusPoller {
  /** Check now instead of waiting. Ignored while a check is running or after the end. */
  refresh(): void;
  stop(): void;
}

export function startStatusPoller(options: StatusPollerOptions): StatusPoller {
  let stopped = false;
  let running = false;
  let delay = options.intervalMs;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;

  function schedule(): void {
    if (!stopped) timer = setTimeout(() => void tick(), delay);
  }

  async function tick(): Promise<void> {
    timer = undefined;
    running = true;
    controller = new AbortController();
    try {
      const response = await options.check(options.referenceId, controller.signal);
      if (stopped) return;
      delay = options.intervalMs;
      options.onStatus(response);
      if (isFinalStatus(response.status)) {
        stopped = true;
        return;
      }
    } catch (error) {
      if (stopped) return;
      options.onRequestError(toErrorCode(error));
      delay = Math.min(delay * 2, options.maxIntervalMs);
    } finally {
      running = false;
    }
    schedule();
  }

  void tick();

  return {
    refresh() {
      if (stopped || running) return;
      if (timer !== undefined) clearTimeout(timer);
      void tick();
    },
    stop() {
      stopped = true;
      if (timer !== undefined) clearTimeout(timer);
      controller?.abort();
    },
  };
}
