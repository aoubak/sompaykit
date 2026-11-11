/**
 * The demo store's products. The browser uses this list for display only; the server computes
 * every total from it (never from a total the browser sends).
 */
import type { Currency, Locale } from '@sompaykit/core';

export interface Product {
  id: string;
  /** In dollars, at most 2 decimals. */
  price: number;
  name: Readonly<Record<Locale, string>>;
  category: 'food' | 'beauty' | 'electronics';
}

export const CURRENCY: Currency = 'USD';

export const PRODUCTS: readonly Product[] = [
  {
    id: 'tea',
    price: 6,
    category: 'food',
    name: { so: 'Shaah Soomaali, 500g', en: 'Somali tea blend, 500g', ar: 'شاي صومالي، 500 غ' },
  },
  {
    id: 'uunsi',
    price: 12,
    category: 'beauty',
    name: { so: 'Uunsi, 250g', en: 'Uunsi incense, 250g', ar: 'بخور أونسي، 250 غ' },
  },
  {
    id: 'charger',
    price: 9.5,
    category: 'electronics',
    name: { so: 'Dabeeye taleefan, USB-C', en: 'Phone charger, USB-C', ar: 'شاحن هاتف، USB-C' },
  },
  {
    id: 'dates',
    price: 8,
    category: 'food',
    name: { so: 'Timir, sanduuq 1kg', en: 'Dates, 1kg box', ar: 'تمر، علبة 1 كغ' },
  },
  {
    id: 'oil',
    price: 4.25,
    category: 'beauty',
    name: { so: 'Saliid timo, 100ml', en: 'Hair oil, 100ml', ar: 'زيت شعر، 100 مل' },
  },
  {
    id: 'earbuds',
    price: 15,
    category: 'electronics',
    name: { so: 'Dhegaha wireless', en: 'Wireless earbuds', ar: 'سماعات لاسلكية' },
  },
];

export const MAX_QUANTITY = 20;
export const MAX_LINES = PRODUCTS.length;

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((product) => product.id === id);
}

export interface CartLine {
  productId: string;
  quantity: number;
}

/** Total in cents-safe dollars, or null if any line is invalid. */
export function cartTotal(lines: readonly CartLine[]): number | null {
  if (lines.length === 0 || lines.length > MAX_LINES) return null;
  const seen = new Set<string>();
  let cents = 0;
  for (const line of lines) {
    const product = getProduct(line.productId);
    if (
      !product ||
      seen.has(line.productId) ||
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > MAX_QUANTITY
    ) {
      return null;
    }
    seen.add(line.productId);
    cents += Math.round(product.price * 100) * line.quantity;
  }
  return cents / 100;
}
