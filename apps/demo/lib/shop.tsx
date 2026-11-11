'use client';

// Cart and language for the demo shop, kept in this browser (localStorage) only.
import type { Locale } from '@sompaykit/core';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { dirFor } from '@/lib/sompaykit-i18n';
import { MAX_QUANTITY, PRODUCTS, getProduct, type CartLine } from '~/server/catalog';
import { SHOP_MESSAGES, type ShopMessages } from './messages';

const STORAGE_KEY = 'sompaykit-demo';
const LOCALES: readonly Locale[] = ['so', 'en', 'ar'];

interface Saved {
  locale: Locale;
  lines: CartLine[];
}

interface Shop {
  locale: Locale;
  setLocale(locale: Locale): void;
  t: ShopMessages;
  lines: CartLine[];
  /** Number of items (sum of quantities). */
  count: number;
  /** For display only: the server computes the real total. */
  subtotal: number;
  quantityOf(productId: string): number;
  setQuantity(productId: string, quantity: number): void;
  clear(): void;
  /** True once the saved cart has been read (avoids flashing an empty cart). */
  ready: boolean;
}

const ShopContext = createContext<Shop | null>(null);

function load(): Saved | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<Saved>;
    const locale = LOCALES.includes(value.locale as Locale) ? (value.locale as Locale) : 'so';
    const lines = Array.isArray(value.lines)
      ? value.lines.filter(
          (line) =>
            getProduct(line.productId) !== undefined &&
            Number.isInteger(line.quantity) &&
            line.quantity > 0 &&
            line.quantity <= MAX_QUANTITY,
        )
      : [];
    return { locale, lines };
  } catch {
    return null;
  }
}

function save(value: Saved): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Private mode or storage full: the cart still works for this visit.
  }
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('so');
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = load();
    if (saved) {
      setLocale(saved.locale);
      setLines(saved.lines);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) save({ locale, lines });
  }, [ready, locale, lines]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dirFor(locale);
  }, [locale]);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    const next = Math.max(0, Math.min(MAX_QUANTITY, Math.round(quantity)));
    setLines((prev) => {
      const rest = prev.filter((line) => line.productId !== productId);
      if (next === 0) return rest;
      const index = prev.findIndex((line) => line.productId === productId);
      const line = { productId, quantity: next };
      if (index === -1) return [...prev, line];
      return prev.map((item) => (item.productId === productId ? line : item));
    });
  }, []);

  const value = useMemo<Shop>(() => {
    let count = 0;
    let cents = 0;
    for (const line of lines) {
      const product = PRODUCTS.find((p) => p.id === line.productId);
      if (!product) continue;
      count += line.quantity;
      cents += Math.round(product.price * 100) * line.quantity;
    }
    return {
      locale,
      setLocale,
      t: SHOP_MESSAGES[locale],
      lines,
      count,
      subtotal: cents / 100,
      quantityOf: (id) => lines.find((line) => line.productId === id)?.quantity ?? 0,
      setQuantity,
      clear: () => setLines([]),
      ready,
    };
  }, [locale, lines, ready, setQuantity]);

  return <ShopContext value={value}>{children}</ShopContext>;
}

export function useShop(): Shop {
  const shop = use(ShopContext);
  if (!shop) throw new Error('useShop() must be used inside <ShopProvider>');
  return shop;
}
