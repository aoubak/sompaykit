import { describe, expect, it } from 'vitest';
import {
  PAYMENT_STATUSES,
  isFinalStatus,
  isPaymentStatus,
  toClientResult,
} from '../src/payment-status';

describe('isPaymentStatus', () => {
  it('accepts every status and rejects anything else', () => {
    for (const status of PAYMENT_STATUSES) expect(isPaymentStatus(status)).toBe(true);
    expect(isPaymentStatus('done')).toBe(false);
    expect(isPaymentStatus(undefined)).toBe(false);
    expect(isPaymentStatus(1)).toBe(false);
  });
});

describe('isFinalStatus', () => {
  it('treats paid, failed and expired as final', () => {
    expect(PAYMENT_STATUSES.filter(isFinalStatus)).toEqual(['paid', 'failed', 'expired']);
  });
});

describe('toClientResult', () => {
  it('drops the raw gateway response and keeps everything else', () => {
    const client = toClientResult({
      referenceId: 'ref_1',
      status: 'failed',
      errorCode: 'DECLINED',
      providerTxnId: 'txn_1',
      raw: { secret: 'merchant data' },
    });
    expect(client).toEqual({
      referenceId: 'ref_1',
      status: 'failed',
      errorCode: 'DECLINED',
      providerTxnId: 'txn_1',
    });
    expect('raw' in client).toBe(false);
  });
});
