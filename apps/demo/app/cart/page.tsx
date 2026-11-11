'use client';

import Link from 'next/link';
import { formatMoney } from '@/lib/sompaykit-format';
import { fillText } from '@/lib/sompaykit-i18n';
import { QuantityStepper } from '~/components/quantity-stepper';
import { ShopHeader } from '~/components/shop-header';
import { useShop } from '~/lib/shop';
import { CURRENCY, getProduct } from '~/server/catalog';

export default function CartPage() {
  const shop = useShop();
  const total = formatMoney(shop.subtotal, CURRENCY);

  return (
    <div className="flex min-h-dvh flex-col">
      <ShopHeader back="/" title={shop.t.cartTitle} />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3 px-4 pt-4 pb-28">
        {shop.ready && shop.lines.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-muted-foreground">{shop.t.cartEmpty}</p>
            <Link
              href="/"
              className="inline-flex h-12 items-center rounded-xl border bg-card px-5 font-semibold hover:bg-accent"
            >
              {shop.t.backToShop}
            </Link>
          </div>
        )}

        {shop.lines.map((line) => {
          const product = getProduct(line.productId);
          if (!product) return null;
          const name = product.name[shop.locale];
          return (
            <article
              key={line.productId}
              className="flex items-center gap-3 rounded-2xl border bg-card p-3"
            >
              <div
                aria-hidden="true"
                className="flex size-18 shrink-0 items-center justify-center rounded-xl bg-primary-muted text-xl font-bold text-primary-muted-foreground"
              >
                {product.name.en.slice(0, 1)}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex justify-between gap-2">
                  <h2 className="text-[15px] leading-5 font-semibold">{name}</h2>
                  <bdi dir="ltr" className="text-[15px] font-bold tabular-nums">
                    {formatMoney(product.price * line.quantity, CURRENCY)}
                  </bdi>
                </div>
                <div className="flex items-center justify-between">
                  <QuantityStepper productId={line.productId} name={name} />
                  <button
                    type="button"
                    onClick={() => shop.setQuantity(line.productId, 0)}
                    className="h-11 rounded-xl px-2 text-sm text-destructive hover:bg-destructive-muted"
                  >
                    {shop.t.remove}
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {shop.lines.length > 0 && (
          <>
            <section className="flex flex-col gap-2.5 rounded-2xl border bg-card p-4">
              <div className="flex justify-between text-[15px] text-muted-foreground">
                <span>{shop.t.subtotal}</span>
                <bdi dir="ltr" className="tabular-nums">
                  {total}
                </bdi>
              </div>
              <div className="flex justify-between gap-4 text-[15px] text-muted-foreground">
                <span>{shop.t.delivery}</span>
                <span className="text-end">{shop.t.deliveryValue}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between text-lg font-bold">
                <span>{shop.t.total}</span>
                <bdi dir="ltr" className="tabular-nums">
                  {total}
                </bdi>
              </div>
            </section>
            <p className="rounded-xl bg-primary-muted p-3 text-sm text-primary-muted-foreground">
              {shop.t.payNote}
            </p>
          </>
        )}
      </main>

      {shop.lines.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 border-t bg-card px-4 pt-3 pb-5">
          <Link
            href="/checkout"
            className="mx-auto flex h-13 max-w-3xl items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            {fillText(shop.t.checkout, { amount: total })}
          </Link>
        </div>
      )}
    </div>
  );
}
