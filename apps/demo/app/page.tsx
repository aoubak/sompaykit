'use client';

import Link from 'next/link';
import { useState } from 'react';
import { formatMoney } from '@/lib/sompaykit-format';
import { fillText } from '@/lib/sompaykit-i18n';
import { cn } from '@/lib/utils';
import { PlusIcon } from '~/components/icons';
import { QuantityStepper } from '~/components/quantity-stepper';
import { ShopHeader } from '~/components/shop-header';
import { useShop } from '~/lib/shop';
import { CURRENCY, PRODUCTS, type Product } from '~/server/catalog';

type Category = 'all' | Product['category'];
const CATEGORIES: readonly Category[] = ['all', 'food', 'beauty', 'electronics'];

export default function ShopPage() {
  const shop = useShop();
  const [category, setCategory] = useState<Category>('all');
  const products = PRODUCTS.filter((p) => category === 'all' || p.category === category);

  return (
    <div className="flex min-h-dvh flex-col">
      <ShopHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 pt-4 pb-28">
        <div role="group" className="-mx-4 flex gap-2 overflow-x-auto px-4">
          {CATEGORIES.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={category === id}
              onClick={() => setCategory(id)}
              className={cn(
                'h-10 shrink-0 rounded-full border px-4 text-sm font-medium',
                category === id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-accent',
              )}
            >
              {shop.t.categories[id]}
            </button>
          ))}
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {products.map((product) => {
            const quantity = shop.quantityOf(product.id);
            const name = product.name[shop.locale];
            return (
              <li
                key={product.id}
                className="flex flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground"
              >
                <div
                  aria-hidden="true"
                  className="flex aspect-square items-center justify-center bg-primary-muted text-3xl font-bold text-primary-muted-foreground"
                >
                  {product.name.en.slice(0, 1)}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <h2 className="text-[15px] leading-5 font-semibold">{name}</h2>
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <bdi dir="ltr" className="font-bold tabular-nums">
                      {formatMoney(product.price, CURRENCY)}
                    </bdi>
                    {quantity === 0 ? (
                      <button
                        type="button"
                        aria-label={`${shop.t.addToCart}: ${name}`}
                        onClick={() => shop.setQuantity(product.id, 1)}
                        className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover"
                      >
                        <PlusIcon className="size-5" />
                      </button>
                    ) : (
                      <QuantityStepper productId={product.id} name={name} compact />
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </main>

      {shop.count > 0 && (
        <div className="fixed inset-x-0 bottom-0 border-t bg-card px-4 pt-3 pb-5">
          <Link
            href="/cart"
            className="mx-auto flex h-13 max-w-3xl items-center justify-between rounded-xl bg-primary px-5 text-base font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            <span>{fillText(shop.t.viewCart, { count: String(shop.count) })}</span>
            <bdi dir="ltr" className="tabular-nums">
              {formatMoney(shop.subtotal, CURRENCY)}
            </bdi>
          </Link>
        </div>
      )}
    </div>
  );
}
