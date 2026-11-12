import { describe, expectTypeOf, it } from 'vitest';
import type {
  CheckoutInput,
  CheckoutResult,
  CreatePaymentInput,
  CreatePaymentResult,
  HostedCheckoutProvider,
  MobileWallet,
  PaymentProvider,
  PaymentStatus,
  VerifyInput,
  VerifyResult,
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

  it('a payment-page provider satisfies HostedCheckoutProvider without a phone number', () => {
    const provider = {
      id: 'sifalopay',
      createCheckout: async (_input: CheckoutInput): Promise<CheckoutResult> => ({
        redirectUrl: 'https://pay.example/checkout',
      }),
      verifyPayment: async (input: VerifyInput): Promise<VerifyResult> => ({
        status: 'pending',
        sid: input.sid ?? null,
        amount: null,
        currency: null,
        paymentType: null,
      }),
    } satisfies HostedCheckoutProvider;
    expectTypeOf(provider).toExtend<HostedCheckoutProvider>();
    expectTypeOf<CheckoutInput>().not.toHaveProperty('payerPhone');
    expectTypeOf<VerifyResult['status']>().toEqualTypeOf<'paid' | 'pending' | 'failed'>();
  });
});
