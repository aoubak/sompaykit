import { describe, expect, it } from 'vitest';
import {
  ERROR_MESSAGES,
  LOCALES,
  SomPayError,
  isErrorCode,
  isSomPayError,
  message,
} from '../src/errors';
import type { Locale } from '../src/types';

describe('ERROR_MESSAGES', () => {
  it('has a non-empty message in every locale for every code', () => {
    for (const [code, messages] of Object.entries(ERROR_MESSAGES)) {
      for (const locale of LOCALES) {
        expect(messages[locale], `${code}.${locale}`).toMatch(/\S/);
      }
    }
  });

  it('uses the approved Somali copy from docs/PAYMENTS.md', () => {
    expect(message('INSUFFICIENT_FUNDS', 'so')).toBe('Lacagtaada kuma filna.');
    expect(message('TIMEOUT', 'so')).toBe('Waqtigii wuu dhamaaday. Fadlan isku day mar kale.');
    expect(message('CANCELLED', 'so')).toBe('Lacag bixinta waa la joojiyay.');
    expect(message('INVALID_NUMBER', 'so')).toBe('Lambarka taleefanka sax maaha.');
  });

  it('Arabic messages are written in Arabic script', () => {
    for (const messages of Object.values(ERROR_MESSAGES)) {
      expect(messages.ar).toMatch(/[؀-ۿ]/);
    }
  });
});

describe('message', () => {
  it('defaults to Somali', () => {
    expect(message('INVALID_NUMBER')).toBe('Lambarka taleefanka sax maaha.');
  });

  it('returns the requested locale', () => {
    expect(message('INVALID_NUMBER', 'en')).toBe('Invalid phone number.');
    expect(message('INVALID_NUMBER', 'ar')).toBe('رقم الهاتف غير صحيح.');
  });

  it('falls back to a generic message for unknown codes', () => {
    expect(message('SOMETHING_NEW', 'en')).toBe(ERROR_MESSAGES.PROVIDER_ERROR.en);
  });

  it('falls back to Somali for an unknown locale', () => {
    expect(message('DECLINED', 'fr' as Locale)).toBe(ERROR_MESSAGES.DECLINED.so);
  });
});

describe('SomPayError', () => {
  it('carries a code and an English message', () => {
    const error = new SomPayError('INVALID_AMOUNT');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('SomPayError');
    expect(error.code).toBe('INVALID_AMOUNT');
    expect(error.message).toBe('Invalid amount.');
    expect(isSomPayError(error)).toBe(true);
  });

  it('accepts a developer detail and a cause', () => {
    const cause = new Error('boom');
    const error = new SomPayError('CONFIG_ERROR', 'merchantNumbers is empty', { cause });
    expect(error.message).toBe('merchantNumbers is empty');
    expect(error.cause).toBe(cause);
  });

  it('isSomPayError rejects other errors', () => {
    expect(isSomPayError(new Error('x'))).toBe(false);
    expect(isErrorCode('toString')).toBe(false);
  });
});
