'use client';

import type { Locale } from '@sompaykit/core';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { fillText } from '@/lib/sompaykit-i18n';
import { useShop } from '~/lib/shop';
import { ArrowStartIcon, CartIcon } from './icons';

const NEXT_LOCALE: Record<Locale, Locale> = { so: 'en', en: 'ar', ar: 'so' };
const LOCALE_LABEL: Record<Locale, string> = { so: 'SO', en: 'EN', ar: 'ع' };

/** Store header: back link or store name, language switch, cart. */
export function ShopHeader({ back, title }: { back?: string; title?: ReactNode }) {
  const { t, locale, setLocale, count } = useShop();

  return (
    <header className="sticky top-0 z-10 border-b bg-card">
      <div className="mx-auto flex h-16 max-w-3xl items-center gap-2 px-4">
        {back ? (
          <Link
            href={back}
            aria-label={t.back}
            className="-ms-2 flex size-11 items-center justify-center rounded-xl hover:bg-accent"
          >
            <ArrowStartIcon className="size-5.5 rtl:-scale-x-100" />
          </Link>
        ) : (
          <Link href="/" className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex size-9 items-center justify-center rounded-xl bg-primary text-base font-bold text-primary-foreground"
            >
              H
            </span>
            <span className="text-[17px] font-semibold">{t.storeName}</span>
          </Link>
        )}
        {title && <h1 className="text-xl font-semibold">{title}</h1>}

        <div className="ms-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setLocale(NEXT_LOCALE[locale])}
            aria-label={t.language}
            className="flex h-11 min-w-11 items-center justify-center rounded-xl px-2 text-sm font-semibold hover:bg-accent"
          >
            {LOCALE_LABEL[NEXT_LOCALE[locale]]}
          </button>
          <Link
            href="/cart"
            aria-label={fillText(t.cartLabel, { count: String(count) })}
            className="relative flex size-11 items-center justify-center rounded-xl hover:bg-accent"
          >
            <CartIcon className="size-5.5" />
            {count > 0 && (
              <span className="absolute end-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground tabular-nums">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
      <p className="bg-warning-muted px-4 py-2 text-center text-xs text-warning-muted-foreground">
        {t.demoNotice}
      </p>
    </header>
  );
}
