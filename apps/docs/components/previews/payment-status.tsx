'use client';

import { PAYMENT_STATUSES, type PaymentStatus } from '@sompaykit/core';
import { useState } from 'react';
import { PaymentStatusBadge, PaymentStatusCard } from '@/components/sompaykit/payment-status';
import { cn } from '@/lib/utils';
import type { DemoProps } from '../component-preview';
import { DEMO_AMOUNT } from './mock-server';

const CHOICES: readonly (PaymentStatus | null)[] = [null, ...PAYMENT_STATUSES];
const PIN_WINDOW_MS = 2 * 60 * 1000;

export function PaymentStatusDemo({ locale }: DemoProps) {
  const [status, setStatus] = useState<PaymentStatus | null>('pending');
  const [expiresAt, setExpiresAt] = useState(() => Date.now() + PIN_WINDOW_MS);

  function pick(next: PaymentStatus | null) {
    setStatus(next);
    if (next === 'pending') setExpiresAt(Date.now() + PIN_WINDOW_MS);
  }

  return (
    <div className="flex flex-col gap-6">
      <div role="group" aria-label="Status" className="flex flex-wrap justify-center gap-1">
        {CHOICES.map((choice) => (
          <button
            key={choice ?? 'null'}
            type="button"
            aria-pressed={status === choice}
            onClick={() => pick(choice)}
            className={cn(
              'min-h-8 rounded-md border px-2 font-mono text-[11px]',
              status === choice
                ? 'border-primary bg-primary-muted text-primary-muted-foreground'
                : 'bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            {choice ?? 'null'}
          </button>
        ))}
      </div>

      <PaymentStatusCard
        status={status}
        errorCode={status === 'failed' ? 'INSUFFICIENT_FUNDS' : null}
        amount={DEMO_AMOUNT}
        currency="USD"
        wallet="evc"
        phone="612345678"
        expiresAt={expiresAt}
        locale={locale}
        onRetry={() => pick('pending')}
        onChangeWallet={() => pick('pending')}
      />

      <div className="flex flex-col gap-2 border-t pt-4">
        <span className="text-xs font-medium text-muted-foreground">PaymentStatusBadge</span>
        <div className="flex flex-wrap gap-1.5">
          {PAYMENT_STATUSES.map((s) => (
            <PaymentStatusBadge key={s} status={s} locale={locale} />
          ))}
        </div>
      </div>
    </div>
  );
}
