'use client';

import {
  WALLETS,
  message,
  type ErrorCode,
  type Locale,
  type ManualInstructions,
} from '@sompaykit/core';
import { useEffect, useId, useState, type FormEvent } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CopyIcon, ImageIcon, LoaderIcon, PhoneIcon } from '@/components/sompaykit/icons';
import { formatMoney, formatPhone } from '@/lib/sompaykit-format';
import { dirFor, fill, fillText, getMessages } from '@/lib/sompaykit-i18n';
import { cn } from '@/lib/utils';

export interface PaymentProof {
  transactionId: string;
  screenshot: File | null;
}

export interface ManualPayCardProps {
  /** `result.instructions` from a manual-mode charge. */
  instructions: ManualInstructions;
  storeName?: string;
  locale?: Locale;
  /** Send the proof to your server (which sets the payment to `awaiting_confirmation`). */
  onSubmitProof: (proof: PaymentProof) => void | Promise<void>;
  isSubmitting?: boolean;
  /** An error from your proof endpoint, shown above the button. */
  errorCode?: ErrorCode | null;
  /** Let the customer attach a screenshot of the SMS. Default true. */
  allowScreenshot?: boolean;
  /** e.g. `https://wa.me/252612345678?text=…` */
  whatsappUrl?: string;
  className?: string;
}

export function ManualPayCard({
  instructions,
  storeName,
  locale = 'so',
  onSubmitProof,
  isSubmitting = false,
  errorCode = null,
  allowScreenshot = true,
  whatsappUrl,
  className,
}: ManualPayCardProps) {
  const t = getMessages(locale);
  const ids = useId();
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [missing, setMissing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const walletName = WALLETS[instructions.wallet].name;
  const amount = formatMoney(instructions.amount, instructions.currency);

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(instructions.number);
      setCopied(true);
    } catch {
      // Clipboard blocked (old browser or no permission): the number is still on screen.
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const id = transactionId.trim();
    setMissing(id === '');
    if (id === '') return;
    await onSubmitProof({ transactionId: id, screenshot });
  }

  return (
    <form
      dir={dirFor(locale)}
      lang={locale}
      noValidate
      onSubmit={(event) => void onSubmit(event)}
      className={cn('flex flex-col gap-3.5', className)}
    >
      <section className="flex flex-col items-center gap-1.5 rounded-2xl border bg-card p-4.5 text-center text-card-foreground">
        <span className="text-sm text-muted-foreground">{t.manual.sendExactly}</span>
        <bdi dir="ltr" className="text-4xl font-bold tracking-tight tabular-nums">
          {amount}
        </bdi>
        <span className="text-sm text-muted-foreground">
          {storeName
            ? fill(t.manual.viaTo, {
                wallet: walletName,
                store: (
                  <strong key="s" className="text-foreground">
                    {storeName}
                  </strong>
                ),
              })
            : fillText(t.manual.via, { wallet: walletName })}
        </span>

        <div className="mt-2 flex w-full items-center justify-between gap-3 rounded-xl bg-muted px-3 py-2.5">
          <bdi dir="ltr" className="text-xl font-semibold tracking-wide tabular-nums">
            {formatPhone(instructions.number)}
          </bdi>
          <Button
            type="button"
            variant="outline"
            onClick={() => void copyNumber()}
            className="h-11 rounded-lg bg-card px-3 text-sm"
          >
            <CopyIcon />
            <span aria-live="polite">{copied ? t.manual.copied : t.manual.copy}</span>
          </Button>
        </div>

        {instructions.ussdLink ? (
          <>
            <a
              href={instructions.ussdLink}
              className={buttonVariants({
                variant: 'outline',
                className:
                  'mt-1.5 h-12 w-full rounded-xl border-2 border-primary bg-card text-base font-semibold text-primary hover:bg-primary-muted hover:text-primary',
              })}
            >
              <PhoneIcon className="size-4.5" />
              {t.manual.dial}
            </a>
            <span className="text-xs text-muted-foreground">{t.manual.dialHint}</span>
          </>
        ) : (
          <span className="mt-1.5 text-sm text-muted-foreground">
            {fillText(t.manual.noDial, { wallet: walletName })}
          </span>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border bg-card p-4 text-card-foreground">
        <h2 className="text-[15px] font-semibold">{t.manual.afterYouPay}</h2>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${ids}-txn`} className="text-sm font-medium">
            {t.manual.transactionId}
          </label>
          <Input
            id={`${ids}-txn`}
            name="transactionId"
            dir="ltr"
            autoComplete="off"
            placeholder={t.manual.transactionIdPlaceholder}
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            aria-invalid={missing || undefined}
            aria-describedby={missing ? `${ids}-txn-error` : undefined}
            className="h-12 rounded-xl px-3.5 text-base md:text-base"
          />
          {missing && (
            <p id={`${ids}-txn-error`} className="text-[13px] text-destructive">
              {t.manual.transactionIdRequired}
            </p>
          )}
        </div>

        {allowScreenshot && (
          <label className="relative flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-muted-foreground/50 px-3.5 text-sm has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-ring">
            <ImageIcon className="size-5 shrink-0" />
            <span className="min-w-0 truncate">
              {screenshot ? (
                screenshot.name
              ) : (
                <>
                  {t.manual.screenshot}{' '}
                  <span className="text-muted-foreground">{t.manual.optional}</span>
                </>
              )}
            </span>
            <input
              type="file"
              name="screenshot"
              accept="image/*"
              className="sr-only"
              onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
            />
          </label>
        )}
      </section>

      {errorCode && (
        <p
          role="alert"
          className="rounded-xl bg-destructive-muted px-4 py-3 text-sm text-destructive-muted-foreground"
        >
          {message(errorCode, locale)}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting || undefined}
          className="h-13 w-full rounded-xl text-base font-semibold hover:bg-primary-hover"
        >
          {isSubmitting && (
            <LoaderIcon className="size-5 animate-spin motion-reduce:animate-none" />
          )}
          {t.manual.sent}
        </Button>
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: 'link', className: 'h-11 text-sm' })}
          >
            {t.manual.help}
          </a>
        )}
      </div>
    </form>
  );
}
