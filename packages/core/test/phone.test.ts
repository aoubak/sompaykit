import { describe, expect, it } from 'vitest';
import { isValidPhone, maskPhone, normalizePhone, toNationalNumber } from '../src/phone';

describe('normalizePhone', () => {
  it.each([
    ['+252 61 234 5678', '252612345678'],
    ['+252612345678', '252612345678'],
    ['00252612345678', '252612345678'],
    ['252612345678', '252612345678'],
    ['0612345678', '252612345678'],
    ['612345678', '252612345678'],
    ['61-234-5678', '252612345678'],
    ['(61) 234.5678', '252612345678'],
    ['  63 123 4567  ', '252631234567'],
    ['90 7123456', '252907123456'],
    ['61234567', '25261234567'], // 8-digit national number (allowed until VERIFY)
  ])('%s → %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it('accepts Arabic-Indic and Persian digits', () => {
    expect(normalizePhone('٦١٢٣٤٥٦٧٨')).toBe('252612345678');
    expect(normalizePhone('+۲۵۲۶۱۲۳۴۵۶۷۸')).toBe('252612345678');
  });

  it('ignores invisible direction marks from RTL text', () => {
    expect(normalizePhone('‎+252 61 234 5678')).toBe('252612345678');
  });

  it('does not mistake a short number starting with 252 for a country code', () => {
    expect(normalizePhone('2526123')).toBeNull();
  });

  it.each([
    [''],
    ['abc'],
    ['61 234 56a8'],
    ['+1 202 555 0100'], // not Somali
    ['+254 712 345 678'], // Kenya
    ['6123'], // too short
    ['6123456789'], // too long (10 digits)
    ['+252 012345678'], // national part starts with 0
    ['++252612345678'],
    ['+'],
  ])('rejects %j', (input) => {
    expect(normalizePhone(input)).toBeNull();
  });

  it('rejects non-strings without throwing', () => {
    expect(normalizePhone(undefined as unknown as string)).toBeNull();
  });
});

describe('isValidPhone', () => {
  it('matches normalizePhone', () => {
    expect(isValidPhone('61 234 5678')).toBe(true);
    expect(isValidPhone('hello')).toBe(false);
  });
});

describe('toNationalNumber', () => {
  it('drops the country code', () => {
    expect(toNationalNumber('+252 61 234 5678')).toBe('612345678');
    expect(toNationalNumber('bad')).toBeNull();
  });
});

describe('maskPhone', () => {
  it('hides the middle digits', () => {
    expect(maskPhone('252612345678')).toBe('252 61 *** 5678');
    expect(maskPhone('+252 63 123 4567')).toBe('252 63 *** 4567');
  });

  it('never echoes an invalid input', () => {
    expect(maskPhone('my number is 12345')).toBe('***');
  });
});
