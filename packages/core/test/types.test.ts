import { describe, expectTypeOf, it } from 'vitest';
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  MobileWallet,
  PaymentProvider,
  PaymentStatus,
  Wallet,
} from '../src/types';

describe('types', () => {
  it('MobileWallet excludes card', () => {
    expectTypeOf<MobileWallet>().toEqualTypeOf<'evc' | 'zaad' | 'sahal' | 'edahab'>();
    expectTypeOf<'card'>().toExtend<Wallet>();
  });

  it('PaymentStatus includes the manual-mode states', () => {
    expectTypeOf<'awaiting_proof'>().toExtend<PaymentStatus>();
    expectTypeOf<'awaiting_confirmation'>().toExtend<PaymentStatus>();
  });

  it('a provider object satisfies PaymentProvider', () => {
    const provider = {
      id: 'manual',
      createPayment: async (input: CreatePaymentInput): Promise<CreatePaymentResult> => ({
        referenceId: input.referenceId,
        status: 'pending',
      }),
      checkStatus: async (): Promise<PaymentStatus> => 'pending',
    } satisfies PaymentProvider;
    expectTypeOf(provider).toExtend<PaymentProvider>();
  });
});
