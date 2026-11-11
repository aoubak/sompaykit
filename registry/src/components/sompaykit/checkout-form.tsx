'use client';

import {
  MOBILE_WALLETS,
  WALLETS,
  detectWallet,
  message,
  type ClientPaymentResult,
  type Currency,
  type ErrorCode,
  type Locale,
  type MobileWallet,
} from '@sompaykit/core';
import { usePayment, type UsePaymentOptions } from '@sompaykit/react';
import { useId, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoaderIcon } from '@/components/sompaykit/icons';
import { WalletPicker } from '@/components/sompaykit/wallet-picker';
import { formatMoney } from '@/lib/sompaykit-format';
import { dirFor, fill, fillText, getMessages } from '@/lib/sompaykit-i18n';
import { cn } from '@/lib/utils';

export interface CheckoutFormProps {
  /** Your charge API route (e.g. `'/api/pay'`) or function. See @sompaykit/react. */
  charge: UsePaymentOptions['charge'];
  /** Shown to the customer only. Your server calculates the real total from `orderId`. */
  amount: number;
  currency: Currency;
  orderId?: string;
  itemCount?: number;
  /** `manual`: "Continue to payment". `auto`: "Pay $18.00 with EVC Plus" (PIN prompt). */
  mode?: 'manual' | 'auto';
  wallets?: readonly MobileWallet[];
  locale?: Locale;
  /** Ask for the customer's name. Default true. */
  askName?: boolean;
  defaultValues?: { name?: string; phone?: string };
  /** Called once the server has started the payment. */
  onResult?: (result: ClientPaymentResult) => void;
  className?: string;
}

const PHONE_ERRORS: readonly ErrorCode[] = ['INVALID_NUMBER'];
const WALLET_ERRORS: readonly ErrorCode[] = ['WALLET_REQUIRED', 'WALLET_NOT_SUPPORTED'];

export function CheckoutForm({
  charge,
  amount,
  currency,
  orderId,
  itemCount,
  mode = 'manual',
  wallets = MOBILE_WALLETS,
  locale = 'so',
  askName = true,
  defaultValues,
  onResult,
  className,
}: CheckoutFormProps) {
  const t = getMessages(locale);
  const ids = useId();
  const payment = usePayment({ charge });
  const [name, setName] = useState(defaultValues?.name ?? '');
  const [phone, setPhone] = useState(defaultValues?.phone ?? '');
  const [picked, setPicked] = useState<MobileWallet | null>(null);
  const [nameMissing, setNameMissing] = useState(false);
  const [localError, setLocalError] = useState<ErrorCode | null>(null);

  const detectedWallet = detectWallet(phone);
  const detected =
    detectedWallet !== null && wallets.includes(detectedWallet) ? detectedWallet : null;
  // The customer's own pick wins: numbers can move between operators.
  const wallet = picked ?? detected;

  const errorCode = localError ?? payment.errorCode;
  const phoneError = errorCode !== null && PHONE_ERRORS.includes(errorCode) ? errorCode : null;
  const walletError = errorCode !== null && WALLET_ERRORS.includes(errorCode) ? errorCode : null;
  const formError = errorCode !== null && !phoneError && !walletError ? errorCode : null;
  const total = formatMoney(amount, currency);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (payment.isSubmitting) return;
    const missing = askName && name.trim() === '';
    setNameMissing(missing);
    setLocalError(wallet === null ? 'WALLET_REQUIRED' : null);
    if (missing || wallet === null) return;

    const result = await payment.pay({
      phone,
      wallet,
      ...(orderId !== undefined && { orderId }),
      ...(askName && { customerName: name }),
    });
    if (result) onResult?.(result);
  }

  const submitLabel =
    mode === 'auto' && wallet !== null
      ? fillText(t.checkout.payWith, { amount: total, wallet: WALLETS[wallet].name })
      : t.checkout.continue;

  return (
    <form
      dir={dirFor(locale)}
      lang={locale}
      noValidate
      onSubmit={(event) => void onSubmit(event)}
      className={cn('flex flex-col gap-4.5', className)}
    >
      {askName && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${ids}-name`} className="text-sm font-medium">
            {t.checkout.fullName}
          </label>
          <Input
            id={`${ids}-name`}
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={nameMissing || undefined}
            aria-describedby={nameMissing ? `${ids}-name-error` : undefined}
            className="h-12 rounded-xl bg-card px-3.5 text-base md:text-base"
          />
          {nameMissing && (
            <p id={`${ids}-name-error`} className="text-[13px] text-destructive">
              {t.checkout.nameRequired}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${ids}-phone`} className="text-sm font-medium">
          {t.checkout.phone}
        </label>
        <div
          dir="ltr"
          className={cn(
            'flex h-12 items-center overflow-hidden rounded-xl border bg-card focus-within:border-primary focus-within:ring-1 focus-within:ring-primary',
            phoneError ? 'border-destructive' : 'border-input',
          )}
        >
          <span className="flex h-full items-center border-e border-border px-3 text-base text-muted-foreground">
            +252
          </span>
          <input
            id={`${ids}-phone`}
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="61 234 5678"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (localError) setLocalError(null);
            }}
            aria-invalid={phoneError ? true : undefined}
            aria-describedby={`${ids}-phone-hint`}
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground"
          />
        </div>
        <p
          id={`${ids}-phone-hint`}
          className={cn('text-[13px]', phoneError ? 'text-destructive' : 'text-muted-foreground')}
        >
          {phoneError
            ? message(phoneError, locale)
            : detected &&
              fill(t.checkout.detected, {
                wallet: (
                  <strong key="w" className="text-primary-muted-foreground">
                    {WALLETS[detected].name}
                  </strong>
                ),
              })}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <WalletPicker
          value={wallet}
          onChange={(next) => {
            setPicked(next);
            setLocalError(null);
          }}
          wallets={wallets}
          locale={locale}
          name="wallet"
          disabled={payment.isSubmitting}
        />
        {walletError && (
          <p role="alert" className="text-[13px] text-destructive">
            {message(walletError, locale)}
          </p>
        )}
      </div>

      <section className="flex flex-col gap-2 rounded-xl border bg-card px-4 py-3.5 text-card-foreground">
        {itemCount !== undefined && (
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{fillText(t.checkout.items, { count: String(itemCount) })}</span>
            <bdi dir="ltr" className="tabular-nums">
              {total}
            </bdi>
          </div>
        )}
        <div className="flex justify-between text-[17px] font-bold">
          <span>{t.checkout.total}</span>
          <bdi dir="ltr" className="tabular-nums">
            {total}
          </bdi>
        </div>
      </section>

      {formError && (
        <p
          role="alert"
          className="rounded-xl bg-destructive-muted px-4 py-3 text-sm text-destructive-muted-foreground"
        >
          {message(formError, locale)}
        </p>
      )}

      <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t bg-card px-4 pt-3 pb-5 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <Button
          type="submit"
          disabled={payment.isSubmitting}
          aria-busy={payment.isSubmitting || undefined}
          className="h-13 w-full rounded-xl text-base font-semibold hover:bg-primary-hover"
        >
          {payment.isSubmitting && (
            <LoaderIcon className="size-5 animate-spin motion-reduce:animate-none" />
          )}
          {submitLabel}
        </Button>
        <p className="text-center text-xs text-muted-foreground">{t.checkout.secure}</p>
      </div>
    </form>
  );
}
