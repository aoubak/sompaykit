/**
 * Error codes with customer-facing messages in Somali, English and Arabic.
 *
 * Two kinds of problems:
 * - Payment outcomes (declined, timeout, …) come back in a result: `{ status: 'failed', errorCode }`.
 * - Input and setup problems (bad phone, bad amount, …) are thrown as `SomPayError` before any
 *   payment is attempted.
 * Either way, show `message(code, locale)` to the customer.
 *
 * TODO(REVIEW): Arabic strings, and Somali strings not listed in docs/PAYMENTS.md, are drafts.
 * Have a native speaker check them before v1.0.
 */
import type { ErrorCode, Locale } from './types';

export const DEFAULT_LOCALE: Locale = 'so';

export const LOCALES: readonly Locale[] = ['so', 'en', 'ar'];

export const ERROR_MESSAGES: Readonly<Record<ErrorCode, Readonly<Record<Locale, string>>>> = {
  INSUFFICIENT_FUNDS: {
    so: 'Lacagtaada kuma filna.',
    en: 'Insufficient balance.',
    ar: 'الرصيد غير كافٍ.',
  },
  DECLINED: {
    so: 'Lacag bixinta waa la diiday.',
    en: 'Payment was declined.',
    ar: 'تم رفض الدفع.',
  },
  CANCELLED: {
    so: 'Lacag bixinta waa la joojiyay.',
    en: 'Payment was cancelled.',
    ar: 'تم إلغاء الدفع.',
  },
  TIMEOUT: {
    so: 'Waqtigii wuu dhamaaday. Fadlan isku day mar kale.',
    en: 'Payment timed out. Please try again.',
    ar: 'انتهت مهلة الدفع. يرجى المحاولة مرة أخرى.',
  },
  NETWORK_ERROR: {
    so: 'Cilad xiriir ayaa dhacday. Fadlan isku day mar kale.',
    en: 'Connection problem. Please try again.',
    ar: 'حدثت مشكلة في الاتصال. يرجى المحاولة مرة أخرى.',
  },
  PROVIDER_ERROR: {
    so: 'Adeegga lacag bixinta cilad ayaa ku timid. Fadlan isku day mar kale.',
    en: 'The payment service had a problem. Please try again.',
    ar: 'واجهت خدمة الدفع مشكلة. يرجى المحاولة مرة أخرى.',
  },
  INVALID_NUMBER: {
    so: 'Lambarka taleefanka sax maaha.',
    en: 'Invalid phone number.',
    ar: 'رقم الهاتف غير صحيح.',
  },
  INVALID_AMOUNT: {
    so: 'Qaddarka lacagta sax maaha.',
    en: 'Invalid amount.',
    ar: 'المبلغ غير صحيح.',
  },
  INVALID_CURRENCY: {
    so: 'Nooca lacagta lama taageero.',
    en: 'This currency is not supported.',
    ar: 'هذه العملة غير مدعومة.',
  },
  INVALID_REFERENCE: {
    so: 'Lambarka tixraaca sax maaha.',
    en: 'Missing or invalid reference ID.',
    ar: 'الرقم المرجعي مفقود أو غير صحيح.',
  },
  WALLET_REQUIRED: {
    so: 'Fadlan dooro habka lacag bixinta.',
    en: 'Please choose a wallet.',
    ar: 'يرجى اختيار المحفظة.',
  },
  WALLET_NOT_SUPPORTED: {
    so: 'Habkan lacag bixinta lama taageero. Fadlan dooro mid kale.',
    en: 'This wallet is not supported. Please choose another.',
    ar: 'هذه المحفظة غير مدعومة. يرجى اختيار محفظة أخرى.',
  },
  DUPLICATE_REFERENCE: {
    so: 'Lambarka tixraacan hore ayaa loogu isticmaalay lacag bixin kale.',
    en: 'This reference ID was already used for a different payment.',
    ar: 'تم استخدام هذا الرقم المرجعي لدفعة أخرى.',
  },
  NOT_FOUND: {
    so: 'Lacag bixintan lama helin.',
    en: 'Payment not found.',
    ar: 'لم يتم العثور على الدفعة.',
  },
  NOT_IMPLEMENTED: {
    so: 'Adeeggan lacag bixinta weli lama heli karo.',
    en: 'This payment provider is not available yet.',
    ar: 'مزود الدفع هذا غير متاح بعد.',
  },
  CONFIG_ERROR: {
    so: 'Habaynta lacag bixinta ma dhammaystirna. Fadlan la xiriir dukaanka.',
    en: 'Payment setup is incomplete. Please contact the store.',
    ar: 'إعداد الدفع غير مكتمل. يرجى التواصل مع المتجر.',
  },
};

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && Object.hasOwn(ERROR_MESSAGES, value);
}

/** Customer-facing text for an error code. Unknown codes fall back to PROVIDER_ERROR. */
export function message(code: ErrorCode | string, locale: Locale = DEFAULT_LOCALE): string {
  const messages = isErrorCode(code) ? ERROR_MESSAGES[code] : ERROR_MESSAGES.PROVIDER_ERROR;
  return messages[locale] ?? messages[DEFAULT_LOCALE];
}

/**
 * Thrown for input and setup problems. `message` is English for developers and logs; show
 * customers `message(error.code, locale)` instead. Never contains credentials or full phone numbers.
 */
export class SomPayError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, detail?: string, options?: { cause?: unknown }) {
    super(detail ?? ERROR_MESSAGES[code].en, options);
    this.name = 'SomPayError';
    this.code = code;
  }
}

export function isSomPayError(error: unknown): error is SomPayError {
  return error instanceof SomPayError;
}
