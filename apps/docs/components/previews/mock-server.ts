// Pretend API routes for the previews. A real app calls its own server, which uses @sompaykit/core.
import {
  buildUssdCode,
  isMobileWallet,
  type ClientPaymentResult,
  type ManualInstructions,
  type MobileWallet,
} from '@sompaykit/core';
import type { ChargeFn } from '@sompaykit/react';

export const DEMO_MERCHANT = '612345678';
export const DEMO_AMOUNT = 18;
/** Pay from this number in a preview to see a declined payment. */
export const DECLINE_NUMBER = '610000000';
const PREVIEW_DIAL_LINK = '#dial-to-pay';

export function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

export function demoInstructions(wallet: MobileWallet): ManualInstructions {
  const code = buildUssdCode(wallet, DEMO_MERCHANT, DEMO_AMOUNT);
  return {
    wallet,
    number: DEMO_MERCHANT,
    amount: DEMO_AMOUNT,
    currency: 'USD',
    ussdCode: code,
    // Shows the "Dial to pay" button without a real tel: link: tapping it on a phone must never
    // send money to the example number. A real app uses ussdLink(code).
    ussdLink: code === null ? null : PREVIEW_DIAL_LINK,
  };
}

export const demoCharge: ChargeFn = async (body, signal): Promise<ClientPaymentResult> => {
  await wait(900, signal);
  if (body.phone.endsWith(DECLINE_NUMBER)) {
    return { referenceId: body.referenceId, status: 'failed', errorCode: 'INSUFFICIENT_FUNDS' };
  }
  const wallet = body.wallet !== undefined && isMobileWallet(body.wallet) ? body.wallet : 'evc';
  return {
    referenceId: body.referenceId,
    status: 'awaiting_proof',
    instructions: demoInstructions(wallet),
  };
};
