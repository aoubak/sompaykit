import { describe, expect, it } from 'vitest';
import { formatMoney, formatPhone } from '@/lib/sompaykit-format';
import { SOMPAY_MESSAGES, dirFor, fill, fillText, getMessages } from '@/lib/sompaykit-i18n';

/** Every leaf path in a nested object, e.g. `status.badge.paid`. */
function keysOf(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keysOf(child, prefix ? `${prefix}.${key}` : key),
  );
}

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1] as string).sort();
}

describe('SomPayKit messages', () => {
  const en = SOMPAY_MESSAGES.en;
  const enKeys = keysOf(en);

  it.each(['so', 'ar'] as const)('%s has every English key and the same placeholders', (locale) => {
    const other = SOMPAY_MESSAGES[locale];
    expect(keysOf(other)).toEqual(enKeys);
    for (const key of enKeys) {
      const get = (root: unknown) =>
        key
          .split('.')
          .reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], root);
      const text = get(other);
      expect(typeof text === 'string' && text.length > 0, `${locale}.${key}`).toBe(true);
      expect(placeholders(String(text)), `${locale}.${key}`).toEqual(placeholders(String(get(en))));
    }
  });

  it('falls back to Somali and knows text direction', () => {
    expect(getMessages('xx' as never)).toBe(SOMPAY_MESSAGES.so);
    expect(dirFor('ar')).toBe('rtl');
    expect(dirFor('so')).toBe('ltr');
    expect(dirFor('en')).toBe('ltr');
  });
});

describe('fill', () => {
  it('replaces known placeholders with any value and keeps unknown ones', () => {
    const node = { type: 'strong' };
    expect(fill('Pay {amount} with {wallet} {x}', { amount: node, wallet: 'EVC' })).toEqual([
      'Pay ',
      node,
      ' with ',
      'EVC',
      ' ',
      '{x}',
    ]);
    expect(fillText('{count} items', { count: '2' })).toBe('2 items');
  });
});

describe('formatMoney', () => {
  it('formats USD with cents and SLSH with grouping', () => {
    expect(formatMoney(18, 'USD')).toBe('$18.00');
    expect(formatMoney(1234.5, 'USD')).toBe('$1,234.50');
    expect(formatMoney(18000, 'SLSH')).toBe('18,000 SLSH');
  });
});

describe('formatPhone', () => {
  it('groups Somali numbers in local form', () => {
    expect(formatPhone('252612345678')).toBe('61 234 5678');
    expect(formatPhone('+252 61 234 5678')).toBe('61 234 5678');
    expect(formatPhone('61234567')).toBe('61 23 4567');
    expect(formatPhone('abc')).toBe('abc');
  });
});
