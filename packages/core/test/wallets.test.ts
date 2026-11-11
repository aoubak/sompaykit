import { describe, expect, it } from 'vitest';
import {
  MOBILE_WALLETS,
  WALLETS,
  detectWallet,
  getWallet,
  isMobileWallet,
  isWallet,
} from '../src/wallets';

describe('detectWallet', () => {
  it.each([
    ['61 234 5678', 'evc'],
    ['+252 77 123 4567', 'evc'],
    ['063 123 4567', 'zaad'],
    ['907123456', 'sahal'],
    ['252621234567', 'edahab'],
    ['65 123 4567', 'edahab'],
  ])('%s → %s', (phone, wallet) => {
    expect(detectWallet(phone)).toBe(wallet);
  });

  it('returns null for an unknown prefix', () => {
    expect(detectWallet('69 123 4567')).toBeNull();
  });

  it('returns null for an invalid number', () => {
    expect(detectWallet('not a number')).toBeNull();
  });
});

describe('wallet metadata', () => {
  it('has a name and operator for every mobile wallet', () => {
    for (const id of MOBILE_WALLETS) {
      expect(WALLETS[id].id).toBe(id);
      expect(WALLETS[id].name).not.toBe('');
      expect(WALLETS[id].operator).not.toBeNull();
    }
  });

  it('matches the checkout mockup', () => {
    expect(getWallet('evc')).toMatchObject({ name: 'EVC Plus', operator: 'Hormuud' });
    expect(getWallet('zaad')).toMatchObject({ name: 'Zaad', operator: 'Telesom' });
    expect(getWallet('sahal')).toMatchObject({ name: 'Sahal', operator: 'Golis' });
    expect(getWallet('edahab')).toMatchObject({ name: 'eDahab', operator: 'Somtel' });
  });
});

describe('type guards', () => {
  it('isWallet', () => {
    expect(isWallet('evc')).toBe(true);
    expect(isWallet('card')).toBe(true);
    expect(isWallet('toString')).toBe(false);
    expect(isWallet(42)).toBe(false);
  });

  it('isMobileWallet', () => {
    expect(isMobileWallet('zaad')).toBe(true);
    expect(isMobileWallet('card')).toBe(false);
  });
});
