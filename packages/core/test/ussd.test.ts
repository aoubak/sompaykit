import { describe, expect, it } from 'vitest';
import { formatAmountPlain, isValidAmount } from '../src/amount';
import { buildUssdCode, ussdLink } from '../src/ussd';

describe('buildUssdCode', () => {
  it('builds the EVC Plus code from any number format', () => {
    expect(buildUssdCode('evc', '612345678', 18)).toBe('*712*612345678*18#');
    expect(buildUssdCode('evc', '+252 61 234 5678', 18)).toBe('*712*612345678*18#');
  });

  it('keeps decimals short', () => {
    expect(buildUssdCode('evc', '612345678', 18.5)).toBe('*712*612345678*18.5#');
    expect(buildUssdCode('evc', '612345678', 0.25)).toBe('*712*612345678*0.25#');
  });

  it('returns null for wallets without a known pattern', () => {
    expect(buildUssdCode('zaad', '631234567', 18)).toBeNull();
  });

  it('returns null for an invalid number or amount', () => {
    expect(buildUssdCode('evc', '123', 18)).toBeNull();
    expect(buildUssdCode('evc', '612345678', 0)).toBeNull();
    expect(buildUssdCode('evc', '612345678', 1.234)).toBeNull();
  });
});

describe('ussdLink', () => {
  it('encodes # as %23', () => {
    expect(ussdLink('*712*612345678*18#')).toBe('tel:*712*612345678*18%23');
  });
});

describe('amount helpers', () => {
  it.each([1, 18, 18.5, 18.25, 0.01, 0.1 + 0.2 - 0.3 + 1, 1_000_000])('accepts %s', (n) => {
    expect(isValidAmount(n)).toBe(true);
  });

  it.each([0, -5, 1.001, Number.NaN, Number.POSITIVE_INFINITY, 1_000_000.01, '18'])(
    'rejects %s',
    (n) => {
      expect(isValidAmount(n)).toBe(false);
    },
  );

  it('formats plainly', () => {
    expect(formatAmountPlain(18)).toBe('18');
    expect(formatAmountPlain(18.5)).toBe('18.5');
    expect(formatAmountPlain(0.1 + 0.2)).toBe('0.3');
  });
});
