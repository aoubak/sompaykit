'use client';

import { cn } from '@/lib/utils';
import { useShop } from '~/lib/shop';
import { MAX_QUANTITY } from '~/server/catalog';
import { MinusIcon, PlusIcon } from './icons';

export function QuantityStepper({
  productId,
  name,
  compact = false,
}: {
  productId: string;
  name: string;
  compact?: boolean;
}) {
  const shop = useShop();
  const quantity = shop.quantityOf(productId);
  const button = cn(
    'flex items-center justify-center rounded-xl hover:bg-accent disabled:opacity-40',
    compact ? 'h-11 w-9' : 'h-10 w-11',
  );

  return (
    <div className="flex items-center rounded-xl border bg-card" dir="ltr">
      <button
        type="button"
        className={button}
        aria-label={`${shop.t.decrease}: ${name}`}
        onClick={() => shop.setQuantity(productId, quantity - 1)}
      >
        <MinusIcon className="size-4.5" />
      </button>
      <span
        aria-live="polite"
        className="min-w-6 text-center text-[15px] font-semibold tabular-nums"
      >
        {quantity}
      </span>
      <button
        type="button"
        className={button}
        aria-label={`${shop.t.increase}: ${name}`}
        disabled={quantity >= MAX_QUANTITY}
        onClick={() => shop.setQuantity(productId, quantity + 1)}
      >
        <PlusIcon className="size-4.5" />
      </button>
    </div>
  );
}
