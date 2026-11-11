'use client';

import type { ClientPaymentResult } from '@sompaykit/core';
import { useState } from 'react';
import { CheckoutForm } from '@/components/sompaykit/checkout-form';
import type { DemoProps } from '../component-preview';
import { DECLINE_NUMBER, DEMO_AMOUNT, demoCharge } from './mock-server';

export function CheckoutFormDemo({ locale }: DemoProps) {
  const [result, setResult] = useState<ClientPaymentResult | null>(null);
  // Remount the form on "Start over" so it forgets the last attempt.
  const [attempt, setAttempt] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      <CheckoutForm
        key={attempt}
        charge={demoCharge}
        amount={DEMO_AMOUNT}
        currency="USD"
        itemCount={2}
        locale={locale}
        onResult={setResult}
      />
      <p className="text-xs text-muted-foreground">
        Try <code>61 234 5678</code> (EVC Plus) or <code>63 …</code> (Zaad). Pay from{' '}
        <code>{DECLINE_NUMBER}</code> to see a decline.
      </p>
      {result && (
        <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-medium">Server answered</span>
            <button
              type="button"
              className="min-h-8 rounded-md px-2 font-medium text-primary hover:bg-primary-muted"
              onClick={() => {
                setResult(null);
                setAttempt((n) => n + 1);
              }}
            >
              Start over
            </button>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-muted p-2">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
