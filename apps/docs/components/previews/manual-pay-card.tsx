'use client';

import type { MobileWallet } from '@sompaykit/core';
import { useState } from 'react';
import { ManualPayCard, type PaymentProof } from '@/components/sompaykit/manual-pay-card';
import { PaymentStatusCard } from '@/components/sompaykit/payment-status';
import { cn } from '@/lib/utils';
import type { DemoProps } from '../component-preview';
import { DEMO_AMOUNT, demoInstructions, wait } from './mock-server';

const WALLET_TABS: readonly MobileWallet[] = ['evc', 'zaad', 'sahal', 'edahab'];

export function ManualPayCardDemo({ locale }: DemoProps) {
  const [wallet, setWallet] = useState<MobileWallet>('evc');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState<PaymentProof | null>(null);

  async function onSubmitProof(proof: PaymentProof) {
    setIsSubmitting(true);
    await wait(800);
    setIsSubmitting(false);
    setSent(proof);
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <PaymentStatusCard
          status="awaiting_confirmation"
          amount={DEMO_AMOUNT}
          currency="USD"
          wallet={wallet}
          locale={locale}
        />
        <p className="text-center text-xs text-muted-foreground">
          Sent transaction ID <code>{sent.transactionId}</code>.{' '}
          <button
            type="button"
            className="min-h-8 font-medium text-primary hover:underline"
            onClick={() => setSent(null)}
          >
            Start over
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        role="group"
        aria-label="Wallet"
        className="flex gap-1 self-center rounded-lg bg-muted p-0.5"
      >
        {WALLET_TABS.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={wallet === id}
            onClick={() => setWallet(id)}
            className={cn(
              'min-h-8 rounded-md px-2.5 text-xs font-medium',
              wallet === id ? 'bg-card shadow-xs' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {id}
          </button>
        ))}
      </div>
      <ManualPayCard
        instructions={demoInstructions(wallet)}
        storeName="Hodan Store"
        locale={locale}
        isSubmitting={isSubmitting}
        onSubmitProof={onSubmitProof}
        whatsappUrl="https://wa.me/252612345678"
      />
    </div>
  );
}
