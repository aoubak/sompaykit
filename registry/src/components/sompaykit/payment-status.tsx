'use client';

import {
  WALLETS,
  message,
  type Currency,
  type ErrorCode,
  type Locale,
  type PaymentStatus,
  type Wallet,
} from '@sompaykit/core';
import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  CheckIcon,
  ClockIcon,
  LoaderIcon,
  SmartphoneIcon,
  TimerOffIcon,
  XIcon,
} from '@/components/sompaykit/icons';
import { formatMoney, formatPhone } from '@/lib/sompaykit-format';
import { dirFor, fill, getMessages } from '@/lib/sompaykit-i18n';
import { cn } from '@/lib/utils';

type Tone = 'info' | 'warning' | 'success' | 'destructive' | 'muted';

const TONE: Record<PaymentStatus, Tone> = {
  pending: 'info',
  awaiting_proof: 'info',
  awaiting_confirmation: 'warning',
  paid: 'success',
  failed: 'destructive',
  expired: 'muted',
};

// Full class names so Tailwind can find them.
const BADGE: Record<Tone, string> = {
  info: 'bg-info-muted text-info-muted-foreground',
  warning: 'bg-warning-muted text-warning-muted-foreground',
  success: 'bg-success-muted text-success-muted-foreground',
  destructive: 'bg-destructive-muted text-destructive-muted-foreground',
  muted: 'bg-muted text-foreground/80',
};

const CIRCLE: Record<Tone, string> = {
  info: 'bg-info-muted text-info',
  warning: 'bg-warning-muted text-warning',
  success: 'bg-success text-success-foreground',
  destructive: 'bg-destructive-muted text-destructive',
  muted: 'bg-muted text-muted-foreground',
};

const ICON: Record<PaymentStatus, (props: { className?: string }) => ReactNode> = {
  pending: SmartphoneIcon,
  awaiting_proof: ClockIcon,
  awaiting_confirmation: ClockIcon,
  paid: CheckIcon,
  failed: XIcon,
  expired: TimerOffIcon,
};

export interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  locale?: Locale;
  className?: string;
}

/** Colored pill with icon + text. Also fits order tables. */
export function PaymentStatusBadge({ status, locale = 'so', className }: PaymentStatusBadgeProps) {
  const Icon = ICON[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold',
        BADGE[TONE[status]],
        className,
      )}
    >
      <Icon className="size-3.5" />
      {getMessages(locale).status.badge[status]}
    </span>
  );
}

export interface PaymentStatusCardProps {
  /** From `usePaymentStatus()`. Null shows "Checking your payment…". */
  status: PaymentStatus | null;
  /** Why it failed (from `usePaymentStatus().errorCode`). */
  errorCode?: ErrorCode | null;
  /** Set while status checks fail (weak signal). Polling continues. */
  requestError?: ErrorCode | null;
  amount?: number;
  currency?: Currency;
  wallet?: Wallet;
  /** Payer's number, any format. Shown as `+252 61 234 5678`. */
  phone?: string;
  /** While `pending`: when the PIN request runs out. Shows a countdown. */
  expiresAt?: number | Date;
  locale?: Locale;
  /** Shows "Try again" when failed or expired. */
  onRetry?: () => void;
  /** Shows "Use another wallet" when failed or expired. */
  onChangeWallet?: () => void;
  /** Extra content under the message, e.g. order details or a WhatsApp button. */
  children?: ReactNode;
  className?: string;
}

function useSecondsLeft(expiresAt: number | Date | undefined, active: boolean): number | null {
  const target = expiresAt === undefined ? null : new Date(expiresAt).getTime();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (target === null || !active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [target, active]);
  return target === null ? null : Math.max(0, Math.ceil((target - now) / 1000));
}

function formatSeconds(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** Fills the template only if every placeholder has a value; otherwise shows nothing. */
function fillAll(
  template: string,
  values: Record<string, ReactNode | undefined>,
): ReactNode[] | null {
  const keys = [...template.matchAll(/\{(\w+)\}/g)].map((m) => m[1] as string);
  if (keys.some((key) => values[key] === undefined)) return null;
  return fill(template, values);
}

export function PaymentStatusCard({
  status,
  errorCode = null,
  requestError = null,
  amount,
  currency = 'USD',
  wallet,
  phone,
  expiresAt,
  locale = 'so',
  onRetry,
  onChangeWallet,
  children,
  className,
}: PaymentStatusCardProps) {
  const t = getMessages(locale);
  const secondsLeft = useSecondsLeft(expiresAt, status === 'pending');

  if (status === null) {
    return (
      <div
        dir={dirFor(locale)}
        lang={locale}
        role="status"
        aria-live="polite"
        className={cn('flex flex-col items-center gap-3 py-16 text-center', className)}
      >
        <LoaderIcon className="size-8 animate-spin text-primary motion-reduce:animate-none" />
        <p className="text-[15px] text-muted-foreground">{t.status.checking}</p>
      </div>
    );
  }

  const tone = TONE[status];
  const Icon = ICON[status];
  const ended = status === 'failed' || status === 'expired';

  const body =
    status === 'failed' && errorCode
      ? message(errorCode, locale)
      : fillAll(t.status.body[status], {
          amount:
            amount === undefined ? undefined : (
              <strong key="a" className="text-foreground">
                <bdi dir="ltr">{formatMoney(amount, currency)}</bdi>
              </strong>
            ),
          phone:
            phone === undefined ? undefined : (
              <bdi key="p" dir="ltr" className="font-semibold text-foreground">
                +252 {formatPhone(phone)}
              </bdi>
            ),
          wallet: wallet === undefined ? undefined : WALLETS[wallet].name,
        });

  return (
    <div
      dir={dirFor(locale)}
      lang={locale}
      className={cn('flex flex-col items-center gap-5.5 text-center', className)}
    >
      <div
        className={cn(
          'relative flex size-24 items-center justify-center rounded-full',
          CIRCLE[tone],
        )}
      >
        {status === 'pending' && (
          <span
            aria-hidden="true"
            className="absolute -inset-2 animate-spin rounded-full border-3 border-info/25 border-t-info [animation-duration:1.6s] motion-reduce:animate-none"
          />
        )}
        <Icon className="size-11" />
      </div>

      <div role="status" aria-live="polite" className="flex flex-col items-center gap-2">
        <PaymentStatusBadge status={status} locale={locale} />
        <h1 className="text-2xl font-bold">{t.status.title[status]}</h1>
        {body && <p className="text-[15px] leading-[22px] text-muted-foreground">{body}</p>}
      </div>

      {status === 'pending' && (
        <div className="flex w-full flex-col gap-2.5 rounded-xl border bg-card px-4 py-3.5 text-start text-card-foreground">
          {secondsLeft !== null && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t.status.timeLeft}</span>
              <bdi dir="ltr" className="font-semibold tabular-nums">
                {formatSeconds(secondsLeft)}
              </bdi>
            </div>
          )}
          <span className="text-[13px] text-muted-foreground">{t.status.dontClose}</span>
        </div>
      )}

      {requestError && !ended && status !== 'paid' && (
        <p aria-live="polite" className="text-[13px] text-muted-foreground">
          {t.status.weakConnection}
        </p>
      )}

      {children}

      {ended && (onRetry || onChangeWallet) && (
        <div className="flex w-full flex-col gap-2">
          {onRetry && (
            <Button
              type="button"
              onClick={onRetry}
              className="h-13 w-full rounded-xl text-base font-semibold hover:bg-primary-hover"
            >
              {t.status.tryAgain}
            </Button>
          )}
          {onChangeWallet && (
            <Button
              type="button"
              variant="outline"
              onClick={onChangeWallet}
              className="h-12 w-full rounded-xl bg-card text-[15px] font-semibold"
            >
              {t.status.useAnotherWallet}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
