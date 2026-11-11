'use client';

import { MOBILE_WALLETS, WALLETS, type Locale, type MobileWallet } from '@sompaykit/core';
import { useId } from 'react';
import { getMessages } from '@/lib/sompaykit-i18n';
import { cn } from '@/lib/utils';

export interface WalletPickerProps {
  value: MobileWallet | null;
  onChange: (wallet: MobileWallet) => void;
  /** Wallets to offer, in order. Default: EVC Plus, Zaad, Sahal, eDahab. */
  wallets?: readonly MobileWallet[];
  locale?: Locale;
  /** Overrides the "Pay with" legend. */
  legend?: string;
  /** Form field name. */
  name?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Radio cards with wallet name and operator. Native radios underneath, so arrow keys, forms and
 * screen readers work as expected.
 */
export function WalletPicker({
  value,
  onChange,
  wallets = MOBILE_WALLETS,
  locale = 'so',
  legend,
  name,
  disabled = false,
  className,
}: WalletPickerProps) {
  const t = getMessages(locale);
  const fallbackName = useId();

  return (
    <fieldset className={cn('flex flex-col gap-2', className)} disabled={disabled}>
      <legend className="mb-2 text-sm font-medium">{legend ?? t.wallet.legend}</legend>
      <div className="grid grid-cols-2 gap-2">
        {wallets.map((id) => {
          const wallet = WALLETS[id];
          const selected = value === id;
          return (
            <label
              key={id}
              className={cn(
                'flex min-h-15 cursor-pointer items-center gap-2.5 rounded-xl border bg-card px-3 py-2.5 text-start text-card-foreground transition-colors',
                'has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-ring',
                'has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50',
                selected
                  ? 'border-2 border-primary ring-3 ring-primary-muted'
                  : 'border-input hover:bg-accent',
              )}
            >
              <input
                type="radio"
                className="sr-only"
                name={name ?? fallbackName}
                value={id}
                checked={selected}
                onChange={() => onChange(id)}
              />
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground"
              >
                {wallet.short}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[15px] font-semibold">{wallet.name}</span>
                {wallet.operator && (
                  <span className="text-xs text-muted-foreground">{wallet.operator}</span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
