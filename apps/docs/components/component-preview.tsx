'use client';

import type { Locale } from '@sompaykit/core';
import { useState, useSyncExternalStore, type ComponentType } from 'react';
import { cn } from '@/lib/utils';
import { CheckoutFormDemo } from './previews/checkout-form';
import { ManualPayCardDemo } from './previews/manual-pay-card';
import { PaymentStatusDemo } from './previews/payment-status';
import { WalletPickerDemo } from './previews/wallet-picker';

export interface DemoProps {
  locale: Locale;
}

const DEMOS = {
  'checkout-form': CheckoutFormDemo,
  'wallet-picker': WalletPickerDemo,
  'manual-pay-card': ManualPayCardDemo,
  'payment-status': PaymentStatusDemo,
} satisfies Record<string, ComponentType<DemoProps>>;

const LOCALES: readonly { id: Locale; label: string }[] = [
  { id: 'so', label: 'Soomaali' },
  { id: 'en', label: 'English' },
  { id: 'ar', label: 'العربية' },
];

const noop = () => () => {};

/** True in the browser only. Previews use the clock and the clipboard, so they skip prerender. */
function useIsClient(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

export function ComponentPreview({ name }: { name: keyof typeof DEMOS }) {
  const [locale, setLocale] = useState<Locale>('so');
  const isClient = useIsClient();
  const Demo = DEMOS[name];

  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
        <span className="text-sm font-medium text-muted-foreground">Live preview</span>
        <div role="group" aria-label="Language" className="flex rounded-lg bg-muted p-0.5">
          {LOCALES.map((item) => (
            <button
              key={item.id}
              type="button"
              lang={item.id}
              aria-pressed={locale === item.id}
              onClick={() => setLocale(item.id)}
              className={cn(
                'min-h-8 rounded-md px-2.5 text-xs font-medium transition-colors',
                locale === item.id
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-background px-4 py-8 text-foreground">
        <div className="mx-auto w-full max-w-sm">
          {isClient ? (
            <Demo locale={locale} />
          ) : (
            <div className="h-96 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
          )}
        </div>
      </div>
    </div>
  );
}
