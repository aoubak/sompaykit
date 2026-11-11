import {
  isWallet,
  normalizePhone,
  type ClientPaymentResult,
  type ErrorCode,
} from '@sompaykit/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PaymentRequestError,
  chargeViaUrl,
  createReferenceId,
  toErrorCode,
  type ChargeFn,
  type PayRequest,
  type TransportOptions,
} from './client';

export interface UsePaymentOptions extends TransportOptions {
  /** Your charge API route (e.g. `'/api/pay'`), or your own function that calls it. */
  charge: string | ChargeFn;
  /** Makes a new referenceId per attempt. Default: `spk_` + 32 random hex characters. */
  createReferenceId?: () => string;
}

export interface UsePaymentResult {
  /**
   * Starts a payment. A second call while one is running returns the same promise, so a
   * double-tapped Pay button never charges twice. Resolves to the result, or null on error.
   */
  pay(request: PayRequest): Promise<ClientPaymentResult | null>;
  /** Clears everything for a fresh attempt (e.g. "Use another wallet"). */
  reset(): void;
  isSubmitting: boolean;
  result: ClientPaymentResult | null;
  /**
   * What went wrong: bad input, a failed request, or a failed payment (`result.errorCode`).
   * Show it with `message(errorCode, locale)` from `@sompaykit/core`.
   */
  errorCode: ErrorCode | null;
  /** The current attempt's referenceId, for `usePaymentStatus`. */
  referenceId: string | null;
}

interface State {
  isSubmitting: boolean;
  result: ClientPaymentResult | null;
  errorCode: ErrorCode | null;
  referenceId: string | null;
}

const IDLE: State = { isSubmitting: false, result: null, errorCode: null, referenceId: null };

/** Errors where we can't know if the server created the payment: resend with the same ID. */
const UNKNOWN_OUTCOME: readonly ErrorCode[] = ['NETWORK_ERROR', 'PROVIDER_ERROR', 'TIMEOUT'];

interface LastAttempt {
  referenceId: string;
  requestKey: string;
  errorCode: ErrorCode | null;
}

/**
 * Picks the referenceId for an attempt. Resending the exact same request after a connection
 * problem reuses the previous ID, so the server returns the payment it may already have made
 * instead of creating a second one. Anything else gets a fresh ID.
 */
export function pickReferenceId(
  last: LastAttempt | null,
  requestKey: string,
  create: () => string,
): string {
  if (
    last !== null &&
    last.requestKey === requestKey &&
    last.errorCode !== null &&
    UNKNOWN_OUTCOME.includes(last.errorCode)
  ) {
    return last.referenceId;
  }
  return create();
}

/** Checks the request in the browser so obvious mistakes never reach the network. */
function prepare(request: PayRequest): PayRequest {
  const phone = normalizePhone(request.phone);
  if (phone === null) throw new PaymentRequestError('INVALID_NUMBER');
  const prepared: PayRequest = { phone };
  if (request.wallet !== undefined) {
    if (!isWallet(request.wallet)) throw new PaymentRequestError('WALLET_NOT_SUPPORTED');
    prepared.wallet = request.wallet;
  }
  if (request.orderId !== undefined) prepared.orderId = request.orderId;
  const customerName = request.customerName?.trim();
  if (customerName) prepared.customerName = customerName;
  return prepared;
}

export function usePayment(options: UsePaymentOptions): UsePaymentResult {
  const [state, setState] = useState<State>(IDLE);
  const optionsRef = useRef(options);
  const inFlight = useRef<Promise<ClientPaymentResult | null> | null>(null);
  const controller = useRef<AbortController | null>(null);
  const last = useRef<LastAttempt | null>(null);

  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(
    () => () => {
      controller.current?.abort();
    },
    [],
  );

  const pay = useCallback((request: PayRequest): Promise<ClientPaymentResult | null> => {
    if (inFlight.current) return inFlight.current;

    let prepared: PayRequest;
    try {
      prepared = prepare(request);
    } catch (error) {
      setState({ ...IDLE, errorCode: toErrorCode(error) });
      return Promise.resolve(null);
    }

    const opts = optionsRef.current;
    const requestKey = JSON.stringify(prepared);
    const referenceId = pickReferenceId(
      last.current,
      requestKey,
      opts.createReferenceId ?? createReferenceId,
    );
    const charge = typeof opts.charge === 'string' ? chargeViaUrl(opts.charge, opts) : opts.charge;
    const abort = new AbortController();
    controller.current = abort;
    setState({ isSubmitting: true, result: null, errorCode: null, referenceId });

    const attempt = (async () => {
      try {
        const result = await charge({ ...prepared, referenceId }, abort.signal);
        if (abort.signal.aborted) return null;
        last.current = { referenceId, requestKey, errorCode: null };
        setState({
          isSubmitting: false,
          result,
          errorCode: result.errorCode ?? null,
          referenceId,
        });
        return result;
      } catch (error) {
        if (abort.signal.aborted) return null;
        const errorCode = toErrorCode(error);
        last.current = { referenceId, requestKey, errorCode };
        setState({ isSubmitting: false, result: null, errorCode, referenceId });
        return null;
      } finally {
        // Skip if reset() already started over with a new attempt.
        if (controller.current === abort) inFlight.current = null;
      }
    })();
    inFlight.current = attempt;
    return attempt;
  }, []);

  const reset = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
    inFlight.current = null;
    last.current = null;
    setState(IDLE);
  }, []);

  return { ...state, pay, reset };
}
