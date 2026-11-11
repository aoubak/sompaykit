import { isFinalStatus, type ErrorCode, type PaymentStatus } from '@sompaykit/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { statusViaUrl, type StatusFn, type TransportOptions } from './client';
import { startStatusPoller, type StatusPoller } from './poller';

export interface UsePaymentStatusOptions extends TransportOptions {
  /** Your status API route (called as `?referenceId=…`), or your own function. */
  check: string | StatusFn;
  /** Wait between checks. Default 3000 ms. */
  intervalMs?: number;
  /** Longest wait after failed requests (the wait doubles each time). Default 30 000 ms. */
  maxIntervalMs?: number;
  /** Set false to pause polling. Default true. */
  enabled?: boolean;
  /** A status you already know (e.g. `usePayment().result.status`). If final, no polling. */
  initialStatus?: PaymentStatus;
}

export interface UsePaymentStatusResult {
  /** Latest known status, or null before the first answer. */
  status: PaymentStatus | null;
  /** Why the payment failed, when status is `failed`. */
  errorCode: ErrorCode | null;
  /** The last check failed (e.g. no signal). Polling keeps going; show a gentle notice. */
  requestError: ErrorCode | null;
  /** paid, failed or expired: polling has stopped. */
  isFinal: boolean;
  /** Check now, e.g. from a "Refresh" button. */
  refresh(): void;
}

interface State {
  referenceId: string | null;
  status: PaymentStatus | null;
  errorCode: ErrorCode | null;
  requestError: ErrorCode | null;
}

export const DEFAULT_INTERVAL_MS = 3000;
export const DEFAULT_MAX_INTERVAL_MS = 30_000;

/** Follows a payment until it is paid, failed or expired. Pass null until you have a referenceId. */
export function usePaymentStatus(
  referenceId: string | null | undefined,
  options: UsePaymentStatusOptions,
): UsePaymentStatusResult {
  const id = referenceId ?? null;
  const optionsRef = useRef(options);
  const poller = useRef<StatusPoller | null>(null);
  const initialStatus = options.initialStatus ?? null;
  const [state, setState] = useState<State>({
    referenceId: id,
    status: initialStatus,
    errorCode: null,
    requestError: null,
  });

  useEffect(() => {
    optionsRef.current = options;
  });

  // A new referenceId starts clean, without waiting for an effect.
  const current: State =
    state.referenceId === id
      ? state
      : { referenceId: id, status: initialStatus, errorCode: null, requestError: null };

  const enabled = options.enabled ?? true;
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
  const maxIntervalMs = options.maxIntervalMs ?? DEFAULT_MAX_INTERVAL_MS;
  const knownFinal = initialStatus !== null && isFinalStatus(initialStatus);

  useEffect(() => {
    if (id === null || !enabled || knownFinal) return;

    const check: StatusFn = (ref, signal) => {
      const opts = optionsRef.current;
      const fn = typeof opts.check === 'string' ? statusViaUrl(opts.check, opts) : opts.check;
      return fn(ref, signal);
    };

    const running = startStatusPoller({
      referenceId: id,
      check,
      intervalMs,
      maxIntervalMs,
      onStatus: (response) =>
        setState({
          referenceId: id,
          status: response.status,
          errorCode: response.errorCode ?? null,
          requestError: null,
        }),
      onRequestError: (code) =>
        setState((prev) => ({
          ...(prev.referenceId === id
            ? prev
            : { referenceId: id, status: initialStatus, errorCode: null }),
          requestError: code,
        })),
    });
    poller.current = running;
    return () => {
      running.stop();
      if (poller.current === running) poller.current = null;
    };
    // initialStatus is left out on purpose: it only matters when the referenceId changes.
  }, [id, enabled, knownFinal, intervalMs, maxIntervalMs]);

  const refresh = useCallback(() => poller.current?.refresh(), []);

  return {
    status: current.status,
    errorCode: current.errorCode,
    requestError: current.requestError,
    isFinal: current.status !== null && isFinalStatus(current.status),
    refresh,
  };
}
